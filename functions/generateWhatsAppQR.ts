import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

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

    // Gerar QR Code simulado (em produção, conectar com Baileys ou similar)
    const sessionId = `session_${integrationId}_${Date.now()}`;
    const qrCodeData = `whatsapp_qr_${sessionId}`;
    
    // Atualizar integração com QR Code
    await base44.entities.WhatsAppIntegration.update(integrationId, {
      qr_code: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==`,
      session_id: sessionId,
      status: 'pending'
    });

    return Response.json({
      qr_code: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==`,
      session_id: sessionId
    });
  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});