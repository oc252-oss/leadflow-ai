import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Auto-ativa IA quando uma mensagem inbound é recebida
 * Triggered by Message entity creation automation
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    console.log('🤖 [AutoActivateAI] Received payload:', JSON.stringify(payload, null, 2));

    // Extrair dados da mensagem do evento
    const messageData = payload.data;
    const eventType = payload.event?.type;

    // Apenas processar se for CREATE de mensagem INBOUND de LEAD
    if (eventType !== 'create') {
      console.log('⏭️ Not a create event, skipping');
      return Response.json({ success: true, skipped: 'not_create_event' });
    }

    if (!messageData || messageData.direction !== 'inbound' || messageData.sender_type !== 'lead') {
      console.log('⏭️ Not an inbound lead message, skipping');
      return Response.json({ success: true, skipped: 'not_inbound_lead_message' });
    }

    const conversationId = messageData.conversation_id;
    const leadId = messageData.lead_id;
    const messageContent = messageData.content;

    if (!conversationId || !leadId) {
      console.log('❌ Missing conversation_id or lead_id');
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Buscar conversa
    const conversations = await base44.asServiceRole.entities.Conversation.filter({ id: conversationId });
    if (conversations.length === 0) {
      console.log('❌ Conversation not found');
      return Response.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const conversation = conversations[0];

    // PROTEÇÕES - NÃO executar IA se:
    if (conversation.status === 'human_active') {
      console.log('🛑 Status is human_active, skipping AI');
      return Response.json({ success: true, skipped: 'human_active' });
    }

    if (conversation.status === 'closed') {
      console.log('🛑 Conversation is closed, skipping AI');
      return Response.json({ success: true, skipped: 'closed' });
    }

    if (conversation.ai_active === false) {
      console.log('🛑 AI is disabled, skipping');
      return Response.json({ success: true, skipped: 'ai_disabled' });
    }

    // Buscar lead
    const leads = await base44.asServiceRole.entities.Lead.filter({ id: leadId });
    if (leads.length === 0) {
      console.log('❌ Lead not found');
      return Response.json({ error: 'Lead not found' }, { status: 404 });
    }

    const lead = leads[0];

    // ETAPA 3 - Identificar Assistente IA correto
    let assistant = null;
    let flow = null;

    // 1. Assistente vinculado à conversa
    if (conversation.assigned_assistant_id) {
      const assistants = await base44.asServiceRole.entities.Assistant.filter({ 
        id: conversation.assigned_assistant_id,
        is_active: true 
      });
      if (assistants.length > 0) {
        assistant = assistants[0];
        console.log('✅ Using conversation assistant:', assistant.name);
      }
    }

    // 2. Buscar assistente pela conexão (se houver)
    if (!assistant && conversation.company_id) {
      const connections = await base44.asServiceRole.entities.Connection.filter({
        status: 'conectado',
        is_active: true
      });
      
      if (connections.length > 0) {
        const connection = connections[0];
        if (connection.assistant_id) {
          const assistants = await base44.asServiceRole.entities.Assistant.filter({ 
            id: connection.assistant_id,
            is_active: true 
          });
          if (assistants.length > 0) {
            assistant = assistants[0];
            console.log('✅ Using connection assistant:', assistant.name);
          }
        }

        // Buscar flow da conexão
        if (connection.default_flow_id) {
          const flows = await base44.asServiceRole.entities.AIConversationFlow.filter({ 
            id: connection.default_flow_id,
            is_active: true 
          });
          if (flows.length > 0) {
            flow = flows[0];
            console.log('✅ Using connection flow:', flow.name);
          }
        }
      }
    }

    // 3. Assistente padrão da empresa
    if (!assistant) {
      const assistants = await base44.asServiceRole.entities.Assistant.filter({ 
        is_active: true
      }, '-created_date', 1);
      
      if (assistants.length > 0) {
        assistant = assistants[0];
        console.log('✅ Using default assistant:', assistant.name);
      }
    }

    if (!assistant) {
      console.log('❌ No assistant found');
      return Response.json({ error: 'No active assistant found' }, { status: 404 });
    }

    // ETAPA 4 - Ativar IA e atualizar conversa
    await base44.asServiceRole.entities.Conversation.update(conversationId, {
      ai_active: true,
      status: 'bot_active',
      assigned_assistant_id: assistant.id,
      ai_flow_id: flow?.id || conversation.ai_flow_id,
      last_message_at: new Date().toISOString()
    });

    console.log('✅ Conversation updated with AI active');

    // Buscar histórico de mensagens para contexto
    const previousMessages = await base44.asServiceRole.entities.Message.filter(
      { conversation_id: conversationId },
      'created_date',
      50
    );

    const conversationHistory = previousMessages
      .filter(msg => msg.id !== messageData.id) // Excluir a mensagem atual
      .map(msg => ({
        role: msg.sender_type === 'lead' ? 'user' : 'assistant',
        content: msg.content
      }));

    // Buscar contexto da campanha
    let campaignContext = '';
    if (lead.campaign_id) {
      try {
        const campaigns = await base44.asServiceRole.entities.Campaign.filter({ id: lead.campaign_id });
        if (campaigns.length > 0 && campaigns[0].campaign_context) {
          campaignContext = campaigns[0].campaign_context;
          console.log('📋 Campaign context found');
        }
      } catch (error) {
        console.log('⚠️ Error fetching campaign:', error.message);
      }
    }

    // Construir prompt para IA
    let prompt = assistant.system_prompt || 'Você é um assistente de atendimento profissional e prestativo.';
    
    if (assistant.rules && assistant.rules.length > 0) {
      prompt += '\n\nRegras de comportamento:\n' + assistant.rules.map(r => `- ${r}`).join('\n');
    }

    // Adicionar contexto da campanha
    if (campaignContext) {
      prompt += `\n\n🎯 CONTEXTO DA CAMPANHA:\n${campaignContext}`;
      prompt += '\n\nIMPORTANTE: Use este contexto para ser mais assertivo e relevante nas suas respostas.';
    } else if (lead.campaign_name) {
      prompt += `\n\n🎯 Lead veio da campanha: "${lead.campaign_name}"`;
    }

    // Adicionar informações do lead
    prompt += `\n\nInformações do lead:
- Nome: ${lead.name}
- Interesse: ${lead.interest || 'não informado'}
- Nível de interesse: ${lead.interest_level || 'não informado'}
- Urgência: ${lead.urgency || 'não informada'}`;

    if (conversationHistory.length === 0 && assistant.greeting_message) {
      prompt += `\n\nEsta é a primeira mensagem. Use a saudação: ${assistant.greeting_message}`;
    }

    prompt += `\n\nHistórico da conversa:
${conversationHistory.map(m => `${m.role === 'user' ? 'Cliente' : 'Assistente'}: ${m.content}`).join('\n')}

Cliente: ${messageContent}

Responda de forma ${assistant.tone || 'humanizada'} e profissional. Seja breve e direto.`;

    // ETAPA 5 - Invocar IA e enviar resposta
    console.log('🤖 Invoking AI...');
    
    const aiResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: prompt
    });

    const responseText = typeof aiResponse === 'string' ? aiResponse : aiResponse.response || aiResponse.content || JSON.stringify(aiResponse);
    
    console.log('✅ AI Response:', responseText);

    // Registrar resposta da IA no banco
    await base44.asServiceRole.entities.Message.create({
      company_id: conversation.company_id,
      unit_id: conversation.unit_id,
      conversation_id: conversationId,
      lead_id: leadId,
      sender_type: 'bot',
      content: responseText,
      message_type: 'text',
      direction: 'outbound',
      delivered: false,
      read: false
    });

    // Enviar via Z-API (se houver conexão configurada)
    try {
      const zapiToken = Deno.env.get('ZAPI_TOKEN');
      const zapiInstanceId = Deno.env.get('ZAPI_INSTANCE_ID');

      if (zapiToken && zapiInstanceId && lead.phone) {
        const phone = lead.phone.replace(/\D/g, '');
        
        const zapiResponse = await fetch(
          `https://api.z-api.io/instances/${zapiInstanceId}/token/${zapiToken}/send-text`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phone: phone,
              message: responseText
            })
          }
        );

        if (zapiResponse.ok) {
          console.log('✅ Message sent via Z-API');
          
          // Atualizar status de entrega
          const messages = await base44.asServiceRole.entities.Message.filter({
            conversation_id: conversationId,
            content: responseText,
            sender_type: 'bot'
          }, '-created_date', 1);

          if (messages.length > 0) {
            await base44.asServiceRole.entities.Message.update(messages[0].id, {
              delivered: true
            });
          }
        } else {
          console.log('⚠️ Z-API send failed:', await zapiResponse.text());
        }
      }
    } catch (error) {
      console.log('⚠️ Error sending via Z-API:', error.message);
    }

    // Atualizar timestamp da última resposta
    await base44.asServiceRole.entities.Conversation.update(conversationId, {
      last_message_at: new Date().toISOString()
    });

    return Response.json({ 
      success: true,
      assistant: assistant.name,
      response_sent: true
    });

  } catch (error) {
    console.error('❌ [AutoActivateAI] Error:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});