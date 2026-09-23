import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Garante que um lead está em um pipeline CRM
 * Se não estiver, adiciona ao pipeline padrão no estágio "Novo Lead"
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { lead_id } = await req.json();

    if (!lead_id) {
      return Response.json({ error: 'lead_id is required' }, { status: 400 });
    }

    // Buscar lead
    const leads = await base44.asServiceRole.entities.Lead.filter({ id: lead_id });
    if (leads.length === 0) {
      return Response.json({ error: 'Lead not found' }, { status: 404 });
    }

    const lead = leads[0];

    // Verificar se já está em um pipeline
    if (lead.pipeline_id && lead.pipeline_stage_id) {
      console.log(`Lead ${lead_id} já está no pipeline ${lead.pipeline_id}`);
      return Response.json({ 
        success: true, 
        already_in_pipeline: true,
        pipeline_id: lead.pipeline_id,
        pipeline_stage_id: lead.pipeline_stage_id
      });
    }

    // Buscar pipeline padrão
    const pipelines = await base44.asServiceRole.entities.Pipeline.filter({
      is_default: true
    });

    if (pipelines.length === 0) {
      console.log('Nenhum pipeline padrão encontrado');
      return Response.json({ 
        success: false, 
        error: 'No default pipeline found' 
      }, { status: 400 });
    }

    const defaultPipeline = pipelines[0];

    // Buscar primeiro estágio (type=new)
    const stages = await base44.asServiceRole.entities.PipelineStage.filter(
      { pipeline_id: defaultPipeline.id, stage_type: 'new' },
      'order',
      1
    );

    if (stages.length === 0) {
      console.log('Nenhum estágio "new" encontrado no pipeline');
      return Response.json({ 
        success: false, 
        error: 'No "new" stage found in default pipeline' 
      }, { status: 400 });
    }

    const firstStage = stages[0];

    // Atualizar lead
    await base44.asServiceRole.entities.Lead.update(lead_id, {
      pipeline_id: defaultPipeline.id,
      pipeline_stage_id: firstStage.id
    });

    // Criar histórico
    await base44.asServiceRole.entities.ActivityLog.create({
      company_id: lead.company_id || null,
      lead_id: lead_id,
      action: 'stage_changed',
      old_value: null,
      new_value: firstStage.name,
      details: {
        pipeline_name: defaultPipeline.name,
        auto_assigned: true,
        reason: 'first_conversation'
      }
    });

    console.log(`✅ Lead ${lead_id} adicionado ao pipeline ${defaultPipeline.name} - Estágio: ${firstStage.name}`);

    return Response.json({ 
      success: true,
      pipeline_id: defaultPipeline.id,
      pipeline_stage_id: firstStage.id,
      stage_name: firstStage.name
    });

  } catch (error) {
    console.error('❌ Error ensuring lead in pipeline:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});