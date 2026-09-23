import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Process script variables with lead context
function processScriptVariables(script, lead, company) {
  if (!script) return '';

  let processedScript = script;

  // Replace variables with actual values or remove gracefully
  processedScript = processedScript.replace(/\{\{lead_name\}\}/gi, lead.name || '');
  processedScript = processedScript.replace(/\{\{clinic_name\}\}/gi, company?.name || 'clínica');
  processedScript = processedScript.replace(/\{\{interest_type\}\}/gi, lead.interest_type || '');
  
  // Calculate days since last contact
  if (lead.last_interaction_at) {
    const daysSince = Math.floor((Date.now() - new Date(lead.last_interaction_at).getTime()) / (1000 * 60 * 60 * 24));
    processedScript = processedScript.replace(/\{\{last_contact_days\}\}/gi, String(daysSince));
  } else {
    processedScript = processedScript.replace(/\{\{last_contact_days\}\}/gi, '');
  }

  // Clean up any empty phrases caused by missing variables
  processedScript = processedScript
    .replace(/\s{2,}/g, ' ')
    .replace(/\.\s+\./g, '.')
    .trim();

  return processedScript;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const { voice_call_id, phone_number, script_text, lead_context, company_context } = await req.json();

    if (!voice_call_id || !phone_number || !script_text) {
      return Response.json({ 
        error: 'voice_call_id, phone_number, and script_text are required' 
      }, { status: 400 });
    }

    // Process script with context variables
    const finalScript = processScriptVariables(script_text, lead_context || {}, company_context || {});

    const zenviaApiKey = Deno.env.get('ZENVIA_API_KEY');
    const zenviaWebhookUrl = Deno.env.get('ZENVIA_WEBHOOK_URL');

    if (!zenviaApiKey) {
      return Response.json({ error: 'ZENVIA_API_KEY not configured' }, { status: 500 });
    }

    // Format phone number for Brazil (remove non-digits, ensure +55)
    const cleanPhone = phone_number.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('55') ? `+${cleanPhone}` : `+55${cleanPhone}`;

    // Zenvia Voice API call
    const zenviaResponse = await fetch('https://voice-api.zenvia.com/voice/calls', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-TOKEN': zenviaApiKey
      },
      body: JSON.stringify({
        callerId: Deno.env.get('ZENVIA_CALLER_ID') || '+5511999999999',
        destination: formattedPhone,
        messageToPlay: finalScript,
        detectVoicemail: true,
        recordCall: true,
        webhookUrl: zenviaWebhookUrl || `${Deno.env.get('BASE44_APP_URL')}/functions/zenviaVoiceWebhook`,
        maxCallDuration: 180,
        waitForAnswer: true
      })
    });

    if (!zenviaResponse.ok) {
      const errorData = await zenviaResponse.text();
      throw new Error(`Zenvia API error: ${zenviaResponse.status} - ${errorData}`);
    }

    const zenviaData = await zenviaResponse.json();

    // Update VoiceCall with external ID
    await base44.asServiceRole.entities.VoiceCall.update(voice_call_id, {
      external_call_id: zenviaData.callId || zenviaData.id,
      status: 'answered'
    });

    return Response.json({
      voice_call_id,
      external_call_id: zenviaData.callId || zenviaData.id,
      status: 'initiated'
    });
  } catch (error) {
    console.error('Error initiating Zenvia call:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});