import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { DisconnectReason, useMultiFileAuthState } from 'npm:@whiskeysockets/baileys@6.4.0';
import makeWASocket from 'npm:@whiskeysockets/baileys@6.4.0';
import QRCode from 'npm:qrcode@1.5.3';
import { readdir, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const SESSIONS_DIR = '/tmp/whatsapp_sessions';

// Garantir diretório de sessões
try {
  await mkdir(SESSIONS_DIR, { recursive: true });
} catch (e) {
  // Já existe
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, sessionId } = await req.json();

    if (action === 'initSession') {
      // Inicializar nova sessão
      const newSessionId = `session_${Date.now()}`;
      const sessionDir = join(SESSIONS_DIR, newSessionId);

      try {
        await mkdir(sessionDir, { recursive: true });
      } catch (e) {
        // Diretório já existe
      }

      let qrCode = null;
      let connectionStatus = 'awaiting_qr';

      const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

      const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false
      });

      // Evento QR Code
      sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          // Gerar QR Code em base64
          try {
            const qrDataUrl = await QRCode.toDataURL(qr);
            qrCode = qrDataUrl;
          } catch (err) {
            console.error('Erro ao gerar QR:', err);
          }
        }

        if (connection === 'close') {
          const reason = lastDisconnect?.error?.output?.statusCode;
          if (reason === DisconnectReason.loggedOut) {
            console.log('Sessão encerrada pelo usuário');
            connectionStatus = 'disconnected';
          }
        } else if (connection === 'open') {
          connectionStatus = 'connected';
          const phoneNumber = sock.user?.id?.split(':')[0] || 'unknown';
          
          // Salvar sessão na DB
          try {
            await base44.entities.WhatsAppIntegration.create({
              label: `WhatsApp Session ${newSessionId.slice(0, 8)}`,
              ai_assistant_id: 'default',
              phone_number: phoneNumber,
              session_id: newSessionId,
              status: 'connected',
              is_active: true
            });
          } catch (err) {
            console.error('Erro ao salvar sessão:', err);
          }
        }
      });

      // Salvar credenciais
      sock.ev.on('creds.update', saveCreds);

      // Aguardar QR Code por 30 segundos
      let qrAttempts = 0;
      while (!qrCode && qrAttempts < 60) {
        await new Promise(resolve => setTimeout(resolve, 500));
        qrAttempts++;
      }

      if (!qrCode) {
        return Response.json({ 
          error: 'QR Code não gerado no tempo limite' 
        }, { status: 500 });
      }

      return Response.json({
        sessionId: newSessionId,
        qrCode,
        status: connectionStatus
      });
    }

    if (action === 'getStatus') {
      // Verificar status da sessão
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