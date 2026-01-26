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

    // Get campaign
    const campaigns = await base44.asServiceRole.entities.ReengagementCampaign.filter({
      id: campaign_id
    });

    if (campaigns.length === 0) {
      return Response.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const campaign = campaigns[0];

    // Get all leads for the company
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
      // Must have phone
      if (!lead.phone) return false;

      // Check last interaction
      if (!lead.last_interaction_at) return false;
      
      const daysSince = Math.floor((now - new Date(lead.last_interaction_at)) / (1000 * 60 * 60 * 24));
      if (daysSince < minDays) return false;

      // Period-specific filters
      if (campaign.period_type === '7_days') {
        // Recent leads: exclude closed won
        if (lead.funnel_stage === 'Venda Ganha') return false;
      } else if (campaign.period_type === '30_days') {
        // Warm leads: target qualified and exploring
        const targetStages = ['Qualificado', 'Avaliação Convidada', 'Venda Perdida'];
        if (!targetStages.includes(lead.funnel_stage)) return false;
      } else if (campaign.period_type === '90_days') {
        // Cold leads: exclude won
        if (lead.funnel_stage === 'Venda Ganha') return false;
      }

      // Custom funnel stages filter
      if (campaign.funnel_stages && campaign.funnel_stages.length > 0) {
        if (!campaign.funnel_stages.includes(lead.funnel_stage)) return false;
      }

      // Custom interest types filter
      if (campaign.interest_types && campaign.interest_types.length > 0) {
        if (!campaign.interest_types.includes(lead.interest_type)) return false;
      }

      return true;
    });

    // Get already contacted leads
    const existingContacts = await base44.asServiceRole.entities.CampaignContact.filter({
      campaign_id: campaign_id
    });

    const contactedLeadIds = new Set(existingContacts.map(c => c.lead_id));
    const newLeads = filteredLeads.filter(lead => !contactedLeadIds.has(lead.id));

    return Response.json({
      success: true,
      leads: newLeads.slice(0, 50), // Limit preview
      total: newLeads.length
    });

  } catch (error) {
    console.error('Error previewing leads:', error);
    return Response.json({ 
      error: 'Failed to preview leads',
      details: error.message 
    }, { status: 500 });
  }
});