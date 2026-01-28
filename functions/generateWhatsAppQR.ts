import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const WHATSAPP_SERVER_URL = Deno.env.get('WHATSAPP_SERVER_URL') || 'http://localhost:3001';

async function callWhatsAppServer(endpoint, method = 'GET', body = null) {
  const url = `${WHATSAPP_SERVER_URL}${endpoint}`;
  console.log(`[WhatsApp] ${method} ${url}`);

  try {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    });

    console.log(`[WhatsApp] Response status: ${response.status}`);
    return response;
  } catch (error) {
    console.error(`[WhatsApp] Erro de conexão em ${url}:`, error.message);
    throw new Error(`Falha ao conectar em ${WHATSAPP_SERVER_URL}: ${error.message}`);
  }
}

Deno.serve(async (req) => {
  try {
    console.log('[WhatsApp QR] Iniciando geração de QR code...');
    console.log('[WhatsApp QR] Servidor configurado:', WHATSAPP_SERVER_URL);

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

    console.log(`[WhatsApp QR] Canal: ${channelId}`);

    // Verificar se canal existe
    const channels = await base44.entities.WhatsAppChannel.filter({ id: channelId });
    if (!channels || channels.length === 0) {
      return Response.json({ error: 'Canal não encontrado' }, { status: 404 });
    }

    console.log('[WhatsApp QR] Iniciando conexão com servidor externo...');
    const connectResponse = await callWhatsAppServer('/whatsapp/connect', 'POST', { channelId });
    
    if (!connectResponse.ok) {
      const errorText = await connectResponse.text();
      console.error('[WhatsApp QR] Erro ao conectar:', connectResponse.status, errorText);
      return Response.json({ error: `Erro do servidor: ${connectResponse.status} - ${errorText}` }, { status: connectResponse.status });
    }

    console.log('[WhatsApp QR] Aguardando geração de QR code...');
    await new Promise(r => setTimeout(r, 3000));

    console.log('[WhatsApp QR] Recuperando QR code...');
    const qrResponse = await callWhatsAppServer(`/whatsapp/qr/${channelId}`);
    
    if (qrResponse.ok) {
      const data = await qrResponse.json();
      console.log('[WhatsApp QR] QR code recebido:', !!data.qr);
      
      if (data.qr) {
        await base44.asServiceRole.entities.WhatsAppChannel.update(channelId, {
          qr_code: data.qr,
          status: 'pending'
        });
        console.log('[WhatsApp QR] Canal atualizado com sucesso');
        return Response.json({ qr_code: data.qr, status: 'pending' });
      }
    } else {
      const errorText = await qrResponse.text();
      console.error('[WhatsApp QR] Erro ao buscar QR:', qrResponse.status, errorText);
    }

    return Response.json({ qr_code: null, status: 'generating', message: 'QR code ainda não está pronto' });
  } catch (error) {
    console.error('[WhatsApp QR] Erro crítico:', error.message, error.stack);
    return Response.json({ error: `Erro: ${error.message}` }, { status: 500 });
  }
});