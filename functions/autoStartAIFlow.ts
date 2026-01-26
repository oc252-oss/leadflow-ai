import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { conversation_id } = await req.json();

    if (!conversation_id) {
      return Response.json({ error: 'conversation_id required' }, { status: 400 });
    }

    // Fetch conversation
    const conversations = await base44.asServiceRole.entities.Conversation.filter({ id: conversation_id });
    if (!conversations.length) {
      console.log(`[autoStartAIFlow] Conversation ${conversation_id} not found`);
      return Response.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const conversation = conversations[0];

    // Fetch lead
    const leads = await base44.asServiceRole.entities.Lead.filter({ id: conversation.lead_id });
    if (!leads.length) {
      console.log(`[autoStartAIFlow] Lead ${conversation.lead_id} not found`);
      return Response.json({ error: 'Lead not found' }, { status: 404 });
    }

    const lead = leads[0];

    // Determine trigger source from lead.source or conversation.channel
    const triggerSource = lead.source || conversation.channel;

    // Find matching AI flow: is_default=true, is_active=true, highest priority
    const flows = await base44.asServiceRole.entities.AIConversationFlow.filter({
      company_id: conversation.company_id,
      is_active: true,
      is_default: true
    }, '-priority');

    let matchedFlow = null;

    // Find flow with matching trigger_source, sorted by priority (highest first)
    if (flows.length > 0) {
      for (const flow of flows) {
        if (flow.trigger_sources && flow.trigger_sources.includes(triggerSource)) {
          matchedFlow = flow;
          break;
        }
      }
    }

    // If no source match, use highest priority default flow (first in list since sorted by -priority)
    if (!matchedFlow && flows.length > 0) {
      matchedFlow = flows[0];
    }

    if (!matchedFlow) {
      console.log(`[autoStartAIFlow] No matching AI flow found for conversation ${conversation_id}, source: ${triggerSource}`);
      return Response.json({ success: false, message: 'No matching flow' });
    }

    console.log(`[autoStartAIFlow] Starting AI flow ${matchedFlow.id} for conversation ${conversation_id}`);

    // Send greeting message
    if (matchedFlow.greeting_message) {
      await base44.asServiceRole.entities.Message.create({
        company_id: conversation.company_id,
        unit_id: conversation.unit_id,
        conversation_id: conversation_id,
        lead_id: conversation.lead_id,
        sender_type: 'bot',
        content: matchedFlow.greeting_message,
        message_type: 'text',
        direction: 'outbound',
        delivered: true
      });
    }

    // Get first question
    const firstQuestion = matchedFlow.qualification_questions && matchedFlow.qualification_questions.length > 0
      ? matchedFlow.qualification_questions[0]
      : null;

    // Send first question if exists
    if (firstQuestion) {
      await base44.asServiceRole.entities.Message.create({
        company_id: conversation.company_id,
        unit_id: conversation.unit_id,
        conversation_id: conversation_id,
        lead_id: conversation.lead_id,
        sender_type: 'bot',
        content: firstQuestion.question,
        message_type: 'text',
        direction: 'outbound',
        delivered: true
      });
    }

    // Update conversation
    await base44.asServiceRole.entities.Conversation.update(conversation_id, {
      status: 'bot_active',
      ai_active: true,
      ai_flow_id: matchedFlow.id,
      qualification_step: firstQuestion ? 1 : 0,
      last_message_preview: firstQuestion?.question || matchedFlow.greeting_message,
      last_message_at: new Date().toISOString()
    });

    // Update lead with active conversation
    await base44.asServiceRole.entities.Lead.update(conversation.lead_id, {
      active_conversation_id: conversation_id
    });

    console.log(`[autoStartAIFlow] AI Flow auto-started for conversation ${conversation_id}`);

    return Response.json({ 
      success: true, 
      flow_id: matchedFlow.id,
      conversation_id 
    });

  } catch (error) {
    console.error('[autoStartAIFlow] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});