import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const { session_id } = await req.json();

    if (!session_id) {
      return Response.json({ error: 'session_id required' }, { status: 400 });
    }

    const whatsappServiceUrl = Deno.env.get('WHATSAPP_WEB_SERVICE_URL') || 'http://localhost:3000';

    const response = await fetch(`${whatsappServiceUrl}/whatsapp/status/${session_id}`, {
      method: 'GET'
    });

    if (!response.ok) {
      return Response.json({ 
        status: 'disconnected',
        session_id: session_id
      });
    }

    const data = await response.json();

    // If connected, update integration record
    if (data.status === 'connected') {
      const base44 = createClientFromRequest(req);
      try {
        const integrations = await base44.asServiceRole.entities.WhatsAppIntegration.filter({
          session_id: session_id
        });

        if (integrations.length > 0) {
          await base44.asServiceRole.entities.WhatsAppIntegration.update(integrations[0].id, {
            status: 'connected',
            phone_number: data.phone,
            last_connected_at: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('[checkWhatsAppWebStatus] Error updating integration:', error);
      }
    }

    return Response.json(data);
  } catch (error) {
    console.error('[checkWhatsAppWebStatus] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});