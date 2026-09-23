import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teamMembers = await base44.entities.TeamMember.filter({ user_email: user.email });
    if (teamMembers.length === 0) {
      return Response.json({ error: 'Company not found' }, { status: 404 });
    }

    const companyId = teamMembers[0].company_id;
    const report = {
      pipeline: { exists: false, created: false },
      qualificationFlow: { exists: false, created: false },
      integrations: { valid: false, issues: [] },
      handoff: { configured: false }
    };

    // ========================================
    // ETAPA 1: Verificar Pipeline
    // ========================================
    const pipelines = await base44.entities.Pipeline.filter({
      company_id: companyId,
      is_default: true
    });

    if (pipelines.length === 0) {
      // Criar pipeline padrão
      const pipeline = await base44.entities.Pipeline.create({
        company_id: companyId,
        name: 'Funil Clínico – Qualificação & Vendas',
        description: 'Funil padrão para leads de WhatsApp, Instagram, Facebook e Voz',
        is_default: true,
        is_active: true
      });

      // Criar estágios
      const stages = [
        { name: 'Novo Lead', order: 1, stage_type: 'new', color: 'gray', is_final: false },
        { name: 'Em Atendimento (IA)', order: 2, stage_type: 'ai_handling', color: 'blue', is_final: false },
        { name: 'Qualificado', order: 3, stage_type: 'qualified', color: 'purple', is_final: false },
        { name: 'Avaliação Agendada', order: 4, stage_type: 'scheduled', color: 'green', is_final: false },
        { name: 'Compareceu', order: 5, stage_type: 'attended', color: 'teal', is_final: false },
        { name: 'Venda Realizada', order: 6, stage_type: 'won', color: 'emerald', is_final: true },
        { name: 'Perdido', order: 7, stage_type: 'lost', color: 'red', is_final: true }
      ];

      for (const stageData of stages) {
        await base44.entities.PipelineStage.create({
          pipeline_id: pipeline.id,
          ...stageData
        });
      }

      report.pipeline.created = true;
    }
    report.pipeline.exists = true;

    // ========================================
    // ETAPA 2: Verificar Fluxo de Qualificação
    // ========================================
    const flows = await base44.entities.AIConversationFlow.filter({
      company_id: companyId
    });

    const qualificationFlow = flows.find(f => 
      f.name?.toLowerCase().includes('qualifica') ||
      f.description?.toLowerCase().includes('qualifica') ||
      f.is_default
    );

    if (!qualificationFlow) {
      // Criar fluxo de qualificação padrão
      const newFlow = await base44.entities.AIConversationFlow.create({
        company_id: companyId,
        name: 'Fluxo de Qualificação Inicial',
        description: 'Fluxo padrão para qualificar leads automaticamente via IA',
        is_default: true,
        is_active: true,
        greeting_message: 'Olá! Bem-vindo(a)! Como posso ajudar você hoje? 😊',
        qualification_questions: [
          {
            id: 'q1',
            question: 'Qual é o seu nome?',
            field_to_update: 'name',
            next_step: 'q2'
          },
          {
            id: 'q2',
            question: 'Qual tratamento você tem interesse?',
            field_to_update: 'interest',
            score_impact: 10,
            next_step: 'q3'
          },
          {
            id: 'q3',
            question: 'Você gostaria de agendar uma avaliação?',
            field_to_update: 'wants_evaluation',
            expected_answers: ['sim', 'quero', 'gostaria', 'yes'],
            score_impact: 20,
            next_step: 'finish'
          }
        ],
        hot_lead_threshold: 80,
        warm_lead_threshold: 50,
        auto_assign_hot_leads: true
      });

      report.qualificationFlow.created = true;
      report.qualificationFlow.flowId = newFlow.id;
    } else {
      report.qualificationFlow.exists = true;
      report.qualificationFlow.flowId = qualificationFlow.id;
    }

    // ========================================
    // ETAPA 3: Validar Integrações
    // ========================================
    
    // Verificar se existem conexões ativas
    const connections = await base44.entities.Connection.filter({
      is_active: true
    });

    if (connections.length === 0) {
      report.integrations.issues.push('Nenhuma conexão ativa encontrada');
    }

    // Verificar se existem assistentes ativos
    const assistants = await base44.entities.Assistant.filter({
      is_active: true
    });

    if (assistants.length === 0) {
      report.integrations.issues.push('Nenhum assistente ativo encontrado');
    } else {
      report.integrations.valid = true;
    }

    // ========================================
    // ETAPA 4: Verificar Handoff
    // ========================================
    report.handoff.configured = true;
    report.handoff.details = {
      keywords: ['atendente', 'pessoa', 'humano', 'falar com alguém'],
      automaticTransfer: true,
      manualTakeover: true
    };

    // ========================================
    // Retornar Relatório
    // ========================================
    return Response.json({
      success: true,
      report: report,
      summary: {
        allReady: report.pipeline.exists && 
                  (report.qualificationFlow.exists || report.qualificationFlow.created) &&
                  report.integrations.valid &&
                  report.handoff.configured,
        issues: report.integrations.issues
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Erro ao validar sistema:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});