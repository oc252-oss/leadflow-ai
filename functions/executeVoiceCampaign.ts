import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { campaign_id } = await req.json();

    if (!campaign_id) {
      return Response.json({ error: 'campaign_id is required' }, { status: 400 });
    }

    // Get campaign details
    const campaigns = await base44.asServiceRole.entities.VoiceCampaign.filter({ id: campaign_id });
    if (campaigns.length === 0) {
      return Response.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const campaign = campaigns[0];

    if (!campaign.is_active) {
      return Response.json({ error: 'Campaign is not active' }, { status: 400 });
    }

    // Check if within allowed hours
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
    
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = days[now.getDay()];

    if (!campaign.calling_days.includes(currentDay)) {
      return Response.json({ 
        message: 'Not within allowed calling days', 
        current_day: currentDay 
      });
    }

    if (currentTime < campaign.business_hours_start || currentTime > campaign.business_hours_end) {
      return Response.json({ 
        message: 'Not within allowed calling hours', 
        current_time: currentTime 
      });
    }

    // Calculate inactivity threshold
    const inactivityDate = new Date();
    inactivityDate.setDate(inactivityDate.getDate() - campaign.inactivity_days);

    // Get eligible leads
    const allLeads = await base44.asServiceRole.entities.Lead.filter({
      company_id: campaign.company_id,
      status: 'active'
    });

    const eligibleLeads = [];

    for (const lead of allLeads) {
      // Check last interaction
      if (!lead.last_interaction_at) continue;
      
      const lastInteraction = new Date(lead.last_interaction_at);
      if (lastInteraction > inactivityDate) continue;

      // Check if lead has phone
      if (!lead.phone) continue;

      // Check if lead opted out
      if (lead.tags && lead.tags.includes('opt_out_voice')) continue;

      // Check if lead has open tasks
      const openTasks = await base44.asServiceRole.entities.Task.filter({
        lead_id: lead.id,
        status: 'open'
      });

      if (openTasks.length > 0 && campaign.exclude_open_tasks) continue;

      // Check attempts count
      const previousCalls = await base44.asServiceRole.entities.VoiceCall.filter({
        campaign_id: campaign.id,
        lead_id: lead.id
      });

      if (previousCalls.length >= campaign.max_attempts_per_lead) continue;

      eligibleLeads.push(lead);
    }

    // Limit to 10 calls per execution
    const leadsToCall = eligibleLeads.slice(0, 10);

    const callsInitiated = [];

    for (const lead of leadsToCall) {
      // Create VoiceCall record
      const voiceCall = await base44.asServiceRole.entities.VoiceCall.create({
        company_id: campaign.company_id,
        campaign_id: campaign.id,
        lead_id: lead.id,
        phone_number: lead.phone,
        status: 'pending',
        attempt_number: (await base44.asServiceRole.entities.VoiceCall.filter({
          campaign_id: campaign.id,
          lead_id: lead.id
        })).length + 1
      });

      // Initiate call via Zenvia
      try {
        const callResult = await base44.asServiceRole.functions.invoke('initiateZenviaCall', {
          voice_call_id: voiceCall.id,
          phone_number: lead.phone,
          script_text: campaign.script_text
        });

        callsInitiated.push({
          lead_id: lead.id,
          voice_call_id: voiceCall.id,
          status: 'initiated'
        });
      } catch (error) {
        await base44.asServiceRole.entities.VoiceCall.update(voiceCall.id, {
          status: 'failed',
          notes: error.message
        });

        callsInitiated.push({
          lead_id: lead.id,
          voice_call_id: voiceCall.id,
          status: 'failed',
          error: error.message
        });
      }
    }

    // Update campaign stats
    await base44.asServiceRole.entities.VoiceCampaign.update(campaign.id, {
      calls_made_today: campaign.calls_made_today + callsInitiated.length,
      total_calls_made: campaign.total_calls_made + callsInitiated.length,
      last_run_at: new Date().toISOString()
    });

    return Response.json({
      campaign_id: campaign.id,
      eligible_leads: eligibleLeads.length,
      calls_initiated: callsInitiated.length,
      calls: callsInitiated
    });
  } catch (error) {
    console.error('Error executing voice campaign:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});