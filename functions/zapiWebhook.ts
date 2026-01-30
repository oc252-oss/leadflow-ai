import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    
    console.log('📥 Z-API Webhook received:', JSON.stringify(payload, null, 2));

    // Identificar tipo de evento
    const eventType = identifyEventType(payload);
    console.log('🔍 Event type:', eventType);

    switch (eventType) {
      case 'message_received':
        await handleMessageReceived(base44, payload);
        break;
      
      case 'message_status':
        await handleMessageStatus(base44, payload);
        break;
      
      case 'connection_status':
        await handleConnectionStatus(base44, payload);
        break;
      
      default:
        console.log('⚠️ Unknown event type, ignoring');
    }

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    // Sempre retornar 200 para não bloquear Z-API
    return Response.json({ success: true, error: error.message }, { status: 200 });
  }
});

function identifyEventType(payload) {
  // Mensagem recebida
  if (payload.messages && Array.isArray(payload.messages) && payload.messages.length > 0) {
    return 'message_received';
  }
  
  if (payload.message && payload.fromMe === false) {
    return 'message_received';
  }

  // Status de mensagem
  if (payload.type === 'MessageStatus' || payload.status) {
    return 'message_status';
  }

  // Status de conexão
  if (payload.connected !== undefined || payload.event === 'connection') {
    return 'connection_status';
  }

  return 'unknown';
}

async function handleMessageReceived(base44, payload) {
  try {
    // Extrair dados da mensagem
    const message = payload.messages?.[0] || payload.message || payload;
    const phone = normalizePhone(message.phone || message.from || message.sender);
    const text = message.text?.message || message.body || message.content || '';
    const messageType = message.type || 'text';
    const instanceId = payload.instanceId || payload.instance;

    console.log('💬 Processing message from:', phone);

    if (!phone || !text) {
      console.log('⚠️ Missing phone or text, skipping');
      return;
    }

    // Buscar ou criar Lead
    let lead = await findOrCreateLead(base44, phone, message);
    console.log('👤 Lead:', lead.id);

    // Buscar Conexão WhatsApp ativa
    const connections = await base44.asServiceRole.entities.Connection.filter({
      type: 'whatsapp_zapi',
      status: 'conectado',
      is_active: true
    });

    if (connections.length === 0) {
      console.log('⚠️ No active WhatsApp connection found');
      return;
    }

    const connection = connections[0];
    console.log('🔌 Connection:', connection.name);

    // Buscar ou criar Conversa
    let conversation = await findOrCreateConversation(base44, lead.id, connection.id);
    console.log('💭 Conversation:', conversation.id);

    // Salvar mensagem no histórico
    await base44.asServiceRole.entities.Message.create({
      conversation_id: conversation.id,
      lead_id: lead.id,
      sender_type: 'lead',
      content: text,
      message_type: messageType,
      direction: 'inbound',
      delivered: true,
      read: false
    });

    // Buscar Assistente IA padrão
    const assistants = await base44.asServiceRole.entities.Assistant.filter({
      channel: 'whatsapp',
      is_active: true
    });

    if (assistants.length === 0) {
      console.log('⚠️ No active WhatsApp assistant found');
      return;
    }

    const assistant = assistants[0];
    console.log('🤖 Assistant:', assistant.name);

    // Buscar histórico de mensagens para contexto
    const messageHistory = await base44.asServiceRole.entities.Message.filter(
      { conversation_id: conversation.id },
      '-created_date',
      10
    );

    // Montar contexto da conversa
    const conversationContext = messageHistory
      .reverse()
      .map(m => `${m.sender_type === 'lead' ? 'Lead' : 'Assistente'}: ${m.content}`)
      .join('\n');

    // Gerar resposta via IA
    const aiPrompt = `${assistant.system_prompt || 'Você é um assistente de atendimento via WhatsApp.'}

Contexto da conversa:
${conversationContext}

Nova mensagem do lead: ${text}

Responda de forma natural, objetiva e profissional. Seja cordial e prestativo.`;

    console.log('🧠 Generating AI response...');

    const aiResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: aiPrompt
    });

    const responseText = aiResponse.output || aiResponse;
    console.log('✅ AI response:', responseText.substring(0, 100));

    // Salvar resposta no histórico
    await base44.asServiceRole.entities.Message.create({
      conversation_id: conversation.id,
      lead_id: lead.id,
      sender_type: 'bot',
      content: responseText,
      message_type: 'text',
      direction: 'outbound',
      delivered: false,
      read: false
    });

    // Enviar resposta via Z-API
    await sendWhatsAppMessage(connection, phone, responseText);
    console.log('📤 Response sent to WhatsApp');

    // Atualizar última interação do lead
    await base44.asServiceRole.entities.Lead.update(lead.id, {
      last_interaction_type: 'ia_chat',
      last_contact_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error handling message:', error);
    throw error;
  }
}

