import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      action,
      trainingType,
      clientProfile,
      difficulty,
      userMessage,
      conversationHistory,
    } = await req.json();

    if (action === 'generateFeedback') {
      // Gerar feedback da conversa
      const prompt = `Você é um avaliador de desempenho comercial. Analise esta conversa de treinamento e gere feedback.

Contexto:
- Tipo de treinamento: ${trainingType}
- Perfil do cliente: ${clientProfile}
- Nível de dificuldade: ${difficulty}

Conversa:
${conversationHistory.map(m => `${m.role === 'agent' ? 'Agente' : 'Cliente'}: ${m.content}`).join('\n')}

Gere um JSON com:
{
  "overallScore": número de 0 a 10,
  "criteria": {
    "clareza": 0-10,
    "empatia": 0-10,
    "postura_comercial": 0-10,
    "conducao_para_avaliacao": 0-10
  },
  "suggestions": [lista de 3-5 sugestões práticas],
  "goodPhrases": [frases que funcionaram bem],
  "badPhrases": [frases a evitar],
  "suggestedDifficulty": número 1-4 para próximo treino
}`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            overallScore: { type: 'number' },
            criteria: { type: 'object' },
            suggestions: { type: 'array', items: { type: 'string' } },
            goodPhrases: { type: 'array', items: { type: 'string' } },
            badPhrases: { type: 'array', items: { type: 'string' } },
            suggestedDifficulty: { type: 'number' },
          },
        },
      });

      return Response.json(response);
    }

    // Processar mensagem do agente e gerar resposta do cliente
    const systemPrompt = getSystemPrompt(trainingType, clientProfile, difficulty);

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `${systemPrompt}\n\nHistórico:\n${conversationHistory.map(m => `${m.role === 'agent' ? 'Agente' : 'Cliente'}: ${m.content}`).join('\n')}\n\nNova mensagem do Agente: "${userMessage}"\n\nResponda como o cliente, de forma natural e realista.`,
    });

    return Response.json({
      response: response,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function getSystemPrompt(trainingType, clientProfile, difficulty) {
  const basePrompt = `Você é um cliente em um cenário de treinamento comercial. Seu papel é:
- Atuar como cliente real
- Reagir conforme qualidade da resposta do agente
- NÃO dar dicas durante a conversa`;

  const clientBehavior = {
    indeciso: 'Você é indeciso, faz muitas perguntas e demora para decidir.',
    sensivel_preco: 'Você é muito sensível a preço e sempre questiona o custo.',
    frio: 'Você é desinteressado, pouco engajado no início.',
    quente: 'Você é interessado e colaborativo desde o início.',
    desconfiado: 'Você questiona tudo e pede provas do que é dito.',
    comparando_concorrencia: 'Você está comparando com concorrentes e questiona diferenciais.',
  };

  const difficultyBehavior = {
    1: 'Seja cooperativo e fácil de convencer. Respostas breves (1-2 linhas).',
    2: 'Seja moderadamente exigente. Levante algumas objeções. Respostas de 2-3 linhas.',
    3: 'Seja exigente e questione bastante. Levante múltiplas objeções. Respostas de 3-4 linhas.',
    4: 'Seja muito desafiador. Questione profundamente. Objeções complexas. Respostas longas.',
  };

  return `${basePrompt}\n\nPerfil: ${clientBehavior[clientProfile] || clientBehavior.indeciso}\n\nDificuldade: ${difficultyBehavior[difficulty] || difficultyBehavior[1]}`;
}