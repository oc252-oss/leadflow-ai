import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import QRCode from 'npm:qrcode@1.5.3';

// Import session manager functions
const sessionManagerModule = await import('./whatsAppWebSessionManager.js');

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { company_id, unit_id, integration_id } = await req.json();

    if (!company_id) {
      return Response.json({ error: 'company_id is required' }, { status: 400 });
    }

    console.log('Generating WhatsApp Web QR code for:', { company_id, integration_id });

    // Create or get session
    const result = await sessionManagerModule.createWhatsAppSession(
      company_id,
      unit_id || '',
      '',
      integration_id
    );

    const sessionId = result.sessionId;
    const qrValue = await result.qrPromise;

    if (!qrValue) {
      return Response.json({
        error: 'QR code generation timeout',
        sessionId: sessionId
      }, { status: 408 });
    }

    // Generate QR code data URL
    const qrDataUrl = await QRCode.toDataURL(qrValue);

    console.log('QR code generated successfully for session:', sessionId);

    return Response.json({
      success: true,
      session_id: sessionId,
      qr_code: qrDataUrl,
      instruction: 'Scan this QR code with WhatsApp on your phone'
    });

  } catch (error) {
    console.error('Error generating QR code:', error);
    return Response.json({
      error: 'Failed to generate QR code',
      details: error.message
    }, { status: 500 });
  }
});