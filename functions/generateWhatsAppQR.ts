import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { useMultiFileAuthState } from 'npm:@whiskeysockets/baileys@6.4.0';
import makeWASocket from 'npm:@whiskeysockets/baileys@6.4.0';
import QRCode from 'npm:qrcode@1.5.3';

const activeSessions = new Map();

async function startWhatsAppSession(integrationId, base44) {
  const sessionPath = `/tmp/whatsapp_${integrationId}`;
  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

  const socket = makeWASocket({
    auth: state,
    printQRInTerminal: false
  });

  let qrCode = null;

  socket.ev.on('creds.update', saveCreds);

  socket.ev.on('connection.update', async (update) => {
    const { connection, qr } = update;

    if (qr) {
      qrCode = await QRCode.toDataURL(qr);
      await base44.asServiceRole.entities.WhatsAppIntegration.update(integrationId, {
        qr_code: qrCode,
        status: 'pending'
      });
    }

    if (connection === 'open') {
      const phoneId = socket.user?.id?.split(':')[0] || '';
      await base44.asServiceRole.entities.WhatsAppIntegration.update(integrationId, {
        status: 'connected',
        phone_number: phoneId
      });
    }
  });

  activeSessions.set(integrationId, { socket, qrCode: null });
  return { socket, qrCode: null };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { integrationId } = payload;

    if (!integrationId) {
      return Response.json({ error: 'integrationId é obrigatório' }, { status: 400 });
    }

    const integrations = await base44.entities.WhatsAppIntegration.filter({ id: integrationId });
    if (!integrations || integrations.length === 0) {
      return Response.json({ error: 'Integração não encontrada' }, { status: 404 });
    }

    const integration = integrations[0];
    if (!integration.ai_assistant_id) {
      return Response.json({ error: 'Assistente não selecionado' }, { status: 400 });
    }

    // Iniciar sessão se não estiver ativa
    if (!activeSessions.has(integrationId)) {
      await startWhatsAppSession(integrationId, base44);
    }

    const session = activeSessions.get(integrationId);
    
    // Aguardar o QR Code ser gerado
    await new Promise(resolve => setTimeout(resolve, 1500));

    const integrationData = await base44.entities.WhatsAppIntegration.filter({ id: integrationId });
    const qrCode = integrationData[0]?.qr_code;

    return Response.json({
      qr_code: qrCode || null,
      status: 'pending',
      message: qrCode ? 'QR Code pronto' : 'Gerando QR Code...'
    });
  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});