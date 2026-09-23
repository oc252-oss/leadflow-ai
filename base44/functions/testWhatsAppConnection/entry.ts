import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { integration_id } = await req.json();

    if (!integration_id) {
      return Response.json({ error: 'integration_id is required' }, { status: 400 });
    }

    console.log('Testing WhatsApp connection:', integration_id);

    const integrations = await base44.asServiceRole.entities.WhatsAppIntegration.filter({
      id: integration_id
    });

    if (integrations.length === 0) {
      return Response.json({ error: 'Integration not found' }, { status: 404 });
    }

    const integration = integrations[0];
    let testResult = false;

    // Test based on integration type
    if (integration.integration_type === 'provider') {
      if (integration.provider === 'zapi') {
        const url = `https://api.z-api.io/instances/${integration.instance_id}/token/${integration.api_token}/status`;
        
        const response = await fetch(url, {
          headers: {
            'Client-Token': integration.api_key
          }
        });

        const data = await response.json();
        testResult = data.connected === true;
      }
      // Add other providers here
    } else if (integration.integration_type === 'meta') {
      const url = `https://graph.facebook.com/v18.0/${integration.phone_number}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${integration.api_key}`
        }
      });

      testResult = response.ok;
    }

    // Update integration status
    await base44.asServiceRole.entities.WhatsAppIntegration.update(integration.id, {
      status: testResult ? 'connected' : 'error',
      last_sync: new Date().toISOString()
    });

    return Response.json({
      success: testResult,
      message: testResult ? 'Connection successful' : 'Connection failed'
    });

  } catch (error) {
    console.error('Error testing connection:', error);
    return Response.json({ 
      error: 'Failed to test connection',
      details: error.message 
    }, { status: 500 });
  }
});