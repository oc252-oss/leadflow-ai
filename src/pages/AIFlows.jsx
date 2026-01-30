import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit2, Trash2, Loader, X, Calendar } from 'lucide-react';
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AIFlows() {
  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingFlow, setEditingFlow] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    industry: 'estética',
    priority: 0,
    is_default: false,
    is_active: true,
    greeting_message: '',
    outside_hours_message: '',
    handoff_message: '',
    data_collection_fields: [],
    pipeline_routing_rules: [],
    scheduling_enabled: false,
    scheduling_prompt: '',
    available_time_slots: []
  });
  const [isSaving, setIsSaving] = useState(false);
  const [pipelines, setPipelines] = useState([]);

  useEffect(() => {
    loadFlows();
    loadPipelines();
  }, []);

  const loadFlows = async () => {
    try {
      const data = await base44.entities.AIFlow.list('-updated_date', 100);
      setFlows(data);
    } catch (error) {
      console.error('Erro ao carregar fluxos:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPipelines = async () => {
    try {
      const data = await base44.entities.Pipeline.list();
      setPipelines(data);
    } catch (error) {
      console.error('Erro ao carregar pipelines:', error);
    }
  };

  const handleOpenDialog = (flow = null) => {
    if (flow) {
      setEditingFlow(flow);
      setFormData({
        name: flow.name || '',
        description: flow.description || '',
        industry: flow.industry || 'estética',
        priority: flow.priority || 0,
        is_default: flow.is_default || false,
        is_active: flow.is_active !== false,
        greeting_message: flow.greeting_message || '',
        outside_hours_message: flow.outside_hours_message || '',
        handoff_message: flow.handoff_message || '',
        data_collection_fields: flow.data_collection_fields || [],
        pipeline_routing_rules: flow.pipeline_routing_rules || [],
        scheduling_enabled: flow.scheduling_enabled || false,
        scheduling_prompt: flow.scheduling_prompt || '',
        available_time_slots: flow.available_time_slots || []
      });
    } else {
      setEditingFlow(null);
      setFormData({
        name: '',
        description: '',
        industry: 'estética',
        priority: 0,
        is_default: false,
        is_active: true,
        greeting_message: '',
        outside_hours_message: '',
        handoff_message: '',
        data_collection_fields: [],
        pipeline_routing_rules: [],
        scheduling_enabled: false,
        scheduling_prompt: 'Gostaria de agendar uma avaliação? Temos horários disponíveis!',
        available_time_slots: []
      });
    }
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;
    
    setIsSaving(true);
    try {
      if (editingFlow) {
        await base44.entities.AIFlow.update(editingFlow.id, formData);
      } else {
        await base44.entities.AIFlow.create(formData);
      }
      await loadFlows();
      setShowDialog(false);
    } catch (error) {
      console.error('Erro ao salvar fluxo:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Tem certeza que deseja deletar este fluxo?')) {
      try {
        await base44.entities.AIFlow.delete(id);
        await loadFlows();
      } catch (error) {
        console.error('Erro ao deletar fluxo:', error);
      }
    }
  };

  const handleToggleActive = async (flow) => {
    try {
      await base44.entities.AIFlow.update(flow.id, { is_active: !flow.is_active });
      await loadFlows();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Fluxos de IA</h1>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Fluxo
        </Button>
      </div>

      <div className="grid gap-4">
        {flows.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-slate-500">
              Nenhum fluxo criado ainda
            </CardContent>
          </Card>
        ) : (
          flows.map(flow => (
            <Card key={flow.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">{flow.name}</h3>
                    {flow.description && (
                      <p className="text-sm text-slate-600 mt-1">{flow.description}</p>
                    )}
                    <div className="flex gap-2 mt-3">
                      <Badge variant={flow.objective === 'qualificacao' ? 'default' : 'secondary'}>
                        {flow.objective}
                      </Badge>
                      <Badge variant={flow.is_active ? 'default' : 'outline'}>
                        {flow.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleToggleActive(flow)}
                    >
                      {flow.is_active ? 'Desativar' : 'Ativar'}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleOpenDialog(flow)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleDelete(flow.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
         <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
           <DialogHeader>
             <DialogTitle>
               {editingFlow ? 'Editar Fluxo' : 'Novo Fluxo de IA'}
             </DialogTitle>
             <p className="text-sm text-slate-600 mt-1">Configure o comportamento do fluxo de qualificação automática</p>
           </DialogHeader>

           <Tabs defaultValue="geral" className="w-full">
             <TabsList className="grid w-full grid-cols-5">
               <TabsTrigger value="geral">Geral</TabsTrigger>
               <TabsTrigger value="mensagens">Mensagens</TabsTrigger>
               <TabsTrigger value="coleta">Coleta de Dados</TabsTrigger>
               <TabsTrigger value="roteamento">Roteamento CRM</TabsTrigger>
               <TabsTrigger value="agendamento">Agendamento</TabsTrigger>
             </TabsList>

             {/* Geral */}
             <TabsContent value="geral" className="space-y-4 mt-4">
               <div>
                 <label className="text-sm font-medium text-slate-700">Nome *</label>
                 <Input 
                   value={formData.name}
                   onChange={(e) => setFormData({...formData, name: e.target.value})}
                   placeholder="Ex: Fluxo de Qualificação"
                   className="mt-1"
                 />
               </div>
               <div>
                 <label className="text-sm font-medium text-slate-700">Descrição</label>
                 <Textarea 
                   value={formData.description}
                   onChange={(e) => setFormData({...formData, description: e.target.value})}
                   placeholder="Descrição do fluxo"
                   className="mt-1 h-20"
                 />
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="text-sm font-medium text-slate-700">Segmento</label>
                   <select 
                     value={formData.industry}
                     onChange={(e) => setFormData({...formData, industry: e.target.value})}
                     className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md text-sm"
                   >
                     <option value="estética">Estética</option>
                     <option value="dentista">Dentista</option>
                     <option value="franchise">Franquia</option>
                     <option value="imobiliaria">Imobiliária</option>
                     <option value="educacao">Educação</option>
                   </select>
                 </div>
                 <div>
                   <label className="text-sm font-medium text-slate-700">Prioridade</label>
                   <Input 
                     type="number"
                     min="0"
                     value={formData.priority}
                     onChange={(e) => setFormData({...formData, priority: parseInt(e.target.value) || 0})}
                     className="mt-1"
                   />
                 </div>
               </div>
               <div className="flex items-center justify-between p-3 rounded-lg border">
                 <span className="text-sm font-medium text-slate-700">Fluxo Padrão</span>
                 <Switch 
                   checked={formData.is_default}
                   onCheckedChange={(checked) => setFormData({...formData, is_default: checked})}
                 />
               </div>
               <div className="flex items-center justify-between p-3 rounded-lg border">
                 <span className="text-sm font-medium text-slate-700">Ativo</span>
                 <Switch 
                   checked={formData.is_active}
                   onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                 />
               </div>
             </TabsContent>

             {/* Coleta de Dados */}
             <TabsContent value="coleta" className="space-y-4 mt-4">
               <div className="flex items-center justify-between">
                 <div>
                   <h3 className="text-sm font-medium text-slate-900">Campos para Coletar</h3>
                   <p className="text-xs text-slate-500 mt-1">Informações que a IA coletará do lead no início da conversa</p>
                 </div>
                 <Button
                   size="sm"
                   variant="outline"
                   onClick={() => {
                     setFormData({
                       ...formData,
                       data_collection_fields: [
                         ...formData.data_collection_fields,
                         {
                           id: Date.now().toString(),
                           field_name: 'name',
                           prompt: 'Para começar, qual é o seu nome?',
                           required: true,
                           order: formData.data_collection_fields.length
                         }
                       ]
                     });
                   }}
                 >
                   <Plus className="w-4 h-4 mr-1" />
                   Adicionar Campo
                 </Button>
               </div>
               
               <div className="space-y-3">
                 {formData.data_collection_fields.map((field, index) => (
                   <div key={field.id} className="border rounded-lg p-4 space-y-3">
                     <div className="flex items-center justify-between">
                       <span className="text-xs font-medium text-slate-500">Campo {index + 1}</span>
                       <Button
                         size="sm"
                         variant="ghost"
                         onClick={() => {
                           setFormData({
                             ...formData,
                             data_collection_fields: formData.data_collection_fields.filter(f => f.id !== field.id)
                           });
                         }}
                       >
                         <X className="w-4 h-4" />
                       </Button>
                     </div>
                     
                     <div className="grid grid-cols-2 gap-3">
                       <div>
                         <Label className="text-xs">Campo do Lead</Label>
                         <Select
                           value={field.field_name}
                           onValueChange={(value) => {
                             const updated = [...formData.data_collection_fields];
                             updated[index].field_name = value;
                             setFormData({...formData, data_collection_fields: updated});
                           }}
                         >
                           <SelectTrigger className="h-9 text-sm">
                             <SelectValue />
                           </SelectTrigger>
                           <SelectContent>
                             <SelectItem value="name">Nome</SelectItem>
                             <SelectItem value="email">Email</SelectItem>
                             <SelectItem value="phone">Telefone</SelectItem>
                             <SelectItem value="interest">Interesse</SelectItem>
                             <SelectItem value="budget_range">Orçamento</SelectItem>
                             <SelectItem value="urgency">Urgência</SelectItem>
                           </SelectContent>
                         </Select>
                       </div>
                       
                       <div className="flex items-center gap-2 pt-6">
                         <input
                           type="checkbox"
                           checked={field.required}
                           onChange={(e) => {
                             const updated = [...formData.data_collection_fields];
                             updated[index].required = e.target.checked;
                             setFormData({...formData, data_collection_fields: updated});
                           }}
                           className="rounded"
                         />
                         <Label className="text-xs">Obrigatório</Label>
                       </div>
                     </div>
                     
                     <div>
                       <Label className="text-xs">Pergunta da IA</Label>
                       <Input
                         value={field.prompt}
                         onChange={(e) => {
                           const updated = [...formData.data_collection_fields];
                           updated[index].prompt = e.target.value;
                           setFormData({...formData, data_collection_fields: updated});
                         }}
                         placeholder="Ex: Como posso te chamar?"
                         className="h-9 text-sm"
                       />
                     </div>
                   </div>
                 ))}
                 
                 {formData.data_collection_fields.length === 0 && (
                   <div className="text-center py-8 text-slate-500 text-sm border border-dashed rounded-lg">
                     Nenhum campo configurado. Clique em "Adicionar Campo" para começar.
                   </div>
                 )}
               </div>
             </TabsContent>

             {/* Mensagens */}
             <TabsContent value="mensagens" className="space-y-4 mt-4">
               <div>
                 <label className="text-sm font-medium text-slate-700">Mensagem de Saudação</label>
                 <Textarea 
                   value={formData.greeting_message}
                   onChange={(e) => setFormData({...formData, greeting_message: e.target.value})}
                   placeholder="Ex: Olá! Como posso ajudá-lo?"
                   className="mt-1 h-20"
                 />
               </div>
               <div>
                 <label className="text-sm font-medium text-slate-700">Mensagem Fora do Horário</label>
                 <Textarea 
                   value={formData.outside_hours_message}
                   onChange={(e) => setFormData({...formData, outside_hours_message: e.target.value})}
                   placeholder="Ex: Estamos fora do horário..."
                   className="mt-1 h-20"
                 />
               </div>
               <div>
                 <label className="text-sm font-medium text-slate-700">Mensagem de Transferência</label>
                 <Textarea 
                   value={formData.handoff_message}
                   onChange={(e) => setFormData({...formData, handoff_message: e.target.value})}
                   placeholder="Ex: Vou conectar você com um especialista..."
                   className="mt-1 h-20"
                 />
               </div>
             </TabsContent>

             {/* Roteamento CRM */}
             <TabsContent value="roteamento" className="space-y-4 mt-4">
               <div className="flex items-center justify-between">
                 <div>
                   <h3 className="text-sm font-medium text-slate-900">Regras de Roteamento</h3>
                   <p className="text-xs text-slate-500 mt-1">Direcione leads para pipelines específicos baseado em condições</p>
                 </div>
                 <Button
                   size="sm"
                   variant="outline"
                   onClick={() => {
                     setFormData({
                       ...formData,
                       pipeline_routing_rules: [
                         ...formData.pipeline_routing_rules,
                         {
                           condition_field: 'interest',
                           condition_operator: 'equals',
                           condition_value: '',
                           target_pipeline_id: '',
                           target_stage_type: 'qualified'
                         }
                       ]
                     });
                   }}
                 >
                   <Plus className="w-4 h-4 mr-1" />
                   Adicionar Regra
                 </Button>
               </div>
               
               <div className="space-y-3">
                 {formData.pipeline_routing_rules.map((rule, index) => (
                   <div key={index} className="border rounded-lg p-4 space-y-3">
                     <div className="flex items-center justify-between">
                       <span className="text-xs font-medium text-slate-500">Regra {index + 1}</span>
                       <Button
                         size="sm"
                         variant="ghost"
                         onClick={() => {
                           setFormData({
                             ...formData,
                             pipeline_routing_rules: formData.pipeline_routing_rules.filter((_, i) => i !== index)
                           });
                         }}
                       >
                         <X className="w-4 h-4" />
                       </Button>
                     </div>
                     
                     <div className="grid grid-cols-3 gap-3">
                       <div>
                         <Label className="text-xs">Campo</Label>
                         <Select
                           value={rule.condition_field}
                           onValueChange={(value) => {
                             const updated = [...formData.pipeline_routing_rules];
                             updated[index].condition_field = value;
                             setFormData({...formData, pipeline_routing_rules: updated});
                           }}
                         >
                           <SelectTrigger className="h-9 text-sm">
                             <SelectValue />
                           </SelectTrigger>
                           <SelectContent>
                             <SelectItem value="interest">Interesse</SelectItem>
                             <SelectItem value="score">Score</SelectItem>
                             <SelectItem value="source">Origem</SelectItem>
                             <SelectItem value="budget_range">Orçamento</SelectItem>
                           </SelectContent>
                         </Select>
                       </div>
                       
                       <div>
                         <Label className="text-xs">Operador</Label>
                         <Select
                           value={rule.condition_operator}
                           onValueChange={(value) => {
                             const updated = [...formData.pipeline_routing_rules];
                             updated[index].condition_operator = value;
                             setFormData({...formData, pipeline_routing_rules: updated});
                           }}
                         >
                           <SelectTrigger className="h-9 text-sm">
                             <SelectValue />
                           </SelectTrigger>
                           <SelectContent>
                             <SelectItem value="equals">É igual a</SelectItem>
                             <SelectItem value="contains">Contém</SelectItem>
                             <SelectItem value="greater_than">Maior que</SelectItem>
                             <SelectItem value="less_than">Menor que</SelectItem>
                           </SelectContent>
                         </Select>
                       </div>
                       
                       <div>
                         <Label className="text-xs">Valor</Label>
                         <Input
                           value={rule.condition_value}
                           onChange={(e) => {
                             const updated = [...formData.pipeline_routing_rules];
                             updated[index].condition_value = e.target.value;
                             setFormData({...formData, pipeline_routing_rules: updated});
                           }}
                           placeholder="Ex: Botox"
                           className="h-9 text-sm"
                         />
                       </div>
                     </div>
                     
                     <div className="grid grid-cols-2 gap-3">
                       <div>
                         <Label className="text-xs">Pipeline Destino</Label>
                         <Select
                           value={rule.target_pipeline_id}
                           onValueChange={(value) => {
                             const updated = [...formData.pipeline_routing_rules];
                             updated[index].target_pipeline_id = value;
                             setFormData({...formData, pipeline_routing_rules: updated});
                           }}
                         >
                           <SelectTrigger className="h-9 text-sm">
                             <SelectValue placeholder="Selecione..." />
                           </SelectTrigger>
                           <SelectContent>
                             {pipelines.map(p => (
                               <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                             ))}
                           </SelectContent>
                         </Select>
                       </div>
                       
                       <div>
                         <Label className="text-xs">Estágio</Label>
                         <Select
                           value={rule.target_stage_type}
                           onValueChange={(value) => {
                             const updated = [...formData.pipeline_routing_rules];
                             updated[index].target_stage_type = value;
                             setFormData({...formData, pipeline_routing_rules: updated});
                           }}
                         >
                           <SelectTrigger className="h-9 text-sm">
                             <SelectValue />
                           </SelectTrigger>
                           <SelectContent>
                             <SelectItem value="new">Novo</SelectItem>
                             <SelectItem value="ai_handling">Em Atendimento IA</SelectItem>
                             <SelectItem value="qualified">Qualificado</SelectItem>
                             <SelectItem value="scheduled">Agendado</SelectItem>
                           </SelectContent>
                         </Select>
                       </div>
                     </div>
                   </div>
                 ))}
                 
                 {formData.pipeline_routing_rules.length === 0 && (
                   <div className="text-center py-8 text-slate-500 text-sm border border-dashed rounded-lg">
                     Nenhuma regra configurada. Leads seguirão o pipeline padrão.
                   </div>
                 )}
               </div>
             </TabsContent>

             {/* Agendamento */}
             <TabsContent value="agendamento" className="space-y-4 mt-4">
               <div className="flex items-center justify-between p-3 rounded-lg border">
                 <div>
                   <span className="text-sm font-medium text-slate-700">Habilitar Agendamento</span>
                   <p className="text-xs text-slate-500 mt-1">Oferecer horários disponíveis no chat</p>
                 </div>
                 <Switch 
                   checked={formData.scheduling_enabled}
                   onCheckedChange={(checked) => setFormData({...formData, scheduling_enabled: checked})}
                 />
               </div>
               
               {formData.scheduling_enabled && (
                 <>
                   <div>
                     <Label className="text-sm">Prompt de Agendamento</Label>
                     <Textarea 
                       value={formData.scheduling_prompt}
                       onChange={(e) => setFormData({...formData, scheduling_prompt: e.target.value})}
                       placeholder="Ex: Gostaria de agendar uma avaliação? Temos horários disponíveis!"
                       className="mt-1 h-20"
                     />
                     <p className="text-xs text-slate-500 mt-1">Mensagem que a IA usará para oferecer agendamento</p>
                   </div>
                   
                   <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                     <div className="flex items-start gap-2">
                       <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
                       <div className="text-sm text-blue-900">
                         <p className="font-medium">Integração com Calendário</p>
                         <p className="text-xs text-blue-700 mt-1">
                           A IA verificará automaticamente horários disponíveis e oferecerá opções ao lead.
                           Configure horários de atendimento nas Configurações da Empresa.
                         </p>
                       </div>
                     </div>
                   </div>
                 </>
               )}
             </TabsContent>
           </Tabs>

           <div className="flex gap-2 justify-end pt-4 border-t">
             <Button variant="outline" onClick={() => setShowDialog(false)}>
               Cancelar
             </Button>
             <Button 
               onClick={handleSave}
               disabled={!formData.name.trim() || isSaving}
               className="gap-2 bg-indigo-600 hover:bg-indigo-700"
             >
               {isSaving && <Loader className="w-4 h-4 animate-spin" />}
               {editingFlow ? 'Atualizar' : 'Criar'}
             </Button>
           </div>
         </DialogContent>
       </Dialog>
    </div>
  );
}