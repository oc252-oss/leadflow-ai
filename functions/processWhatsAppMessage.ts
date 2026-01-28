import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const { senderJid, messageText, sessionId, senderName } = await req.json();

    if (!senderJid || !messageText) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Normalizar número
    const phoneNumber = senderJid.replace('@s.whatsapp.net', '').replace(/\D/g, '');

    // Buscar ou criar Lead
    let lead = null;
    const existingLeads = await base44.entities.Lead.filter({
      phone: phoneNumber
    });

    if (existingLeads.length > 0) {
      lead = existingLeads[0];
    } else {
      lead = await base44.entities.Lead.create({
        organization_id: 'default',
        brand_id: 'default',
        unit_id: 'default',
        name: senderName || `Lead ${phoneNumber.slice(-4)}`,
        phone: phoneNumber,
        source: 'whatsapp',
        platform: 'whatsapp',
        status: 'active'
      });
    }

    // Buscar ou criar Conversa
    let conversation = null;
    const existingConversations = await base44.entities.Conversation.filter({
      lead_id: lead.id,
      channel: 'whatsapp',
      status: { $ne: 'closed' }
    });

    if (existingConversations.length > 0) {
      conversation = existingConversations[0];
    } else {
      // Buscar assistente ativo para WhatsApp
      const assistants = await base44.entities.Assistant.filter({
        channel: 'whatsapp',
        is_active: true
      });

      const activeAssistant = assistants.length > 0 ? assistants[0] : null;

      conversation = await base44.entities.Conversation.create({
        company_id: 'default',
        unit_id: 'default',
        lead_id: lead.id,
        channel: 'whatsapp',
        status: 'bot_active',
        ai_active: true
      });
    }

    // Salvar mensagem recebida
    await base44.entities.Message.create({
      company_id: 'default',
      unit_id: 'default',
      conversation_id: conversation.id,
      lead_id: lead.id,
      sender_type: 'lead',
      content: messageText,
      message_type: 'text',
      direction: 'inbound',
      delivered: true
    });

    // Processar com IA
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `Você é um assistente de atendimento profissional pelo WhatsApp. Responda de forma natural, breve e acolhedora.\n\nMensagem do cliente: "${messageText}"\n\nResponda:`,
      add_context_from_internet: false
    });

    // Salvar resposta da IA
    await base44.entities.Message.create({
      company_id: 'default',
      unit_id: 'default',
      conversation_id: conversation.id,
      lead_id: lead.id,
      sender_type: 'bot',
      content: response,
      message_type: 'text',
      direction: 'outbound',
      delivered: false
    });

    // Atualizar status da conversa
    await base44.entities.Conversation.update(conversation.id, {
      status: 'bot_active',
      last_message_at: new Date().toISOString(),
      last_message_preview: response
    });

    return Response.json({
      success: true,
      leadId: lead.id,
      conversationId: conversation.id,
      response,
      phoneNumber
    });
  } catch (error) {
    console.error('Erro ao processar mensagem:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});