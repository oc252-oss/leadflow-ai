import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Phone, Mail, MessageSquare, User, AlertCircle, RefreshCw } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function CRM() {
  const [pipeline, setPipeline] = useState(null);
  const [stages, setStages] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      const teamMembers = await base44.entities.TeamMember.filter({ user_email: user.email });
      
      if (teamMembers.length === 0) {
        toast.error('Empresa não encontrada');
        return;
      }

      const companyId = teamMembers[0].company_id;

      // Buscar pipeline padrão
      const pipelines = await base44.entities.Pipeline.filter({
        company_id: companyId,
        is_default: true
      });

      if (pipelines.length === 0) {
        setPipeline(null);
        setLoading(false);
        return;
      }

      const defaultPipeline = pipelines[0];
      setPipeline(defaultPipeline);

      // Buscar estágios do pipeline
      const stagesData = await base44.entities.PipelineStage.filter(
        { pipeline_id: defaultPipeline.id },
        'order'
      );
      setStages(stagesData);

      // Buscar leads do pipeline
      const leadsData = await base44.entities.Lead.filter({ 
        pipeline_id: defaultPipeline.id 
      });
      setLeads(leadsData);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar pipeline');
    } finally {
      setLoading(false);
    }
  };

  const initializePipeline = async () => {
    setInitializing(true);
    try {
      const result = await base44.functions.invoke('initializePipeline', {});
      toast.success('Pipeline criado com sucesso!');
      await loadData();
    } catch (error) {
      console.error('Erro ao inicializar pipeline:', error);
      toast.error('Erro ao criar pipeline');
    } finally {
      setInitializing(false);
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId) return;

    const lead = leads.find(l => l.id === draggableId);
    const newStage = stages.find(s => s.id === destination.droppableId);
    const oldStage = stages.find(s => s.id === source.droppableId);

    try {
      // Atualizar lead no novo estágio
      await base44.entities.Lead.update(lead.id, { 
        pipeline_stage_id: newStage.id,
        last_interaction_at: new Date().toISOString()
      });

      // Criar histórico
      await base44.entities.ActivityLog.create({
        company_id: lead.company_id || null,
        lead_id: lead.id,
        action: 'stage_changed',
        old_value: oldStage?.name,
        new_value: newStage.name,
        details: {
          pipeline_id: pipeline.id,
          stage_type: newStage.stage_type
        }
      });

      toast.success(`Lead movido para ${newStage.name}`);
      await loadData();
    } catch (error) {
      console.error('Erro ao mover lead:', error);
      toast.error('Erro ao mover lead');
    }
  };

  const getLeadsByStage = (stageId) => {
    return leads.filter(l => l.pipeline_stage_id === stageId);
  };

  const getStageColor = (color) => {
    const colors = {
      gray: 'bg-slate-100 border-slate-300',
      blue: 'bg-blue-50 border-blue-300',
      purple: 'bg-purple-50 border-purple-300',
      green: 'bg-green-50 border-green-300',
      teal: 'bg-teal-50 border-teal-300',
      emerald: 'bg-emerald-50 border-emerald-300',
      red: 'bg-red-50 border-red-300'
    };
    return colors[color] || colors.gray;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!pipeline) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Card className="max-w-md border-0 shadow-lg">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-indigo-100 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Pipeline não configurado</h3>
            <p className="text-slate-600 mb-6">
              Crie o funil de vendas padrão para começar a organizar seus leads
            </p>
            <Button 
              onClick={initializePipeline}
              disabled={initializing}
              className="gap-2 bg-indigo-600 hover:bg-indigo-700"
            >
              {initializing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Criar Pipeline Padrão
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{pipeline.name}</h1>
          <p className="text-slate-600">{pipeline.description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </Button>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages.map((stage) => {
            const stageLeads = getLeadsByStage(stage.id);
            return (
              <Droppable key={stage.id} droppableId={stage.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="flex-shrink-0 w-80"
                  >
                    <Card className={cn(
                      "border-2",
                      getStageColor(stage.color),
                      snapshot.isDraggingOver && 'ring-2 ring-indigo-500'
                    )}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            {stage.name}
                            {stage.is_final && (
                              <Badge variant="outline" className="text-xs">
                                Final
                              </Badge>
                            )}
                          </CardTitle>
                          <Badge variant="secondary" className="font-semibold">
                            {stageLeads.length}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
                        {stageLeads.map((lead, index) => (
                          <Draggable key={lead.id} draggableId={lead.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={cn(
                                  "p-3 bg-white border-2 rounded-lg hover:shadow-md transition-all cursor-grab",
                                  snapshot.isDragging && 'shadow-lg ring-2 ring-indigo-400 cursor-grabbing'
                                )}
                              >
                                <div className="space-y-2">
                                  <div className="flex items-start justify-between">
                                    <h4 className="font-medium text-sm text-slate-900">{lead.name}</h4>
                                    <Badge variant="outline" className="text-xs capitalize">
                                      {lead.source}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-slate-600">
                                    <Phone className="w-3 h-3" />
                                    {lead.phone}
                                  </div>
                                  {lead.score > 0 && (
                                    <div className="flex items-center gap-2">
                                      <Badge className="text-xs bg-amber-100 text-amber-800">
                                        Score: {lead.score}
                                      </Badge>
                                    </div>
                                  )}
                                  {lead.last_interaction_type !== 'nenhum' && (
                                    <Badge variant="secondary" className="text-xs capitalize">
                                      {lead.last_interaction_type?.replace('_', ' ')}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        {stageLeads.length === 0 && (
                          <div className="text-center py-8">
                            <p className="text-sm text-slate-400">
                              Nenhum lead
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </Droppable>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}