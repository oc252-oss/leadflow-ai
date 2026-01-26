import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { lead_id } = await req.json();

    if (!lead_id) {
      return Response.json({ error: 'lead_id is required' }, { status: 400 });
    }

    console.log('[openConversation] Starting for lead:', lead_id);

    // Get lead
    const leads = await base44.asServiceRole.entities.Lead.filter({ id: lead_id });
    if (leads.length === 0) {
      console.error('[openConversation] Lead not found:', lead_id);
      return Response.json({ error: 'Lead not found' }, { status: 404 });
    }
    const lead = leads[0];
    console.log('[openConversation] Lead found:', lead.name);

    // Check if active conversation exists
    const existingConvs = await base44.asServiceRole.entities.Conversation.filter({
      lead_id: lead_id,
      status: { $ne: 'closed' }
    });

    if (existingConvs.length > 0) {
      const conversation = existingConvs[0];
      console.log('[openConversation] Reusing existing conversation:', conversation.id);
      return Response.json({
        success: true,
        conversation_id: conversation.id,
        created: false
      });
    }

    console.log('[openConversation] Creating new conversation for lead:', lead_id);

    // Find active AI flow
    const flows = await base44.asServiceRole.entities.AIConversationFlow.filter({
      company_id: lead.company_id,
      is_active: true
    }, '-priority', 10);

    let flow = flows.find(f => f.is_default) || flows[0];
    if (flow) {
      console.log('[openConversation] Selected flow:', flow.name);
    } else {
      console.warn('[openConversation] No active flow found for company:', lead.company_id);
    }

    // Create conversation
    const conversation = await base44.asServiceRole.entities.Conversation.create({
      company_id: lead.company_id,
      unit_id: lead.unit_id,
      lead_id: lead_id,
      channel: 'whatsapp',
      status: 'bot_active',
      ai_active: true,
      ai_flow_id: flow?.id,
      unread_count: 0,
      last_message_at: new Date().toISOString()
    });

    console.log('[openConversation] Conversation created:', conversation.id);

    // Update lead
    await base44.asServiceRole.entities.Lead.update(lead_id, {
      active_conversation_id: conversation.id,
      funnel_stage: 'Atendimento Iniciado'
    });

    // Create greeting message if flow has one
    if (flow?.greeting_message) {
      console.log('[openConversation] Creating greeting message');

      const greetingMsg = flow.greeting_message
        .replace(/{nome}/g, lead.name || 'Cliente')
        .replace(/{interesse}/g, lead.interest_type || 'nossos serviços');

      await base44.asServiceRole.entities.Message.create({
        company_id: lead.company_id,
        unit_id: lead.unit_id,
        conversation_id: conversation.id,
        lead_id: lead_id,
        sender_type: 'bot',
        content: greetingMsg,
        message_type: 'text',
        direction: 'outbound',
        delivered: true,
        read: false
      });

      console.log('[openConversation] Greeting message created');

      // Update conversation
      await base44.asServiceRole.entities.Conversation.update(conversation.id, {
        last_message_preview: greetingMsg.substring(0, 100),
        last_message_at: new Date().toISOString(),
        qualification_step: 1
      });
    }

    console.log('[openConversation] Success - conversation ready:', conversation.id);

    return Response.json({
      success: true,
      conversation_id: conversation.id,
      created: true
    });

  } catch (error) {
    console.error('[openConversation] Error:', error);
    return Response.json({
      error: 'Failed to open conversation',
      details: error.message
    }, { status: 500 });
  }
});