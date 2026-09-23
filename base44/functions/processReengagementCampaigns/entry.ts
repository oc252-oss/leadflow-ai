import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    console.log('Processing reengagement campaigns...');

    // Get all running campaigns
    const campaigns = await base44.asServiceRole.entities.ReengagementCampaign.filter({
      status: 'running',
      is_active: true
    });

    console.log(`Found ${campaigns.length} active campaigns`);

    for (const campaign of campaigns) {
      try {
        await processCampaign(base44, campaign);
      } catch (error) {
        console.error(`Error processing campaign ${campaign.id}:`, error);
      }
    }

    return Response.json({ success: true, processed: campaigns.length });

  } catch (error) {
    console.error('Error in reengagement processor:', error);
    return Response.json({ 
      error: 'Failed to process campaigns',
      details: error.message 
    }, { status: 500 });
  }
});

async function processCampaign(base44, campaign) {
  console.log(`Processing campaign: ${campaign.name}`);

  // Check if within active hours
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  if (currentTime < campaign.active_hours_start || currentTime > campaign.active_hours_end) {
    console.log('Outside active hours, skipping');
    return;
  }

  // Check daily limit
  if (campaign.messages_sent_today >= campaign.max_messages_per_day) {
    console.log('Daily limit reached, skipping');
    return;
  }

  // Check last sent time for interval
  if (campaign.last_sent_at) {
    const lastSent = new Date(campaign.last_sent_at);
    const secondsSinceLastSent = (now - lastSent) / 1000;
    if (secondsSinceLastSent < campaign.interval_seconds_min) {
      console.log('Too soon since last message, skipping');
      return;
    }
  }

  // Get pending contacts
  const contacts = await base44.asServiceRole.entities.CampaignContact.filter({
    campaign_id: campaign.id,
    status: 'pending'
  }, 'created_date', 1);

  if (contacts.length === 0) {
    console.log('No pending contacts, campaign may be finished');
    await base44.asServiceRole.entities.ReengagementCampaign.update(campaign.id, {
      status: 'finished',
      finished_at: new Date().toISOString()
    });
    return;
  }

  const contact = contacts[0];

  // Get lead
  const leads = await base44.asServiceRole.entities.Lead.filter({ id: contact.lead_id });
  if (leads.length === 0) {
    await base44.asServiceRole.entities.CampaignContact.update(contact.id, {
      status: 'failed',
      error_message: 'Lead not found'
    });
    return;
  }
  const lead = leads[0];

  // Personalize message
  const message = campaign.message_template
    .replace(/{nome}/g, lead.name || 'Cliente')
    .replace(/{interesse}/g, lead.interest_type || 'nossos serviços')
    .replace(/{score}/g, lead.score || 0);

  console.log(`Sending message to ${lead.name} (${lead.phone})`);

  // Send message
  try {
    const messageRecord = await base44.asServiceRole.entities.Message.create({
      company_id: campaign.company_id,
      unit_id: campaign.unit_id,
      lead_id: lead.id,
      sender_type: 'bot',
      content: message,
      message_type: 'text',
      direction: 'outbound',
      delivered: false
    });

    await base44.asServiceRole.functions.invoke('sendWhatsAppMessage', {
      integration_id: campaign.whatsapp_integration_id,
      to: lead.phone,
      message: message,
      message_id: messageRecord.id
    });

    // Update contact status
    await base44.asServiceRole.entities.CampaignContact.update(contact.id, {
      status: 'sent',
      sent_at: new Date().toISOString(),
      message_sent: message
    });

    // Update campaign stats
    await base44.asServiceRole.entities.ReengagementCampaign.update(campaign.id, {
      messages_sent_today: campaign.messages_sent_today + 1,
      total_messages_sent: campaign.total_messages_sent + 1,
      last_sent_at: new Date().toISOString()
    });

    console.log('Message sent successfully');

  } catch (error) {
    console.error('Error sending message:', error);
    await base44.asServiceRole.entities.CampaignContact.update(contact.id, {
      status: 'failed',
      error_message: error.message
    });
  }
}