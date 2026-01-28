import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, X, ChevronDown, ChevronUp } from 'lucide-react';

export default function ConditionalLogicBuilder({ conditions = [], onChange }) {
  const [expandedIndex, setExpandedIndex] = useState(null);

  const addCondition = () => {
    const newCondition = {
      id: `cond_${Date.now()}`,
      field: 'score',
      operator: 'gte',
      value: '0',
      action: 'next_question',
      actionValue: ''
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
    { value: 'score', label: 'Pontuação do Lead' },
    { value: 'response', label: 'Resposta da Pergunta' },
    { value: 'urgency_level', label: 'Nível de Urgência' },
    { value: 'budget_range', label: 'Faixa de Orçamento' },
    { value: 'interest_type', label: 'Tipo de Interesse' },
    { value: 'custom_field', label: 'Campo Customizado' }
  ];

  const operatorOptions = [
    { value: 'eq', label: 'Igual a (=)' },
    { value: 'neq', label: 'Diferente de (≠)' },
    { value: 'gte', label: 'Maior ou igual a (≥)' },
    { value: 'lte', label: 'Menor ou igual a (≤)' },
    { value: 'gt', label: 'Maior que (>)' },
    { value: 'lt', label: 'Menor que (<)' },
    { value: 'contains', label: 'Contém' },
    { value: 'not_contains', label: 'Não contém' }
  ];

  const actionOptions = [
    { value: 'next_question', label: 'Próxima Pergunta' },
    { value: 'handoff', label: 'Transferir para Agente' },
    { value: 'mark_hot', label: 'Marcar como Hot Lead' },
    { value: 'mark_warm', label: 'Marcar como Warm Lead' },
    { value: 'send_message', label: 'Enviar Mensagem' },
    { value: 'assign_agent', label: 'Atribuir a Agente' },
    { value: 'trigger_flow', label: 'Ativar Outro Fluxo' }
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm">Lógica Condicional</h3>
        <Button 
          onClick={addCondition}
          size="sm"
          variant="outline"
          className="gap-1"
        >
          <Plus className="w-4 h-4" />
          Adicionar Condição
        </Button>
      </div>

      {conditions.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          <p className="text-sm text-slate-500">Nenhuma condição criada</p>
          <Button 
            onClick={addCondition}
            size="sm"
            variant="ghost"
            className="mt-2"
          >
            <Plus className="w-4 h-4 mr-2" />
            Criar Primeira Condição
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {conditions.map((condition, index) => (
            <Card key={condition.id} className="overflow-hidden">
              <div 
                className="flex items-center gap-2 p-3 bg-slate-50 cursor-pointer hover:bg-slate-100"
                onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {fieldOptions.find(f => f.value === condition.field)?.label}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {operatorOptions.find(o => o.value === condition.operator)?.label}
                    </Badge>
                    <span className="text-sm font-mono text-slate-600">{condition.value}</span>
                    <span className="text-xs text-slate-500">→</span>
                    <Badge className="text-xs bg-blue-100 text-blue-800">
                      {actionOptions.find(a => a.value === condition.action)?.label}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
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
                    className="h-8 w-8"
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
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeCondition(index);
                    }}
                  >
                    <X className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>

              {expandedIndex === index && (
                <CardContent className="pt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Campo</label>
                      <Select 
                        value={condition.field}
                        onValueChange={(value) => updateCondition(index, { field: value })}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {fieldOptions.map(field => (
                            <SelectItem key={field.value} value={field.value}>
                              {field.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Operador</label>
                      <Select 
                        value={condition.operator}
                        onValueChange={(value) => updateCondition(index, { operator: value })}
                      >
                        <SelectTrigger className="h-8">
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
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Valor</label>
                    <Input 
                      value={condition.value}
                      onChange={(e) => updateCondition(index, { value: e.target.value })}
                      placeholder="Digite o valor"
                      className="h-8"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Ação</label>
                    <Select 
                      value={condition.action}
                      onValueChange={(value) => updateCondition(index, { action: value })}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {actionOptions.map(action => (
                          <SelectItem key={action.value} value={action.value}>
                            {action.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {['next_question', 'assign_agent', 'trigger_flow'].includes(condition.action) && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        {condition.action === 'next_question' && 'Pergunta Seguinte'}
                        {condition.action === 'assign_agent' && 'Agente'}
                        {condition.action === 'trigger_flow' && 'Fluxo'}
                      </label>
                      <Input 
                        value={condition.actionValue}
                        onChange={(e) => updateCondition(index, { actionValue: e.target.value })}
                        placeholder="ID ou identificador"
                        className="h-8"
                      />
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}