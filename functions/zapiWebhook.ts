import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    
    console.log('📥 Z-API Webhook payload:', JSON.stringify(payload, null, 2));

    // Extrair dados da mensagem
    const phone = payload.phone || payload.from || payload.sender || '';
    const messageBody = payload.message?.body || payload.text?.message || payload.body || '';
    const messageId = payload.message?.id || payload.messageId || payload.id || '';
    const instance = payload.instance || payload.instanceId || '';

    if (!phone || !messageBody) {
      console.log('⚠️ Missing phone or message body, skipping');
      return Response.json({ success: true }, { status: 200 });
    }

    // Criar registro na entidade Message
    await base44.asServiceRole.entities.Message.create({
      sender_type: 'lead',
      sender_id: phone,
      content: messageBody,
      message_type: 'text',
      direction: 'inbound',
      metadata: payload,
      external_message_id: messageId,
      delivered: true,
      read: false
    });

    console.log('✅ Message saved:', phone, messageBody.substring(0, 50));

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    // Sempre retornar 200 para não bloquear Z-API
    return Response.json({ success: true, error: error.message }, { status: 200 });
  }
});