import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Intent detection from transcript
function detectIntent(transcript) {
  if (!transcript) {
    return { result: 'unknown', confidence: 0 };
  }

  const text = transcript.toLowerCase().trim();

  // Yes patterns
  const yesPatterns = ['sim', 'yes', 'pode ser', 'claro', 'com certeza', 'ok', 'tudo bem', 'agrees', 'concordo'];
  if (yesPatterns.some(p => text.includes(p))) {
    return { result: 'yes', confidence: 85 };
  }

  // No patterns
  const noPatterns = ['não', 'no', 'nunca', 'de jeito nenhum', 'recuso', 'sem chance', 'nega'];
  if (noPatterns.some(p => text.includes(p))) {
    return { result: 'no', confidence: 85 };
  }

  // Maybe patterns
  const maybePatterns = ['talvez', 'maybe', 'acho que sim', 'não sei', 'depende', 'deixa eu pensar', 'preciso pensar'];
  if (maybePatterns.some(p => text.includes(p))) {
    return { result: 'maybe', confidence: 75 };
  }

  // Default to unknown if no clear match
  return { result: 'unknown', confidence: 30 };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const body = await req.json();
    const { id: externalCallId, status, text: transcript, duration } = body;

    if (!externalCallId) {
      return Response.json({ error: 'Missing call ID' }, { status: 400 });
    }

    // Find VoiceCall by external ID
    const voiceCalls = await base44.asServiceRole.entities.VoiceCall.filter({
      external_call_id: externalCallId
    });

    if (!voiceCalls.length) {
      console.log(`[zenviaCampaignWebhook] VoiceCall not found for ID: ${externalCallId}`);
      return Response.json({ success: true });
    }

    const voiceCall = voiceCalls[0];

    // Detect intent
    const intentData = detectIntent(transcript);

    // Determine final status
    let finalStatus = 'completed';
    if (status === 'failed' || status === 'no_answer') {
      finalStatus = status;
    }

    // Update VoiceCall record
    await base44.asServiceRole.entities.VoiceCall.update(voiceCall.id, {
      status: finalStatus,
      result: intentData.result,
      transcript: transcript || '',
      confidence_score: intentData.confidence,
      duration_seconds: duration || 0,
      ended_at: new Date().toISOString()
    });

    // Get lead and campaign for actions
    const leads = await base44.asServiceRole.entities.Lead.filter({
      id: voiceCall.lead_id
    });

    if (leads.length === 0) {
      return Response.json({ success: true });
    }

    const lead = leads[0];

    const campaigns = await base44.asServiceRole.entities.VoiceCampaign.filter({
      id: voiceCall.campaign_id
    });

    const campaign = campaigns[0];

    // Process actions based on result
    if (finalStatus === 'completed') {
      if (intentData.result === 'yes') {
        // Update lead as qualified
        await base44.asServiceRole.entities.Lead.update(lead.id, {
          funnel_stage: 'Qualificado',
          temperature: 'hot',
          score: Math.min(100, (lead.score || 0) + 30)
        });

        // Create task for sales
        try {
          await base44.asServiceRole.entities.Task.create({
            company_id: lead.company_id,
            lead_id: lead.id,
            title: `Acompanhar lead qualificado por voz - ${lead.name}`,
            description: `Lead respondeu positivamente à campanha de voz. Transcrição: "${transcript}"`,
            assigned_to: lead.assigned_agent_id,
            priority: 'high',
            status: 'open'
          });
        } catch (error) {
          console.log('[zenviaCampaignWebhook] Could not create task:', error.message);
        }

        // Update campaign stats
        await base44.asServiceRole.entities.VoiceCampaign.update(campaign.id, {
          total_positive_responses: campaign.total_positive_responses + 1
        });

      } else if (intentData.result === 'no') {
        // Mark as opt-out
        await base44.asServiceRole.entities.Lead.update(lead.id, {
          status: 'archived',
          notes: (lead.notes || '') + '\nOptou por não receber mais contatos.'
        });

        // Update campaign stats
        await base44.asServiceRole.entities.VoiceCampaign.update(campaign.id, {
          total_negative_responses: campaign.total_negative_responses + 1
        });

      } else if (intentData.result === 'maybe') {
        // Schedule follow-up
        try {
          await base44.asServiceRole.entities.Task.create({
            company_id: lead.company_id,
            lead_id: lead.id,
            title: `Acompanhamento - Resposta indefinida em campanha de voz`,
            description: `Lead respondeu de forma indefinida: "${transcript}". Agendar novo contato.`,
            assigned_to: lead.assigned_agent_id,
            priority: 'medium',
            status: 'open',
            due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
          });
        } catch (error) {
          console.log('[zenviaCampaignWebhook] Could not create task:', error.message);
        }

        // Update campaign stats
        await base44.asServiceRole.entities.VoiceCampaign.update(campaign.id, {
          total_maybe_responses: campaign.total_maybe_responses + 1
        });
      }
    }

    return Response.json({ success: true });

  } catch (error) {
    console.error('[zenviaCampaignWebhook] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});