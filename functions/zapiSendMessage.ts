import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { phone, message, connection_id } = await req.json();

    if (!phone || !message || !connection_id) {
      return Response.json(
        { error: 'Missing required fields: phone, message, connection_id' },
        { status: 400 }
      );
    }

    // Buscar credenciais da conexão Z-API
    const connections = await base44.asServiceRole.entities.Connection.filter({ id: connection_id });
    if (connections.length === 0) {
      return Response.json({ error: 'Connection not found' }, { status: 404 });
    }

    const connection = connections[0];
    const { instance_id, token } = connection.credentials || {};

    if (!instance_id || !token) {
      return Response.json({ error: 'Invalid connection credentials' }, { status: 400 });
    }

    // Enviar mensagem via Z-API
    const zapiUrl = `https://api.z-api.io/instances/${instance_id}/token/${token}/send-text`;
    
    const zapiResponse = await fetch(zapiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone: phone,
        message: message
      })
    });

    const zapiData = await zapiResponse.json();

    if (!zapiResponse.ok) {
      console.error('❌ Z-API error:', zapiData);
      return Response.json(
        { error: 'Failed to send message via Z-API', details: zapiData },
        { status: zapiResponse.status }
      );
    }

    console.log('✅ Message sent via Z-API:', zapiData);

    return Response.json({
      success: true,
      data: zapiData
    });

  } catch (error) {
    console.error('❌ Error in zapiSendMessage:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});