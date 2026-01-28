import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit2, Trash2, Loader, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import { toast } from 'sonner';

export default function Scripts() {
  const [scripts, setScripts] = useState([]);
  const [assistants, setAssistants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' ou 'simulate'
  const [selectedAssistant, setSelectedAssistant] = useState(null);
  const [editingScript, setEditingScript] = useState(null);
  const [formData, setFormData] = useState({
    assistant_id: '',
    name: '',
    description: '',
    usage_type: 'qualificacao',
    channel: 'whatsapp',
    version: 'v1',
    system_prompt: '',
    greeting_message: '',
    tone: 'elegante',
    behavior_rules: {},
    voice_settings: {
      gender: 'feminine',
      speed: 1.0,
      tone: 'professional'
    },
    conversation_history: [],
    status: 'draft'
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      const [scriptsData, assistantsData] = await Promise.all([
        base44.entities.AIScript.list('-updated_date', 100),
        base44.entities.Assistant.list('-updated_date', 100)
      ]);
      setScripts(scriptsData);
      setAssistants(assistantsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar scripts');
    } finally {
      setLoading(false);
    }
  };

  const getNextVersion = (assistantId) => {
    const assistantScripts = scripts.filter(s => s.assistant_id === assistantId);
    if (assistantScripts.length === 0) return 'v1';
    const versions = assistantScripts.map(s => {
      const match = s.version?.match(/v(\d+)/);
      return match ? parseInt(match[1]) : 0;
    });
    const maxVersion = Math.max(...versions);
    return `v${maxVersion + 1}`;
  };

  const handleOpenDialog = (script = null) => {
    if (script) {
      setEditingScript(script);
      setFormData(script);
    } else {
      setEditingScript(null);
      setFormData({
        assistant_id: '',
        name: '',
        description: '',
        usage_type: 'qualificacao',
        channel: 'whatsapp',
        version: 'v1',
        system_prompt: '',
        greeting_message: '',
        tone: 'elegante',
        behavior_rules: {},
        voice_settings: {
          gender: 'feminine',
          speed: 1.0,
          tone: 'professional'
        },
        conversation_history: [],
        status: 'draft'
      });
    }
    setShowDialog(true);
  };

  const isFormValid = formData.assistant_id && formData.name.trim() && formData.usage_type && formData.channel;

  const handleSave = async () => {
    if (!isFormValid) {
      toast.error('Preencha os campos obrigatórios');
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

      if (editingScript) {
        await base44.entities.AIScript.update(editingScript.id, payload);
        toast.success('Script atualizado com sucesso');
      } else {
        await base44.entities.AIScript.create(payload);
        toast.success('Script criado com sucesso');
      }
      await loadData();
      setShowDialog(false);
    } catch (error) {
      console.error('Erro ao salvar script:', error);
      toast.error('Erro ao salvar script: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Tem certeza que deseja deletar este script?')) {
      try {
        await base44.entities.AIScript.delete(id);
        toast.success('Script deletado com sucesso');
        await loadData();
      } catch (error) {
        console.error('Erro ao deletar script:', error);
        toast.error('Erro ao deletar script');
      }
    }
  };

  const handleApprove = async (scriptId) => {
    try {
      await base44.entities.AIScript.update(scriptId, { 
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: (await base44.auth.me()).email
      });
      toast.success('Script aprovado com sucesso');
      await loadData();
    } catch (error) {
      console.error('Erro ao aprovar script:', error);
      toast.error('Erro ao aprovar script');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-slate-100 text-slate-800',
      testing: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      deprecated: 'bg-red-100 text-red-800'
    };
    return colors[status] || colors.draft;
  };

  const getAssistantName = (assistantId) => {
    return assistants.find(a => a.id === assistantId)?.name || 'N/A';
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
        <h1 className="text-2xl font-bold text-slate-900">Scripts de IA</h1>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Script
        </Button>
      </div>

      <div className="grid gap-4">
        {scripts.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-slate-500">
              Nenhum script criado ainda
            </CardContent>
          </Card>
        ) : (
          scripts.map(script => (
            <Card key={script.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">{script.name}</h3>
                    <p className="text-sm text-slate-500 mt-1">
                      Assistente: <span className="font-medium">{getAssistantName(script.assistant_id)}</span>
                    </p>
                    {script.description && (
                      <p className="text-sm text-slate-600 mt-2">{script.description}</p>
                    )}
                    <div className="flex gap-2 mt-3 flex-wrap">
                      <Badge variant="secondary" className="capitalize">
                        {script.usage_type}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {script.channel}
                      </Badge>
                      <Badge variant="outline">
                        {script.version}
                      </Badge>
                      <Badge className={getStatusColor(script.status)}>
                        {script.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {script.status === 'draft' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleApprove(script.id)}
                        className="gap-1"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Aprovar
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleOpenDialog(script)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleDelete(script.id)}
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

      {/* Dialog de criação/edição */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingScript ? 'Editar Script' : 'Novo Script de IA'}
            </DialogTitle>
            <p className="text-sm text-slate-600 mt-1">Configure e teste o comportamento da IA</p>
          </DialogHeader>

          <Tabs defaultValue="geral" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="geral">Geral</TabsTrigger>
              <TabsTrigger value="comportamento">Comportamento</TabsTrigger>
              {formData.channel === 'voice' && <TabsTrigger value="voz">Voz</TabsTrigger>}
            </TabsList>

            {/* Geral */}
            <TabsContent value="geral" className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Assistente *</label>
                <select 
                  value={formData.assistant_id}
                  onChange={(e) => {
                    setFormData({...formData, assistant_id: e.target.value});
                    if (e.target.value && !editingScript) {
                      setFormData(prev => ({...prev, version: getNextVersion(e.target.value)}));
                    }
                  }}
                  className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md text-sm"
                >
                  <option value="">Selecione um assistente</option>
                  {assistants.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Nome do Script *</label>
                <Input 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Ex: Script de Qualificação v1"
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Descrição</label>
                <Textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Descreva o propósito deste script"
                  className="mt-1 h-16"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Tipo de Uso *</label>
                  <select 
                    value={formData.usage_type}
                    onChange={(e) => setFormData({...formData, usage_type: e.target.value})}
                    className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md text-sm"
                  >
                    <option value="qualificacao">Qualificação</option>
                    <option value="reengajamento_7d">Reengajamento 7d</option>
                    <option value="reengajamento_30d">Reengajamento 30d</option>
                    <option value="prospeccao_ativa">Prospecção Ativa</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Canal *</label>
                  <select 
                    value={formData.channel}
                    onChange={(e) => setFormData({...formData, channel: e.target.value})}
                    className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md text-sm"
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="messenger">Messenger</option>
                    <option value="webchat">WebChat</option>
                    <option value="voice">Voz</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Versão</label>
                  <Input 
                    value={formData.version}
                    disabled
                    className="mt-1 bg-slate-50"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Comportamento */}
            <TabsContent value="comportamento" className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Instrução do Sistema</label>
                <Textarea 
                  value={formData.system_prompt}
                  onChange={(e) => setFormData({...formData, system_prompt: e.target.value})}
                  placeholder="Defina como a IA deve se comportar..."
                  className="mt-1 h-24"
                />
              </div>

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
            </TabsContent>

            {/* Voz */}
            {formData.channel === 'voice' && (
              <TabsContent value="voz" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Gênero da Voz</label>
                    <select 
                      value={formData.voice_settings?.gender}
                      onChange={(e) => setFormData({
                        ...formData, 
                        voice_settings: {...formData.voice_settings, gender: e.target.value}
                      })}
                      className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md text-sm"
                    >
                      <option value="masculine">Masculino</option>
                      <option value="feminine">Feminino</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700">Velocidade de Fala</label>
                    <Input 
                      type="number"
                      min="0.8"
                      max="1.5"
                      step="0.1"
                      value={formData.voice_settings?.speed || 1.0}
                      onChange={(e) => setFormData({
                        ...formData, 
                        voice_settings: {...formData.voice_settings, speed: parseFloat(e.target.value)}
                      })}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Tom da Voz</label>
                  <select 
                    value={formData.voice_settings?.tone}
                    onChange={(e) => setFormData({
                      ...formData, 
                      voice_settings: {...formData.voice_settings, tone: e.target.value}
                    })}
                    className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md text-sm"
                  >
                    <option value="neutral">Neutro</option>
                    <option value="professional">Profissional</option>
                    <option value="friendly">Amigável</option>
                    <option value="energetic">Energético</option>
                  </select>
                </div>
              </TabsContent>
            )}
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
              {editingScript ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}