import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot, Copy, FileText, History, BarChart3, Plus, ChevronRight, Clock, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";

export default function AssistantCentral() {
  const [assistants, setAssistants] = useState([]);
  const [selectedAssistant, setSelectedAssistant] = useState(null);
  const [versions, setVersions] = useState([]);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [teamMember, setTeamMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showVersionDialog, setShowVersionDialog] = useState(false);
  const [editingVersion, setEditingVersion] = useState(null);
  const [filterChannel, setFilterChannel] = useState('all');

  const [versionForm, setVersionForm] = useState({
    system_prompt: '',
    greeting_message: '',
    tone: 'elegante',
    behavior_rules: {
      elegant_tone: true,
      prioritize_evaluation: true,
      no_pricing: false,
      feminine_language: false,
      respect_hours: true
    },
    status: 'draft',
    change_description: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedAssistant) {
      loadAssistantDetails();
    }
  }, [selectedAssistant]);

  const loadData = async () => {
    try {
      setLoading(true);
      const user = await base44.auth.me();
      const members = await base44.entities.TeamMember.filter({ user_email: user.email });
      
      if (members.length > 0) {
        setTeamMember(members[0]);
        const assistantsData = await base44.entities.Assistant.filter({
          organization_id: members[0].organization_id
        });
        setAssistants(assistantsData);
        
        if (assistantsData.length > 0) {
          setSelectedAssistant(assistantsData[0]);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar assistentes');
    } finally {
      setLoading(false);
    }
  };

  const loadAssistantDetails = async () => {
    if (!selectedAssistant) return;
    
    try {
      const [versionsData, historyData, metricsData] = await Promise.all([
        base44.entities.AssistantVersion.filter({ assistant_id: selectedAssistant.id }, '-created_date'),
        base44.entities.AssistantVersionHistory.filter({ assistant_id: selectedAssistant.id }, '-created_date', 50),
        base44.entities.AssistantMetrics.filter({ assistant_id: selectedAssistant.id }, '-date', 30)
      ]);
      
      setVersions(versionsData);
      setHistoryRecords(historyData);
      setMetrics(metricsData);
    } catch (error) {
      console.error('Error loading details:', error);
      toast.error('Erro ao carregar detalhes do assistente');
    }
  };

  const handleCreateVersion = async () => {
    if (!versionForm.system_prompt) {
      toast.error('Prompt do sistema é obrigatório');
      return;
    }

    try {
      const nextVersion = Math.max(0, ...versions.map(v => v.version_number || 0)) + 1;
      
      const newVersion = await base44.entities.AssistantVersion.create({
        assistant_id: selectedAssistant.id,
        version_number: nextVersion,
        ...versionForm,
        created_by: teamMember.user_email
      });

      await base44.entities.AssistantVersionHistory.create({
        assistant_id: selectedAssistant.id,
        version_id: newVersion.id,
        action: 'created',
        action_description: `Versão ${nextVersion} criada`,
        performed_by: teamMember.user_email,
        notes: versionForm.change_description
      });

      toast.success('Versão criada com sucesso');
      await loadAssistantDetails();
      handleCloseVersionDialog();
    } catch (error) {
      console.error('Error creating version:', error);
      toast.error('Erro ao criar versão');
    }
  };

  const handleCloneVersion = async (version) => {
    try {
      const nextVersion = Math.max(0, ...versions.map(v => v.version_number || 0)) + 1;
      
      const clonedVersion = await base44.entities.AssistantVersion.create({
        assistant_id: selectedAssistant.id,
        version_number: nextVersion,
        system_prompt: version.system_prompt,
        greeting_message: version.greeting_message,
        tone: version.tone,
        behavior_rules: version.behavior_rules,
        status: 'draft',
        change_description: `Clonado da versão ${version.version_number}`,
        created_by: teamMember.user_email,
        cloned_from_version: version.version_number
      });

      await base44.entities.AssistantVersionHistory.create({
        assistant_id: selectedAssistant.id,
        version_id: clonedVersion.id,
        action: 'cloned',
        action_description: `Versão ${nextVersion} clonada de ${version.version_number}`,
        performed_by: teamMember.user_email
      });

      toast.success('Versão clonada com sucesso');
      await loadAssistantDetails();
    } catch (error) {
      console.error('Error cloning version:', error);
      toast.error('Erro ao clonar versão');
    }
  };

  const handleActivateVersion = async (version) => {
    try {
      // Deactivate current active version
      const activeVersion = versions.find(v => v.is_active);
      if (activeVersion) {
        await base44.entities.AssistantVersion.update(activeVersion.id, { is_active: false });
      }

      // Activate new version
      await base44.entities.AssistantVersion.update(version.id, { is_active: true });

      await base44.entities.AssistantVersionHistory.create({
        assistant_id: selectedAssistant.id,
        version_id: version.id,
        action: 'activated',
        action_description: `Versão ${version.version_number} ativada para produção`,
        performed_by: teamMember.user_email
      });

      toast.success('Versão ativada com sucesso');
      await loadAssistantDetails();
    } catch (error) {
      console.error('Error activating version:', error);
      toast.error('Erro ao ativar versão');
    }
  };

  const handleCloseVersionDialog = () => {
    setShowVersionDialog(false);
    setEditingVersion(null);
    setVersionForm({
      system_prompt: '',
      greeting_message: '',
      tone: 'elegante',
      behavior_rules: {
        elegant_tone: true,
        prioritize_evaluation: true,
        no_pricing: false,
        feminine_language: false,
        respect_hours: true
      },
      status: 'draft',
      change_description: ''
    });
  };

  const filteredAssistants = assistants.filter(a =>
    filterChannel === 'all' || a.channel === filterChannel
  );

  const getChannelColor = (channel) => {
    const colors = {
      whatsapp: 'bg-green-100 text-green-700',
      voice: 'bg-blue-100 text-blue-700',
      webchat: 'bg-purple-100 text-purple-700',
      messenger: 'bg-blue-100 text-blue-700',
      instagram: 'bg-pink-100 text-pink-700'
    };
    return colors[channel] || 'bg-slate-100 text-slate-700';
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-slate-100 text-slate-700',
      testing: 'bg-yellow-100 text-yellow-700',
      production: 'bg-green-100 text-green-700',
      archived: 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Central de Assistentes</h1>
        <p className="text-slate-500 mt-1">Gerencie versões, histórico e performance de IA</p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar - Assistants List */}
        <div className="col-span-12 lg:col-span-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bot className="w-5 h-5" />
                Assistentes
              </CardTitle>
              <Select value={filterChannel} onValueChange={setFilterChannel}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Filtrar canal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os canais</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="voice">Voz</SelectItem>
                  <SelectItem value="webchat">WebChat</SelectItem>
                  <SelectItem value="messenger">Messenger</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="space-y-2">
              {filteredAssistants.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">Nenhum assistente</p>
              ) : (
                filteredAssistants.map(assistant => (
                  <button
                    key={assistant.id}
                    onClick={() => setSelectedAssistant(assistant)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg transition-colors",
                      selectedAssistant?.id === assistant.id
                        ? "bg-indigo-50 border border-indigo-200"
                        : "hover:bg-slate-50 border border-transparent"
                    )}
                  >
                    <p className="font-medium text-sm truncate">{assistant.name}</p>
                    <Badge className={cn("mt-2 text-xs", getChannelColor(assistant.channel))}>
                      {assistant.channel}
                    </Badge>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        {selectedAssistant && (
          <div className="col-span-12 lg:col-span-9 space-y-6">
            {/* Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{selectedAssistant.name}</CardTitle>
                    <CardDescription className="mt-2">{selectedAssistant.description}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={cn("h-fit", selectedAssistant.is_active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-700")}>
                      {selectedAssistant.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="versions" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="versions" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Versões
                </TabsTrigger>
                <TabsTrigger value="history" className="flex items-center gap-2">
                  <History className="w-4 h-4" />
                  Histórico
                </TabsTrigger>
                <TabsTrigger value="performance" className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Performance
                </TabsTrigger>
              </TabsList>

              {/* Versions Tab */}
              <TabsContent value="versions" className="space-y-4 mt-4">
                <div className="flex justify-end">
                  <Button onClick={() => setShowVersionDialog(true)} className="bg-indigo-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Versão
                  </Button>
                </div>

                {versions.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center text-slate-500">
                      Nenhuma versão criada. Crie a primeira versão do assistente.
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {versions.map((version) => (
                      <Card key={version.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <h3 className="font-semibold">Versão {version.version_number}</h3>
                                {version.is_active && (
                                  <Badge className="bg-green-100 text-green-700 text-xs">Ativa</Badge>
                                )}
                                <Badge className={cn("text-xs", getStatusColor(version.status))}>
                                  {version.status}
                                </Badge>
                              </div>
                              {version.change_description && (
                                <p className="text-sm text-slate-600 mt-2">{version.change_description}</p>
                              )}
                              <p className="text-xs text-slate-500 mt-2">
                                Criada por {version.created_by}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              {!version.is_active && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleActivateVersion(version)}
                                >
                                  Ativar
                                </Button>
                              )}
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleCloneVersion(version)}
                              >
                                <Copy className="w-4 h-4 mr-1" />
                                Clonar
                              </Button>
                            </div>
                          </div>

                          <div className="mt-4 pt-4 border-t space-y-2 text-sm">
                            <p><strong>Tom:</strong> {version.tone}</p>
                            <p><strong>Prompt:</strong> {version.system_prompt.substring(0, 100)}...</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history" className="space-y-4 mt-4">
                {historyRecords.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center text-slate-500">
                      Nenhum histórico de alterações
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {historyRecords.map((record) => (
                      <Card key={record.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-3">
                            <Clock className="w-5 h-5 text-indigo-600 mt-1 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">
                                {record.action_description}
                              </p>
                              <p className="text-xs text-slate-500 mt-1">
                                {record.performed_by} • {new Date(record.created_date).toLocaleString('pt-BR')}
                              </p>
                              {record.notes && (
                                <p className="text-sm text-slate-600 mt-2">{record.notes}</p>
                              )}
                            </div>
                            <Badge className="h-fit" variant="outline">
                              {record.action}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Performance Tab */}
              <TabsContent value="performance" className="space-y-4 mt-4">
                {metrics.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center text-slate-500">
                      Nenhuma métrica disponível ainda
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {metrics.slice(0, 7).map((metric) => (
                      <Card key={metric.id}>
                        <CardContent className="pt-6">
                          <p className="text-sm text-slate-500 mb-3">
                            {new Date(metric.date).toLocaleDateString('pt-BR')}
                          </p>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Conversas:</span>
                              <strong>{metric.conversations_total}</strong>
                            </div>
                            <div className="flex justify-between">
                              <span>Completadas:</span>
                              <strong>{metric.conversations_completed}</strong>
                            </div>
                            <div className="flex justify-between">
                              <span>Agendadas:</span>
                              <strong>{metric.scheduled_count}</strong>
                            </div>
                            <div className="flex justify-between">
                              <span>Convertidas:</span>
                              <strong>{metric.converted_count}</strong>
                            </div>
                            {metric.satisfaction_score && (
                              <div className="flex justify-between pt-2 border-t">
                                <span>Satisfação:</span>
                                <strong>{metric.satisfaction_score}%</strong>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>

      {/* Version Dialog */}
      <Dialog open={showVersionDialog} onOpenChange={setShowVersionDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Versão de Prompt</DialogTitle>
            <DialogDescription>
              Crie uma nova versão do assistente {selectedAssistant?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Prompt do Sistema *</Label>
              <Textarea
                value={versionForm.system_prompt}
                onChange={(e) => setVersionForm({ ...versionForm, system_prompt: e.target.value })}
                placeholder="Instruções detalhadas..."
                rows={6}
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label>Mensagem de Saudação</Label>
              <Textarea
                value={versionForm.greeting_message}
                onChange={(e) => setVersionForm({ ...versionForm, greeting_message: e.target.value })}
                placeholder="Primeira mensagem ao usuário..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tom</Label>
                <Select value={versionForm.tone} onValueChange={(value) => setVersionForm({ ...versionForm, tone: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="neutro">Neutro</SelectItem>
                    <SelectItem value="comercial">Comercial</SelectItem>
                    <SelectItem value="elegante">Elegante</SelectItem>
                    <SelectItem value="humanizado">Humanizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={versionForm.status} onValueChange={(value) => setVersionForm({ ...versionForm, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Rascunho</SelectItem>
                    <SelectItem value="testing">Teste</SelectItem>
                    <SelectItem value="production">Produção</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição da Alteração</Label>
              <Textarea
                value={versionForm.change_description}
                onChange={(e) => setVersionForm({ ...versionForm, change_description: e.target.value })}
                placeholder="O que mudou nesta versão?"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseVersionDialog}>
              Cancelar
            </Button>
            <Button onClick={handleCreateVersion} className="bg-indigo-600">
              Criar Versão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}