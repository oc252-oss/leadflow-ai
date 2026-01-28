import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, label, assistantId } = await req.json();

    if (action === 'createIntegration') {
      // Criar integração com provedor externo
      try {
        const integration = await base44.entities.WhatsAppIntegration.create({
          label: label || 'WhatsApp Integration',
          ai_assistant_id: assistantId || 'default',
          phone_number: '',
          status: 'pending',
          is_active: true
        });

        return Response.json({
          success: true,
          integration: {
            id: integration.id,
            label: integration.label,
            status: 'pending',
            webhookUrl: getWebhookUrl(integration.id)
          }
        });
      } catch (error) {
        console.error('Erro ao criar integração:', error);
        return Response.json({ 
          error: 'Erro ao criar integração: ' + error.message 
        }, { status: 500 });
      }
    }

    if (action === 'getIntegrations') {
      try {
        const integrations = await base44.entities.WhatsAppIntegration.list('-updated_date', 10);
        return Response.json({
          integrations: integrations.map(i => ({
            id: i.id,
            label: i.label,
            status: i.status,
            phoneNumber: i.phone_number,
            isActive: i.is_active,
            webhookUrl: getWebhookUrl(i.id)
          }))
        });
      } catch (err) {
        return Response.json({
          error: err.message
        }, { status: 500 });
      }
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function getWebhookUrl(integrationId) {
  const baseUrl = Deno.env.get('WHATSAPP_SERVER_URL') || 'https://api.example.com';
  return `${baseUrl}/webhook/whatsapp/${integrationId}`;
}