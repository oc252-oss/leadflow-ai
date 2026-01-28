import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Process script variables with lead context (same as production)
function processScriptVariables(script, lead, company) {
  if (!script) return '';

  let processedScript = script;
  processedScript = processedScript.replace(/\{\{lead_name\}\}/gi, lead.name || '');
  processedScript = processedScript.replace(/\{\{clinic_name\}\}/gi, company?.name || 'clínica');
  processedScript = processedScript.replace(/\{\{interest_type\}\}/gi, lead.interest_type || '');
  
  if (lead.last_interaction_days) {
    processedScript = processedScript.replace(/\{\{last_contact_days\}\}/gi, String(lead.last_interaction_days));
  } else {
    processedScript = processedScript.replace(/\{\{last_contact_days\}\}/gi, '');
  }

  processedScript = processedScript
    .replace(/\s{2,}/g, ' ')
    .replace(/\.\s+\./g, '.')
    .trim();

  return processedScript;
}

// Intent detection (same as production webhook)
function detectIntent(transcript) {
  if (!transcript) return { intent: 'unknown', confidence: 0, objection: null };

  const text = transcript.toLowerCase();

  const yesKeywords = ['sim', 'quero', 'pode', 'tenho interesse', 'vamos', 'aceito', 'concordo', 'gostaria'];
  const yesScore = yesKeywords.filter(keyword => text.includes(keyword)).length;

  const maybeKeywords = ['talvez', 'depois', 'agora não', 'me liga depois', 'pensar', 'não sei'];
  const maybeScore = maybeKeywords.filter(keyword => text.includes(keyword)).length;

  const noKeywords = ['não', 'sem interesse', 'não quero', 'nao tenho', 'remover', 'tirar'];
  const noScore = noKeywords.filter(keyword => text.includes(keyword)).length;

  let objection = null;
  
  const timingKeywords = ['agora não', 'depois', 'mais tarde', 'outro momento', 'não é bom momento'];
  if (timingKeywords.some(keyword => text.includes(keyword))) {
    objection = 'timing';
  }
  
  const financialKeywords = ['caro', 'sem dinheiro', 'não posso pagar', 'muito caro', 'não tenho grana', 'quanto custa', 'desconto'];
  if (financialKeywords.some(keyword => text.includes(keyword))) {
    objection = 'financial';
  }
  
  const researchKeywords = ['estou pesquisando', 'comparando', 'pensando', 'vou ver', 'estudando'];
  if (researchKeywords.some(keyword => text.includes(keyword))) {
    objection = 'research';
  }

  if (noScore > yesScore && noScore > maybeScore) {
    return { intent: 'no', confidence: Math.min(noScore * 30, 90), objection };
  }
  
  if (yesScore > maybeScore && yesScore > noScore) {
    return { intent: 'yes', confidence: Math.min(yesScore * 30, 90), objection };
  }
  
  if (maybeScore > 0) {
    return { intent: 'maybe', confidence: Math.min(maybeScore * 25, 75), objection };
  }

  return { intent: 'unknown', confidence: 0, objection };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      campaign_id, 
      user_response,
      conversation_history,
      simulated_context,
      company_context,
      current_insights,
      is_initial
    } = await req.json();

    if (!campaign_id) {
      return Response.json({ error: 'campaign_id is required' }, { status: 400 });
    }

    // Get campaign
    const campaigns = await base44.entities.VoiceCampaign.filter({ id: campaign_id });
    if (campaigns.length === 0) {
      return Response.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const campaign = campaigns[0];
    const isProspecting = campaign.type === 'active_prospecting';

    // Initial call - return processed script
    if (is_initial) {
      const processedScript = processScriptVariables(
        campaign.script, 
        simulated_context, 
        company_context
      );

      return Response.json({
        voice_message: processedScript,
        insights: {
          intent: 'unknown',
          objection: null,
          confidence: 0,
          funnel_stage: 'Atendimento Iniciado',
          score_change: 0,
          would_create_task: false,
          task_preview: '',
          final_outcome: null
        }
      });
    }

    // Process user response
    const { intent, confidence, objection } = detectIntent(user_response);

    let voiceMessage = '';
    let funnelStage = current_insights?.funnel_stage || 'Atendimento Iniciado';
    let wouldCreateTask = false;
    let taskPreview = '';
    let finalOutcome = null;

    // Handle YES intent
    if (intent === 'yes') {
      funnelStage = 'Qualificado';
      wouldCreateTask = true;
      finalOutcome = 'qualified';
      
      voiceMessage = 'Que ótimo! Vou registrar seu interesse e nossa equipe entrará em contato para agendar sua avaliação. Muito obrigado!';
      
      taskPreview = isProspecting
        ? `🎯 Lead reativado: ${simulated_context.lead_name} demonstrou interesse. Interesse: ${simulated_context.interest_type}. Oferecer avaliação gratuita.`
        : `🎙️ Lead interessado: ${simulated_context.lead_name}. Interesse: ${simulated_context.interest_type}. Agendar avaliação.`;
    }
    // Handle MAYBE intent
    else if (intent === 'maybe') {
      wouldCreateTask = true;
      finalOutcome = 'follow_up';
      
      if (objection === 'timing') {
        voiceMessage = 'Entendo perfeitamente. Vou pedir para nossa equipe entrar em contato em um horário melhor. Qual período funciona melhor para você?';
        taskPreview = `Follow-up: ${simulated_context.lead_name} pediu contato em melhor horário. Tentar à tarde ou fim de semana.`;
      } else if (objection === 'financial') {
        voiceMessage = 'Compreendo sua preocupação. Nossa equipe pode conversar com você sobre opções e facilidades de pagamento. Posso pedir para entrarem em contato?';
        taskPreview = `Follow-up: ${simulated_context.lead_name} mencionou preço. Oferecer consulta para entender necessidades e apresentar opções.`;
      } else if (objection === 'research') {
        voiceMessage = 'Sem problemas! Vou pedir para nossa equipe enviar mais informações sobre nossos tratamentos. Isso ajudaria?';
        taskPreview = `Follow-up: ${simulated_context.lead_name} está comparando. Enviar diferenciais e cases de sucesso.`;
      } else {
        voiceMessage = 'Entendi. Vou anotar e nossa equipe retornará o contato em breve. Obrigado!';
        taskPreview = `Follow-up: ${simulated_context.lead_name} pediu contato posterior. Retomar em 5 dias.`;
      }
    }
    // Handle NO intent
    else if (intent === 'no') {
      funnelStage = 'Venda Perdida';
      finalOutcome = 'lost';
      voiceMessage = 'Tudo bem, agradeço seu tempo. Se mudar de ideia, pode nos procurar. Tenha um ótimo dia!';
    }
    // Unknown intent
    else {
      voiceMessage = 'Desculpe, não entendi bem. Você tem interesse em conhecer nossos tratamentos?';
    }

    const insights = {
      intent,
      objection,
      confidence,
      funnel_stage: funnelStage,
      would_create_task: wouldCreateTask,
      task_preview: taskPreview,
      final_outcome: finalOutcome
    };

    return Response.json({
      voice_message: voiceMessage,
      insights: insights
    });

  } catch (error) {
    console.error('Error processing voice simulation:', error);
    return Response.json({ 
      error: error.message,
      voice_message: 'Ocorreu um erro na simulação.',
      insights: current_insights || {}
    }, { status: 500 });
  }
});