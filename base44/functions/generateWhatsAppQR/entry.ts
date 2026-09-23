import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    // Validate method
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    // Authenticate user
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();
    const { channel_id } = body;

    // Validate channel_id
    if (!channel_id || typeof channel_id !== 'string') {
      return Response.json(
        { error: 'channel_id é obrigatório e deve ser uma string' },
        { status: 400 }
      );
    }

    // Get WHATSAPP_SERVER_URL from environment
    const whatsappServerUrl = Deno.env.get('WHATSAPP_SERVER_URL');

    if (!whatsappServerUrl) {
      return Response.json(
        {
          error: 'Servidor WhatsApp não configurado',
          details: 'WHATSAPP_SERVER_URL não está definida nas variáveis de ambiente'
        },
        { status: 500 }
      );
    }

    // Set timeout (8 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    let serverResponse;
    try {
      // Make request to external WhatsApp server
      const response = await fetch(`${whatsappServerUrl}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel_id }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return Response.json(
          {
            error: 'Erro ao conectar ao servidor WhatsApp',
            details: `Status: ${response.status}`
          },
          { status: 502 }
        );
      }

      serverResponse = await response.json();
    } catch (fetchError) {
      clearTimeout(timeoutId);

      if (fetchError.name === 'AbortError') {
        return Response.json(
          {
            error: 'Timeout ao conectar ao servidor WhatsApp',
            details: 'O servidor levou muito tempo para responder (>8s)'
          },
          { status: 504 }
        );
      }

      return Response.json(
        {
          error: 'Servidor WhatsApp offline ou inacessível',
          details: whatsappServerUrl
        },
        { status: 502 }
      );
    }

    // Prepare data for database
    const channelData = {
      channel_id,
      status: serverResponse.status || 'pending',
      qr_code: serverResponse.qr || null,
      phone_number: serverResponse.phone_number || null,
      last_qr_generated_at: new Date().toISOString()
    };

    // Check if channel already exists
    const existingChannels = await base44.entities.WhatsAppChannel.filter({
      channel_id
    });

    if (existingChannels.length > 0) {
      // Update existing
      await base44.entities.WhatsAppChannel.update(existingChannels[0].id, channelData);
    } else {
      // Create new
      await base44.entities.WhatsAppChannel.create(channelData);
    }

    // Return response to frontend
    return Response.json({
      status: channelData.status,
      qr_code: channelData.qr_code,
      phone_number: channelData.phone_number
    });
  } catch (error) {
    console.error('Error in generateWhatsAppQR:', error);
    return Response.json(
      {
        error: 'Erro interno ao processar requisição',
        details: error.message
      },
      { status: 500 }
    );
  }
});