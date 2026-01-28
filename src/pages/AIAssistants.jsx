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
import { Plus, Edit2, Trash2, Loader } from 'lucide-react';

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
    is_active: true,
    can_use_voice: false,
    behavior_rules: {
      elegant_tone: true,
      prioritize_evaluation: true,
      no_pricing: false,
      feminine_language: false,
      respect_hours: true
    }
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [assistantsData, flowsData] = await Promise.all([
        base44.asServiceRole.entities.Assistant.list('-updated_date', 100),
        base44.asServiceRole.entities.AIConversationFlow.filter({ is_active: true }, '-updated_date', 100)
      ]);
      setAssistants(assistantsData);
      setFlows(flowsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (assistant = null) => {
    if (assistant) {
      setEditingAssistant(assistant);
      setFormData({
        name: assistant.name || '',
        description: assistant.description || '',
        channel: assistant.channel || 'whatsapp',
        assistant_type: assistant.assistant_type || 'qualificacao',
        tone: assistant.tone || 'elegante',
        default_flow_id: assistant.default_flow_id || '',
        greeting_message: assistant.greeting_message || '',
        system_prompt: assistant.system_prompt || '',
        is_active: assistant.is_active !== false,
        can_use_voice: assistant.can_use_voice || false,
        behavior_rules: assistant.behavior_rules || {
          elegant_tone: true,
          prioritize_evaluation: true,
          no_pricing: false,
          feminine_language: false,
          respect_hours: true
        }
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
        is_active: true,
        can_use_voice: false,
        behavior_rules: {
          elegant_tone: true,
          prioritize_evaluation: true,
          no_pricing: false,
          feminine_language: false,
          respect_hours: true
        }
      });
    }
    setShowDialog(true);
  };

  const isFormValid = formData.name.trim() && formData.channel && formData.assistant_type && formData.default_flow_id;

  const handleSave = async () => {
    if (!isFormValid) return;

    setIsSaving(true);
    try {
      const dataToSave = {
        name: formData.name,
        description: formData.description,
        channel: formData.channel,
        assistant_type: formData.assistant_type,
        tone: formData.tone,
        default_flow_id: formData.default_flow_id,
        greeting_message: formData.greeting_message,
        system_prompt: formData.system_prompt,
        is_active: formData.is_active,
        can_use_voice: formData.can_use_voice,
        behavior_rules: formData.behavior_rules
      };

      if (editingAssistant) {
        await base44.asServiceRole.entities.Assistant.update(editingAssistant.id, dataToSave);
      } else {
        await base44.asServiceRole.entities.Assistant.create(dataToSave);
      }
      await loadData();
      setShowDialog(false);
    } catch (error) {
      console.error('Erro ao salvar assistente:', error);
      alert('Erro ao salvar assistente: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Tem certeza que deseja deletar este assistente?')) {
      try {
        await base44.asServiceRole.entities.Assistant.delete(id);
        await loadData();
      } catch (error) {
        console.error('Erro ao deletar assistente:', error);
      }
    }
  };

  const handleToggleActive = async (assistant) => {
    try {
      await base44.asServiceRole.entities.Assistant.update(assistant.id, { is_active: !assistant.is_active });
      await loadData();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const getFlowName = (flowId) => {
    const flow = flows.find(f => f.id === flowId);
    return flow?.name || 'Fluxo não encontrado';
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
                    <p className="text-sm text-slate-600 mt-1">Fluxo: {getFlowName(assistant.default_flow_id)}</p>
                    {assistant.greeting_message && (
                      <p className="text-sm text-slate-600 mt-1">"{assistant.greeting_message}"</p>
                    )}
                    <div className="flex gap-2 mt-3 flex-wrap">
                      <Badge variant="secondary" className="capitalize">
                        {assistant.channel}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {assistant.tone}
                      </Badge>
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
             <DialogTitle>{editingAssistant ? 'Editar Assistente' : 'Novo Assistente'}</DialogTitle>
           </DialogHeader>

           <Tabs defaultValue="geral" className="w-full">
             <TabsList className="grid w-full grid-cols-4">
               <TabsTrigger value="geral">Geral</TabsTrigger>
               <TabsTrigger value="comportamento">Comportamento</TabsTrigger>
               <TabsTrigger value="mensagens">Mensagens</TabsTrigger>
               <TabsTrigger value="integracao">Integração</TabsTrigger>
             </TabsList>

             {/* Geral */}
             <TabsContent value="geral" className="space-y-4 mt-4">
               <div>
                 <label className="text-sm font-medium text-slate-700">Nome *</label>
                 <Input 
                   value={formData.name}
                   onChange={(e) => setFormData({...formData, name: e.target.value})}
                   placeholder="Ex: WhatsApp Royal"
                   className="mt-1"
                 />
               </div>
               <div>
                 <label className="text-sm font-medium text-slate-700">Descrição</label>
                 <Textarea
                   value={formData.description}
                   onChange={(e) => setFormData({...formData, description: e.target.value})}
                   placeholder="Descrição do assistente"
                   className="mt-1 h-20"
                 />
               </div>
               <div>
                 <label className="text-sm font-medium text-slate-700">Canal *</label>
                 <select 
                   value={formData.channel}
                   onChange={(e) => setFormData({...formData, channel: e.target.value})}
                   className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md text-sm"
                 >
                   <option value="whatsapp">WhatsApp</option>
                   <option value="webchat">WebChat</option>
                   <option value="messenger">Messenger</option>
                   <option value="instagram">Instagram</option>
                   <option value="voice">Voz</option>
                 </select>
               </div>
               <div>
                 <label className="text-sm font-medium text-slate-700">Tipo de Uso *</label>
                 <select 
                   value={formData.assistant_type}
                   onChange={(e) => setFormData({...formData, assistant_type: e.target.value})}
                   className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md text-sm"
                 >
                   <option value="qualificacao">Qualificação</option>
                   <option value="reengajamento_7d">Reengajamento 7d</option>
                   <option value="reengajamento_30d">Reengajamento 30d</option>
                   <option value="reengajamento_90d">Reengajamento 90d</option>
                   <option value="prospeccao_ativa">Prospecção Ativa</option>
                   <option value="voz_reativacao">Voz - Reativação</option>
                   <option value="voz_qualificacao">Voz - Qualificação</option>
                 </select>
               </div>
               <div>
                 <label className="text-sm font-medium text-slate-700">Tom de Comunicação</label>
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
               <div>
                 <label className="text-sm font-medium text-slate-700">Fluxo de IA Padrão *</label>
                 <select 
                   value={formData.default_flow_id}
                   onChange={(e) => setFormData({...formData, default_flow_id: e.target.value})}
                   className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md text-sm"
                 >
                   <option value="">Selecione um fluxo</option>
                   {flows.map(flow => (
                     <option key={flow.id} value={flow.id}>{flow.name}</option>
                   ))}
                 </select>
               </div>
               <div className="flex items-center justify-between p-3 rounded-lg border">
                 <span className="text-sm font-medium text-slate-700">Ativa a assistente em produção</span>
                 <Switch 
                   checked={formData.is_active}
                   onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                 />
               </div>
             </TabsContent>

             {/* Comportamento */}
             <TabsContent value="comportamento" className="space-y-3 mt-4">
               {Object.entries(formData.behavior_rules).map(([key, value]) => (
                 <div key={key} className="flex items-center justify-between p-3 rounded-lg border">
                   <span className="text-sm font-medium text-slate-700 capitalize">
                     {key.replace(/_/g, ' ')}
                   </span>
                   <Switch 
                     checked={value}
                     onCheckedChange={(checked) => setFormData({
                       ...formData,
                       behavior_rules: {
                         ...formData.behavior_rules,
                         [key]: checked
                       }
                     })}
                   />
                 </div>
               ))}
               <div className="flex items-center justify-between p-3 rounded-lg border">
                 <span className="text-sm font-medium text-slate-700">Suporta Voz</span>
                 <Switch 
                   checked={formData.can_use_voice}
                   onCheckedChange={(checked) => setFormData({...formData, can_use_voice: checked})}
                 />
               </div>
             </TabsContent>

             {/* Mensagens */}
             <TabsContent value="mensagens" className="space-y-4 mt-4">
               <div>
                 <label className="text-sm font-medium text-slate-700">Mensagem de Saudação</label>
                 <Textarea
                   value={formData.greeting_message}
                   onChange={(e) => setFormData({...formData, greeting_message: e.target.value})}
                   placeholder="Ex: Olá! Como posso ajudar?"
                   className="mt-1 h-20"
                 />
               </div>
               <div>
                 <label className="text-sm font-medium text-slate-700">Instrução do Sistema</label>
                 <Textarea
                   value={formData.system_prompt}
                   onChange={(e) => setFormData({...formData, system_prompt: e.target.value})}
                   placeholder="Instruções para o comportamento do assistente"
                   className="mt-1 h-24"
                 />
               </div>
             </TabsContent>

             {/* Integração */}
             <TabsContent value="integracao" className="mt-4">
               <p className="text-sm text-slate-600">Configurações de integração (em desenvolvimento)</p>
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