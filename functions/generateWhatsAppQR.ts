import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { useMultiFileAuthState } from 'npm:@whiskeysockets/baileys@6.4.0';
import makeWASocket from 'npm:@whiskeysockets/baileys@6.4.0';
import QRCode from 'npm:qrcode@1.5.3';

const activeSessions = new Map();
const qrCodes = new Map();

async function startWhatsAppSession(channelId, base44) {
  try {
    console.log(`[${channelId}] Iniciando sessão WhatsApp...`);
    
    const sessionPath = `/tmp/whatsapp_${channelId}`;
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

    const socket = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      browser: ['LeadFlow AI', 'Chrome', '5.0']
    });

    socket.ev.on('creds.update', saveCreds);

    socket.ev.on('connection.update', async (update) => {
      const { connection, qr, lastDisconnectReason } = update;

      if (qr) {
        console.log(`[${channelId}] QR Code gerado`);
        const qrCodeData = await QRCode.toDataURL(qr);
        qrCodes.set(channelId, qrCodeData);
        
        await base44.asServiceRole.entities.WhatsAppChannel.update(channelId, {
          qr_code: qrCodeData,
          status: 'pending'
        });
      }

      if (connection === 'open') {
        console.log(`[${channelId}] WhatsApp conectado`);
        const phoneNumber = socket.user?.id?.split(':')[0] || '';
        qrCodes.delete(channelId);
        
        await base44.asServiceRole.entities.WhatsAppChannel.update(channelId, {
          status: 'connected',
          phone_number: `+${phoneNumber}`,
          qr_code: null
        });
      }

      if (connection === 'close') {
        console.log(`[${channelId}] WhatsApp desconectado`);
        activeSessions.delete(channelId);
        qrCodes.delete(channelId);
      }
    });

    activeSessions.set(channelId, socket);
    console.log(`[${channelId}] Sessão iniciada`);
  } catch (error) {
    console.error(`[${channelId}] Erro ao iniciar sessão:`, error);
    throw error;
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { channelId, integrationId } = payload;
    const id = channelId || integrationId;

    if (!id) {
      return Response.json({ error: 'channelId é obrigatório' }, { status: 400 });
    }

    const channels = await base44.entities.WhatsAppChannel.filter({ id: id });
    if (!channels || channels.length === 0) {
      return Response.json({ error: 'Canal não encontrado' }, { status: 404 });
    }

    // Se já existe QR Code em cache, retorna imediatamente
    if (qrCodes.has(id)) {
      return Response.json({
        qr_code: qrCodes.get(id),
        status: 'pending',
        cached: true
      });
    }

    // Inicia nova sessão se não houver
    if (!activeSessions.has(id)) {
      await startWhatsAppSession(id, base44);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // Tenta buscar QR Code gerado
    const qrCode = qrCodes.get(id);
    if (qrCode) {
      return Response.json({
        qr_code: qrCode,
        status: 'pending'
      });
    }

    // Se ainda não gerou, retorna vazio (frontend fará polling)
    return Response.json({
      qr_code: null,
      status: 'generating'
    });
  } catch (error) {
    console.error('Erro geral:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});