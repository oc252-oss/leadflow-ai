import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { conversationId, aiResponse } = payload;

    if (!conversationId || !aiResponse) {
      return Response.json({ error: 'Parâmetros obrigatórios: conversationId, aiResponse' }, { status: 400 });
    }

    console.log(`[WhatsApp Teste] Enviando resposta IA na conversa ${conversationId}`);

    // Verificar conversa
    const conversations = await base44.entities.Conversation.filter({ id: conversationId });
    if (!conversations || conversations.length === 0) {
      return Response.json({ error: 'Conversa não encontrada' }, { status: 404 });
    }

    const conversation = conversations[0];

    // Salvar resposta do bot
    const botMessage = await base44.asServiceRole.entities.Message.create({
      conversation_id: conversationId,
      lead_id: conversation.lead_id,
      company_id: conversation.company_id,
      unit_id: conversation.unit_id,
      sender_type: 'bot',
      content: aiResponse,
      message_type: 'text',
      direction: 'outbound',
      delivered: true
    });

    console.log(`[WhatsApp Teste] Resposta IA criada: ${botMessage.id}`);

    return Response.json({
      success: true,
      messageId: botMessage.id,
      conversationId: conversationId,
      message: 'Resposta enviada'
    });
  } catch (error) {
    console.error('[WhatsApp Teste] Erro:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});