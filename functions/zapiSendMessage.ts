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

    // Usar credenciais das variáveis de ambiente (mais confiável)
    const instance_id = Deno.env.get('ZAPI_INSTANCE_ID');
    const token = Deno.env.get('ZAPI_TOKEN');

    if (!instance_id || !token) {
      console.error('❌ ZAPI_INSTANCE_ID ou ZAPI_TOKEN não configurados');
      return Response.json({ error: 'Z-API credentials not configured in environment' }, { status: 500 });
    }

    console.log('🔑 Using Z-API credentials from environment');

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