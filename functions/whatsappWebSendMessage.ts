import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message_id, conversation_id, content, phone } = await req.json();

    if (!conversation_id || !content) {
      return Response.json({ error: 'conversation_id and content required' }, { status: 400 });
    }

    // Fetch conversation
    const conversations = await base44.asServiceRole.entities.Conversation.filter({
      id: conversation_id
    });

    if (!conversations.length) {
      return Response.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const conversation = conversations[0];

    // Fetch lead to get phone if not provided
    let leadPhone = phone;
    if (!leadPhone) {
      const leads = await base44.asServiceRole.entities.Lead.filter({
        id: conversation.lead_id
      });
      if (leads.length > 0) {
        leadPhone = leads[0].phone;
      }
    }

    if (!leadPhone) {
      return Response.json({ error: 'Phone number not found' }, { status: 400 });
    }

    // Create message record
    const msg = await base44.asServiceRole.entities.Message.create({
      company_id: conversation.company_id,
      unit_id: conversation.unit_id,
      conversation_id: conversation_id,
      lead_id: conversation.lead_id,
      sender_type: 'bot',
      sender_id: user.id,
      content: content,
      message_type: 'text',
      direction: 'outbound',
      delivered: false
    });

    // Return payload for external WhatsApp Web session to send
    return Response.json({
      success: true,
      message_id: msg.id,
      phone: leadPhone,
      message: content,
      timestamp: new Date().toISOString(),
      action: 'send_whatsapp_message'
    });

  } catch (error) {
    console.error('[whatsappWebSendMessage] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});