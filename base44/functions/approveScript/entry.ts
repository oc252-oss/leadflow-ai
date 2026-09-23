import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { scriptId, assistantId } = payload;

    if (!scriptId || !assistantId) {
      return Response.json({ error: 'scriptId and assistantId are required' }, { status: 400 });
    }

    console.log(`[Script] Approving script ${scriptId}`);

    // Update script to approved
    await base44.asServiceRole.entities.AIScript.update(scriptId, {
      status: 'approved',
      is_approved: true,
      approved_by: user.email,
      approved_at: new Date().toISOString()
    });

    // Link script to assistant (deprecated other versions)
    const assistant = await base44.asServiceRole.entities.Assistant.filter({ id: assistantId });
    if (assistant && assistant.length > 0) {
      await base44.asServiceRole.entities.Assistant.update(assistantId, {
        approved_script_id: scriptId
      });
    }

    console.log(`[Script] Script approved and linked to assistant`);

    return Response.json({
      success: true,
      message: 'Script approved and linked to assistant'
    });
  } catch (error) {
    console.error('[Script] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});