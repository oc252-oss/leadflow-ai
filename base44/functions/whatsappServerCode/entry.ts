/**
 * CÓDIGO COMPLETO DO SERVIDOR EXTERNO
 * 
 * Copie este código para um arquivo server.js fora do Base44
 * 
 * npm install express @whiskeysockets/baileys qrcode pino pino-pretty
 * node server.js
 */

const code = `
import express from 'express';
import { makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import pino from 'pino';

const app = express();
app.use(express.json());

const logger = pino({ transport: { target: 'pino-pretty' } });

// Mapa de sessões ativas
const activeSessions = new Map();

// Diretório para armazenar sessões
const SESSIONS_DIR = './sessions';
if (!existsSync(SESSIONS_DIR)) mkdirSync(SESSIONS_DIR, { recursive: true });

/**
 * POST /whatsapp/connect
 */
app.post('/whatsapp/connect', async (req, res) => {
  try {
    const { channelId } = req.body;

    if (!channelId) {
      return res.status(400).json({ error: 'channelId is required' });
    }

    if (activeSessions.has(channelId)) {
      const session = activeSessions.get(channelId);
      return res.json({ status: session.status });
    }

    await initializeSession(channelId);
    const session = activeSessions.get(channelId);

    res.json({ status: session.status });
  } catch (error) {
    logger.error(error, 'Erro ao conectar');
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /whatsapp/qrcode/:channelId
 */
app.get('/whatsapp/qrcode/:channelId', (req, res) => {
  try {
    const { channelId } = req.params;

    if (!activeSessions.has(channelId)) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = activeSessions.get(channelId);

    res.json({
      status: session.status,
      qr_code: session.qrCode || null,
      phone_number: session.phoneNumber || null
    });
  } catch (error) {
    logger.error(error, 'Erro ao buscar QR Code');
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /whatsapp/send-message
 */
app.post('/whatsapp/send-message', async (req, res) => {
  try {
    const { channelId, to, message } = req.body;

    if (!channelId || !to || !message) {
      return res.status(400).json({ error: 'channelId, to, and message are required' });
    }

    if (!activeSessions.has(channelId)) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = activeSessions.get(channelId);

    if (session.status !== 'connected') {
      return res.status(400).json({ error: 'Session not connected' });
    }

    const jid = to.includes('@') ? to : \\\`\\\${to}@s.whatsapp.net\\\`;
    await session.socket.sendMessage(jid, { text: message });

    res.json({ success: true });
  } catch (error) {
    logger.error(error, 'Erro ao enviar mensagem');
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /whatsapp/status/:channelId
 */
app.get('/whatsapp/status/:channelId', (req, res) => {
  try {
    const { channelId } = req.params;

    if (!activeSessions.has(channelId)) {
      return res.json({ status: 'disconnected', phoneNumber: null });
    }

    const session = activeSessions.get(channelId);
    res.json({ 
      status: session.status, 
      phoneNumber: session.phoneNumber || null 
    });
  } catch (error) {
    logger.error(error, 'Erro ao verificar status');
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /whatsapp/disconnect/:channelId
 */
app.post('/whatsapp/disconnect/:channelId', async (req, res) => {
  try {
    const { channelId } = req.params;

    if (!activeSessions.has(channelId)) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = activeSessions.get(channelId);
    await session.socket.end();
    activeSessions.delete(channelId);

    res.json({ success: true });
  } catch (error) {
    logger.error(error, 'Erro ao desconectar');
    res.status(500).json({ error: error.message });
  }
});

/**
 * Inicializar sessão WhatsApp
 */
async function initializeSession(channelId) {
  try {
    const sessionPath = join(SESSIONS_DIR, channelId);
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

    const socket = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      logger: pino({ level: 'silent' })
    });

    const sessionData = {
      socket,
      status: 'disconnected',
      qrCode: null,
      phoneNumber: null
    };

    activeSessions.set(channelId, sessionData);

    socket.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        try {
          const qrDataUrl = await QRCode.toDataURL(qr);
          sessionData.qrCode = qrDataUrl;
          sessionData.status = 'waiting_qr';
          logger.info(\\\`QR gerado para \\\${channelId}\\\`);
        } catch (err) {
          logger.error(err, 'Erro ao gerar QR Code');
        }
      }

      if (connection === 'open') {
        sessionData.status = 'connected';
        sessionData.qrCode = null;
        logger.info(\\\`Conectado: \\\${channelId}\\\`);
      }

      if (connection === 'close') {
        const shouldReconnect =
          lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

        if (shouldReconnect) {
          sessionData.status = 'waiting_qr';
          sessionData.phoneNumber = null;
          logger.info(\\\`Reconectando: \\\${channelId}\\\`);
          setTimeout(() => initializeSession(channelId), 3000);
        } else {
          activeSessions.delete(channelId);
          logger.info(\\\`Logout: \\\${channelId}\\\`);
        }
      }
    });

    socket.ev.on('creds.update', saveCreds);

    socket.ev.on('contacts.update', (contacts) => {
      contacts.forEach(contact => {
        if (contact.id === socket.user?.id) {
          sessionData.phoneNumber = contact.id?.split('@')[0] || null;
          if (sessionData.phoneNumber) {
            sessionData.phoneNumber = \\\`+\\\${sessionData.phoneNumber}\\\`;
          }
          logger.info(\\\`Número capturado: \\\${sessionData.phoneNumber}\\\`);
        }
      });
    });
  } catch (error) {
    logger.error(error, \\\`Erro ao inicializar sessão \\\${channelId}\\\`);
    throw error;
  }
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(\\\`WhatsApp Gateway rodando em http://localhost:\\\${PORT}\\\`);
  logger.info(\\\`Sessões serão salvas em \\\${SESSIONS_DIR}\\\`);
});
`;

Deno.serve(async (req) => {
  return Response.json({
    message: 'Copie o código acima para um arquivo server.js externo',
    codeLength: code.length
  });
});