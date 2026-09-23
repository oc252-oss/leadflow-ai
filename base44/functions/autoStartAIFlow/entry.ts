import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    // Handle both direct invocation and entity automation trigger
    let conversation;
    const conversationId = payload.conversation_id || payload.event?.entity_id;

    if (payload.data && payload.event?.entity_name === 'Conversation') {
      // Entity automation payload
      conversation = payload.data;
    } else if (conversationId) {
      // Direct invocation - fetch conversation
      const conversations = await base44.asServiceRole.entities.Conversation.filter({ id: conversationId });
      if (!conversations.length) {
        console.log(`[autoStartAIFlow] Conversation ${conversationId} not found`);
        return Response.json({ error: 'Conversation not found' }, { status: 404 });
      }
      conversation = conversations[0];
    } else {
      return Response.json({ error: 'conversation_id or event data required' }, { status: 400 });
    }

    const conversationId = conversation.id;

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
      console.log(`[autoStartAIFlow] No matching AI flow found for conversation ${conversationId}, source: ${triggerSource}`);
      return Response.json({ success: false, message: 'No matching flow' });
    }

    // Prevent duplicate flow starts: check if flow already running
    if (conversation.ai_flow_id === matchedFlow.id && conversation.current_question_index !== null) {
      console.log(`[autoStartAIFlow] Flow already running for conversation ${conversationId}, skipping restart`);
      return Response.json({ success: false, message: 'Flow already running' });
    }

    // Check if greeting message was already sent
    const existingMessages = await base44.asServiceRole.entities.Message.filter({
      conversation_id: conversationId,
      sender_type: 'bot'
    });

    const greetingAlreadySent = existingMessages.some(msg => 
      msg.content === matchedFlow.greeting_message
    );

    console.log(`[autoStartAIFlow] Starting AI flow ${matchedFlow.id} for conversation ${conversationId}`);

    // Only send greeting + first question if not already sent
    if (!greetingAlreadySent && conversation.current_question_index === null) {
      // Send greeting message
      if (matchedFlow.greeting_message) {
        await base44.asServiceRole.entities.Message.create({
          company_id: conversation.company_id,
          unit_id: conversation.unit_id,
          conversation_id: conversationId,
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
          conversation_id: conversationId,
          lead_id: conversation.lead_id,
          sender_type: 'bot',
          content: firstQuestion.question,
          message_type: 'text',
          direction: 'outbound',
          delivered: true
        });
      }
    }

    // Update conversation only if not already bot_active
    if (conversation.status !== 'bot_active') {
      await base44.asServiceRole.entities.Conversation.update(conversationId, {
        status: 'bot_active',
        ai_active: true,
        ai_flow_id: matchedFlow.id,
        current_question_index: 0,
        last_message_at: new Date().toISOString()
      });
    } else if (conversation.current_question_index === null) {
      // Just set the current_question_index if status already bot_active
      await base44.asServiceRole.entities.Conversation.update(conversationId, {
        current_question_index: 0,
        last_message_at: new Date().toISOString()
      });
    }

    // Update lead with active conversation
    await base44.asServiceRole.entities.Lead.update(conversation.lead_id, {
      active_conversation_id: conversationId
    });

    console.log(`[autoStartAIFlow] AI Flow execution engine started for conversation ${conversationId}`);

    return Response.json({ 
      success: true, 
      flow_id: matchedFlow.id,
      conversation_id: conversationId
    });

  } catch (error) {
    console.error('[autoStartAIFlow] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});