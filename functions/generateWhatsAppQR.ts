import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { useMultiFileAuthState } from 'npm:@whiskeysockets/baileys@6.4.0';
import makeWASocket from 'npm:@whiskeysockets/baileys@6.4.0';
import QRCode from 'npm:qrcode@1.5.3';

const activeSessions = new Map();

async function startWhatsAppSession(channelId, base44) {
  const sessionPath = `/tmp/whatsapp_${channelId}`;
  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

  const socket = makeWASocket({
    auth: state,
    printQRInTerminal: false
  });

  socket.ev.on('creds.update', saveCreds);

  socket.ev.on('connection.update', async (update) => {
    const { connection, qr } = update;

    if (qr) {
      const qrCodeData = await QRCode.toDataURL(qr);
      await base44.asServiceRole.entities.WhatsAppChannel.update(channelId, {
        qr_code: qrCodeData,
        status: 'pending'
      });
    }

    if (connection === 'open') {
      const phoneNumber = socket.user?.id?.split(':')[0] || '';
      await base44.asServiceRole.entities.WhatsAppChannel.update(channelId, {
        status: 'connected',
        phone_number: `+${phoneNumber}`
      });
    }
  });

  activeSessions.set(channelId, socket);
}

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

    const channels = await base44.entities.WhatsAppChannel.filter({ id: channelId });
    if (!channels || channels.length === 0) {
      return Response.json({ error: 'Canal não encontrado' }, { status: 404 });
    }

    if (!activeSessions.has(channelId)) {
      await startWhatsAppSession(channelId, base44);
    }

    await new Promise(resolve => setTimeout(resolve, 1500));

    const channelData = await base44.entities.WhatsAppChannel.filter({ id: channelId });
    const qrCode = channelData[0]?.qr_code;

    return Response.json({
      qr_code: qrCode || null,
      status: 'pending'
    });
  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});