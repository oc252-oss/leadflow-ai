import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { Baileys, DisconnectReason, useMultiFileAuthState, MessageType } from 'npm:@whiskeysockets/baileys@6.4.0';
import QRCode from 'npm:qrcode@1.5.3';
import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';

// In-memory session store
const activeSessions = new Map();
const sessionStates = new Map();

// Session file storage path
const SESSION_DIR = '/tmp/whatsapp_sessions';
const SESSIONS_INDEX = '/tmp/whatsapp_sessions_index.json';

async function ensureSessionDir() {
  try {
    const stat = await Deno.stat(SESSION_DIR).catch(() => null);
    if (!stat) {
      await Deno.mkdir(SESSION_DIR, { recursive: true });
    }
  } catch (e) {
    console.error('Error creating session dir:', e);
  }
}

async function saveSessionIndex() {
  try {
    const index = {};
    for (const [key, session] of sessionStates.entries()) {
      index[key] = {
        company_id: session.company_id,
        unit_id: session.unit_id,
        phone_number: session.phone_number,
        label: session.label,
        created_at: session.created_at
      };
    }
    await writeFile(SESSIONS_INDEX, JSON.stringify(index, null, 2));
  } catch (error) {
    console.error('Error saving session index:', error);
  }
}

async function loadSessionIndex() {
  try {
    if (existsSync(SESSIONS_INDEX)) {
      const data = await readFile(SESSIONS_INDEX, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading session index:', error);
  }
  return {};
}

export async function createWhatsAppSession(company_id, unit_id, label = '', integration_id = null) {
  await ensureSessionDir();
  
  const sessionId = integration_id || `${company_id}_${Date.now()}`;
  const authDir = `${SESSION_DIR}/${sessionId}`;

  console.log(`Creating WhatsApp Web session: ${sessionId}`);

  try {
    // Import Baileys dynamically for better control
    const { default: makeWASocket, useMultiFileAuthState: useAuth, DisconnectReason: Disconnect } = await import('npm:@whiskeysockets/baileys@6.4.0');

    const { state, saveCreds } = await useAuth(authDir);

    const socket = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      browser: ['CLINIQ', 'Desktop', '1.0.0'],
      logger: {
        level: 'silent',
        log: () => {},
        error: () => {},
        warn: () => {}
      }
    });

    // Store session state
    sessionStates.set(sessionId, {
      company_id,
      unit_id,
      label,
      created_at: new Date().toISOString(),
      auth_dir: authDir
    });

    let qrCodeValue = '';

    // Handle QR code
    socket.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log('QR Code generated for:', sessionId);
        qrCodeValue = qr;
      }

      if (connection === 'open') {
        console.log('Connected:', sessionId);
        activeSessions.set(sessionId, socket);
        await saveCreds();
        await saveSessionIndex();
      }

      if (connection === 'close') {
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== Disconnect.loggedOut;
        console.log('Disconnected:', sessionId, 'Should reconnect:', shouldReconnect);
        if (!shouldReconnect) {
          activeSessions.delete(sessionId);
          sessionStates.delete(sessionId);
        }
      }
    });

    // Handle incoming messages
    socket.ev.on('messages.upsert', async (m) => {
      const message = m.messages[0];
      if (message.key.fromMe) return; // Skip own messages

      try {
        const sender = message.key.remoteJid.split('@')[0];
        const sessionInfo = sessionStates.get(sessionId);

        console.log(`Message from ${sender} in session ${sessionId}`);

        // Process through webhook
        await processIncomingWhatsAppMessage({
          sender: sender,
          body: message.message?.conversation || '',
          integration_id: sessionId,
          company_id,
          unit_id,
          timestamp: new Date().toISOString(),
          message_key: message.key.id
        });

      } catch (error) {
        console.error('Error processing message:', error);
      }
    });

    // Store QR code promise
    return {
      sessionId,
      qrPromise: new Promise((resolve) => {
        const checkQR = setInterval(() => {
          if (qrCodeValue) {
            clearInterval(checkQR);
            resolve(qrCodeValue);
          }
        }, 100);
        
        setTimeout(() => {
          clearInterval(checkQR);
          resolve(null);
        }, 30000);
      })
    };

  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
}

