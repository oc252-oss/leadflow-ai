import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { lead_id } = await req.json();

    if (!lead_id) {
      return Response.json({ error: 'lead_id is required' }, { status: 400 });
    }

    console.log('Starting AI conversation for lead:', lead_id);

    // Get the lead data
    const leads = await base44.asServiceRole.entities.Lead.filter({ id: lead_id });
    if (leads.length === 0) {
      console.error('Lead not found:', lead_id);
      return Response.json({ error: 'Lead not found' }, { status: 404 });
    }

    const lead = leads[0];
    console.log('Lead data:', lead);

    // Map source to channel
    const sourceToChannel = {
      'facebook_lead_ad': 'messenger',
      'messenger': 'messenger',
      'webchat': 'webchat',
      'whatsapp': 'whatsapp',
      'manual': 'webchat',
      'import': 'webchat'
    };

    const channel = sourceToChannel[lead.source] || 'webchat';
    console.log('Mapped channel:', channel);

    // Find the appropriate AI flow
    const flows = await base44.asServiceRole.entities.AIConversationFlow.filter({
      company_id: lead.company_id,
      is_active: true
    }, '-priority');

    console.log(`Found ${flows.length} active flows for company ${lead.company_id}`);

    // Filter flows that match the lead source
    const matchingFlows = flows.filter(flow => {
      if (!flow.trigger_sources || flow.trigger_sources.length === 0) {
        return true; // If no trigger sources specified, it matches all
      }
      return flow.trigger_sources.includes(lead.source);
    });

    console.log(`Found ${matchingFlows.length} flows matching source ${lead.source}`);

    if (matchingFlows.length === 0) {
      console.log('No matching AI flow found, skipping conversation creation');
      return Response.json({ 
        success: true, 
        message: 'No matching AI flow found',
        conversation: null 
      });
    }

    const selectedFlow = matchingFlows[0];
    console.log('Selected AI flow:', selectedFlow.name, 'ID:', selectedFlow.id);

    // Create the conversation
    const conversation = await base44.asServiceRole.entities.Conversation.create({
      company_id: lead.company_id,
      unit_id: lead.unit_id,
      lead_id: lead.id,
      channel: channel,
      status: 'bot_active',
      ai_active: true,
      ai_flow_id: selectedFlow.id,
      priority: 'normal',
      qualification_complete: false,
      qualification_step: 0,
      started_at: new Date().toISOString()
    });

    console.log('Conversation created:', conversation.id);

    // Send greeting message if available
    if (selectedFlow.greeting_message) {
      const greetingMessage = await base44.asServiceRole.entities.Message.create({
        company_id: lead.company_id,
        unit_id: lead.unit_id,
        conversation_id: conversation.id,
        lead_id: lead.id,
        sender_type: 'bot',
        content: selectedFlow.greeting_message,
        message_type: 'text',
        direction: 'outbound',
        delivered: true,
        read: false
      });

      console.log('Greeting message sent:', greetingMessage.id);

      // Update conversation with last message info
      await base44.asServiceRole.entities.Conversation.update(conversation.id, {
        last_message_preview: selectedFlow.greeting_message.substring(0, 100),
        last_message_at: new Date().toISOString()
      });

      console.log('Conversation updated with last message info');
    }

    // Update lead with active conversation
    await base44.asServiceRole.entities.Lead.update(lead.id, {
      active_conversation_id: conversation.id,
      last_interaction_at: new Date().toISOString()
    });

    console.log('Lead updated with active conversation');

    // Create activity log
    await base44.asServiceRole.entities.ActivityLog.create({
      company_id: lead.company_id,
      lead_id: lead.id,
      action: 'message_sent',
      details: {
        conversation_id: conversation.id,
        flow_id: selectedFlow.id,
        flow_name: selectedFlow.name,
        message_type: 'greeting'
      }
    });

    console.log('Activity log created');

    return Response.json({
      success: true,
      conversation_id: conversation.id,
      flow_id: selectedFlow.id,
      flow_name: selectedFlow.name,
      channel: channel
    });

  } catch (error) {
    console.error('Error starting AI conversation:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
    
    return Response.json({ 
      error: 'Failed to start AI conversation',
      details: error.message 
    }, { status: 500 });
  }
});