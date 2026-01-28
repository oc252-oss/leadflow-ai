import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { conversationId, userMessage, assistantId, systemPrompt } = payload;

    if (!conversationId || !userMessage || !assistantId) {
      return Response.json({ 
        error: 'Parâmetros obrigatórios: conversationId, userMessage, assistantId' 
      }, { status: 400 });
    }

    console.log(`[Simulação] Processando mensagem na conversa ${conversationId}`);

    // Verificar conversa de simulação
    const conversations = await base44.entities.Conversation.filter({ 
      id: conversationId,
      status: { $in: ['bot_active', 'human_active'] }
    });

    if (!conversations || conversations.length === 0) {
      return Response.json({ error: 'Conversa de simulação não encontrada' }, { status: 404 });
    }

    const conversation = conversations[0];

    // Verificar se é uma simulação (olhar a originating channel)
    const messages = await base44.entities.Message.filter({ 
      conversation_id: conversationId 
    }, 'created_date', 100);

    // Salvar mensagem do usuário
    const userMsg = await base44.asServiceRole.entities.Message.create({
      conversation_id: conversationId,
      lead_id: conversation.lead_id,
      company_id: conversation.company_id,
      unit_id: conversation.unit_id,
      sender_type: 'lead',
      content: userMessage,
      message_type: 'text',
      direction: 'inbound',
      delivered: true
    });

    // Obter histórico de mensagens para contexto
    const messageHistory = (messages || []).map(m => ({
      role: m.sender_type === 'lead' ? 'user' : 'assistant',
      content: m.content
    }));

    // Invocar LLM com contexto de simulação
    const llmResponse = await base44.integrations.Core.InvokeLLM({
      prompt: `${systemPrompt || 'Você é um assistente de IA profissional.'}\n\nHistórico da conversa:\n${
        messageHistory.map((m, i) => `${m.role === 'user' ? 'Usuário' : 'Você'}: ${m.content}`).join('\n')
      }\n\nResponda à última mensagem do usuário de forma adequada e útil.`,
      add_context_from_internet: false
    });

    const aiResponse = llmResponse;

    // Salvar resposta da IA
    const aiMsg = await base44.asServiceRole.entities.Message.create({
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

    console.log(`[Simulação] Resposta gerada: ${aiMsg.id}`);

    return Response.json({
      success: true,
      userMessageId: userMsg.id,
      aiMessageId: aiMsg.id,
      aiResponse: aiResponse,
      conversationId: conversationId
    });
  } catch (error) {
    console.error('[Simulação] Erro:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});