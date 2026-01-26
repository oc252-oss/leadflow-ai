import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const url = new URL(req.url);

  // Webhook verification (GET request from Facebook)
  if (req.method === 'GET') {
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    const verifyToken = Deno.env.get('FACEBOOK_WEBHOOK_VERIFY_TOKEN');

    if (mode === 'subscribe' && token === verifyToken) {
      console.log('Webhook verified successfully');
      return new Response(challenge, { status: 200 });
    } else {
      return Response.json({ error: 'Verification failed' }, { status: 403 });
    }
  }

  // Handle webhook events (POST request from Facebook)
  if (req.method === 'POST') {
    try {
      const body = await req.json();
      console.log('Received webhook:', JSON.stringify(body, null, 2));

      // Process each entry
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          // Handle leadgen events
          if (change.field === 'leadgen') {
            await handleLeadGenEvent(base44, change.value);
          }
        }
      }

      return Response.json({ status: 'success' }, { status: 200 });
    } catch (error) {
      console.error('Error processing webhook:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }
  }

  return Response.json({ error: 'Method not allowed' }, { status: 405 });
});

async function handleLeadGenEvent(base44, eventData) {
  try {
    const leadgenId = eventData.leadgen_id;
    const pageId = eventData.page_id;
    const formId = eventData.form_id;
    const adId = eventData.ad_id;
    const adsetId = eventData.adset_id;
    const campaignId = eventData.campaign_id;

    console.log('Processing lead:', leadgenId);

    // Fetch lead data from Facebook Graph API
    const accessToken = Deno.env.get('FACEBOOK_PAGE_ACCESS_TOKEN');
    const leadResponse = await fetch(
      `https://graph.facebook.com/v21.0/${leadgenId}?access_token=${accessToken}`
    );

    if (!leadResponse.ok) {
      throw new Error(`Failed to fetch lead data: ${leadResponse.statusText}`);
    }

    const leadData = await leadResponse.json();
    console.log('Lead data from Facebook:', JSON.stringify(leadData, null, 2));

    // Extract field data
    const fieldData = {};
    for (const field of leadData.field_data || []) {
      fieldData[field.name.toLowerCase()] = field.values[0];
    }

    // Find or create company (use first company for now, or you can add logic to match by page_id)
    const companies = await base44.asServiceRole.entities.Company.list();
    if (companies.length === 0) {
      console.error('No company found');
      return;
    }
    const companyId = companies[0].id;

    // Find or create campaign
    let campaign = null;
    if (campaignId) {
      const existingCampaigns = await base44.asServiceRole.entities.Campaign.filter({
        company_id: companyId,
        external_campaign_id: campaignId
      });

      if (existingCampaigns.length > 0) {
        campaign = existingCampaigns[0];
      } else {
        // Create new campaign
        campaign = await base44.asServiceRole.entities.Campaign.create({
          company_id: companyId,
          platform: 'facebook',
          external_campaign_id: campaignId,
          external_adset_id: adsetId,
          external_ad_id: adId,
          campaign_name: `Campaign ${campaignId}`,
          status: 'active'
        });
      }

      // Update leads count
      await base44.asServiceRole.entities.Campaign.update(campaign.id, {
        leads_count: (campaign.leads_count || 0) + 1
      });
    }

    // Create lead entity
    const newLead = await base44.asServiceRole.entities.Lead.create({
      company_id: companyId,
      name: fieldData.full_name || fieldData.name || 'Lead sem nome',
      email: fieldData.email || '',
      phone: fieldData.phone_number || fieldData.phone || '',
      source: 'facebook_lead_ad',
      platform: 'facebook',
      campaign_id: campaign?.id || null,
      external_campaign_id: campaignId || '',
      external_adset_id: adsetId || '',
      external_ad_id: adId || '',
      form_id: formId || '',
      utm_source: 'facebook',
      funnel_stage: 'new',
      status: 'active',
      temperature: 'cold',
      score: 0,
      custom_fields: fieldData
    });

    console.log('Lead created:', newLead.id);

    // Log activity
    await base44.asServiceRole.entities.ActivityLog.create({
      company_id: companyId,
      lead_id: newLead.id,
      action: 'lead_created',
      details: {
        lead_name: newLead.name,
        source: 'facebook_lead_ad',
        campaign_id: campaignId
      }
    });

    return newLead;
  } catch (error) {
    console.error('Error handling leadgen event:', error);
    throw error;
  }
}