export async function getSessionQRCode(sessionId) {
  try {
    const session = activeSessions.get(sessionId);
    if (!session) {
      return null;
    }

    // Wait for QR code to be generated
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        // Try to get QR from socket events
        resolve(null);
        clearInterval(checkInterval);
      }, 100);

      setTimeout(() => {
        clearInterval(checkInterval);
        resolve(null);
      }, 5000);
    });
  } catch (error) {
    console.error('Error getting QR code:', error);
    return null;
  }
}

export async function getSessionStatus(sessionId) {
  const session = activeSessions.get(sessionId);
  const sessionInfo = sessionStates.get(sessionId);

  if (!sessionInfo) {
    return { status: 'disconnected', phone_number: null };
  }

  if (session) {
    try {
      const user = session.user;
      return {
        status: 'connected',
        phone_number: user?.id?.split('@')[0] || sessionInfo.phone_number,
        label: sessionInfo.label,
        connected_at: sessionInfo.created_at
      };
    } catch (e) {
      return {
        status: 'error',
        phone_number: sessionInfo.phone_number,
        label: sessionInfo.label
      };
    }
  }

  return { status: 'disconnected', phone_number: sessionInfo.phone_number };
}

export async function disconnectSession(sessionId) {
  const session = activeSessions.get(sessionId);
  if (session) {
    try {
      await session.logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
    activeSessions.delete(sessionId);
  }
  sessionStates.delete(sessionId);
  await saveSessionIndex();
}

async function processIncomingWhatsAppMessage(data) {
  try {
    // Get Base44 service client for database operations
    const base44 = createClientFromRequest(new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }));

    const { sender, body, company_id, unit_id, timestamp } = data;

    console.log('Processing incoming message:', { sender, company_id, unit_id });

    // Find or create Lead
    const leads = await base44.asServiceRole.entities.Lead.filter({
      company_id,
      phone: sender
    });

    let lead;
    if (leads.length > 0) {
      lead = leads[0];
    } else {
      lead = await base44.asServiceRole.entities.Lead.create({
        company_id,
        unit_id,
        name: `WhatsApp ${sender}`,
        phone: sender,
        source: 'whatsapp',
        funnel_stage: 'Novo Lead',
        status: 'active'
      });
    }

    // Find or create Conversation
    let conversation = null;
    if (lead.active_conversation_id) {
      const conversations = await base44.asServiceRole.entities.Conversation.filter({
        id: lead.active_conversation_id
      });
      if (conversations.length > 0) {
        conversation = conversations[0];
      }
    }

    if (!conversation) {
      conversation = await base44.asServiceRole.entities.Conversation.create({
        company_id,
        unit_id,
        lead_id: lead.id,
        channel: 'whatsapp',
        status: 'bot_active',
        ai_active: true
      });
    }

    // Create Message record
    await base44.asServiceRole.entities.Message.create({
      company_id,
      unit_id,
      conversation_id: conversation.id,
      lead_id: lead.id,
      sender_type: 'lead',
      content: body,
      message_type: 'text',
      direction: 'inbound',
      delivered: true
    });

    // Update Lead
    await base44.asServiceRole.entities.Lead.update(lead.id, {
      last_interaction_at: timestamp,
      active_conversation_id: conversation.id
    });

    // Trigger AI flow if bot is active
    if (conversation.ai_active) {
      try {
        await base44.asServiceRole.functions.invoke('processAIConversation', {
          conversation_id: conversation.id,
          lead_id: lead.id,
          message_content: body
        });
      } catch (error) {
        console.error('Error triggering AI:', error);
      }
    }

  } catch (error) {
    console.error('Error processing WhatsApp message:', error);
  }
}

// Export for use in functions
export { activeSessions, sessionStates };