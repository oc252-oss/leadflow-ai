import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const { voice_call_id, phone_number, script_text } = await req.json();

    if (!voice_call_id || !phone_number || !script_text) {
      return Response.json({ 
        error: 'voice_call_id, phone_number, and script_text are required' 
      }, { status: 400 });
    }

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
        messageToPlay: script_text,
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
      status: 'calling',
      started_at: new Date().toISOString()
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