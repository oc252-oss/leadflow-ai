import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { lead_id, company_id, unit_id } = await req.json();

    if (!lead_id || !company_id) {
      return Response.json({ error: 'lead_id and company_id are required' }, { status: 400 });
    }

    console.log('Creating or getting conversation for lead:', lead_id);

    // Get lead
    const leads = await base44.asServiceRole.entities.Lead.filter({ id: lead_id });
    if (leads.length === 0) {
      return Response.json({ error: 'Lead not found' }, { status: 404 });
    }
    const lead = leads[0];

    // Check if conversation already exists (not closed)
    let conversation = null;
    const existingConvs = await base44.asServiceRole.entities.Conversation.filter({
      lead_id: lead_id,
      status: { $ne: 'closed' }
    });
    
    if (existingConvs.length > 0) {
      conversation = existingConvs[0];
      console.log('Existing active conversation found:', conversation.id);
    }

    // If no conversation, create one
    if (!conversation) {
      console.log('Creating new conversation for lead:', lead_id);

      // Find active AI flow
      const flows = await base44.asServiceRole.entities.AIConversationFlow.filter({
        company_id,
        is_active: true
      }, '-priority', 10);

      let flow = flows.find(f => f.is_default) || flows[0];
      if (flow) {
        console.log('Selected flow:', flow.name);
      }

      // Create conversation
      conversation = await base44.asServiceRole.entities.Conversation.create({
        company_id,
        unit_id: unit_id || lead.unit_id,
        lead_id,
        channel: 'whatsapp',
        status: 'bot_active',
        ai_active: true,
        ai_flow_id: flow?.id,
        unread_count: 0,
        last_message_at: new Date().toISOString()
      });

      console.log('Conversation created:', conversation.id, 'with flow:', flow?.id);

      // Link conversation to lead
      await base44.asServiceRole.entities.Lead.update(lead_id, {
        active_conversation_id: conversation.id,
        funnel_stage: 'Atendimento Iniciado'
      });

      // Send greeting message if flow has one
      if (flow?.greeting_message) {
        console.log('Sending greeting message');
        
        const greetingMsg = flow.greeting_message
          .replace(/{nome}/g, lead.name || 'Cliente')
          .replace(/{interesse}/g, lead.interest_type || 'nossos serviços');

        const greeting = await base44.asServiceRole.entities.Message.create({
          company_id,
          unit_id: unit_id || lead.unit_id,
          conversation_id: conversation.id,
          lead_id,
          sender_type: 'bot',
          content: greetingMsg,
          message_type: 'text',
          direction: 'outbound',
          delivered: true,
          read: false
        });

        console.log('Greeting message created:', greeting.id);

        // Update conversation with greeting info
        await base44.asServiceRole.entities.Conversation.update(conversation.id, {
          last_message_preview: greetingMsg.substring(0, 100),
          last_message_at: new Date().toISOString(),
          qualification_step: 1
        });
      }
    }

    return Response.json({
      success: true,
      conversation: {
        id: conversation.id,
        lead_id: conversation.lead_id,
        status: conversation.status,
        ai_flow_id: conversation.ai_flow_id,
        channel: conversation.channel
      }
    });

  } catch (error) {
    console.error('Error creating/getting conversation:', error);
    return Response.json({
      error: 'Failed to create conversation',
      details: error.message
    }, { status: 500 });
  }
});