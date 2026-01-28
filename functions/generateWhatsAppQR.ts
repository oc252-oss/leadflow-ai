import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { Boom } from 'npm:@hapi/boom@10.0.1';
import { DisconnectReason, useMultiFileAuthState } from 'npm:@whiskeysockets/baileys@6.4.0';
import makeWASocket from 'npm:@whiskeysockets/baileys@6.4.0';
import QRCode from 'npm:qrcode@1.5.3';

const sessions = new Map();

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

    // Buscar integração
    const integrations = await base44.entities.WhatsAppIntegration.filter({ id: integrationId });
    if (!integrations || integrations.length === 0) {
      return Response.json({ error: 'Integração não encontrada' }, { status: 404 });
    }

    const integration = integrations[0];

    // Validar se assistente está selecionado
    if (!integration.ai_assistant_id) {
      return Response.json({ error: 'Assistente não selecionado' }, { status: 400 });
    }

    // Criar ou buscar sessão
    const sessionPath = `/tmp/whatsapp_session_${integrationId}`;
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

    let qrCode = null;
    const socket = makeWASocket({
      auth: state,
      printQRInTerminal: false
    });

    sessions.set(integrationId, { socket, saveCreds });

    // Listener para QR Code
    socket.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        qrCode = await QRCode.toDataURL(qr, {
          width: 300,
          margin: 2,
          errorCorrectionLevel: 'H'
        });

        // Atualizar integração com QR Code
        await base44.entities.WhatsAppIntegration.update(integrationId, {
          qr_code: qrCode,
          status: 'pending'
        });
      }

      if (connection === 'open') {
        await base44.entities.WhatsAppIntegration.update(integrationId, {
          status: 'connected',
          phone_number: socket.user.id.split(':')[0]
        });
      }
    });

    socket.ev.on('creds.update', saveCreds);

    // Aguardar um pouco para gerar o QR
    await new Promise(resolve => setTimeout(resolve, 2000));

    if (!qrCode) {
      return Response.json({
        status: 'pending',
        message: 'Gerando QR Code, tente novamente em 2 segundos...'
      });
    }

    return Response.json({
      qr_code: qrCode,
      status: 'pending',
      message: 'QR Code gerado com sucesso. Escaneie com seu telefone.'
    });
  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});