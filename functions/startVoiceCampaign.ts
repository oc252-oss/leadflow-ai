import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { campaign_id } = await req.json();

    if (!campaign_id) {
      return Response.json({ error: 'campaign_id required' }, { status: 400 });
    }

    // Fetch campaign
    const campaigns = await base44.asServiceRole.entities.VoiceCampaign.filter({
      id: campaign_id
    });

    if (!campaigns.length) {
      return Response.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const campaign = campaigns[0];

    // Get company timezone
    const companies = await base44.asServiceRole.entities.Company.filter({
      id: campaign.company_id
    });
    const company = companies[0];

    // Check if within business hours
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { 
      hour12: false, 
      timeZone: company?.timezone || 'America/Sao_Paulo',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const [hour, minute] = timeStr.split(':');
    const currentTime = `${hour}:${minute}`;
    const campaignStart = campaign.business_hours_start;
    const campaignEnd = campaign.business_hours_end;

    if (currentTime < campaignStart || currentTime > campaignEnd) {
      return Response.json({ 
        success: true,
        message: 'Outside business hours',
        calls_made: 0
      });
    }

    // Check day of week
    const dayName = now.toLocaleDateString('en-US', { 
      weekday: 'long',
      timeZone: company?.timezone || 'America/Sao_Paulo'
    }).toLowerCase();

    if (!campaign.calling_days.includes(dayName)) {
      return Response.json({ 
        success: true,
        message: 'Not a calling day',
        calls_made: 0
      });
    }

    // Find leads to call
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - campaign.inactivity_days);

    const leads = await base44.asServiceRole.entities.Lead.filter({
      company_id: campaign.company_id,
      status: 'active',
      last_interaction_at: { $lt: cutoffDate.toISOString() }
    }, '-score', 100);

    // Filter by funnel stage and interest type
    const targetLeads = leads.filter(lead => {
      const stageMatch = campaign.funnel_stages.length === 0 || 
        campaign.funnel_stages.includes(lead.funnel_stage);
      const interestMatch = campaign.interest_types.length === 0 || 
        campaign.interest_types.includes(lead.interest_type);
      return stageMatch && interestMatch;
    });

    let callsMade = 0;
    const maxCallsPerRun = 10; // Safety limit

    for (const lead of targetLeads.slice(0, maxCallsPerRun)) {
      if (!lead.phone_number) continue;

      // Check if already called in this campaign
      const existingCalls = await base44.asServiceRole.entities.VoiceCall.filter({
        campaign_id,
        lead_id: lead.id
      });

      if (existingCalls.length >= campaign.max_attempts_per_lead) {
        continue;
      }

      try {
        // Create VoiceCall record
        const voiceCall = await base44.asServiceRole.entities.VoiceCall.create({
          company_id: campaign.company_id,
          campaign_id,
          lead_id: lead.id,
          phone_number: lead.phone_number,
          status: 'pending',
          attempt_number: existingCalls.length + 1,
          started_at: new Date().toISOString()
        });

        // Make API call to Zenvia
        const zenviaApiKey = Deno.env.get('ZENVIA_API_KEY');
        if (!zenviaApiKey) {
          console.error('ZENVIA_API_KEY not configured');
          continue;
        }

        const webhookUrl = `${Deno.env.get('BASE44_APP_URL') || 'http://localhost'}/api/functions/zenviaCampaignWebhook`;
        
        const zenviaResponse = await fetch('https://api.zenvia.com/v2/voice', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${zenviaApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: campaign.company_id,
            to: lead.phone_number,
            callbackUrl: webhookUrl,
            dtmfCallbackUrl: webhookUrl,
            text: campaign.script_text,
            language: 'pt-BR'
          })
        });

        if (zenviaResponse.ok) {
          const zenviaData = await zenviaResponse.json();
          
          // Update VoiceCall with external call ID
          await base44.asServiceRole.entities.VoiceCall.update(voiceCall.id, {
            external_call_id: zenviaData.id,
            status: 'calling'
          });

          callsMade++;
        } else {
          console.error('Zenvia API error:', await zenviaResponse.text());
          await base44.asServiceRole.entities.VoiceCall.update(voiceCall.id, {
            status: 'failed'
          });
        }
      } catch (error) {
        console.error('Error making voice call:', error);
      }
    }

    // Update campaign stats
    await base44.asServiceRole.entities.VoiceCampaign.update(campaign_id, {
      total_calls_made: campaign.total_calls_made + callsMade,
      calls_made_today: campaign.calls_made_today + callsMade,
      last_run_at: new Date().toISOString(),
      status: campaign.status === 'draft' ? 'running' : campaign.status
    });

    return Response.json({
      success: true,
      calls_made: callsMade,
      campaign_id
    });

  } catch (error) {
    console.error('[startVoiceCampaign] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});