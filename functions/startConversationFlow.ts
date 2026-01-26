import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (!data?.id) {
      return Response.json({ error: 'conversation_id is required' }, { status: 400 });
    }

    console.log('Starting AI flow for conversation:', data.id);

    const conversation = data;

    // Only handle webchat channels
    if (conversation.channel !== 'webchat') {
      console.log('Skipping non-webchat channel:', conversation.channel);
      return Response.json({ success: true, message: 'Not a webchat conversation' });
    }

    // Check if already has an AI flow assigned
    if (conversation.ai_flow_id) {
      console.log('Conversation already has AI flow assigned:', conversation.ai_flow_id);
      return Response.json({ success: true, message: 'Flow already assigned' });
    }

    // Find matching AI flow
    const flows = await base44.asServiceRole.entities.AIConversationFlow.filter({
      company_id: conversation.company_id,
      is_active: true
    }, '-priority');

    console.log(`Found ${flows.length} active flows for company ${conversation.company_id}`);

    const matchingFlows = flows.filter(flow => {
      if (!flow.trigger_sources || flow.trigger_sources.length === 0) {
        return true;
      }
      return flow.trigger_sources.includes('webchat');
    });

    console.log(`Found ${matchingFlows.length} flows matching webchat`);

    if (matchingFlows.length === 0) {
      console.log('No matching AI flow found');
      return Response.json({ success: true, message: 'No matching flow' });
    }

    const selectedFlow = matchingFlows[0];
    console.log('Selected AI flow:', selectedFlow.name, 'ID:', selectedFlow.id);

    // Send greeting message
    if (selectedFlow.greeting_message) {
      await base44.asServiceRole.entities.Message.create({
        company_id: conversation.company_id,
        unit_id: conversation.unit_id,
        conversation_id: conversation.id,
        lead_id: conversation.lead_id,
        sender_type: 'bot',
        content: selectedFlow.greeting_message,
        message_type: 'text',
        direction: 'outbound',
        delivered: true,
        read: false
      });

      console.log('Greeting message sent');
    }

    // Update conversation with AI flow info
    await base44.asServiceRole.entities.Conversation.update(conversation.id, {
      ai_flow_id: selectedFlow.id,
      ai_active: true,
      status: 'bot_active',
      last_message_preview: selectedFlow.greeting_message?.substring(0, 100),
      last_message_at: new Date().toISOString()
    });

    console.log('Conversation updated with AI flow');

    // Update lead's last interaction
    if (conversation.lead_id) {
      await base44.asServiceRole.entities.Lead.update(conversation.lead_id, {
        last_interaction_at: new Date().toISOString()
      });
    }

    return Response.json({
      success: true,
      flow_id: selectedFlow.id,
      flow_name: selectedFlow.name
    });

  } catch (error) {
    console.error('Error starting conversation flow:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
    
    return Response.json({ 
      error: 'Failed to start conversation flow',
      details: error.message 
    }, { status: 500 });
  }
});