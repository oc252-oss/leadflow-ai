import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Normalizar número de telefone
function normalizePhone(phone) {
  if (!phone) return '';
  // Remove caracteres não numéricos
  let cleaned = phone.replace(/\D/g, '');
  // Se começar com 55, mantém (Brasil)
  if (cleaned.startsWith('55')) {
    return cleaned;
  }
  // Se não, adiciona 55
  return '55' + cleaned;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    
    console.log('📥 Z-API Webhook recebido:', JSON.stringify(payload, null, 2));

    // Extrair dados da mensagem
    const rawPhone = payload.phone || payload.from || payload.sender || '';
    const messageBody = payload.message?.body || payload.text?.message || payload.body || '';
    const messageId = payload.message?.id || payload.messageId || payload.id || '';
    const instance = payload.instance || payload.instanceId || '';

    console.log('📞 Dados extraídos - Phone:', rawPhone, 'Body:', messageBody?.substring(0, 50));

    if (!rawPhone || !messageBody) {
      console.log('⚠️ Faltando phone ou mensagem, ignorando');
      return Response.json({ success: true, skipped: true }, { status: 200 });
    }

    const phone = normalizePhone(rawPhone);
    console.log('📞 Telefone normalizado:', phone);

    // Buscar ou criar Company (pegar a primeira disponível)
    let companies = await base44.asServiceRole.entities.Company.list();
    if (companies.length === 0) {
      console.log('⚠️ Nenhuma empresa encontrada, criando empresa padrão');
      const newCompany = await base44.asServiceRole.entities.Company.create({
        name: 'Empresa Padrão',
        plan: 'free',
        status: 'active'
      });
      companies = [newCompany];
    }
    const company = companies[0];
    console.log('🏢 Empresa:', company.name, company.id);

    // Buscar pipeline padrão da empresa
    const pipelines = await base44.asServiceRole.entities.Pipeline.filter({
      company_id: company.id,
      is_default: true
    });

    let defaultPipeline = null;
    let firstStage = null;

    if (pipelines.length > 0) {
      defaultPipeline = pipelines[0];
      const stages = await base44.asServiceRole.entities.PipelineStage.filter(
        { pipeline_id: defaultPipeline.id },
        'order',
        1
      );
      firstStage = stages[0] || null;
      console.log('📊 Pipeline:', defaultPipeline.name, '- Primeiro estágio:', firstStage?.name);
    }

    // Buscar ou criar Lead
    let leads = await base44.asServiceRole.entities.Lead.filter({ phone });
    let lead;
    
    if (leads.length === 0) {
      console.log('👤 Criando novo lead para:', phone);
      
      // Buscar nome do contato no Z-API
      let contactName = `Lead ${phone}`;
      try {
        const instanceId = Deno.env.get('ZAPI_INSTANCE_ID');
        const token = Deno.env.get('ZAPI_TOKEN');
        
        if (instanceId && token) {
          const contactResponse = await fetch(
            `https://api.z-api.io/instances/${instanceId}/token/${token}/contacts/${rawPhone}`,
            { method: 'GET' }
          );
          
          if (contactResponse.ok) {
            const contactData = await contactResponse.json();
            if (contactData.name || contactData.pushname || contactData.notify) {
              contactName = contactData.name || contactData.pushname || contactData.notify;
              console.log('✅ Nome do contato encontrado:', contactName);
            }
          }
        }
      } catch (error) {
        console.log('⚠️ Erro ao buscar nome do contato, usando padrão:', error.message);
      }
      
      lead = await base44.asServiceRole.entities.Lead.create({
        name: contactName,
        phone,
        source: 'whatsapp',
        source_channel: 'whatsapp',
        status: 'new',
        pipeline_id: defaultPipeline?.id || null,
        pipeline_stage_id: firstStage?.id || null,
        score: 0,
        last_interaction_type: 'ia_chat',
        last_interaction_at: new Date().toISOString(),
        last_contact_at: new Date().toISOString()
      });
      console.log('✅ Lead criado:', lead.id, lead.name, '- Estágio:', firstStage?.name);
    } else {
      lead = leads[0];
      console.log('✅ Lead encontrado:', lead.id, lead.name);
      
      // Atualizar última interação
      await base44.asServiceRole.entities.Lead.update(lead.id, {
        last_interaction_type: 'ia_chat',
        last_interaction_at: new Date().toISOString(),
        last_contact_at: new Date().toISOString()
      });
    }

    // Buscar ou criar Conversation
    let conversations = await base44.asServiceRole.entities.Conversation.filter({ 
      lead_id: lead.id,
      channel: 'whatsapp',
      status: 'bot_active'
    });
    
    let conversation;
    if (conversations.length === 0) {
      console.log('💬 Criando nova conversa para lead:', lead.id);
      conversation = await base44.asServiceRole.entities.Conversation.create({
        company_id: company.id,
        lead_id: lead.id,
        channel: 'whatsapp',
        status: 'bot_active',
        ai_active: true,
        last_message_preview: messageBody.substring(0, 100),
        last_message_at: new Date().toISOString(),
        started_at: new Date().toISOString()
      });
      console.log('✅ Conversa criada:', conversation.id);
    } else {
      conversation = conversations[0];
      console.log('✅ Conversa encontrada:', conversation.id);
      
      // Atualizar última mensagem
      await base44.asServiceRole.entities.Conversation.update(conversation.id, {
        last_message_preview: messageBody.substring(0, 100),
        last_message_at: new Date().toISOString()
      });
    }

    // Criar Message
    const message = await base44.asServiceRole.entities.Message.create({
      company_id: company.id,
      conversation_id: conversation.id,
      lead_id: lead.id,
      sender_type: 'lead',
      sender_id: phone,
      content: messageBody,
      message_type: 'text',
      direction: 'inbound',
      metadata: payload,
      external_message_id: messageId,
      delivered: true,
      read: false,
      created_at: new Date().toISOString()
    });

    console.log('✅ Mensagem salva:', message.id, 'Conteúdo:', messageBody.substring(0, 50));

    // ==========================================
    // RESPOSTA AUTOMÁTICA VIA IA
    // ==========================================

    try {
      // Buscar conexão Z-API ativa com credenciais que correspondem
      const connections = await base44.asServiceRole.entities.Connection.filter({
        type: 'whatsapp_zapi',
        is_active: true
      });

      if (connections.length === 0) {
        console.log('⚠️ Nenhuma conexão Z-API ativa encontrada');
        return Response.json({ 
          success: true, 
          lead_id: lead.id,
          conversation_id: conversation.id,
          message_id: message.id
        }, { status: 200 });
      }

      // Tentar encontrar conexão específica por instance_id
      let connection = connections.find(c => c.credentials?.instance_id === instance);
      if (!connection) {
        connection = connections[0]; // Fallback para primeira ativa
      }

      console.log('🔌 Conexão identificada:', connection.name);

      // Verificar se resposta automática está ativada
      if (connection.auto_reply_enabled === false) {
        console.log('⏸️ Resposta automática desativada para esta conexão');
        return Response.json({ 
          success: true, 
          lead_id: lead.id,
          conversation_id: conversation.id,
          message_id: message.id
        }, { status: 200 });
      }

      // Verificar se conversa está em atendimento humano OU se IA está desabilitada
      if (conversation.status === 'human_active' || conversation.human_handoff || conversation.ai_active === false) {
        console.log('👤 Conversa em atendimento humano ou IA desabilitada, pulando IA');
        return Response.json({ 
          success: true, 
          lead_id: lead.id,
          conversation_id: conversation.id,
          message_id: message.id,
          skipped_reason: conversation.ai_active === false ? 'ai_disabled' : 'human_active'
        }, { status: 200 });
      }

      // Detectar gatilhos de handoff automático e status
      const messageText = messageBody.toLowerCase();
      const handoffKeywords = ['atendente', 'pessoa', 'humano', 'falar com alguém', 'pessoa real'];
      const shouldHandoff = handoffKeywords.some(keyword => messageText.includes(keyword));
      
      // Detectar keywords de status
      const scheduleKeywords = ['agendar', 'marcar avaliação', 'quero agendar', 'fazer avaliação', 'sim quero'];
      const refuseKeywords = ['não quero', 'não tenho interesse', 'não me interessa', 'não obrigado', 'para de mandar'];
      
      const wantsSchedule = scheduleKeywords.some(keyword => messageText.includes(keyword));
      const wantsToStop = refuseKeywords.some(keyword => messageText.includes(keyword));

      // Processar solicitação de parada
      if (wantsToStop) {
        console.log('🛑 Lead solicitou parar contato');
        
        // Atualizar lead
        await base44.asServiceRole.entities.Lead.update(lead.id, {
          status: 'lost',
          last_interaction_at: new Date().toISOString()
        });

        // Buscar estágio "Perdido"
        if (defaultPipeline && firstStage) {
          const lostStages = await base44.asServiceRole.entities.PipelineStage.filter({
            pipeline_id: defaultPipeline.id,
            stage_type: 'lost'
          });
          
          if (lostStages.length > 0) {
            await base44.asServiceRole.entities.Lead.update(lead.id, {
              pipeline_stage_id: lostStages[0].id
            });
            
            // Criar histórico
            await base44.asServiceRole.entities.ActivityLog.create({
              company_id: company.id,
              lead_id: lead.id,
              action: 'stage_changed',
              old_value: firstStage?.name,
              new_value: lostStages[0].name,
              details: { reason: 'lead_refused', auto: true }
            });
          }
        }

        // Pausar IA
        await base44.asServiceRole.entities.Conversation.update(conversation.id, {
          ai_active: false,
          status: 'closed'
        });

        const stopMessage = 'Entendido! Obrigado pelo seu tempo. Caso mude de ideia, estou por aqui. 😊';
        
        await base44.asServiceRole.functions.invoke('zapiSendMessage', {
          phone: rawPhone,
          message: stopMessage,
          connection_id: connection.id
        });

        return Response.json({ 
          success: true, 
          lead_id: lead.id,
          status: 'stopped'
        }, { status: 200 });
      }

      if (shouldHandoff) {
        console.log('🔔 Gatilho de handoff detectado');
        
        // Atualizar conversa para handoff
        await base44.asServiceRole.entities.Conversation.update(conversation.id, {
          human_handoff: true,
          handoff_reason: 'lead_request',
          handoff_at: new Date().toISOString(),
          status: 'human_active'
        });

        // Enviar mensagem de transferência
        const handoffMessage = 'Perfeito 😊 vou te colocar em contato com uma de nossas consultoras agora.';
        
        const sendResult = await base44.asServiceRole.functions.invoke('zapiSendMessage', {
          phone: rawPhone,
          message: handoffMessage,
          connection_id: connection.id
        });

        if (sendResult.data?.success) {
          await base44.asServiceRole.entities.Message.create({
            company_id: company.id,
            conversation_id: conversation.id,
            lead_id: lead.id,
            sender_type: 'bot',
            sender_id: null,
            content: handoffMessage,
            message_type: 'text',
            direction: 'outbound',
            metadata: { handoff_message: true },
            delivered: true,
            read: true,
            created_at: new Date().toISOString()
          });
        }

        console.log('✅ Conversa transferida para atendimento humano');
        
        return Response.json({ 
          success: true, 
          lead_id: lead.id,
          conversation_id: conversation.id,
          message_id: message.id,
          handoff: true
        }, { status: 200 });
      }

      let responseMessage = '';
      let assistant = null;
      let flow = null;

      // Buscar assistente vinculado à conexão ou da conversa
      const assistantId = connection.assistant_id || conversation.assigned_assistant_id;
      
      if (assistantId) {
        const assistants = await base44.asServiceRole.entities.Assistant.filter({
          id: assistantId,
          is_active: true
        });

        if (assistants.length > 0) {
          assistant = assistants[0];
          console.log('🤖 Assistente identificado:', assistant.name);
          
          // Vincular assistente à conversa se ainda não estiver
          if (!conversation.assigned_assistant_id) {
            await base44.asServiceRole.entities.Conversation.update(conversation.id, {
              assigned_assistant_id: assistant.id
            });
            console.log('✅ Assistente vinculado à conversa');
          }

          // Buscar fluxo (prioridade: fluxo da conversa > fluxo da conexão > fluxo padrão)
          const flowId = conversation.ai_flow_id || connection.default_flow_id || null;
          if (flowId) {
            const flows = await base44.asServiceRole.entities.AIConversationFlow.filter({
              id: flowId,
              is_active: true
            });
            if (flows.length > 0) {
              flow = flows[0];
              console.log('📋 Fluxo identificado:', flow.name);
              
              // Vincular fluxo à conversa se ainda não estiver
              if (!conversation.ai_flow_id) {
                await base44.asServiceRole.entities.Conversation.update(conversation.id, {
                  ai_flow_id: flow.id
                });
                console.log('✅ Fluxo vinculado à conversa');
              }
            }
          }

          // Buscar histórico de mensagens da conversa
          const previousMessages = await base44.asServiceRole.entities.Message.filter(
            { conversation_id: conversation.id },
            'created_date',
            20
          );

          const isFirstMessage = previousMessages.length === 1;

          // Montar contexto para IA
          const conversationHistory = previousMessages
            .slice(0, -1)
            .map(msg => ({
              role: msg.sender_type === 'lead' ? 'user' : 'assistant',
              content: msg.content
            }));

          // Construir prompt com regras do assistente
          let prompt = assistant.system_prompt || 'Você é um assistente de atendimento profissional e prestativo.';
          
          if (assistant.rules && assistant.rules.length > 0) {
            prompt += '\n\nRegras de comportamento:\n' + assistant.rules.map(r => `- ${r}`).join('\n');
          }

          if (isFirstMessage && assistant.greeting_message) {
            prompt += `\n\nMensagem de saudação: ${assistant.greeting_message}`;
          }

          if (flow?.greeting_message && isFirstMessage) {
            prompt += `\n\nFluxo selecionado: ${flow.name}`;
          }

          prompt += `\n\nHistórico da conversa:
${conversationHistory.map(m => `${m.role === 'user' ? 'Cliente' : 'Assistente'}: ${m.content}`).join('\n')}

Cliente: ${messageBody}

Responda de forma ${assistant.tone || 'humanizada'} e profissional. Seja breve e direto.`;

          const aiResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: prompt
          });

          responseMessage = aiResponse.response || aiResponse;
          console.log('🧠 Resposta gerada pela IA');
          
          // Atualizar status do lead baseado no progresso
          const previousMessagesCount = previousMessages.length;
          let newLeadStatus = lead.status;
          let shouldUpdateStage = false;
          let targetStageType = null;

          // Primeira interação: contacted
          if (previousMessagesCount === 1 && lead.status === 'new') {
            newLeadStatus = 'contacted';
            console.log('📊 Lead status: new → contacted');
          }

          // Após 3+ mensagens: qualified (indicando engajamento)
          if (previousMessagesCount >= 3 && lead.status === 'contacted') {
            newLeadStatus = 'qualified';
            targetStageType = 'qualified';
            shouldUpdateStage = true;
            console.log('📊 Lead status: contacted → qualified');
          }

          // Detectar agendamento
          if (wantsSchedule) {
            newLeadStatus = 'qualified';
            targetStageType = 'scheduled';
            shouldUpdateStage = true;
            console.log('📅 Lead quer agendar - status → scheduled');
          }

          // Atualizar lead se status mudou
          if (newLeadStatus !== lead.status || shouldUpdateStage) {
            const updateData = {
              status: newLeadStatus,
              last_interaction_at: new Date().toISOString()
            };

            if (shouldUpdateStage && defaultPipeline) {
              const targetStages = await base44.asServiceRole.entities.PipelineStage.filter({
                pipeline_id: defaultPipeline.id,
                stage_type: targetStageType
              });

              if (targetStages.length > 0) {
                updateData.pipeline_stage_id = targetStages[0].id;
                
                // Criar histórico de mudança de estágio
                await base44.asServiceRole.entities.ActivityLog.create({
                  company_id: company.id,
                  lead_id: lead.id,
                  action: 'stage_changed',
                  old_value: firstStage?.name,
                  new_value: targetStages[0].name,
                  details: { 
                    reason: wantsSchedule ? 'wants_schedule' : 'qualified_by_ai',
                    auto: true,
                    messages_count: previousMessagesCount
                  }
                });

                console.log('📊 Lead movido para estágio:', targetStages[0].name);
              }
            }

            await base44.asServiceRole.entities.Lead.update(lead.id, updateData);
          }
          
          // Atualizar também o lead na conversa
          if (conversation.assigned_assistant_id !== assistant.id) {
            await base44.asServiceRole.entities.Conversation.update(conversation.id, {
              assigned_assistant_id: assistant.id
            });
          }
        } else {
          console.log('⚠️ Assistente não encontrado ou inativo');
        }
      } else {
        console.log('⚠️ Nenhum assistente vinculado à conexão ou conversa');
      }

      // Fallback se não houver assistente ou erro
      if (!responseMessage) {
        responseMessage = connection.fallback_message || 'Olá! Recebemos sua mensagem 😊 Em instantes alguém do nosso time irá te atender.';
        console.log('⚠️ Usando mensagem de fallback');
      }

      // Enviar resposta via Z-API
      const sendResult = await base44.asServiceRole.functions.invoke('zapiSendMessage', {
        phone: rawPhone,
        message: responseMessage,
        connection_id: connection.id
      });

      if (sendResult.data?.success) {
        console.log('✅ Resposta enviada via Z-API');

        // Salvar mensagem enviada no banco
        await base44.asServiceRole.entities.Message.create({
          company_id: company.id,
          conversation_id: conversation.id,
          lead_id: lead.id,
          sender_type: 'bot',
          sender_id: assistant?.id || null,
          content: responseMessage,
          message_type: 'text',
          direction: 'outbound',
          metadata: {
            assistant_id: assistant?.id,
            flow_id: flow?.id,
            connection_id: connection.id,
            assistant_response: true,
            response_time_ms: Date.now() - new Date(message.created_at).getTime()
          },
          delivered: true,
          read: true,
          created_at: new Date().toISOString()
        });

        console.log('💬 Resposta salva no banco');
      }

    } catch (aiError) {
      console.error('❌ Erro ao processar resposta automática:', aiError);
      // Não falha o webhook se a resposta automática der erro
    }

    return Response.json({ 
      success: true, 
      lead_id: lead.id,
      conversation_id: conversation.id,
      message_id: message.id
    }, { status: 200 });

  } catch (error) {
    console.error('❌ ERRO ao processar webhook:', error.message);
    console.error('Stack:', error.stack);
    // Sempre retornar 200 para não bloquear Z-API
    return Response.json({ success: true, error: error.message }, { status: 200 });
  }
});