async function handleMessageStatus(base44, payload) {
  try {
    const messageId = payload.messageId || payload.id;
    const status = payload.status;

    console.log(`📊 Message status update: ${messageId} -> ${status}`);

    // Buscar mensagem no banco
    const messages = await base44.asServiceRole.entities.Message.filter({
      external_message_id: messageId
    });

    if (messages.length > 0) {
      const updateData = {};
      
      if (status === 'SENT' || status === 'sent') {
        updateData.delivered = true;
      } else if (status === 'DELIVERED' || status === 'delivered') {
        updateData.delivered = true;
      } else if (status === 'READ' || status === 'read') {
        updateData.read = true;
        updateData.delivered = true;
      }

      if (Object.keys(updateData).length > 0) {
        await base44.asServiceRole.entities.Message.update(messages[0].id, updateData);
        console.log('✅ Message status updated');
      }
    }
  } catch (error) {
    console.error('❌ Error updating message status:', error);
  }
}

async function handleConnectionStatus(base44, payload) {
  try {
    const connected = payload.connected;
    const instanceId = payload.instanceId || payload.instance;

    console.log(`🔌 Connection status: ${connected ? 'connected' : 'disconnected'}`);

    // Buscar conexão por instance_id
    const connections = await base44.asServiceRole.entities.Connection.filter({
      type: 'whatsapp_zapi'
    });

    for (const conn of connections) {
      if (conn.credentials?.instance_id === instanceId) {
        await base44.asServiceRole.entities.Connection.update(conn.id, {
          status: connected ? 'conectado' : 'desconectado',
          last_checked_at: new Date().toISOString()
        });
        console.log(`✅ Connection ${conn.name} status updated`);
        break;
      }
    }
  } catch (error) {
    console.error('❌ Error updating connection status:', error);
  }
}

async function findOrCreateLead(base44, phone, message) {
  // Tentar buscar lead existente
  const existingLeads = await base44.asServiceRole.entities.Lead.filter({ phone });

  if (existingLeads.length > 0) {
    return existingLeads[0];
  }

  // Criar novo lead
  const leadData = {
    name: message.pushName || message.senderName || phone,
    phone: phone,
    source: 'whatsapp',
    status: 'ativo',
    last_interaction_type: 'ia_chat',
    last_contact_at: new Date().toISOString()
  };

  return await base44.asServiceRole.entities.Lead.create(leadData);
}

async function findOrCreateConversation(base44, leadId, connectionId) {
  // Buscar conversa existente
  const existingConversations = await base44.asServiceRole.entities.Conversation.filter({
    lead_id: leadId,
    status: { $ne: 'closed' }
  });

  if (existingConversations.length > 0) {
    return existingConversations[0];
  }

  // Criar nova conversa
  const conversationData = {
    lead_id: leadId,
    channel: 'whatsapp',
    status: 'bot_active',
    ai_active: true,
    priority: 'normal',
    unread_count: 1,
    started_at: new Date().toISOString()
  };

  return await base44.asServiceRole.entities.Conversation.create(conversationData);
}

async function sendWhatsAppMessage(connection, phone, text) {
  const credentials = connection.credentials;
  
  if (!credentials?.instance_id || !credentials?.token || !credentials?.base_url) {
    throw new Error('Missing Z-API credentials');
  }

  const url = `${credentials.base_url}/instances/${credentials.instance_id}/token/${credentials.token}/send-text`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      phone: phone,
      message: text
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Z-API error: ${errorText}`);
  }

  return await response.json();
}

function normalizePhone(phone) {
  if (!phone) return '';
  
  // Remove caracteres não numéricos
  let cleaned = phone.replace(/\D/g, '');
  
  // Adiciona código do Brasil se não tiver código de país
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    cleaned = '55' + cleaned.substring(1);
  } else if (cleaned.length === 10) {
    cleaned = '55' + cleaned;
  } else if (cleaned.length === 11 && !cleaned.startsWith('55')) {
    cleaned = '55' + cleaned;
  }
  
  // Formato E.164
  return '+' + cleaned;
}