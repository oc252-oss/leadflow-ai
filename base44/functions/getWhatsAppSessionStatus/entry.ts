import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const sessionManagerModule = await import('./whatsAppWebSessionManager.js');

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { session_id } = await req.json();

    if (!session_id) {
      return Response.json({ error: 'session_id is required' }, { status: 400 });
    }

    const status = await sessionManagerModule.getSessionStatus(session_id);

    return Response.json({
      success: true,
      ...status
    });

  } catch (error) {
    console.error('Error checking session status:', error);
    return Response.json({
      error: 'Failed to check session',
      details: error.message
    }, { status: 500 });
  }
});