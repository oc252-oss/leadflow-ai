import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verificar autenticação
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Buscar empresa do usuário
    const teamMembers = await base44.entities.TeamMember.filter({ user_email: user.email });
    if (teamMembers.length === 0) {
      return Response.json({ error: 'Company not found' }, { status: 404 });
    }

    const companyId = teamMembers[0].company_id;

    // Verificar se já existe pipeline padrão
    const existingPipelines = await base44.entities.Pipeline.filter({
      company_id: companyId,
      is_default: true
    });

    if (existingPipelines.length > 0) {
      return Response.json({ 
        message: 'Pipeline já existe',
        pipeline: existingPipelines[0]
      }, { status: 200 });
    }

    // Criar pipeline padrão
    const pipeline = await base44.entities.Pipeline.create({
      company_id: companyId,
      name: 'Funil Clínico – Qualificação & Vendas',
      description: 'Funil padrão para leads de WhatsApp, Instagram, Facebook e Voz',
      is_default: true,
      is_active: true
    });

    console.log('Pipeline criado:', pipeline.id);

    // Criar estágios do funil
    const stages = [
      {
        name: 'Novo Lead',
        order: 1,
        stage_type: 'new',
        color: 'gray',
        is_final: false,
        auto_actions: {
          on_enter: ['set_lead_status:new']
        }
      },
      {
        name: 'Em Atendimento (IA)',
        order: 2,
        stage_type: 'ai_handling',
        color: 'blue',
        is_final: false,
        auto_actions: {
          on_enter: ['set_lead_status:contacted', 'start_ai_flow']
        }
      },
      {
        name: 'Qualificado',
        order: 3,
        stage_type: 'qualified',
        color: 'purple',
        is_final: false,
        auto_actions: {
          on_enter: ['set_lead_status:qualified', 'update_score']
        }
      },
      {
        name: 'Avaliação Agendada',
        order: 4,
        stage_type: 'scheduled',
        color: 'green',
        is_final: false,
        auto_actions: {
          on_enter: ['create_task']
        }
      },
      {
        name: 'Compareceu',
        order: 5,
        stage_type: 'attended',
        color: 'teal',
        is_final: false,
        auto_actions: {
          on_enter: []
        }
      },
      {
        name: 'Venda Realizada',
        order: 6,
        stage_type: 'won',
        color: 'emerald',
        is_final: true,
        auto_actions: {
          on_enter: ['set_lead_status:won']
        }
      },
      {
        name: 'Perdido',
        order: 7,
        stage_type: 'lost',
        color: 'red',
        is_final: true,
        auto_actions: {
          on_enter: ['set_lead_status:lost']
        }
      }
    ];

    const createdStages = [];
    for (const stageData of stages) {
      const stage = await base44.entities.PipelineStage.create({
        pipeline_id: pipeline.id,
        ...stageData
      });
      createdStages.push(stage);
      console.log('Estágio criado:', stage.name);
    }

    return Response.json({
      success: true,
      pipeline: pipeline,
      stages: createdStages
    }, { status: 200 });

  } catch (error) {
    console.error('Erro ao inicializar pipeline:', error);
    return Response.json({ 
      error: error.message,
      details: error.toString()
    }, { status: 500 });
  }
});