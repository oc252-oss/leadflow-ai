import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { channelId } = payload;

    if (!channelId) {
      return Response.json({ error: 'channelId é obrigatório' }, { status: 400 });
    }

    console.log(`[WhatsApp Teste] Simulando conexão para canal: ${channelId}`);

    // Verificar se canal existe
    const channels = await base44.entities.WhatsAppChannel.filter({ id: channelId });
    if (!channels || channels.length === 0) {
      return Response.json({ error: 'Canal não encontrado' }, { status: 404 });
    }

    const channel = channels[0];

    // Simular conexão bem-sucedida
    await base44.asServiceRole.entities.WhatsAppChannel.update(channelId, {
      status: 'connected',
      mode: 'test'
    });

    console.log(`[WhatsApp Teste] Canal ${channelId} conectado com sucesso`);

    return Response.json({
      success: true,
      status: 'connected',
      message: 'Canal WhatsApp conectado com sucesso em modo teste!',
      channel: {
        id: channelId,
        label: channel.label,
        status: 'connected',
        mode: 'test'
      }
    });
  } catch (error) {
    console.error('[WhatsApp Teste] Erro:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});