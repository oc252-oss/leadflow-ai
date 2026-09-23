import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      session_id,
      user_message, 
      assistant_config,
      lead_context,
      conversation_history 
    } = await req.json();

    // Build AI prompt with behavior rules and context
    const behaviorInstructions = buildBehaviorPrompt(assistant_config.behavior_rules || {});
    
    const systemPrompt = `${assistant_config.system_prompt || 'Você é um assistente de atendimento profissional para clínicas de estética e odontologia.'}

${behaviorInstructions}

CONTEXTO DO LEAD (simulação):
- Nome: ${lead_context.lead_name}
- Origem: ${lead_context.source}
- Campanha: ${lead_context.campaign_name || 'N/A'}
- Estágio: ${lead_context.funnel_stage}
- Última interação: ${lead_context.last_interaction_date || 'Primeira conversa'}

IMPORTANTE: Esta é uma simulação. Você deve se comportar exatamente como se fosse uma conversa real, mas nenhum dado será salvo no sistema.

Seu objetivo é:
1. Qualificar o interesse do lead
2. Identificar necessidades específicas
3. Guiar para agendamento de avaliação
4. Manter tom profissional e consultivo`;

    // Build conversation history for context
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversation_history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      { role: 'user', content: user_message }
    ];

    // Call LLM with structured output for decision tracking
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: JSON.stringify(messages),
      response_json_schema: {
        type: "object",
        properties: {
          response_text: {
            type: "string",
            description: "The assistant's response to the user"
          },
          lead_updates: {
            type: "object",
            properties: {
              interest_type: { type: "string" },
              urgency_level: { type: "string" },
              funnel_stage: { type: "string" },
              notes: { type: "string" }
            }
          },
          score_change: {
            type: "number",
            description: "Score change based on this interaction (-10 to +10)"
          },
          next_action: {
            type: "string",
            enum: ["continue", "schedule_evaluation", "handoff_human", "end_conversation"]
          },
          reasoning: {
            type: "string",
            description: "Why these decisions were made"
          }
        }
      }
    });

    // Calculate new score and temperature
    const currentScore = lead_context.current_score || 0;
    const newScore = Math.max(0, Math.min(100, currentScore + (response.score_change || 0)));
    
    let temperature = 'cold';
    if (newScore >= 70) temperature = 'hot';
    else if (newScore >= 40) temperature = 'warm';

    // Build decision log entry
    const decisionLog = {
      timestamp: new Date().toISOString(),
      decision_type: 'ai_response',
      description: response.reasoning || 'AI processou a mensagem',
      data: {
        lead_updates: response.lead_updates || {},
        score_change: response.score_change || 0,
        new_score: newScore,
        temperature: temperature,
        next_action: response.next_action || 'continue'
      }
    };

    // Update training session
    const sessions = await base44.entities.TrainingSession.filter({ id: session_id });
    if (sessions.length > 0) {
      const session = sessions[0];
      
      await base44.entities.TrainingSession.update(session_id, {
        messages: [
          ...session.messages,
          {
            role: 'user',
            content: user_message,
            timestamp: new Date().toISOString()
          },
          {
            role: 'assistant',
            content: response.response_text,
            timestamp: new Date().toISOString()
          }
        ],
        ai_decision_log: [
          ...session.ai_decision_log,
          decisionLog
        ],
        simulated_score: newScore,
        simulated_temperature: temperature
      });
    }

    return Response.json({
      success: true,
      response_text: response.response_text,
      decision_log: decisionLog,
      simulated_score: newScore,
      simulated_temperature: temperature,
      lead_updates: response.lead_updates || {},
      next_action: response.next_action || 'continue'
    });

  } catch (error) {
    console.error('Error processing sandbox conversation:', error);
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});

function buildBehaviorPrompt(rules) {
  const instructions = [];
  
  if (rules.elegant_tone) {
    instructions.push('- Use tom elegante e comercial');
  }
  
  if (rules.prioritize_evaluation) {
    instructions.push('- Priorize convite para avaliação presencial');
  }
  
  if (rules.no_pricing) {
    instructions.push('- NÃO mencione valores ou preços');
  }
  
  if (rules.feminine_language) {
    instructions.push('- Use linguagem no feminino (ex: "Fico feliz em ajudá-la")');
  }
  
  if (rules.respect_hours) {
    instructions.push('- Respeite horário comercial (9h-18h)');
  }
  
  return instructions.length > 0 
    ? `REGRAS DE COMPORTAMENTO:\n${instructions.join('\n')}`
    : '';
}