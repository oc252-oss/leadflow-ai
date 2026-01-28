import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Intent detection helper
function detectIntent(transcript) {
  if (!transcript) return { intent: 'unknown', confidence: 0 };

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

  // Determine intent based on highest score
  if (noScore > yesScore && noScore > maybeScore) {
    return { intent: 'no', confidence: Math.min(noScore * 30, 90) };
  }
  
  if (yesScore > maybeScore && yesScore > noScore) {
    return { intent: 'yes', confidence: Math.min(yesScore * 30, 90) };
  }
  
  if (maybeScore > 0) {
    return { intent: 'maybe', confidence: Math.min(maybeScore * 25, 75) };
  }

  return { intent: 'unknown', confidence: 0 };
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

    // Detect intent from transcript
    const { intent, confidence } = detectIntent(transcript);

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

      // Create task with context-aware description
      const taskTitle = isProspecting 
        ? '🎯 Lead reativado com interesse (Prospecção)'
        : '🎙️ Lead demonstrou interesse (Reengajamento)';
      
      const taskDescription = isProspecting
        ? `Lead ${lead.name} demonstrou interesse em retomar contato.\n\nCampanha: ${campaign.name}\nInteresse original: ${lead.interest_type || 'Não especificado'}\n\nTranscrição: "${transcript}"\n\nOferecer avaliação gratuita e agendar.`
        : `Lead ${lead.name} demonstrou interesse durante ligação automática.\n\nCampanha: ${campaign.name}\n\nTranscrição: "${transcript}"\n\nSugerir avaliação e próximos passos.`;

      const taskData = {
        company_id: campaign.company_id,
        lead_id: lead.id,
        title: taskTitle,
        description: taskDescription,
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
      // Keep current funnel stage, create follow-up with adjusted timeline
      await base44.asServiceRole.entities.Lead.update(lead.id, {
        last_interaction_at: new Date().toISOString()
      });

      const followUpDays = isProspecting ? 10 : 5;

      await base44.asServiceRole.entities.Task.create({
        company_id: campaign.company_id,
        lead_id: lead.id,
        title: `Follow-up: Lead pediu contato posterior${isProspecting ? ' (Prospecção)' : ''}`,
        description: `Lead ${lead.name} pediu para entrar em contato mais tarde.\n\nCampanha: ${campaign.name}\nTranscrição: "${transcript}"`,
        type: 'call_back',
        priority: 'medium',
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