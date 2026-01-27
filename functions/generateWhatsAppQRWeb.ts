import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { company_id, unit_id } = await req.json();

    if (!company_id) {
      return Response.json({ error: 'company_id required' }, { status: 400 });
    }

    // Get WhatsApp service URL from environment or use default
    const whatsappServiceUrl = Deno.env.get('WHATSAPP_WEB_SERVICE_URL') || 'http://localhost:3000';
    
    // Create a unique session ID for this integration
    const sessionId = `${company_id}-${unit_id || 'default'}-${Date.now()}`;

    try {
      // Request QR code from external service
      const response = await fetch(`${whatsappServiceUrl}/whatsapp/qrcode/${sessionId}`, {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error(`WhatsApp service returned ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate QR code');
      }

      // Store session ID in database for later use
      const user = await base44.auth.me();
      if (user) {
        // Create or update WhatsApp integration record with session info
        try {
          await base44.asServiceRole.entities.WhatsAppIntegration.create({
            company_id: company_id,
            unit_id: unit_id || null,
            integration_type: 'web',
            provider: 'none',
            session_id: sessionId,
            status: 'disconnected'
          });
        } catch (error) {
          console.log('[generateWhatsAppQRWeb] Could not create integration record:', error.message);
        }
      }

      return Response.json({
        success: true,
        qr_code: data.qr_code,
        session_id: sessionId,
        status: data.status || 'pending'
      });
    } catch (error) {
      console.error('[generateWhatsAppQRWeb] Error contacting service:', error);
      return Response.json({ 
        success: false, 
        error: `WhatsApp service unreachable: ${error.message}` 
      }, { status: 503 });
    }
  } catch (error) {
    console.error('[generateWhatsAppQRWeb] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});