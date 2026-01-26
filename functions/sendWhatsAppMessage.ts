import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { integration_id, to, message, message_id } = await req.json();

    if (!integration_id || !to || !message) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log('Sending WhatsApp message:', { integration_id, to, message_id });

    // Get integration config
    const integrations = await base44.asServiceRole.entities.WhatsAppIntegration.filter({
      id: integration_id
    });

    if (integrations.length === 0) {
      return Response.json({ error: 'Integration not found' }, { status: 404 });
    }

    const integration = integrations[0];
    console.log('Integration provider:', integration.provider);

    let response;
    let externalMessageId;

    // Z-API
    if (integration.provider === 'zapi') {
      const url = `https://api.z-api.io/instances/${integration.instance_id}/token/${integration.api_token}/send-text`;
      
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Client-Token': integration.api_key
        },
        body: JSON.stringify({
          phone: to,
          message: message
        })
      });

      const data = await response.json();
      console.log('Z-API response:', data);
      externalMessageId = data.messageId;
    }
    // Gupshup
    else if (integration.provider === 'gupshup') {
      const url = 'https://api.gupshup.io/sm/api/v1/msg';
      
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'apikey': integration.api_key
        },
        body: new URLSearchParams({
          channel: 'whatsapp',
          source: integration.phone_number,
          destination: to,
          'src.name': 'CLINIQ.AI',
          message: JSON.stringify({ type: 'text', text: message })
        })
      });

      const data = await response.json();
      console.log('Gupshup response:', data);
      externalMessageId = data.messageId;
    }
    // Meta Cloud API
    else if (integration.provider === 'meta') {
      const url = `https://graph.facebook.com/v18.0/${integration.phone_number}/messages`;
      
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${integration.api_key}`
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: to,
          type: 'text',
          text: { body: message }
        })
      });

      const data = await response.json();
      console.log('Meta API response:', data);
      externalMessageId = data.messages?.[0]?.id;
    }

    // Update message with external ID and delivery status
    if (message_id) {
      await base44.asServiceRole.entities.Message.update(message_id, {
        external_message_id: externalMessageId,
        delivered: true
      });
      console.log('Message updated with external ID');
    }

    return Response.json({
      success: true,
      external_message_id: externalMessageId
    });

  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
    
    return Response.json({ 
      error: 'Failed to send message',
      details: error.message 
    }, { status: 500 });
  }
});