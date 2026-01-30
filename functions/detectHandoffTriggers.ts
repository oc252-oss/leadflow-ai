import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Detecta gatilhos para handoff humano na mensagem do lead
 * Retorna true se deve fazer handoff
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { message, lead_id, conversation_id } = await req.json();

    if (!message) {
      return Response.json({ error: 'message is required' }, { status: 400 });
    }

    const messageText = message.toLowerCase();
    console.log('🔍 Analisando mensagem para handoff:', messageText.substring(0, 50));

    // Palavras-chave de handoff
    const handoffKeywords = [
      'atendente',
      'pessoa',
      'humano',
      'falar com alguém',
      'pessoa real',
      'vendedor',
      'consultor',
      'representante',
      'gerente'
    ];

    // Palavras-chave de objeções sensíveis
    const sensitiveKeywords = [
      'preço',
      'valor',
      'quanto custa',
      'desconto',
      'promoção',
      'parcelamento',
      'forma de pagamento'
    ];

    // Palavras-chave de agendamento
    const schedulingKeywords = [
      'agendar',
      'marcar',
      'horário',
      'disponibilidade',
      'quando posso',
      'quero agendar',
      'fazer avaliação',
      'sim quero'
    ];

    const hasHandoffKeyword = handoffKeywords.some(kw => messageText.includes(kw));
    const hasSensitiveKeyword = sensitiveKeywords.some(kw => messageText.includes(kw));
    const hasSchedulingKeyword = schedulingKeywords.some(kw => messageText.includes(kw));

    let shouldHandoff = false;
    let handoffReason = null;
    let urgency = 'normal';

    if (hasHandoffKeyword) {
      shouldHandoff = true;
      handoffReason = 'lead_request';
      urgency = 'high';
      console.log('🔔 Gatilho: Lead solicitou atendimento humano');
    } else if (hasSchedulingKeyword) {
      shouldHandoff = true;
      handoffReason = 'scheduling_request';
      urgency = 'high';
      console.log('📅 Gatilho: Lead quer agendar');
    } else if (hasSensitiveKeyword) {
      // Buscar lead para verificar qualification_score
      if (lead_id) {
        const leads = await base44.asServiceRole.entities.Lead.filter({ id: lead_id });
        if (leads.length > 0 && leads[0].qualification_score >= 60) {
          shouldHandoff = true;
          handoffReason = 'sensitive_objection_qualified_lead';
          urgency = 'high';
          console.log('💰 Gatilho: Objeção sensível em lead qualificado');
        }
      }
    }

    // Se deve fazer handoff, atualizar conversa
    if (shouldHandoff && conversation_id) {
      console.log('✋ Iniciando handoff - Motivo:', handoffReason);

      await base44.asServiceRole.entities.Conversation.update(conversation_id, {
        status: 'waiting',
        ai_active: false,
        human_handoff: true,
        handoff_reason: handoffReason,
        handoff_at: new Date().toISOString(),
        priority: urgency
      });

      // Atualizar estágio do lead para "Em Atendimento Humano"
      if (lead_id) {
        const leads = await base44.asServiceRole.entities.Lead.filter({ id: lead_id });
        if (leads.length > 0) {
          const lead = leads[0];
          
          if (lead.pipeline_id) {
            const humanStages = await base44.asServiceRole.entities.PipelineStage.filter({
              pipeline_id: lead.pipeline_id,
              stage_type: 'attended'
            });

            if (humanStages.length > 0) {
              await base44.asServiceRole.entities.Lead.update(lead_id, {
                pipeline_stage_id: humanStages[0].id
              });

              // Registrar mudança
              await base44.asServiceRole.entities.ActivityLog.create({
                company_id: lead.company_id || null,
                lead_id: lead_id,
                action: 'stage_changed',
                new_value: humanStages[0].name,
                details: {
                  handoff_reason: handoffReason,
                  auto: true
                }
              });
            }
          }
        }
      }

      // Criar notificações para usuários disponíveis
      try {
        const teamMembers = await base44.asServiceRole.entities.TeamMember.filter({
          status: 'active',
          can_assume_conversation: true
        });

        const user = await base44.asServiceRole.entities.User.list();
        
        for (const member of teamMembers) {
          await base44.asServiceRole.entities.Notification.create({
            company_id: leads[0]?.company_id || null,
            user_email: member.user_email,
            type: 'lead_assigned',
            title: 'Novo lead aguardando atendimento',
            message: `Lead solicitou atendimento humano: ${handoffReason}`,
            link: `/conversations?conversation_id=${conversation_id}`,
            lead_id: lead_id,
            priority: urgency
          });
        }

        console.log('📢 Notificações enviadas para', teamMembers.length, 'membros da equipe');
      } catch (error) {
        console.log('⚠️ Erro ao criar notificações:', error.message);
      }
    }

    return Response.json({
      success: true,
      should_handoff: shouldHandoff,
      handoff_reason: handoffReason,
      urgency: urgency,
      triggers: {
        handoff_keyword: hasHandoffKeyword,
        sensitive_keyword: hasSensitiveKeyword,
        scheduling_keyword: hasSchedulingKeyword
      }
    });

  } catch (error) {
    console.error('❌ Error detecting handoff triggers:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});