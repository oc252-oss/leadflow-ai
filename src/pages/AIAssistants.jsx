import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit2, Trash2, Loader, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AIAssistants() {
  const [assistants, setAssistants] = useState([]);
  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingAssistant, setEditingAssistant] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    channel: 'whatsapp',
    assistant_type: 'qualificacao',
    tone: 'elegante',
    default_flow_id: '',
    greeting_message: '',
    system_prompt: '',
    behavior_rules: {
      elegant_tone: true,
      prioritize_evaluation: true,
      no_pricing: false,
      feminine_language: false,
      respect_hours: true
    },
    can_use_voice: false,
    is_active: true
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      const [assistantsData, flowsData] = await Promise.all([
        base44.entities.Assistant.list('-updated_date', 100),
        base44.entities.AIConversationFlow.list('-updated_date', 100)
      ]);
      setAssistants(assistantsData);
      setFlows(flowsData.sort((a, b) => {
        if (a.is_default) return -1;
        if (b.is_default) return 1;
        return new Date(b.updated_date) - new Date(a.updated_date);
      }));
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar fluxos de IA');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (assistant = null) => {
    if (assistant) {
      setEditingAssistant(assistant);
      setFormData({
        name: assistant.name,
        description: assistant.description || '',
        channel: assistant.channel,
        assistant_type: assistant.assistant_type || 'qualificacao',
        tone: assistant.tone,
        default_flow_id: assistant.default_flow_id || '',
        greeting_message: assistant.greeting_message || '',
        system_prompt: assistant.system_prompt || '',
        behavior_rules: assistant.behavior_rules || {
          elegant_tone: true,
          prioritize_evaluation: true,
          no_pricing: false,
          feminine_language: false,
          respect_hours: true
        },
        can_use_voice: assistant.can_use_voice || false,
        is_active: assistant.is_active !== false
      });
    } else {
      setEditingAssistant(null);
      setFormData({
        name: '',
        description: '',
        channel: 'whatsapp',
        assistant_type: 'qualificacao',
        tone: 'elegante',
        default_flow_id: '',
        greeting_message: '',
        system_prompt: '',
        behavior_rules: {
          elegant_tone: true,
          prioritize_evaluation: true,
          no_pricing: false,
          feminine_language: false,
          respect_hours: true
        },
        can_use_voice: false,
        is_active: true
      });
    }
    setShowDialog(true);
  };

  const isFormValid = formData.name.trim() && formData.channel;

  const handleSave = async () => {
    if (!isFormValid) {
      toast.error('Preencha os campos obrigatórios: Nome e Canal');
      return;
    }
    
    setIsSaving(true);
    try {
      const user = await base44.auth.me();
      const payload = {
        ...formData,
        organization_id: user.organization_id || 'default',
        brand_id: user.brand_id || 'default'
      };

      if (editingAssistant) {
        await base44.entities.Assistant.update(editingAssistant.id, payload);
        toast.success('Assistente atualizado com sucesso');
      } else {
        await base44.entities.Assistant.create(payload);
        toast.success('Assistente criado com sucesso');
      }
      await loadData();
      setShowDialog(false);
    } catch (error) {
      console.error('Erro ao salvar assistente:', error);
      toast.error('Erro ao salvar assistente: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Tem certeza que deseja deletar este assistente?')) {
      try {
        await base44.entities.Assistant.delete(id);
        toast.success('Assistente deletado com sucesso');
        await loadData();
      } catch (error) {
        console.error('Erro ao deletar assistente:', error);
        toast.error('Erro ao deletar assistente');
      }
    }
  };

  const handleToggleActive = async (assistant) => {
    try {
      await base44.entities.Assistant.update(assistant.id, { is_active: !assistant.is_active });
      toast.success('Status atualizado');
      await loadData();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const getFlowName = (flowId) => {
    const flow = flows.find(f => f.id === flowId);
    return flow?.name || 'Sem fluxo';
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
        <h1 className="text-2xl font-bold text-slate-900">Assistentes de IA</h1>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Assistente
        </Button>
      </div>

      <div className="grid gap-4">
        {assistants.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-slate-500">
              Nenhum assistente criado ainda
            </CardContent>
          </Card>
        ) : (
          assistants.map(assistant => (
            <Card key={assistant.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">{assistant.name}</h3>
                    {assistant.description && (
                      <p className="text-sm text-slate-500 mt-1">{assistant.description}</p>
                    )}
                    <p className="text-sm text-slate-600 mt-1">Fluxo: <span className="font-medium">{getFlowName(assistant.default_flow_id)}</span></p>
                    {assistant.greeting_message && (
                      <p className="text-sm text-slate-600 mt-1 italic">"{assistant.greeting_message}"</p>
                    )}
                    <div className="flex gap-2 mt-3 flex-wrap">
                      <Badge variant="secondary" className="capitalize">
                        {assistant.channel}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {assistant.assistant_type}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {assistant.tone}
                      </Badge>
                      {assistant.can_use_voice && (
                        <Badge className="bg-purple-100 text-purple-800">Voz</Badge>
                      )}
                      <Badge variant={assistant.is_active ? 'default' : 'outline'}>
                        {assistant.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleToggleActive(assistant)}
                    >
                      {assistant.is_active ? 'Desativar' : 'Ativar'}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleOpenDialog(assistant)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleDelete(assistant.id)}
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
               {editingAssistant ? 'Editar Assistente' : 'Novo Assistente de IA'}
             </DialogTitle>
             <p className="text-sm text-slate-600 mt-1">Configure comportamento e fluxo padrão</p>
           </DialogHeader>

           <Tabs defaultValue="geral" className="w-full">
             <TabsList className="grid w-full grid-cols-4">
               <TabsTrigger value="geral">Geral</TabsTrigger>
               <TabsTrigger value="fluxo">Fluxo</TabsTrigger>
               <TabsTrigger value="comportamento">Comportamento</TabsTrigger>
               <TabsTrigger value="avancado">Avançado</TabsTrigger>
             </TabsList>

             {/* Geral */}
             <TabsContent value="geral" className="space-y-4 mt-4">
               <div>
                 <label className="text-sm font-medium text-slate-700">Nome *</label>
                 <Input 
                   value={formData.name}
                   onChange={(e) => setFormData({...formData, name: e.target.value})}
                   placeholder="Ex: Assistente Qualificação"
                   className="mt-1"
                 />
               </div>
               <div>
                 <label className="text-sm font-medium text-slate-700">Descrição</label>
                 <Textarea 
                   value={formData.description}
                   onChange={(e) => setFormData({...formData, description: e.target.value})}
                   placeholder="Descreva o propósito deste assistente"
                   className="mt-1 h-20"
                 />
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="text-sm font-medium text-slate-700">Canal *</label>
                   <select 
                     value={formData.channel}
                     onChange={(e) => setFormData({...formData, channel: e.target.value})}
                     className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md text-sm"
                   >
                     <option value="whatsapp">WhatsApp</option>
                     <option value="voice">Voz</option>
                     <option value="instagram">Instagram</option>
                     <option value="messenger">Messenger</option>
                     <option value="webchat">WebChat</option>
                   </select>
                 </div>
                 <div>
                   <label className="text-sm font-medium text-slate-700">Tipo</label>
                   <select 
                     value={formData.assistant_type}
                     onChange={(e) => setFormData({...formData, assistant_type: e.target.value})}
                     className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md text-sm"
                   >
                     <option value="qualificacao">Qualificação</option>
                     <option value="reengajamento_7d">Reengajamento 7d</option>
                     <option value="reengajamento_30d">Reengajamento 30d</option>
                     <option value="prospeccao_ativa">Prospecção Ativa</option>
                     <option value="voz_qualificacao">Voz - Qualificação</option>
                   </select>
                 </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="text-sm font-medium text-slate-700">Tom de Voz</label>
                   <select 
                     value={formData.tone}
                     onChange={(e) => setFormData({...formData, tone: e.target.value})}
                     className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md text-sm"
                   >
                     <option value="neutro">Neutro</option>
                     <option value="comercial">Comercial</option>
                     <option value="elegante">Elegante</option>
                     <option value="humanizado">Humanizado</option>
                   </select>
                 </div>
                 <div className="flex items-end">
                   <div className="flex items-center gap-2 p-3 rounded-lg border w-full">
                     <span className="text-sm font-medium text-slate-700">Ativo</span>
                     <Switch 
                       checked={formData.is_active}
                       onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                     />
                   </div>
                 </div>
               </div>
             </TabsContent>

             {/* Fluxo */}
             <TabsContent value="fluxo" className="space-y-4 mt-4">
               <div>
                 <label className="text-sm font-medium text-slate-700">Fluxo de IA (Opcional)</label>
                 <p className="text-xs text-slate-500 mt-1 mb-3">Selecione um fluxo para usar como padrão ou deixe em branco</p>

                 {flows.length === 0 ? (
                   <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                     <p className="text-sm text-slate-600">Nenhum fluxo de IA disponível no momento</p>
                   </div>
                 ) : (
                   <div className="space-y-2">
                     {/* Opção Sem Fluxo */}
                     <div 
                       onClick={() => setFormData({...formData, default_flow_id: ''})}
                       className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                         formData.default_flow_id === '' 
                           ? 'border-indigo-600 bg-indigo-50' 
                           : 'border-slate-200 hover:border-slate-300 bg-white'
                       }`}
                     >
                       <p className="font-medium text-slate-900">Sem fluxo (usar da campanha ou canal)</p>
                     </div>

                     {/* Fluxos Disponíveis */}
                     {flows.map(flow => (
                       <div
                         key={flow.id}
                         onClick={() => setFormData({...formData, default_flow_id: flow.id})}
                         className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                           formData.default_flow_id === flow.id
                             ? 'border-indigo-600 bg-indigo-50'
                             : 'border-slate-200 hover:border-slate-300 bg-white'
                         }`}
                       >
                         <div className="flex items-start justify-between">
                           <div className="flex-1">
                             <p className="font-medium text-slate-900">{flow.name}</p>
                             {flow.description && (
                               <p className="text-sm text-slate-600 mt-1">{flow.description}</p>
                             )}
                             <div className="flex gap-2 mt-2 flex-wrap">
                               <Badge variant="secondary" className="text-xs capitalize">
                                 {flow.industry || 'Geral'}
                               </Badge>
                               {flow.is_active && (
                                 <Badge className="text-xs bg-green-100 text-green-800">
                                   Ativo
                                 </Badge>
                               )}
                               {flow.is_default && (
                                 <Badge className="text-xs bg-blue-100 text-blue-800">
                                   Padrão
                                 </Badge>
                               )}
                             </div>
                           </div>
                           {formData.default_flow_id === flow.id && (
                             <div className="ml-2 pt-1">
                               <Badge className="bg-indigo-600">Selecionado</Badge>
                             </div>
                           )}
                         </div>
                       </div>
                     ))}
                   </div>
                 )}
               </div>
             </TabsContent>

             {/* Comportamento */}
             <TabsContent value="comportamento" className="space-y-4 mt-4">
               <div>
                 <label className="text-sm font-medium text-slate-700">Mensagem de Saudação</label>
                 <Input 
                   value={formData.greeting_message}
                   onChange={(e) => setFormData({...formData, greeting_message: e.target.value})}
                   placeholder="Ex: Olá! Como posso ajudá-lo?"
                   className="mt-1"
                 />
               </div>
               <div>
                 <label className="text-sm font-medium text-slate-700">Instrução do Sistema</label>
                 <Textarea 
                   value={formData.system_prompt}
                   onChange={(e) => setFormData({...formData, system_prompt: e.target.value})}
                   placeholder="Defina o comportamento e personalidade da IA..."
                   className="mt-1 h-24"
                 />
               </div>
               <div className="space-y-3 p-3 rounded-lg border">
                 <p className="text-sm font-medium text-slate-700">Regras de Comportamento</p>

                 {[
                   { key: 'elegant_tone', label: 'Tom Elegante' },
                   { key: 'prioritize_evaluation', label: 'Priorizar Avaliação' },
                   { key: 'no_pricing', label: 'Sem Discussão de Preços' },
                   { key: 'feminine_language', label: 'Linguagem Feminina' },
                   { key: 'respect_hours', label: 'Respeitar Horário de Atendimento' }
                 ].map(rule => (
                   <div key={rule.key} className="flex items-center justify-between">
                     <span className="text-sm text-slate-700">{rule.label}</span>
                     <Switch 
                       checked={formData.behavior_rules[rule.key] || false}
                       onCheckedChange={(checked) => setFormData({
                         ...formData,
                         behavior_rules: {...formData.behavior_rules, [rule.key]: checked}
                       })}
                     />
                   </div>
                 ))}
               </div>
             </TabsContent>

             {/* Avançado */}
             <TabsContent value="avancado" className="space-y-4 mt-4">
               <div className="flex items-center justify-between p-3 rounded-lg border">
                 <div>
                   <p className="text-sm font-medium text-slate-700">Suportar Chamadas de Voz</p>
                   <p className="text-xs text-slate-500">Permite usar este assistente para simulações de voz</p>
                 </div>
                 <Switch 
                   checked={formData.can_use_voice}
                   onCheckedChange={(checked) => setFormData({...formData, can_use_voice: checked})}
                 />
               </div>
             </TabsContent>
           </Tabs>

           <div className="flex gap-2 justify-end pt-4 border-t">
             <Button variant="outline" onClick={() => setShowDialog(false)}>
               Cancelar
             </Button>
             <Button 
               onClick={handleSave}
               disabled={!isFormValid || isSaving}
               className="gap-2 bg-indigo-600 hover:bg-indigo-700"
             >
               {isSaving && <Loader className="w-4 h-4 animate-spin" />}
               {editingAssistant ? 'Atualizar' : 'Criar'}
             </Button>
           </div>
         </DialogContent>
       </Dialog>
    </div>
  );
}