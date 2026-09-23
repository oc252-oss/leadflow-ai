import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Helper to detect intent from user message
function detectUserIntent(message) {
  const text = message.toLowerCase();
  
  // Positive intent
  if (/\b(sim|quero|pode|interesse|aceito|vamos|gostaria|claro)\b/i.test(text)) {
    return { intent: 'positive', confidence: 0.8 };
  }
  
  // Negative intent
  if (/\b(não|nao|sem interesse|não quero|remover)\b/i.test(text)) {
    return { intent: 'negative', confidence: 0.8 };
  }
  
  // Question
  if (/\?/.test(text) || /\b(como|quando|onde|quanto|qual|quem)\b/i.test(text)) {
    return { intent: 'question', confidence: 0.7 };
  }
  
  return { intent: 'neutral', confidence: 0.5 };
}

// Helper to calculate score based on message
function calculateScoreImpact(message, currentScore) {
  const { intent } = detectUserIntent(message);
  
  let scoreChange = 0;
  
  if (intent === 'positive') {
    scoreChange = 15;
  } else if (intent === 'question') {
    scoreChange = 5;
  } else if (intent === 'negative') {
    scoreChange = -10;
  }
  
  const newScore = Math.max(0, Math.min(100, currentScore + scoreChange));
  return { newScore, scoreChange };
}

// Helper to determine temperature
function determineTemperature(score) {
  if (score >= 70) return 'hot';
  if (score >= 40) return 'warm';
  return 'cold';
}

// Helper to determine funnel stage progression
function determineFunnelStage(score, currentStage, messageCount) {
  if (score >= 80 && messageCount >= 3) {
    return 'Qualificado';
  }
  
  if (score >= 50 && messageCount >= 2) {
    return 'Atendimento Iniciado';
  }
  
  if (score < 20) {
    return 'Venda Perdida';
  }
  
  return currentStage || 'Atendimento Iniciado';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      flow_id, 
      message, 
      conversation_history, 
      simulated_context,
      current_insights 
    } = await req.json();

    if (!flow_id || !message) {
      return Response.json({ 
        error: 'flow_id and message are required' 
      }, { status: 400 });
    }

    // Get AI flow configuration
    const flows = await base44.entities.AIConversationFlow.filter({ id: flow_id });
    if (flows.length === 0) {
      return Response.json({ error: 'Flow not found' }, { status: 404 });
    }

    const flow = flows[0];
    const messageCount = conversation_history.length + 1;

    // Calculate new score
    const { newScore, scoreChange } = calculateScoreImpact(message, current_insights.score || 0);
    
    // Determine temperature and funnel stage
    const temperature = determineTemperature(newScore);
    const funnelStage = determineFunnelStage(newScore, current_insights.funnel_stage, messageCount);
    
    // Detect intent
    const { intent, confidence } = detectUserIntent(message);

    // Build AI prompt with context
    const systemPrompt = `Você é um assistente virtual de uma clínica estética.

Contexto do Lead:
- Nome: ${simulated_context.lead_name}
- Interesse: ${simulated_context.interest_type}
- Origem: ${simulated_context.source}
- Dias desde último contato: ${simulated_context.last_interaction_days}

Instruções do Fluxo:
${flow.description || ''}

Seu objetivo é qualificar o lead fazendo perguntas relevantes e oferecendo informações sobre os serviços.
Mantenha respostas curtas, naturais e focadas em agendar uma avaliação gratuita.

Histórico da conversa até agora:
${conversation_history.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

Responda à mensagem do lead de forma natural e contextualizada.`;

    // Call AI to generate response
    const aiResponse = await base44.integrations.Core.InvokeLLM({
      prompt: systemPrompt + `\n\nLead: ${message}\n\nAssistente:`,
      response_json_schema: null
    });

    const assistantResponse = typeof aiResponse === 'string' ? aiResponse : aiResponse.response || 'Como posso ajudar?';

    // Determine actions that would happen
    const wouldCreateTask = newScore >= 70 && funnelStage === 'Qualificado';
    const wouldHandoff = newScore >= 80 || intent === 'negative';

    // Build lead updates that would occur
    const leadUpdates = {};
    
    if (funnelStage !== current_insights.funnel_stage) {
      leadUpdates.funnel_stage = funnelStage;
    }
    
    if (temperature !== current_insights.temperature) {
      leadUpdates.temperature = temperature;
    }
    
    if (scoreChange !== 0) {
      leadUpdates.score = `${current_insights.score} → ${newScore} (${scoreChange > 0 ? '+' : ''}${scoreChange})`;
    }

    // Detect field updates based on conversation
    if (intent === 'positive' && !current_insights.lead_updates.urgency_level) {
      leadUpdates.urgency_level = 'this_week';
    }

    // Build insights
    const insights = {
      lead_updates: leadUpdates,
      score: newScore,
      funnel_stage: funnelStage,
      temperature: temperature,
      would_create_task: wouldCreateTask,
      would_handoff: wouldHandoff,
      detected_intent: intent,
      confidence: confidence
    };

    return Response.json({
      response: assistantResponse,
      insights: insights,
      metadata: {
        score_change: scoreChange,
        message_count: messageCount
      }
    });

  } catch (error) {
    console.error('Error processing AI simulation:', error);
    return Response.json({ 
      error: error.message,
      response: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.',
      insights: current_insights
    }, { status: 500 });
  }
});