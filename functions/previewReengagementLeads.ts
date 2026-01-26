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
    const filters = campaign.filters || {};

    // Get all leads for the company
    const allLeads = await base44.asServiceRole.entities.Lead.filter({
      company_id: campaign.company_id,
      status: 'active'
    });

    // Apply filters
    const now = new Date();
    const filteredLeads = allLeads.filter(lead => {
      // Check last interaction
      if (lead.last_interaction_at) {
        const daysSince = Math.floor((now - new Date(lead.last_interaction_at)) / (1000 * 60 * 60 * 24));
        if (filters.last_interaction_days_min && daysSince < filters.last_interaction_days_min) return false;
        if (filters.last_interaction_days_max && daysSince > filters.last_interaction_days_max) return false;
      }

      // Check score
      const score = lead.score || 0;
      if (filters.score_min !== undefined && score < filters.score_min) return false;
      if (filters.score_max !== undefined && score > filters.score_max) return false;

      // Check temperature
      if (filters.temperatures && filters.temperatures.length > 0) {
        if (!filters.temperatures.includes(lead.temperature)) return false;
      }

      // Check stages
      if (filters.stages && filters.stages.length > 0) {
        if (!filters.stages.includes(lead.funnel_stage)) return false;
      }

      // Exclude leads without phone
      if (!lead.phone) return false;

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