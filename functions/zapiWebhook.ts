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
        status: 'ativo'
      });
      console.log('✅ Lead criado:', lead.id, lead.name);
    } else {
      lead = leads[0];
      console.log('✅ Lead encontrado:', lead.id, lead.name);
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
      // Buscar conexão Z-API ativa
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

      const connection = connections[0];

      // Buscar assistente ativo
      const assistants = await base44.asServiceRole.entities.Assistant.filter({
        is_active: true,
        channel: 'whatsapp'
      });

      let responseMessage = '';

      if (assistants.length > 0) {
        const assistant = assistants[0];
        console.log('🤖 Assistente encontrado:', assistant.name);

        // Buscar histórico de mensagens da conversa
        const previousMessages = await base44.asServiceRole.entities.Message.filter(
          { conversation_id: conversation.id },
          'created_date',
          20
        );

        // Montar contexto para IA
        const conversationHistory = previousMessages
          .slice(0, -1) // Remove a última (que acabou de chegar)
          .map(msg => ({
            role: msg.sender_type === 'lead' ? 'user' : 'assistant',
            content: msg.content
          }));

        // Gerar resposta usando IA
        const prompt = `${assistant.system_prompt || 'Você é um assistente de atendimento profissional e prestativo.'}

${assistant.greeting_message && conversationHistory.length === 0 ? `Mensagem de saudação: ${assistant.greeting_message}` : ''}

Histórico da conversa:
${conversationHistory.map(m => `${m.role === 'user' ? 'Cliente' : 'Assistente'}: ${m.content}`).join('\n')}

Cliente: ${messageBody}

Responda de forma ${assistant.tone || 'humanizada'} e profissional. Seja breve e direto.`;

        const aiResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: prompt
        });

        responseMessage = aiResponse.response || aiResponse;
        console.log('🧠 Resposta gerada pela IA');

      } else {
        // Fallback se não houver assistente
        responseMessage = 'Olá! Recebemos sua mensagem 😊 Em instantes alguém do nosso time irá te atender.';
        console.log('⚠️ Nenhum assistente ativo, usando mensagem padrão');
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
          sender_id: null,
          content: responseMessage,
          message_type: 'text',
          direction: 'outbound',
          metadata: {
            assistant_response: true
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