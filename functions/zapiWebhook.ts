import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Normalizar número de telefone
function normalizePhone(phone) {
  if (!phone) return '';
  // Remove caracteres não numéricos
  let cleaned = phone.replace(/\D/g, '');
  // Se começar com 55, mantém (Brasil)
  if (cleaned.startsWith('55')) {
    return cleaned;
  }
  // Se não, adiciona 55
  return '55' + cleaned;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    
    console.log('📥 Z-API Webhook recebido:', JSON.stringify(payload, null, 2));

    // Extrair dados da mensagem
    const rawPhone = payload.phone || payload.from || payload.sender || '';
    const messageBody = payload.message?.body || payload.text?.message || payload.body || '';
    const messageId = payload.message?.id || payload.messageId || payload.id || '';
    const instance = payload.instance || payload.instanceId || '';

    console.log('📞 Dados extraídos - Phone:', rawPhone, 'Body:', messageBody?.substring(0, 50));

    if (!rawPhone || !messageBody) {
      console.log('⚠️ Faltando phone ou mensagem, ignorando');
      return Response.json({ success: true, skipped: true }, { status: 200 });
    }

    const phone = normalizePhone(rawPhone);
    console.log('📞 Telefone normalizado:', phone);

    // Buscar ou criar Company (pegar a primeira disponível)
    let companies = await base44.asServiceRole.entities.Company.list();
    if (companies.length === 0) {
      console.log('⚠️ Nenhuma empresa encontrada, criando empresa padrão');
      const newCompany = await base44.asServiceRole.entities.Company.create({
        name: 'Empresa Padrão',
        plan: 'free',
        status: 'active'
      });
      companies = [newCompany];
    }
    const company = companies[0];
    console.log('🏢 Empresa:', company.name, company.id);

    // Buscar ou criar Lead
    let leads = await base44.asServiceRole.entities.Lead.filter({ phone });
    let lead;
    
    if (leads.length === 0) {
      console.log('👤 Criando novo lead para:', phone);
      lead = await base44.asServiceRole.entities.Lead.create({
        name: `Lead ${phone}`,
        phone,
        source: 'whatsapp',
        status: 'ativo'
      });
      console.log('✅ Lead criado:', lead.id);
    } else {
      lead = leads[0];
      console.log('✅ Lead encontrado:', lead.id, lead.name);
    }

    // Buscar ou criar Conversation
    let conversations = await base44.asServiceRole.entities.Conversation.filter({ 
      lead_id: lead.id,
      channel: 'whatsapp',
      status: 'bot_active'
    });
    
    let conversation;
    if (conversations.length === 0) {
      console.log('💬 Criando nova conversa para lead:', lead.id);
      conversation = await base44.asServiceRole.entities.Conversation.create({
        company_id: company.id,
        lead_id: lead.id,
        channel: 'whatsapp',
        status: 'bot_active',
        ai_active: true,
        last_message_preview: messageBody.substring(0, 100),
        last_message_at: new Date().toISOString(),
        started_at: new Date().toISOString()
      });
      console.log('✅ Conversa criada:', conversation.id);
    } else {
      conversation = conversations[0];
      console.log('✅ Conversa encontrada:', conversation.id);
      
      // Atualizar última mensagem
      await base44.asServiceRole.entities.Conversation.update(conversation.id, {
        last_message_preview: messageBody.substring(0, 100),
        last_message_at: new Date().toISOString()
      });
    }

    // Criar Message
    const message = await base44.asServiceRole.entities.Message.create({
      company_id: company.id,
      conversation_id: conversation.id,
      lead_id: lead.id,
      sender_type: 'lead',
      sender_id: phone,
      content: messageBody,
      message_type: 'text',
      direction: 'inbound',
      metadata: payload,
      external_message_id: messageId,
      delivered: true,
      read: false,
      created_at: new Date().toISOString()
    });

    console.log('✅ Mensagem salva:', message.id, 'Conteúdo:', messageBody.substring(0, 50));

    return Response.json({ 
      success: true, 
      lead_id: lead.id,
      conversation_id: conversation.id,
      message_id: message.id
    }, { status: 200 });

  } catch (error) {
    console.error('❌ ERRO ao processar webhook:', error.message);
    console.error('Stack:', error.stack);
    // Sempre retornar 200 para não bloquear Z-API
    return Response.json({ success: true, error: error.message }, { status: 200 });
  }
});