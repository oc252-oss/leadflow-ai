import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, X, ChevronDown, ChevronUp, GitBranch } from 'lucide-react';
import { toast } from 'sonner';

export default function AdvancedConditionBuilder({ conditions = [], onChange, availableNodes = [] }) {
  const [expandedIndex, setExpandedIndex] = useState(null);

  const addCondition = () => {
    const newCondition = {
      id: `cond_${Date.now()}`,
      field: 'score',
      operator: 'gte',
      value: '0',
      action: 'next_node',
      actionValue: '',
      andOr: 'and'
    };
    onChange([...conditions, newCondition]);
  };

  const updateCondition = (index, updates) => {
    const updated = [...conditions];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  const removeCondition = (index) => {
    onChange(conditions.filter((_, i) => i !== index));
  };

  const moveCondition = (index, direction) => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === conditions.length - 1)) return;
    
    const updated = [...conditions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];
    onChange(updated);
  };

  const fieldOptions = [
    { value: 'score', label: 'Pontuação', icon: '📊' },
    { value: 'response', label: 'Resposta', icon: '💬' },
    { value: 'urgency', label: 'Urgência', icon: '⚡' },
    { value: 'budget', label: 'Orçamento', icon: '💰' },
    { value: 'interest', label: 'Interesse', icon: '❤️' },
    { value: 'time_elapsed', label: 'Tempo Decorrido', icon: '⏱️' },
    { value: 'custom', label: 'Campo Customizado', icon: '⚙️' }
  ];

  const operatorOptions = [
    { value: 'eq', label: 'Igual (=)' },
    { value: 'neq', label: 'Diferente (≠)' },
    { value: 'gte', label: 'Maior ou igual (≥)' },
    { value: 'lte', label: 'Menor ou igual (≤)' },
    { value: 'gt', label: 'Maior que (>)' },
    { value: 'lt', label: 'Menor que (<)' },
    { value: 'contains', label: 'Contém' },
    { value: 'not_contains', label: 'Não contém' },
    { value: 'starts_with', label: 'Começa com' },
    { value: 'ends_with', label: 'Termina com' }
  ];

  const actionOptions = [
    { value: 'next_node', label: 'Ir para Nó', icon: '→' },
    { value: 'handoff', label: 'Transferir para Agente', icon: '👤' },
    { value: 'mark_hot', label: 'Marcar como Hot', icon: '🔥' },
    { value: 'mark_warm', label: 'Marcar como Warm', icon: '🌡️' },
    { value: 'send_message', label: 'Enviar Mensagem', icon: '💬' },
    { value: 'end_flow', label: 'Encerrar Fluxo', icon: '✓' }
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-orange-600" />
            <CardTitle className="text-base">Lógica Condicional Avançada</CardTitle>
          </div>
          <Button 
            onClick={addCondition}
            size="sm"
            className="bg-orange-600 hover:bg-orange-700"
          >
            <Plus className="w-4 h-4 mr-1" />
            Adicionar Ramificação
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {conditions.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-orange-300 rounded-lg">
            <GitBranch className="w-12 h-12 mx-auto mb-3 opacity-30 text-orange-600" />
            <p className="text-sm text-slate-600 mb-4">Nenhuma ramificação criada</p>
            <Button 
              onClick={addCondition}
              size="sm"
              variant="outline"
              className="border-orange-300"
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Ramificação
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {conditions.map((condition, index) => (
              <div key={condition.id}>
                <Card 
                  className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                >
                  <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-orange-50 to-orange-100">
                    <Badge variant="outline" className="text-xs">
                      {index === 0 ? 'SE' : 'SENÃO SE'}
                    </Badge>
                    
                    <Badge variant="secondary" className="text-xs">
                      {fieldOptions.find(f => f.value === condition.field)?.label}
                    </Badge>
                    
                    <span className="text-xs font-mono text-slate-600">
                      {operatorOptions.find(o => o.value === condition.operator)?.label}
                    </span>
                    
                    <Badge className="text-xs font-mono bg-slate-200 text-slate-800">
                      {condition.value || '...'}
                    </Badge>

                    <span className="text-xs text-slate-500 mx-1">→</span>

                    <Badge className="text-xs bg-orange-200 text-orange-900">
                      {actionOptions.find(a => a.value === condition.action)?.label}
                    </Badge>

                    <div className="flex-1" />

                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveCondition(index, 'up');
                        }}
                        disabled={index === 0}
                      >
                        <ChevronUp className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveCondition(index, 'down');
                        }}
                        disabled={index === conditions.length - 1}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-red-600 hover:text-red-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeCondition(index);
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {expandedIndex === index && (
                    <CardContent className="pt-4 space-y-4">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-2">
                          <label className="text-sm font-semibold">Campo</label>
                          <Select 
                            value={condition.field}
                            onValueChange={(value) => updateCondition(index, { field: value })}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {fieldOptions.map(field => (
                                <SelectItem key={field.value} value={field.value}>
                                  <span className="mr-2">{field.icon}</span>
                                  {field.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-semibold">Operador</label>
                          <Select 
                            value={condition.operator}
                            onValueChange={(value) => updateCondition(index, { operator: value })}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {operatorOptions.map(op => (
                                <SelectItem key={op.value} value={op.value}>
                                  {op.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-semibold">Valor</label>
                          <Input 
                            value={condition.value}
                            onChange={(e) => updateCondition(index, { value: e.target.value })}
                            placeholder="ex: 80, hot, urgente"
                            className="h-9"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold">Ação</label>
                        <Select 
                          value={condition.action}
                          onValueChange={(value) => updateCondition(index, { action: value })}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {actionOptions.map(action => (
                              <SelectItem key={action.value} value={action.value}>
                                <span className="mr-2">{action.icon}</span>
                                {action.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {condition.action === 'next_node' && (
                        <div className="space-y-2">
                          <label className="text-sm font-semibold">Ir para Nó</label>
                          <Select 
                            value={condition.actionValue}
                            onValueChange={(value) => updateCondition(index, { actionValue: value })}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Selecione um nó" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableNodes.map(node => (
                                <SelectItem key={node.id} value={node.id}>
                                  {node.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {condition.action === 'send_message' && (
                        <div className="space-y-2">
                          <label className="text-sm font-semibold">Mensagem</label>
                          <Input 
                            value={condition.actionValue}
                            onChange={(e) => updateCondition(index, { actionValue: e.target.value })}
                            placeholder="Mensagem a enviar"
                            className="h-9"
                          />
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>

                {index < conditions.length - 1 && (
                  <div className="flex justify-center py-1">
                    <Badge variant="outline" className="text-xs">OU</Badge>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}