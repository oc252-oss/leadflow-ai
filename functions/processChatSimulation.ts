import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { assistantId, userMessage, conversationHistory, flowId } = await req.json();

    if (!assistantId || !userMessage) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Buscar assistente
    const assistants = await base44.entities.Assistant.list();
    const assistant = assistants.find(a => a.id === assistantId);
    
    if (!assistant) {
      return Response.json({ error: 'Assistant not found' }, { status: 404 });
    }

    // Buscar fluxo se fornecido
    let flowInstructions = '';
    if (flowId) {
      const flows = await base44.entities.AIConversationFlow.list();
      const flow = flows.find(f => f.id === flowId);
      if (flow) {
        flowInstructions = `\n\nFluxo de Qualificação: ${JSON.stringify(flow.qualification_questions, null, 2)}`;
      }
    }

    // Montar histórico de conversa
    const messages = [
      {
        role: 'system',
        content: `${assistant.system_prompt || 'Você é um assistente de atendimento profissional.'}\n\nComportamento:\n- Tom: ${assistant.tone}\n- Regras: ${JSON.stringify(assistant.behavior_rules)}${flowInstructions}`
      },
      ...conversationHistory.map(msg => ({
        role: msg.sender === 'ia' ? 'assistant' : 'user',
        content: msg.text
      })),
      {
        role: 'user',
        content: userMessage
      }
    ];

    // Gerar resposta
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: messages.map(m => `${m.role}: ${m.content}`).join('\n\n'),
      add_context_from_internet: false
    });

    // Simular delay humano (1-3 segundos)
    const delayMs = Math.random() * 2000 + 1000;

    return Response.json({
      message: response,
      delay: delayMs,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro na simulação de chat:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});