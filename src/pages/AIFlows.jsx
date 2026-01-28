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
import { Plus, Edit2, Trash2, Loader } from 'lucide-react';

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
    handoff_message: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadFlows();
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
        handoff_message: flow.handoff_message || ''
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
        handoff_message: ''
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
             <TabsList className="grid w-full grid-cols-6">
               <TabsTrigger value="geral">Geral</TabsTrigger>
               <TabsTrigger value="gatilhos">Gatilhos</TabsTrigger>
               <TabsTrigger value="mensagens">Mensagens</TabsTrigger>
               <TabsTrigger value="pontuacao">Pontuação</TabsTrigger>
               <TabsTrigger value="perguntas">Perguntas</TabsTrigger>
               <TabsTrigger value="avancado">Avançado</TabsTrigger>
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

             {/* Gatilhos */}
             <TabsContent value="gatilhos" className="mt-4">
               <p className="text-sm text-slate-600">Configurar gatilhos que iniciam este fluxo (em desenvolvimento)</p>
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

             {/* Pontuação */}
             <TabsContent value="pontuacao" className="mt-4">
               <p className="text-sm text-slate-600">Configurar regras de pontuação (em desenvolvimento)</p>
             </TabsContent>

             {/* Perguntas */}
             <TabsContent value="perguntas" className="mt-4">
               <p className="text-sm text-slate-600">Gerenciar perguntas de qualificação (em desenvolvimento)</p>
             </TabsContent>

             {/* Avançado */}
             <TabsContent value="avancado" className="mt-4">
               <p className="text-sm text-slate-600">Configurações avançadas (em desenvolvimento)</p>
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