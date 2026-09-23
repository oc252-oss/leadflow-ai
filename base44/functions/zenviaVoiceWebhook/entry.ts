import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Intent detection helper
function detectIntent(transcript) {
  if (!transcript) return { intent: 'unknown', confidence: 0, objection: null };

  const text = transcript.toLowerCase();

  // YES intent keywords
  const yesKeywords = ['sim', 'quero', 'pode', 'tenho interesse', 'vamos', 'aceito', 'concordo', 'gostaria'];
  const yesScore = yesKeywords.filter(keyword => text.includes(keyword)).length;

  // MAYBE intent keywords
  const maybeKeywords = ['talvez', 'depois', 'agora não', 'me liga depois', 'pensar', 'não sei'];
  const maybeScore = maybeKeywords.filter(keyword => text.includes(keyword)).length;

  // NO intent keywords
  const noKeywords = ['não', 'sem interesse', 'não quero', 'nao tenho', 'remover', 'tirar'];
  const noScore = noKeywords.filter(keyword => text.includes(keyword)).length;

  // Detect objection categories
  let objection = null;
  
  // Timing objection
  const timingKeywords = ['agora não', 'depois', 'mais tarde', 'outro momento', 'não é bom momento'];
  if (timingKeywords.some(keyword => text.includes(keyword))) {
    objection = 'timing';
  }
  
  // Financial objection
  const financialKeywords = ['caro', 'sem dinheiro', 'não posso pagar', 'muito caro', 'não tenho grana'];
  if (financialKeywords.some(keyword => text.includes(keyword))) {
    objection = 'financial';
  }
  
  // Research objection
  const researchKeywords = ['estou pesquisando', 'comparando', 'pensando', 'vou ver', 'estudando'];
  if (researchKeywords.some(keyword => text.includes(keyword))) {
    objection = 'research';
  }

  // Determine intent based on highest score
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

    const payload = await req.json();

    const {
      callId,
      status,
      duration,
      transcript,
      recordingUrl
    } = payload;

    if (!callId) {
      return Response.json({ error: 'callId is required' }, { status: 400 });
    }

    // Find VoiceCall by external_call_id
    const voiceCalls = await base44.asServiceRole.entities.VoiceCall.filter({
      external_call_id: callId
    });

    if (voiceCalls.length === 0) {
      return Response.json({ error: 'VoiceCall not found' }, { status: 404 });
    }

    const voiceCall = voiceCalls[0];

    // Detect intent and objections from transcript
    const { intent, confidence, objection } = detectIntent(transcript);

    // Update VoiceCall
    const updateData = {
      status: 'completed',
      intent: intent,
      transcript: transcript || '',
      confidence_score: confidence,
      duration: duration || 0,
      recording_url: recordingUrl || ''
    };

    if (status === 'no_answer' || status === 'failed') {
      updateData.status = status;
    }

    await base44.asServiceRole.entities.VoiceCall.update(voiceCall.id, updateData);

    // Get campaign and lead
    const campaigns = await base44.asServiceRole.entities.VoiceCampaign.filter({ 
      id: voiceCall.campaign_id 
    });
    const leads = await base44.asServiceRole.entities.Lead.filter({ 
      id: voiceCall.lead_id 
    });

    if (campaigns.length === 0 || leads.length === 0) {
      return Response.json({ message: 'Campaign or Lead not found' });
    }

    const campaign = campaigns[0];
    const lead = leads[0];

    // Process intent-based actions and UPDATE CENTRAL FUNNEL
    const isProspecting = campaign.type === 'active_prospecting';

    if (intent === 'yes') {
      // Update lead funnel stage
      const newStage = lead.funnel_stage === 'Novo Lead' || lead.funnel_stage === 'Atendimento Iniciado' 
        ? 'Qualificado' 
        : lead.funnel_stage;

      await base44.asServiceRole.entities.Lead.update(lead.id, {
        funnel_stage: newStage,
        score: Math.min((lead.score || 0) + 30, 100),
        temperature: 'hot',
        last_interaction_at: new Date().toISOString()
      });

      // Create enriched task with full context
      const taskTitle = isProspecting 
        ? '🎯 Lead reativado com interesse (Prospecção)'
        : '🎙️ Lead demonstrou interesse (Reengajamento)';
      
      // Build enriched description with detected context
      let enrichedDescription = `Lead ${lead.name} demonstrou interesse durante ligação automática.\n\n`;
      enrichedDescription += `📋 **Contexto:**\n`;
      enrichedDescription += `- Campanha: ${campaign.name}\n`;
      enrichedDescription += `- Intent detectado: SIM (confiança: ${confidence}%)\n`;
      if (lead.interest_type) {
        enrichedDescription += `- Interesse: ${lead.interest_type}\n`;
      }
      enrichedDescription += `- Fonte original: ${lead.source}\n`;
      enrichedDescription += `- Etapa atual: ${lead.funnel_stage}\n\n`;
      
      if (objection) {
        const objectionLabels = {
          timing: 'Mencionou questão de horário/timing',
          financial: 'Mencionou preocupação financeira',
          research: 'Está pesquisando/comparando'
        };
        enrichedDescription += `⚠️ Observação: ${objectionLabels[objection]}\n\n`;
      }
      
      enrichedDescription += `💬 **Transcrição:**\n"${transcript}"\n\n`;
      enrichedDescription += `✅ **Próximos passos sugeridos:**\n`;
      enrichedDescription += isProspecting 
        ? `- Oferecer avaliação gratuita\n- Entender necessidades atuais\n- Agendar visita`
        : `- Confirmar interesse em ${lead.interest_type || 'tratamento'}\n- Agendar avaliação\n- Enviar informações`;

      const taskData = {
        company_id: campaign.company_id,
        lead_id: lead.id,
        title: taskTitle,
        description: enrichedDescription,
        type: 'voice_campaign',
        priority: 'high',
        status: 'open',
        source: 'voice_campaign',
        source_id: voiceCall.id,
        due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };

      if (campaign.assigned_to_type === 'specific' && campaign.assigned_to_user_id) {
        taskData.assigned_to_user_id = campaign.assigned_to_user_id;
      }

      await base44.asServiceRole.entities.Task.create(taskData);

      // Update campaign stats
      await base44.asServiceRole.entities.VoiceCampaign.update(campaign.id, {
        total_yes_responses: (campaign.total_yes_responses || 0) + 1
      });

    } else if (intent === 'maybe') {
      // Keep current funnel stage, create follow-up with context
      await base44.asServiceRole.entities.Lead.update(lead.id, {
        last_interaction_at: new Date().toISOString()
      });

      // Adjust follow-up timing based on objection type
      let followUpDays = isProspecting ? 10 : 5;
      let suggestedAction = 'Retomar contato';
      
      if (objection === 'timing') {
        followUpDays = 3; // Shorter follow-up for timing objections
        suggestedAction = 'Lead pediu contato em melhor horário - tentar à tarde ou fim de semana';
      } else if (objection === 'financial') {
        followUpDays = 7;
        suggestedAction = 'Lead mencionou preço - oferecer consulta para entender necessidades e opções';
      } else if (objection === 'research') {
        followUpDays = 5;
        suggestedAction = 'Lead está comparando - enviar diferenciais e cases de sucesso';
      }

      let maybeDescription = `Lead ${lead.name} demonstrou interesse moderado.\n\n`;
      maybeDescription += `📋 **Contexto:**\n`;
      maybeDescription += `- Campanha: ${campaign.name}\n`;
      maybeDescription += `- Intent detectado: TALVEZ (confiança: ${confidence}%)\n`;
      if (objection) {
        const objectionLabels = {
          timing: 'Questão de horário/timing',
          financial: 'Preocupação financeira',
          research: 'Em fase de pesquisa'
        };
        maybeDescription += `- Objeção: ${objectionLabels[objection]}\n`;
      }
      if (lead.interest_type) {
        maybeDescription += `- Interesse: ${lead.interest_type}\n`;
      }
      maybeDescription += `\n💬 **Transcrição:**\n"${transcript}"\n\n`;
      maybeDescription += `✅ **Ação sugerida:**\n${suggestedAction}`;

      await base44.asServiceRole.entities.Task.create({
        company_id: campaign.company_id,
        lead_id: lead.id,
        title: `Follow-up: ${objection ? objectionLabels[objection] : 'Lead pediu contato posterior'}`,
        description: maybeDescription,
        type: 'call_back',
        priority: objection === 'timing' ? 'high' : 'medium',
        status: 'open',
        source: 'voice_campaign',
        source_id: voiceCall.id,
        due_date: new Date(Date.now() + followUpDays * 24 * 60 * 60 * 1000).toISOString(),
        assigned_to_user_id: campaign.assigned_to_type === 'specific' ? campaign.assigned_to_user_id : null
      });

      await base44.asServiceRole.entities.VoiceCampaign.update(campaign.id, {
        total_maybe_responses: (campaign.total_maybe_responses || 0) + 1
      });

    } else if (intent === 'no') {
      // Move to Lost stage and opt out
      await base44.asServiceRole.entities.Lead.update(lead.id, {
        funnel_stage: 'Venda Perdida',
        opt_out_voice: true,
        notes: (lead.notes || '') + `\n[${new Date().toISOString()}] Lead optou por não receber ligações de voz (Campanha: ${campaign.name}).`,
        last_interaction_at: new Date().toISOString()
      });

      await base44.asServiceRole.entities.VoiceCampaign.update(campaign.id, {
        total_no_responses: (campaign.total_no_responses || 0) + 1
      });
    }

    return Response.json({
      voice_call_id: voiceCall.id,
      intent,
      confidence,
      action: intent === 'yes' ? 'task_created' : intent === 'maybe' ? 'follow_up_scheduled' : intent === 'no' ? 'opted_out' : 'none'
    });
  } catch (error) {
    console.error('Error processing Zenvia webhook:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});