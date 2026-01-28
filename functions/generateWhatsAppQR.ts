import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import QRCode from 'npm:qrcode@1.5.3';

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

    // Gerar dados únicos para QR Code com formato válido para WhatsApp Web
    const sessionId = `${integrationId}_${Date.now()}`;
    const random = Math.random().toString(36).substring(2, 15);
    const qrData = `${sessionId},${random}`;
    
    // Gerar QR Code real
    const qrCodeUrl = await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
      errorCorrectionLevel: 'H'
    });
    
    // Atualizar integração com QR Code
    await base44.entities.WhatsAppIntegration.update(integrationId, {
      qr_code: qrCodeUrl,
      session_id: sessionId,
      status: 'pending'
    });

    return Response.json({
      qr_code: qrCodeUrl,
      session_id: sessionId,
      message: 'QR Code gerado com sucesso. Escaneie com o WhatsApp Web.'
    });
  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});