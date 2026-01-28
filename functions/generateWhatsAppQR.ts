import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const WHATSAPP_SERVER_URL = Deno.env.get('WHATSAPP_SERVER_URL') || 'http://localhost:3001';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { channelId } = payload;

    if (!channelId) {
      return Response.json({ error: 'channelId é obrigatório' }, { status: 400 });
    }

    // Verificar se canal existe
    const channels = await base44.entities.WhatsAppChannel.filter({ id: channelId });
    if (!channels || channels.length === 0) {
      return Response.json({ error: 'Canal não encontrado' }, { status: 404 });
    }

    // Iniciar sessão no servidor externo
    await fetch(`${WHATSAPP_SERVER_URL}/whatsapp/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channelId })
    });

    // Buscar QR Code do servidor externo
    const qrResponse = await fetch(`${WHATSAPP_SERVER_URL}/whatsapp/qr/${channelId}`);
    
    if (qrResponse.status === 200) {
      const data = await qrResponse.json();
      await base44.asServiceRole.entities.WhatsAppChannel.update(channelId, {
        qr_code: data.qr,
        status: 'pending'
      });

      return Response.json({
        qr_code: data.qr,
        status: 'pending'
      });
    }

    return Response.json({
      qr_code: null,
      status: 'generating'
    });
  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});