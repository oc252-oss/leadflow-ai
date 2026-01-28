import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import QRCode from 'npm:qrcode@1.5.3';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, sessionId } = await req.json();

    if (action === 'initSession') {
      // Gerar QR Code dummy para demonstração
      // Em produção, integraria com Baileys ou API WhatsApp Business
      const newSessionId = `session_${Date.now()}`;
      
      try {
        // Gerar QR Code aleatório para teste
        const qrText = `https://wa.me/0?text=session:${newSessionId}`;
        const qrDataUrl = await QRCode.toDataURL(qrText);

        // Salvar sessão em estado "aguardando"
        await base44.entities.WhatsAppIntegration.create({
          label: `WhatsApp Session ${newSessionId.slice(0, 8)}`,
          ai_assistant_id: 'default',
          phone_number: '',
          session_id: newSessionId,
          status: 'pending',
          is_active: true,
          qr_code: qrDataUrl
        });

        return Response.json({
          sessionId: newSessionId,
          qrCode: qrDataUrl,
          status: 'awaiting_qr'
        });
      } catch (error) {
        console.error('Erro ao criar sessão:', error);
        return Response.json({ 
          error: 'Erro ao gerar QR Code: ' + error.message 
        }, { status: 500 });
      }
    }

    if (action === 'getStatus') {
      if (!sessionId) {
        return Response.json({ error: 'sessionId required' }, { status: 400 });
      }

      try {
        const sessions = await base44.entities.WhatsAppIntegration.filter({
          session_id: sessionId
        });

        if (sessions.length === 0) {
          return Response.json({
            status: 'not_found',
            connected: false
          });
        }

        const session = sessions[0];
        return Response.json({
          status: session.status,
          connected: session.status === 'connected',
          phoneNumber: session.phone_number,
          label: session.label
        });
      } catch (err) {
        return Response.json({
          status: 'error',
          message: err.message
        }, { status: 500 });
      }
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Erro na inicialização WhatsApp:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});