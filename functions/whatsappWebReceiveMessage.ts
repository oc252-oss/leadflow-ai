import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const { phone, message, timestamp } = await req.json();

    if (!phone || !message) {
      return Response.json({ error: 'phone and message required' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    // Find or create Lead by phone number
    let leads = await base44.asServiceRole.entities.Lead.filter({ phone: phone });
    let lead = leads.length > 0 ? leads[0] : null;

    // Get user to determine company_id
    const user = await base44.auth.me();
    const teamMembers = await base44.asServiceRole.entities.TeamMember.filter({ user_email: user.email });
    
    if (!teamMembers.length) {
      return Response.json({ error: 'User not associated with company' }, { status: 403 });
    }

    const companyId = teamMembers[0].company_id;

    // Create lead if doesn't exist
    if (!lead) {
      lead = await base44.asServiceRole.entities.Lead.create({
        company_id: companyId,
        name: `WhatsApp Contact ${phone}`,
        phone: phone,
        source: 'whatsapp',
        platform: 'whatsapp',
        funnel_stage: 'Novo Lead',
        status: 'active'
      });

      console.log(`[whatsappWebReceiveMessage] Created new lead: ${lead.id} for phone: ${phone}`);
    }

    // Find or create Conversation
    let conversations = await base44.asServiceRole.entities.Conversation.filter({
      lead_id: lead.id,
      channel: 'whatsapp',
      status: { $nin: ['closed'] }
    });

    let conversation = conversations.length > 0 ? conversations[0] : null;

    // Create conversation if doesn't exist
    if (!conversation) {
      conversation = await base44.asServiceRole.entities.Conversation.create({
        company_id: companyId,
        lead_id: lead.id,
        channel: 'whatsapp',
        status: 'bot_active',
        ai_active: true,
        priority: 'normal'
      });

      console.log(`[whatsappWebReceiveMessage] Created new conversation: ${conversation.id}`);

      // Trigger AI flow for new conversation
      try {
        await base44.functions.invoke('autoStartAIFlow', {
          conversation_id: conversation.id
        });
        console.log(`[whatsappWebReceiveMessage] AI flow triggered for conversation: ${conversation.id}`);
      } catch (error) {
        console.error(`[whatsappWebReceiveMessage] Error triggering AI flow:`, error);
      }
    }

    // Create Message record (from lead)
    const msg = await base44.asServiceRole.entities.Message.create({
      company_id: companyId,
      conversation_id: conversation.id,
      lead_id: lead.id,
      sender_type: 'lead',
      content: message,
      message_type: 'text',
      direction: 'inbound',
      delivered: true,
      created_at: timestamp || new Date().toISOString()
    });

    // Update lead last interaction
    await base44.asServiceRole.entities.Lead.update(lead.id, {
      last_interaction_at: timestamp || new Date().toISOString(),
      active_conversation_id: conversation.id
    });

    // Update conversation last message
    await base44.asServiceRole.entities.Conversation.update(conversation.id, {
      last_message_preview: message.substring(0, 80),
      last_message_at: timestamp || new Date().toISOString()
    });

    // Process AI flow answer if bot is active
    if (conversation.status === 'bot_active' && conversation.ai_flow_id) {
      try {
        await base44.functions.invoke('processAIFlowAnswer', {
          conversation_id: conversation.id,
          user_message: message
        });
        console.log(`[whatsappWebReceiveMessage] AI flow answer processed for conversation: ${conversation.id}`);
      } catch (error) {
        console.error(`[whatsappWebReceiveMessage] Error processing AI answer:`, error);
      }
    }

    return Response.json({
      success: true,
      message_id: msg.id,
      conversation_id: conversation.id,
      lead_id: lead.id
    });

  } catch (error) {
    console.error('[whatsappWebReceiveMessage] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});