import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    console.log('WhatsApp webhook received:', JSON.stringify(payload, null, 2));

    // Parse message from different providers
    let phoneNumber, senderNumber, messageContent, externalMessageId, timestamp;
    let instanceId, integrationType;

    // Z-API format
    if (payload.instanceId) {
      instanceId = payload.instanceId;
      integrationType = 'provider';
      phoneNumber = payload.phone?.split('@')[0];
      senderNumber = payload.key?.remoteJid?.split('@')[0];
      messageContent = payload.message?.conversation || payload.message?.extendedTextMessage?.text || '';
      externalMessageId = payload.key?.id;
      timestamp = payload.messageTimestamp ? new Date(payload.messageTimestamp * 1000).toISOString() : new Date().toISOString();
    }
    // Gupshup format
    else if (payload.payload) {
      integrationType = 'provider';
      phoneNumber = payload.app;
      senderNumber = payload.payload.sender?.phone;
      messageContent = payload.payload.payload?.text;
      externalMessageId = payload.payload.id;
      timestamp = new Date(payload.timestamp || Date.now()).toISOString();
    }
    // Meta Cloud API format
    else if (payload.entry?.[0]?.changes?.[0]?.value?.messages) {
      integrationType = 'meta';
      const message = payload.entry[0].changes[0].value.messages[0];
      phoneNumber = payload.entry[0].changes[0].value.metadata.phone_number_id;
      senderNumber = message.from;
      messageContent = message.text?.body || '';
      externalMessageId = message.id;
      timestamp = new Date(message.timestamp * 1000).toISOString();
    }
    // WhatsApp Web format
    else if (payload.type === 'web' && payload.message) {
      integrationType = 'web';
      senderNumber = payload.from;
      messageContent = payload.message;
      externalMessageId = payload.message_id;
      timestamp = new Date(payload.timestamp || Date.now()).toISOString();
    }

    if (!senderNumber || !messageContent) {
      console.log('Invalid message format, skipping');
      return Response.json({ success: true, message: 'Invalid format' });
    }

    console.log('Parsed message:', { phoneNumber, senderNumber, messageContent, externalMessageId });

    // Find WhatsApp integration
    const integrations = await base44.asServiceRole.entities.WhatsAppIntegration.filter({
      is_active: true
    });

    const integration = integrations.find(i => 
      i.instance_id === instanceId || i.phone_number === phoneNumber
    );

    if (!integration) {
      console.error('No active WhatsApp integration found');
      return Response.json({ error: 'Integration not found' }, { status: 404 });
    }

    console.log('Found integration:', integration.id);

    // Find or create Lead by phone number
    let leads = await base44.asServiceRole.entities.Lead.filter({
      company_id: integration.company_id,
      phone: senderNumber
    });

    let lead;
    if (leads.length === 0) {
      console.log('Creating new lead for phone:', senderNumber);
      lead = await base44.asServiceRole.entities.Lead.create({
        company_id: integration.company_id,
        unit_id: integration.unit_id,
        name: senderNumber,
        phone: senderNumber,
        source: 'whatsapp',
        platform: 'other',
        funnel_stage: 'Novo Lead',
        status: 'active',
        score: 0,
        temperature: 'cold'
      });
      console.log('Lead created:', lead.id);
    } else {
      lead = leads[0];
      console.log('Existing lead found:', lead.id);
    }

    // Find or create Conversation
    let conversations = await base44.asServiceRole.entities.Conversation.filter({
      company_id: integration.company_id,
      lead_id: lead.id,
      channel: 'whatsapp',
      status: ['bot_active', 'human_active', 'waiting_response']
    });

    let conversation;
    const isFirstMessage = conversations.length === 0;

    if (isFirstMessage) {
      console.log('Creating new WhatsApp conversation');

      // Find matching AI flow
      const flows = await base44.asServiceRole.entities.AIConversationFlow.filter({
        company_id: integration.company_id,
        is_active: true
      }, '-priority');

      const matchingFlows = flows.filter(flow => {
        if (!flow.trigger_sources || flow.trigger_sources.length === 0) return true;
        return flow.trigger_sources.includes('whatsapp');
      });

      const selectedFlow = matchingFlows[0];
      console.log('Selected AI flow:', selectedFlow?.name);

      conversation = await base44.asServiceRole.entities.Conversation.create({
        company_id: integration.company_id,
        unit_id: integration.unit_id,
        lead_id: lead.id,
        channel: 'whatsapp',
        status: 'bot_active',
        ai_active: true,
        ai_flow_id: selectedFlow?.id,
        priority: 'normal',
        qualification_complete: false,
        qualification_step: 0,
        started_at: timestamp
      });

      console.log('Conversation created:', conversation.id);

      // Send greeting if available
      if (selectedFlow?.greeting_message) {
        const greetingMsg = await base44.asServiceRole.entities.Message.create({
          company_id: integration.company_id,
          unit_id: integration.unit_id,
          conversation_id: conversation.id,
          lead_id: lead.id,
          sender_type: 'bot',
          content: selectedFlow.greeting_message,
          message_type: 'text',
          direction: 'outbound',
          delivered: false,
          read: false
        });

        console.log('Greeting message queued:', greetingMsg.id);

        // Call send function
        await base44.asServiceRole.functions.invoke('sendWhatsAppMessage', {
          integration_id: integration.id,
          to: senderNumber,
          message: selectedFlow.greeting_message,
          message_id: greetingMsg.id
        });
      }
    } else {
      conversation = conversations[0];
      console.log('Existing conversation found:', conversation.id);
    }

    // Store incoming message
    await base44.asServiceRole.entities.Message.create({
      company_id: integration.company_id,
      unit_id: integration.unit_id,
      conversation_id: conversation.id,
      lead_id: lead.id,
      sender_type: 'lead',
      content: messageContent,
      message_type: 'text',
      direction: 'inbound',
      external_message_id: externalMessageId,
      delivered: true,
      read: false
    });

    console.log('Message stored');

    // Update conversation
    await base44.asServiceRole.entities.Conversation.update(conversation.id, {
      last_message_preview: messageContent.substring(0, 100),
      last_message_at: timestamp,
      unread_count: (conversation.unread_count || 0) + 1
    });

    // Update lead
    await base44.asServiceRole.entities.Lead.update(lead.id, {
      active_conversation_id: conversation.id,
      last_interaction_at: timestamp
    });

    // Trigger AI response if bot is active
    if (conversation.status === 'bot_active' && conversation.ai_active && conversation.ai_flow_id) {
      console.log('Triggering AI response...');
      try {
        await base44.asServiceRole.functions.invoke('processAIConversation', {
          conversation_id: conversation.id,
          lead_id: lead.id,
          message_content: messageContent
        });
      } catch (error) {
        console.error('Error triggering AI:', error);
      }
    }

    console.log('WhatsApp message processed successfully');

    return Response.json({ success: true });

  } catch (error) {
    console.error('Error processing WhatsApp webhook:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
    
    return Response.json({ 
      error: 'Failed to process message',
      details: error.message 
    }, { status: 500 });
  }
});