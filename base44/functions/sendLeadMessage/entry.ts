import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversation_id, lead_id, content } = await req.json();

    if (!conversation_id || !lead_id || !content) {
      return Response.json({
        error: 'conversation_id, lead_id, and content are required'
      }, { status: 400 });
    }

    console.log('Processing message for conversation:', conversation_id);

    // Get conversation
    const conversations = await base44.asServiceRole.entities.Conversation.filter({
      id: conversation_id
    });
    if (conversations.length === 0) {
      return Response.json({ error: 'Conversation not found' }, { status: 404 });
    }
    const conversation = conversations[0];

    // Get lead
    const leads = await base44.asServiceRole.entities.Lead.filter({ id: lead_id });
    if (leads.length === 0) {
      return Response.json({ error: 'Lead not found' }, { status: 404 });
    }
    const lead = leads[0];

    // Create lead message
    const leadMessage = await base44.asServiceRole.entities.Message.create({
      company_id: conversation.company_id,
      unit_id: conversation.unit_id,
      conversation_id: conversation_id,
      lead_id,
      sender_type: 'lead',
      content,
      message_type: 'text',
      direction: 'inbound',
      delivered: true,
      read: false
    });

    console.log('Lead message created:', leadMessage.id);

    // Update lead last interaction
    await base44.asServiceRole.entities.Lead.update(lead_id, {
      last_interaction_at: new Date().toISOString()
    });

    // Trigger AI if bot is active
    let aiResponse = null;
    if (conversation.status === 'bot_active' && conversation.ai_active) {
      console.log('Triggering AI response...');

      try {
        const aiResult = await base44.asServiceRole.functions.invoke('processAIConversation', {
          conversation_id,
          lead_id,
          message_content: content
        });

        aiResponse = aiResult.data?.ai_response;
        console.log('AI response generated:', aiResponse);
      } catch (error) {
        console.error('Error calling processAIConversation:', error);
      }
    }

    // Update conversation last message
    await base44.asServiceRole.entities.Conversation.update(conversation_id, {
      last_message_at: new Date().toISOString(),
      last_message_preview: content.substring(0, 100)
    });

    return Response.json({
      success: true,
      message_id: leadMessage.id,
      ai_response: aiResponse
    });

  } catch (error) {
    console.error('Error sending message:', error);
    return Response.json({
      error: 'Failed to send message',
      details: error.message
    }, { status: 500 });
  }
});