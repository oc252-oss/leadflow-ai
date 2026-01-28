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

    const integrations = await base44.entities.WhatsAppIntegration.filter({ id: integrationId });
    if (!integrations || integrations.length === 0) {
      return Response.json({ error: 'Integração não encontrada' }, { status: 404 });
    }

    const integration = integrations[0];

    return Response.json({
      status: integration.status,
      phone_number: integration.phone_number || null,
      connected: integration.status === 'connected'
    });
  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});