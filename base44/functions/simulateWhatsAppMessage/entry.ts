import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { channelId, leadId, message, leadName = 'Lead Teste' } = payload;

    if (!channelId || !leadId || !message) {
      return Response.json({ error: 'Parâmetros obrigatórios: channelId, leadId, message' }, { status: 400 });
    }

    console.log(`[WhatsApp Teste] Recebendo mensagem no canal ${channelId} de ${leadId}`);

    // Verificar canal
    const channels = await base44.entities.WhatsAppChannel.filter({ id: channelId });
    if (!channels || channels.length === 0) {
      return Response.json({ error: 'Canal não encontrado' }, { status: 404 });
    }

    const channel = channels[0];
    if (channel.status !== 'connected') {
      return Response.json({ error: 'Canal não está conectado' }, { status: 400 });
    }

    // Obter lead
    const leads = await base44.entities.Lead.filter({ id: leadId });
    if (!leads || leads.length === 0) {
      return Response.json({ error: 'Lead não encontrado' }, { status: 404 });
    }

    const lead = leads[0];

    // Criar ou recuperar conversa
    let conversation = null;
    const conversations = await base44.entities.Conversation.filter({
      lead_id: leadId,
      channel: 'whatsapp',
      status: { $ne: 'closed' }
    });

    if (conversations && conversations.length > 0) {
      conversation = conversations[0];
    } else {
      // Criar nova conversa
      conversation = await base44.asServiceRole.entities.Conversation.create({
        lead_id: leadId,
        unit_id: lead.unit_id,
        company_id: lead.company_id,
        channel: 'whatsapp',
        status: 'bot_active',
        ai_active: true,
        priority: 'normal'
      });
    }

    // Salvar mensagem do lead
    await base44.asServiceRole.entities.Message.create({
      conversation_id: conversation.id,
      lead_id: leadId,
      company_id: lead.company_id,
      unit_id: lead.unit_id,
      sender_type: 'lead',
      content: message,
      message_type: 'text',
      direction: 'inbound',
      delivered: true
    });

    // Atualizar last_interaction_at do lead
    await base44.asServiceRole.entities.Lead.update(leadId, {
      last_interaction_at: new Date().toISOString()
    });

    console.log(`[WhatsApp Teste] Mensagem salva na conversa ${conversation.id}`);

    return Response.json({
      success: true,
      conversationId: conversation.id,
      leadId: leadId,
      channelId: channelId,
      message: 'Mensagem recebida e processada'
    });
  } catch (error) {
    console.error('[WhatsApp Teste] Erro:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});