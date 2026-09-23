import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { assistantId, userMessage, conversationHistory } = await req.json();

    if (!assistantId || !userMessage) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Buscar assistente para obter prompt e configurações
    const assistant = await base44.entities.Assistant.list({ id: assistantId });
    if (!assistant || assistant.length === 0) {
      return Response.json({ error: 'Assistant not found' }, { status: 404 });
    }

    const assistantData = assistant[0];

    // Montar histórico de conversa
    const messages = [
      {
        role: 'system',
        content: assistantData.system_prompt || 'Você é um assistente de atendimento telefônico profissional e acolhedor.'
      },
      ...conversationHistory.map(msg => ({
        role: msg.speaker === 'ia' ? 'assistant' : 'user',
        content: msg.text
      })),
      {
        role: 'user',
        content: userMessage
      }
    ];

    // Chamar LLM para gerar resposta
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: messages.map(m => `${m.role}: ${m.content}`).join('\n\n'),
      add_context_from_internet: false
    });

    // Calcular tempo de fala baseado no comprimento da resposta
    const wordCount = response.split(' ').length;
    const estimatedDuration = Math.max(2, Math.ceil(wordCount / 2.5)); // ~2.5 palavras por segundo

    return Response.json({
      iaResponse: response,
      estimatedDuration,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro na simulação de voz:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});