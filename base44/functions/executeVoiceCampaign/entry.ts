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

    if (!campaign.allowed_days.includes(currentDay)) {
      return Response.json({ 
        message: 'Not within allowed calling days', 
        current_day: currentDay 
      });
    }

    if (currentTime < campaign.allowed_hours_start || currentTime > campaign.allowed_hours_end) {
      return Response.json({ 
        message: 'Not within allowed calling hours', 
        current_time: currentTime 
      });
    }

    // Calculate inactivity threshold
    const inactivityDate = new Date();
    inactivityDate.setDate(inactivityDate.getDate() - campaign.days_inactive);

    // Get eligible leads based on campaign type and funnel stage
    const isProspecting = campaign.type === 'active_prospecting';
    const targetStages = campaign.target_funnel_stages || ['Atendimento Iniciado', 'Qualificado'];
    
    const allLeads = await base44.asServiceRole.entities.Lead.filter({
      company_id: campaign.company_id,
      status: 'active'
    });

    const eligibleLeads = [];

    for (const lead of allLeads) {
      // Check funnel stage (CENTRAL FUNNEL)
      if (!targetStages.includes(lead.funnel_stage)) continue;

      // Active Prospecting: Require previous relationship
      if (isProspecting) {
        // Must have had previous interaction OR reached Contact Initiated stage
        const hasRelationship = lead.last_interaction_at || 
                               lead.funnel_stage === 'Atendimento Iniciado' ||
                               lead.funnel_stage === 'Qualificado' ||
                               lead.funnel_stage === 'Avaliação Realizada';
        
        if (!hasRelationship) continue;
      }

      // Check last interaction
      if (!lead.last_interaction_at) continue;
      
      const lastInteraction = new Date(lead.last_interaction_at);
      if (lastInteraction > inactivityDate) continue;

      // Check if lead has phone
      if (!lead.phone) continue;

      // Check if lead opted out
      if (lead.opt_out_voice === true) continue;
      if (lead.tags && lead.tags.includes('opt_out_voice')) continue;

      // Filter by source if specified
      if (campaign.lead_sources && campaign.lead_sources.length > 0) {
        const sourceMapping = {
          'Facebook': 'facebook_lead_ad',
          'WhatsApp': 'whatsapp',
          'Importados': 'import'
        };
        
        const mappedSources = campaign.lead_sources.map(s => sourceMapping[s] || s.toLowerCase());
        if (!mappedSources.includes(lead.source)) continue;
      }

      // Check if lead has open tasks
      if (campaign.exclude_open_tasks) {
        const openTasks = await base44.asServiceRole.entities.Task.filter({
          lead_id: lead.id,
          status: 'open'
        });

        if (openTasks.length > 0) continue;
      }

      // Check attempts count
      const previousCalls = await base44.asServiceRole.entities.VoiceCall.filter({
        campaign_id: campaign.id,
        lead_id: lead.id
      });

      if (previousCalls.length >= campaign.max_attempts) continue;

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
        phone: lead.phone,
        status: 'initiated',
        attempt_number: (await base44.asServiceRole.entities.VoiceCall.filter({
          campaign_id: campaign.id,
          lead_id: lead.id
        })).length + 1
      });

      // Initiate call via Zenvia with lead context
      try {
        const companies = await base44.asServiceRole.entities.Company.filter({ id: campaign.company_id });
        const company = companies[0];

        const callResult = await base44.asServiceRole.functions.invoke('initiateZenviaCall', {
          voice_call_id: voiceCall.id,
          phone_number: lead.phone,
          script_text: campaign.script,
          lead_context: {
            name: lead.name,
            interest_type: lead.interest_type,
            funnel_stage: lead.funnel_stage,
            source: lead.source,
            last_interaction_at: lead.last_interaction_at
          },
          company_context: {
            name: company?.name || 'clínica'
          }
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