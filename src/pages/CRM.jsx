import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Phone, Mail, MessageSquare, User } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function CRM() {
  const [stages, setStages] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [stagesData, leadsData] = await Promise.all([
        base44.entities.CRMStage.filter({ is_active: true }, 'order'),
        base44.entities.Lead.filter({ status: 'ativo' })
      ]);
      setStages(stagesData);
      setLeads(leadsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId) return;

    const lead = leads.find(l => l.id === draggableId);
    const newStage = stages.find(s => s.id === destination.droppableId);

    try {
      await base44.entities.Lead.update(lead.id, { crm_stage_id: newStage.id });
      await base44.entities.CRMHistory.create({
        lead_id: lead.id,
        from_stage: stages.find(s => s.id === source.droppableId)?.name || 'N/A',
        to_stage: newStage.name,
        changed_by: 'humano',
        changed_at: new Date().toISOString()
      });
      loadData();
    } catch (error) {
      console.error('Erro ao mover lead:', error);
    }
  };

  const getLeadsByStage = (stageId) => {
    return leads.filter(l => l.crm_stage_id === stageId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">CRM - Pipeline</h1>
          <p className="text-slate-600">Arraste os cards para mover leads entre estágios</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Lead
        </Button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages.map((stage) => (
            <Droppable key={stage.id} droppableId={stage.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="flex-shrink-0 w-80"
                >
                  <Card className={snapshot.isDraggingOver ? 'ring-2 ring-indigo-500' : ''}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-semibold">{stage.name}</CardTitle>
                        <Badge variant="secondary">{getLeadsByStage(stage.id).length}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
                      {getLeadsByStage(stage.id).map((lead, index) => (
                        <Draggable key={lead.id} draggableId={lead.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`p-3 bg-white border rounded-lg hover:shadow-md transition-shadow ${
                                snapshot.isDragging ? 'shadow-lg ring-2 ring-indigo-400' : ''
                              }`}
                            >
                              <div className="space-y-2">
                                <div className="flex items-start justify-between">
                                  <h4 className="font-medium text-sm text-slate-900">{lead.name}</h4>
                                  <Badge variant="outline" className="text-xs">
                                    {lead.source}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-600">
                                  <Phone className="w-3 h-3" />
                                  {lead.phone}
                                </div>
                                {lead.assigned_agent_name && (
                                  <div className="flex items-center gap-2 text-xs text-slate-600">
                                    <User className="w-3 h-3" />
                                    {lead.assigned_agent_name}
                                  </div>
                                )}
                                {lead.last_interaction_type !== 'nenhum' && (
                                  <Badge variant="secondary" className="text-xs">
                                    {lead.last_interaction_type}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {getLeadsByStage(stage.id).length === 0 && (
                        <p className="text-center text-sm text-slate-400 py-8">
                          Nenhum lead neste estágio
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}