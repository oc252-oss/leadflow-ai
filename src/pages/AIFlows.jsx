import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit2, Trash2, Loader, Zap, MessageCircle, Target, HelpCircle, Settings } from 'lucide-react';

export default function AIFlows() {
  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingFlow, setEditingFlow] = useState(null);
  const [activeTab, setActiveTab] = useState('triggers');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trigger_keywords: [],
    greeting_message: '',
    qualification_questions: [],
    hot_lead_threshold: 80,
    warm_lead_threshold: 50,
    auto_assign_hot_leads: true
  });
  const [isSaving, setIsSaving] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');

  useEffect(() => {
    loadFlows();
  }, []);

  const loadFlows = async () => {
    try {
      const data = await base44.entities.AIConversationFlow.list('-updated_date', 100);
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
        trigger_keywords: flow.trigger_keywords || [],
        greeting_message: flow.greeting_message || '',
        qualification_questions: flow.qualification_questions || [],
        hot_lead_threshold: flow.hot_lead_threshold || 80,
        warm_lead_threshold: flow.warm_lead_threshold || 50,
        auto_assign_hot_leads: flow.auto_assign_hot_leads !== false
      });
    } else {
      setEditingFlow(null);
      setFormData({
        name: '',
        description: '',
        trigger_keywords: [],
        greeting_message: '',
        qualification_questions: [],
        hot_lead_threshold: 80,
        warm_lead_threshold: 50,
        auto_assign_hot_leads: true
      });
    }
    setActiveTab('triggers');
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;
    
    setIsSaving(true);
    try {
      const dataToSave = {
        name: formData.name,
        description: formData.description,
        trigger_keywords: formData.trigger_keywords,
        greeting_message: formData.greeting_message,
        qualification_questions: formData.qualification_questions,
        hot_lead_threshold: formData.hot_lead_threshold,
        warm_lead_threshold: formData.warm_lead_threshold,
        auto_assign_hot_leads: formData.auto_assign_hot_leads
      };

      if (editingFlow) {
        await base44.entities.AIConversationFlow.update(editingFlow.id, dataToSave);
      } else {
        await base44.entities.AIConversationFlow.create(dataToSave);
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
        await base44.entities.AIConversationFlow.delete(id);
        await loadFlows();
      } catch (error) {
        console.error('Erro ao deletar fluxo:', error);
      }
    }
  };

  const handleToggleActive = async (flow) => {
    try {
      await base44.entities.AIConversationFlow.update(flow.id, { is_active: !flow.is_active });
      await loadFlows();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const handleAddKeyword = () => {
    if (newKeyword.trim()) {
      setFormData({
        ...formData,
        trigger_keywords: [...(formData.trigger_keywords || []), newKeyword.trim()]
      });
      setNewKeyword('');
    }
  };

  const handleRemoveKeyword = (index) => {
    setFormData({
      ...formData,
      trigger_keywords: formData.trigger_keywords.filter((_, i) => i !== index)
    });
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
        <Button onClick={() => handleOpenDialog()} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
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
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {flow.trigger_keywords?.length > 0 && (
                        <Badge variant="outline" className="text-xs">{flow.trigger_keywords.length} gatilhos</Badge>
                      )}
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
            <DialogTitle>{editingFlow ? 'Editar Fluxo de IA' : 'Novo Fluxo de IA'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Nome *</label>
              <Input 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Nome do fluxo"
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

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="triggers" className="gap-1 text-xs">
                  <Zap className="w-3 h-3" />
                  <span className="hidden sm:inline">Gatilhos</span>
                </TabsTrigger>
                <TabsTrigger value="messages" className="gap-1 text-xs">
                  <MessageCircle className="w-3 h-3" />
                  <span className="hidden sm:inline">Mensagens</span>
                </TabsTrigger>
                <TabsTrigger value="scoring" className="gap-1 text-xs">
                  <Target className="w-3 h-3" />
                  <span className="hidden sm:inline">Pontuação</span>
                </TabsTrigger>
                <TabsTrigger value="questions" className="gap-1 text-xs">
                  <HelpCircle className="w-3 h-3" />
                  <span className="hidden sm:inline">Perguntas</span>
                </TabsTrigger>
                <TabsTrigger value="advanced" className="gap-1 text-xs">
                  <Settings className="w-3 h-3" />
                  <span className="hidden sm:inline">Avançado</span>
                </TabsTrigger>
              </TabsList>

              {/* Gatilhos */}
              <TabsContent value="triggers" className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-2">Palavras-chave para ativação</label>
                  <div className="flex gap-2 mb-3">
                    <Input
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddKeyword()}
                      placeholder="Adicionar palavra-chave..."
                      className="text-sm"
                    />
                    <Button onClick={handleAddKeyword} variant="outline" size="sm">Adicionar</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(formData.trigger_keywords || []).map((kw, idx) => (
                      <Badge key={idx} variant="secondary" className="gap-1">
                        {kw}
                        <button onClick={() => handleRemoveKeyword(idx)} className="ml-1 text-red-500 hover:text-red-700 font-bold">×</button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Mensagens */}
              <TabsContent value="messages" className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Mensagem de Saudação</label>
                  <Textarea
                    value={formData.greeting_message}
                    onChange={(e) => setFormData({...formData, greeting_message: e.target.value})}
                    placeholder="Ex: Olá! Como posso ajudá-lo?"
                    className="mt-1 h-24"
                  />
                </div>
              </TabsContent>

              {/* Pontuação */}
              <TabsContent value="scoring" className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Limite para Lead Quente (Hot)</label>
                  <div className="flex gap-2 items-center mt-1">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.hot_lead_threshold}
                      onChange={(e) => setFormData({...formData, hot_lead_threshold: Number(e.target.value)})}
                      className="w-20"
                    />
                    <span className="text-sm text-slate-600">(padrão: 80)</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Limite para Lead Morno (Warm)</label>
                  <div className="flex gap-2 items-center mt-1">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.warm_lead_threshold}
                      onChange={(e) => setFormData({...formData, warm_lead_threshold: Number(e.target.value)})}
                      className="w-20"
                    />
                    <span className="text-sm text-slate-600">(padrão: 50)</span>
                  </div>
                </div>
              </TabsContent>

              {/* Perguntas de Qualificação */}
              <TabsContent value="questions" className="space-y-3 mt-4">
                <div className="text-xs text-slate-600 mb-2">
                  Configure as perguntas de qualificação automática
                </div>
                {(formData.qualification_questions || []).length === 0 && (
                  <p className="text-sm text-slate-500 py-4">Nenhuma pergunta adicionada ainda</p>
                )}
              </TabsContent>

              {/* Avançado */}
              <TabsContent value="advanced" className="space-y-4 mt-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="auto_assign"
                    checked={formData.auto_assign_hot_leads}
                    onChange={(e) => setFormData({...formData, auto_assign_hot_leads: e.target.checked})}
                    className="w-4 h-4 rounded"
                  />
                  <label htmlFor="auto_assign" className="text-sm font-medium text-slate-700">
                    Atribuir automaticamente leads quentes
                  </label>
                </div>
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
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}