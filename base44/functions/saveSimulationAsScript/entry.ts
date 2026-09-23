import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const {
      assistantId,
      scriptName,
      usageType,
      channel,
      systemPrompt,
      greetingMessage,
      tone,
      behaviorRules,
      voiceSettings,
      conversationHistory
    } = payload;

    // Validations
    if (!scriptName || !scriptName.trim()) {
      return Response.json({ error: 'Script name is required' }, { status: 400 });
    }
    if (!usageType || !usageType.trim()) {
      return Response.json({ error: 'Usage type is required' }, { status: 400 });
    }
    if (!channel || !channel.trim()) {
      return Response.json({ error: 'Channel is required' }, { status: 400 });
    }
    if (channel === 'voice' && (!voiceSettings || Object.keys(voiceSettings).length === 0)) {
      return Response.json({ error: 'Voice settings required for voice channel' }, { status: 400 });
    }

    console.log(`[Script] Saving script: ${scriptName} for assistant ${assistantId}`);

    // Get existing scripts to calculate version
    const existingScripts = await base44.asServiceRole.entities.AIScript.filter({
      assistant_id: assistantId,
      usage_type: usageType,
      channel: channel
    });

    // Calculate next version
    let nextVersion = 'v1';
    if (existingScripts && existingScripts.length > 0) {
      const versions = existingScripts
        .map(s => {
          const match = s.version?.match(/v(\d+)/);
          return match ? parseInt(match[1]) : 0;
        })
        .filter(v => v > 0);
      
      const maxVersion = versions.length > 0 ? Math.max(...versions) : 0;
      nextVersion = `v${maxVersion + 1}`;
    }

    // Create new script
    const newScript = await base44.asServiceRole.entities.AIScript.create({
      assistant_id: assistantId,
      name: scriptName.trim(),
      usage_type: usageType,
      channel: channel,
      version: nextVersion,
      system_prompt: systemPrompt || '',
      greeting_message: greetingMessage || '',
      tone: tone || 'elegante',
      behavior_rules: behaviorRules || {},
      voice_settings: channel === 'voice' ? voiceSettings : null,
      conversation_history: conversationHistory || [],
      status: 'draft',
      is_approved: false,
      created_from_simulation: true
    });

    console.log(`[Script] Script created with version ${nextVersion}`);

    return Response.json({
      success: true,
      scriptId: newScript.id,
      version: nextVersion,
      status: 'draft',
      message: 'Script saved successfully. Awaiting approval for production use.'
    });
  } catch (error) {
    console.error('[Script] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});