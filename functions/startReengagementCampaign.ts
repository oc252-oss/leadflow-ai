import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { campaign_id } = await req.json();

    if (!campaign_id) {
      return Response.json({ error: 'campaign_id is required' }, { status: 400 });
    }

    console.log('Starting reengagement campaign:', campaign_id);

    // Get campaign
    const campaigns = await base44.asServiceRole.entities.ReengagementCampaign.filter({
      id: campaign_id
    });

    if (campaigns.length === 0) {
      return Response.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const campaign = campaigns[0];

    // Get leads matching filters
    const allLeads = await base44.asServiceRole.entities.Lead.filter({
      company_id: campaign.company_id,
      status: 'active'
    });

    // Apply period-based filters
    const now = new Date();
    const minDays = {
      '7_days': 7,
      '30_days': 30,
      '90_days': 90,
      'custom': campaign.last_interaction_days || 7
    }[campaign.period_type] || 7;

    const filteredLeads = allLeads.filter(lead => {
      if (!lead.phone) return false;
      if (!lead.last_interaction_at) return false;
      
      const daysSince = Math.floor((now - new Date(lead.last_interaction_at)) / (1000 * 60 * 60 * 24));
      if (daysSince < minDays) return false;

      // Period-specific filters
      if (campaign.period_type === '7_days') {
        if (lead.funnel_stage === 'Venda Ganha') return false;
      } else if (campaign.period_type === '30_days') {
        const targetStages = ['Qualificado', 'Avaliação Convidada', 'Venda Perdida'];
        if (!targetStages.includes(lead.funnel_stage)) return false;
      } else if (campaign.period_type === '90_days') {
        if (lead.funnel_stage === 'Venda Ganha') return false;
      }

      if (campaign.funnel_stages && campaign.funnel_stages.length > 0) {
        if (!campaign.funnel_stages.includes(lead.funnel_stage)) return false;
      }

      if (campaign.interest_types && campaign.interest_types.length > 0) {
        if (!campaign.interest_types.includes(lead.interest_type)) return false;
      }

      return true;
    });

    console.log(`Found ${filteredLeads.length} leads matching filters`);

    // Create campaign contacts
    const contactsToCreate = filteredLeads.map(lead => ({
      campaign_id: campaign_id,
      lead_id: lead.id,
      company_id: campaign.company_id,
      status: 'pending'
    }));

    if (contactsToCreate.length > 0) {
      await base44.asServiceRole.entities.CampaignContact.bulkCreate(contactsToCreate);
    }

    // Update campaign status
    await base44.asServiceRole.entities.ReengagementCampaign.update(campaign_id, {
      status: 'running',
      started_at: new Date().toISOString()
    });

    console.log('Campaign started successfully');

    return Response.json({
      success: true,
      total_leads: filteredLeads.length
    });

  } catch (error) {
    console.error('Error starting campaign:', error);
    return Response.json({ 
      error: 'Failed to start campaign',
      details: error.message 
    }, { status: 500 });
  }
});