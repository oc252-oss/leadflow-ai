import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const sessionManagerModule = await import('./whatsAppWebSessionManager.js');

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { session_id, to, message } = await req.json();

    if (!session_id || !to || !message) {
      return Response.json({
        error: 'session_id, to, and message are required'
      }, { status: 400 });
    }

    const session = sessionManagerModule.activeSessions.get(session_id);
    
    if (!session) {
      return Response.json({
        error: 'Session not found or disconnected',
        session_id
      }, { status: 404 });
    }

    try {
      // Send message via WhatsApp Web
      const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;
      
      const sentMessage = await session.sendMessage(jid, {
        text: message
      });

      console.log('Message sent via WhatsApp Web:', {
        session_id,
        to,
        message_id: sentMessage.key.id
      });

      return Response.json({
        success: true,
        message_id: sentMessage.key.id,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      throw error;
    }

  } catch (error) {
    console.error('Error in sendWhatsAppWebMessage:', error);
    return Response.json({
      error: 'Failed to send message',
      details: error.message
    }, { status: 500 });
  }
});