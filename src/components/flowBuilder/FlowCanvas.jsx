import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, GitBranch, Zap, CheckCircle, Plus, ArrowRight } from 'lucide-react';
import { cn } from "@/lib/utils";
import { toast } from 'sonner';

const nodeIcons = {
  greeting: MessageCircle,
  question: MessageCircle,
  condition: GitBranch,
  action: Zap,
  end: CheckCircle
};

const nodeColors = {
  greeting: 'border-blue-300 bg-blue-50',
  question: 'border-purple-300 bg-purple-50',
  condition: 'border-orange-300 bg-orange-50',
  action: 'border-green-300 bg-green-50',
  end: 'border-gray-300 bg-gray-50'
};

const typeLabels = {
  greeting: 'Saudação',
  question: 'Pergunta',
  condition: 'Condição',
  action: 'Ação',
  end: 'Fim'
};

export default function FlowCanvas({ nodes, onReorder, onEdit, onDelete, onAddNode }) {
  const handleDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;
    if (source.index === destination.index) return;

    const reorderedNodes = Array.from(nodes);
    const [removed] = reorderedNodes.splice(source.index, 1);
    reorderedNodes.splice(destination.index, 0, removed);
    
    onReorder(reorderedNodes);
    toast.success('Nó reordenado');
  };

  if (nodes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Canvas do Fluxo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <MessageCircle className="w-12 h-12 mb-4 opacity-20" />
            <p className="mb-4">Nenhum nó no fluxo</p>
            <Button size="sm" onClick={onAddNode}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Nó
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Canvas Visual (Drag & Drop)</CardTitle>
      </CardHeader>
      <CardContent>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="flow-canvas" direction="vertical">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={cn(
                  "space-y-3 p-4 rounded-lg transition-colors",
                  snapshot.isDraggingOver && "bg-indigo-50 border-2 border-indigo-300"
                )}
              >
                {nodes.map((node, index) => {
                  const Icon = nodeIcons[node.type] || MessageCircle;

                  return (
                    <div key={node.id}>
                      <Draggable draggableId={node.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={cn(
                              "transition-all",
                              snapshot.isDragging && "scale-105 shadow-lg"
                            )}
                          >
                            <Card className={cn(
                              "p-4 border-2 cursor-grab hover:shadow-md transition-shadow",
                              nodeColors[node.type]
                            )}>
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3 flex-1">
                                  <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-semibold text-slate-700 uppercase">
                                      {typeLabels[node.type]}
                                    </p>
                                    <p className="text-sm font-medium text-slate-900 mt-1">
                                      {node.label || 'Sem título'}
                                    </p>
                                    {node.question && (
                                      <p className="text-xs text-slate-600 mt-2 line-clamp-2">
                                        {node.question}
                                      </p>
                                    )}
                                    {node.next_step && (
                                      <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                                        <ArrowRight className="w-3 h-3" />
                                        Próximo: {nodes.find(n => n.id === node.next_step)?.label || 'desconectado'}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="flex gap-2 ml-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onEdit(node)}
                                    className="text-slate-600 hover:text-slate-900"
                                  >
                                    Editar
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onDelete(node.id)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    Remover
                                  </Button>
                                </div>
                              </div>
                            </Card>
                          </div>
                        )}
                      </Draggable>

                      {index < nodes.length - 1 && (
                        <div className="flex justify-center py-2">
                          <div className="flex flex-col items-center gap-1">
                            <ArrowRight className="w-4 h-4 text-slate-400 rotate-90" />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </CardContent>
    </Card>
  );
}