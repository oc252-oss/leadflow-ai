import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Qualifica um lead baseado nas informações coletadas pela IA
 * Calcula score e move para estágio apropriado no CRM
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { lead_id, conversation_id } = await req.json();

    if (!lead_id) {
      return Response.json({ error: 'lead_id is required' }, { status: 400 });
    }

    console.log('🔍 Iniciando qualificação do lead:', lead_id);

    // Buscar lead
    const leads = await base44.asServiceRole.entities.Lead.filter({ id: lead_id });
    if (leads.length === 0) {
      return Response.json({ error: 'Lead not found' }, { status: 404 });
    }

    const lead = leads[0];

    // Buscar conversas e mensagens para analisar
    const conversations = await base44.asServiceRole.entities.Conversation.filter({
      lead_id: lead_id
    }, '-created_date', 1);

    if (conversations.length === 0) {
      return Response.json({ error: 'No conversation found' }, { status: 404 });
    }

    const conversation = conversations[0];

    // Buscar mensagens da conversa
    const messages = await base44.asServiceRole.entities.Message.filter(
      { conversation_id: conversation.id },
      'created_date'
    );

    // Construir contexto da conversa para IA
    const conversationText = messages
      .map(m => `${m.sender_type === 'lead' ? 'Cliente' : 'IA'}: ${m.content}`)
      .join('\n');

    console.log('💬 Analisando', messages.length, 'mensagens');

    // Usar IA para extrair informações de qualificação
    const analysisPrompt = `Analise a conversa abaixo e extraia as informações de qualificação do lead.

CONVERSA:
${conversationText}

Extraia e retorne as seguintes informações em JSON:
1. interest: Qual o interesse/tratamento/serviço principal? (texto livre)
2. interest_level: Grau de interesse (baixo/medio/alto)
3. urgency: Urgência (imediato/breve/futuro)
4. availability: Disponibilidade para agendamento (true/false)
5. objection_type: Objeção principal (preco/tempo/indecisao/outro/nenhum)
6. qualification_score: Score de 0 a 100 baseado em:
   - Nível de interesse (0-30 pontos)
   - Urgência (0-20 pontos)
   - Disponibilidade (0-20 pontos)
   - Presença/severidade de objeções (0-30 pontos)

Seja criterioso. Se o lead demonstrou CLARO interesse e está pronto para avançar, dê score alto (70+).
Se está indeciso ou com objeções fortes, dê score baixo (<40).

Retorne APENAS o JSON, sem texto adicional.`;

    const aiResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: analysisPrompt,
      response_json_schema: {
        type: "object",
        properties: {
          interest: { type: "string" },
          interest_level: { type: "string", enum: ["baixo", "medio", "alto"] },
          urgency: { type: "string", enum: ["imediato", "breve", "futuro"] },
          availability: { type: "boolean" },
          objection_type: { type: "string", enum: ["preco", "tempo", "indecisao", "outro", "nenhum"] },
          qualification_score: { type: "number" }
        }
      }
    });

    console.log('🧠 Análise da IA:', aiResponse);

    const qualificationData = aiResponse;
    const score = qualificationData.qualification_score || 0;

    // Determinar estágio do CRM baseado no score
    let targetStageType = null;
    let nextAction = null;

    if (score >= 70) {
      targetStageType = 'qualified';
      nextAction = 'offer_scheduling';
      console.log('✅ Lead QUALIFICADO - Score:', score);
    } else if (score >= 40) {
      targetStageType = 'ai_handling';
      nextAction = 'continue_nurturing';
      console.log('⚠️ Lead MORNO - Score:', score);
    } else {
      targetStageType = 'lost';
      nextAction = 'close_politely';
      console.log('❌ Lead FRIO - Score:', score);
    }

    // Buscar pipeline do lead
    let pipeline = null;
    if (lead.pipeline_id) {
      const pipelines = await base44.asServiceRole.entities.Pipeline.filter({ id: lead.pipeline_id });
      if (pipelines.length > 0) {
        pipeline = pipelines[0];
      }
    }

    // Se não tiver pipeline, buscar o padrão
    if (!pipeline) {
      const defaultPipelines = await base44.asServiceRole.entities.Pipeline.filter({ is_default: true });
      if (defaultPipelines.length > 0) {
        pipeline = defaultPipelines[0];
      }
    }

    let newStageId = null;
    let newStageName = null;

    if (pipeline) {
      // Buscar estágio alvo
      const targetStages = await base44.asServiceRole.entities.PipelineStage.filter({
        pipeline_id: pipeline.id,
        stage_type: targetStageType
      });

      if (targetStages.length > 0) {
        newStageId = targetStages[0].id;
        newStageName = targetStages[0].name;
      }
    }

    // Atualizar lead com dados de qualificação
    const leadUpdateData = {
      interest: qualificationData.interest,
      interest_level: qualificationData.interest_level,
      urgency: qualificationData.urgency,
      availability: qualificationData.availability,
      objection_type: qualificationData.objection_type,
      qualification_score: score,
      qualification_completed_at: new Date().toISOString()
    };

    if (newStageId) {
      leadUpdateData.pipeline_stage_id = newStageId;
    }

    await base44.asServiceRole.entities.Lead.update(lead_id, leadUpdateData);

    // Registrar mudança de estágio
    if (newStageId) {
      await base44.asServiceRole.entities.ActivityLog.create({
        company_id: lead.company_id || null,
        lead_id: lead_id,
        action: 'stage_changed',
        old_value: lead.pipeline_stage_id ? 'Em Atendimento IA' : 'Novo Lead',
        new_value: newStageName,
        details: {
          qualification_score: score,
          qualified_by: 'AI',
          auto: true
        }
      });
    }

    // Decidir próxima ação
    let responseMessage = null;
    let shouldHandoff = false;

    if (nextAction === 'offer_scheduling') {
      responseMessage = `Ótimo! Vejo que você tem interesse em ${qualificationData.interest}. Posso te ajudar a agendar uma avaliação. Você prefere falar com um de nossos consultores agora ou quer que eu sugira horários disponíveis?`;
      shouldHandoff = false; // Deixa IA oferecer agendamento primeiro
    } else if (nextAction === 'continue_nurturing') {
      responseMessage = `Entendo! Vou te enviar mais informações sobre ${qualificationData.interest}. Tem alguma dúvida específica que posso esclarecer agora?`;
      shouldHandoff = false;
    } else if (nextAction === 'close_politely') {
      responseMessage = `Entendo perfeitamente! Qualquer coisa, estaremos por aqui. Obrigado pelo seu tempo! 😊`;
      shouldHandoff = false;
      
      // Fechar conversa
      await base44.asServiceRole.entities.Conversation.update(conversation.id, {
        status: 'closed',
        ai_active: false,
        closed_at: new Date().toISOString()
      });
    }

    console.log('✅ Qualificação concluída');

    return Response.json({
      success: true,
      lead_id: lead_id,
      qualification_score: score,
      target_stage_type: targetStageType,
      target_stage_name: newStageName,
      next_action: nextAction,
      response_message: responseMessage,
      should_handoff: shouldHandoff,
      qualification_data: qualificationData
    });

  } catch (error) {
    console.error('❌ Error qualifying lead:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});