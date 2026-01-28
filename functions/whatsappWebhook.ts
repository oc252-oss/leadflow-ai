import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    // Suportar GET para verificação do webhook
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');

      if (token === Deno.env.get('WHATSAPP_WEBHOOK_TOKEN')) {
        return new Response(challenge);
      }
      return Response.json({ error: 'Invalid token' }, { status: 403 });
    }

    // Processar POST
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    // Estrutura esperada do webhook
    const message = payload.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    const contact = payload.entry?.[0]?.changes?.[0]?.value?.contacts?.[0];
    const waPhoneId = payload.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id;

    if (!message || !contact) {
      return Response.json({ ok: true });
    }

    // Buscar integração pelo phone ID
    const integrations = await base44.asServiceRole.entities.WhatsAppIntegration.filter({
      status: 'connected'
    });

    const integration = integrations.find(i => i.phone_number === waPhoneId);
    
    if (!integration) {
      console.log('Integração não encontrada para', waPhoneId);
      return Response.json({ ok: true });
    }

    // Buscar assistente
    const assistants = await base44.asServiceRole.entities.AIAssistant.filter({
      id: integration.ai_assistant_id
    });

    if (!assistants || assistants.length === 0) {
      return Response.json({ ok: true });
    }

    const assistant = assistants[0];

    // Se tiver greeting_message, enviar como resposta
    if (assistant.greeting_message) {
      console.log('Enviando greeting:', assistant.greeting_message);
      // Aqui você implementaria o envio da mensagem via WhatsApp API
      // await sendWhatsAppMessage(waPhoneId, message.from, assistant.greeting_message);
    }

    // Log da conversa (para futura integração)
    console.log('Nova mensagem recebida:', {
      from: message.from,
      text: message.text?.body,
      assistant: assistant.name,
      flow: assistant.ai_flow_id
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});