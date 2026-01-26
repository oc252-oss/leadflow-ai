import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, Play, Pause, StopCircle, Edit, Trash2, Users, MessageSquare, 
  TrendingUp, Calendar, Loader2, RefreshCw, Eye 
} from 'lucide-react';
import { toast } from 'sonner';

export default function Reengagement() {
  const [campaigns, setCampaigns] = useState([]);
  const [whatsappNumbers, setWhatsappNumbers] = useState([]);
  const [teamMember, setTeamMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [previewLeads, setPreviewLeads] = useState([]);
  const [showPreview, setShowPreview] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    whatsapp_integration_id: '',
    message_template: '',
    max_messages_per_day: 100,
    interval_seconds_min: 60,
    interval_seconds_max: 300,
    active_hours_start: '09:00',
    active_hours_end: '18:00',
    filters: {
      stages: [],
      last_interaction_days_min: 7,
      last_interaction_days_max: 90,
      interest_types: [],
      score_min: 0,
      score_max: 100,
      temperatures: []
    }
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const user = await base44.auth.me();
      const members = await base44.entities.TeamMember.filter({ user_email: user.email });
      
      if (members.length > 0) {
        setTeamMember(members[0]);
        const [campaignsData, whatsappData] = await Promise.all([
          base44.entities.ReengagementCampaign.filter({ company_id: members[0].company_id }),
          base44.entities.WhatsAppIntegration.filter({ 
            company_id: members[0].company_id,
            is_active: true 
          })
        ]);
        setCampaigns(campaignsData);
        setWhatsappNumbers(whatsappData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar campanhas');
    } finally {
      setLoading(false);
    }
  };

  const handleNewCampaign = () => {
    setEditingId(null);
    setFormData({
      name: '',
      description: '',
      whatsapp_integration_id: whatsappNumbers[0]?.id || '',
      message_template: 'Olá {nome}! Notei que você demonstrou interesse em {interesse}. Como posso ajudá-lo(a)?',
      max_messages_per_day: 100,
      interval_seconds_min: 60,
      interval_seconds_max: 300,
      active_hours_start: '09:00',
      active_hours_end: '18:00',
      filters: {
        stages: ['Novo Lead', 'Atendimento Iniciado'],
        last_interaction_days_min: 7,
        last_interaction_days_max: 90,
        interest_types: [],
        score_min: 30,
        score_max: 100,
        temperatures: ['warm', 'hot']
      }
    });
    setShowDialog(true);
  };

  const handleEdit = (campaign) => {
    setEditingId(campaign.id);
    setFormData({
      name: campaign.name,
      description: campaign.description || '',
      whatsapp_integration_id: campaign.whatsapp_integration_id,
      message_template: campaign.message_template,
      max_messages_per_day: campaign.max_messages_per_day,
      interval_seconds_min: campaign.interval_seconds_min,
      interval_seconds_max: campaign.interval_seconds_max,
      active_hours_start: campaign.active_hours_start,
      active_hours_end: campaign.active_hours_end,
      filters: campaign.filters || {}
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      if (!formData.name || !formData.message_template || !formData.whatsapp_integration_id) {
        toast.error('Preencha os campos obrigatórios');
        return;
      }

      const data = {
        ...formData,
        company_id: teamMember.company_id,
        unit_id: teamMember.unit_id
      };

      if (editingId) {
        await base44.entities.ReengagementCampaign.update(editingId, data);
        toast.success('Campanha atualizada');
      } else {
        await base44.entities.ReengagementCampaign.create(data);
        toast.success('Campanha criada');
      }

      await loadData();
      setShowDialog(false);
    } catch (error) {
      console.error('Error saving campaign:', error);
      toast.error('Erro ao salvar campanha');
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = async (campaign) => {
    try {
      setLoading(true);
      const response = await base44.functions.invoke('previewReengagementLeads', {
        campaign_id: campaign.id
      });
      setPreviewLeads(response.data.leads || []);
      setShowPreview(true);
    } catch (error) {
      console.error('Error previewing leads:', error);
      toast.error('Erro ao visualizar leads');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (campaignId, newStatus) => {
    try {
      await base44.entities.ReengagementCampaign.update(campaignId, { 
        status: newStatus,
        ...(newStatus === 'running' && { started_at: new Date().toISOString() }),
        ...(newStatus === 'finished' && { finished_at: new Date().toISOString() })
      });
      toast.success(`Campanha ${newStatus === 'running' ? 'iniciada' : newStatus === 'paused' ? 'pausada' : 'finalizada'}`);
      await loadData();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Deseja realmente excluir esta campanha?')) return;
    
    try {
      await base44.entities.ReengagementCampaign.delete(id);
      toast.success('Campanha excluída');
      await loadData();
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast.error('Erro ao excluir campanha');
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      draft: { label: 'Rascunho', color: 'bg-slate-100 text-slate-800' },
      running: { label: 'Em execução', color: 'bg-green-100 text-green-800' },
      paused: { label: 'Pausada', color: 'bg-yellow-100 text-yellow-800' },
      finished: { label: 'Finalizada', color: 'bg-blue-100 text-blue-800' }
    };
    const { label, color } = config[status] || config.draft;
    return <Badge className={color}>{label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Campanhas de Reengajamento</h2>
          <p className="text-slate-500 mt-1">Recupere leads inativos com mensagens automatizadas</p>
        </div>
        <Button onClick={handleNewCampaign} className="bg-indigo-600">
          <Plus className="w-4 h-4 mr-2" />
          Nova Campanha
        </Button>
      </div>

      {campaigns.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <RefreshCw className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhuma campanha criada</h3>
              <p className="text-sm text-slate-500 mb-6">
                Crie campanhas para reengajar leads inativos e aumentar conversões
              </p>
              <Button onClick={handleNewCampaign} className="bg-indigo-600">
                <Plus className="w-4 h-4 mr-2" />
                Criar primeira campanha
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {campaigns.map((campaign) => (
            <Card key={campaign.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle>{campaign.name}</CardTitle>
                      {getStatusBadge(campaign.status)}
                    </div>
                    {campaign.description && (
                      <CardDescription>{campaign.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {campaign.status === 'draft' && (
                      <Button
                        size="sm"
                        onClick={() => handleStatusChange(campaign.id, 'running')}
                        className="bg-green-600"
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Iniciar
                      </Button>
                    )}
                    {campaign.status === 'running' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(campaign.id, 'paused')}
                      >
                        <Pause className="w-4 h-4 mr-1" />
                        Pausar
                      </Button>
                    )}
                    {campaign.status === 'paused' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleStatusChange(campaign.id, 'running')}
                          className="bg-green-600"
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Retomar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(campaign.id, 'finished')}
                        >
                          <StopCircle className="w-4 h-4 mr-1" />
                          Finalizar
                        </Button>
                      </>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => handlePreview(campaign)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(campaign)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(campaign.id)}>
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center p-4 rounded-lg bg-blue-50">
                    <MessageSquare className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-900">{campaign.total_messages_sent || 0}</p>
                    <p className="text-xs text-blue-600">Mensagens enviadas</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-green-50">
                    <TrendingUp className="w-6 h-6 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-900">{campaign.total_replies || 0}</p>
                    <p className="text-xs text-green-600">Respostas recebidas</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-purple-50">
                    <Users className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-purple-900">{campaign.total_conversations_reopened || 0}</p>
                    <p className="text-xs text-purple-600">Conversas reabertas</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-amber-50">
                    <Calendar className="w-6 h-6 text-amber-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-amber-900">{campaign.messages_sent_today || 0}</p>
                    <p className="text-xs text-amber-600">Enviadas hoje</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Campaign Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Campanha' : 'Nova Campanha'}</DialogTitle>
            <DialogDescription>Configure os parâmetros da campanha de reengajamento</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="general" className="mt-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">Geral</TabsTrigger>
              <TabsTrigger value="filters">Filtros</TabsTrigger>
              <TabsTrigger value="message">Mensagem</TabsTrigger>
              <TabsTrigger value="schedule">Programação</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Nome da Campanha *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Reengajamento Lead Dentistas"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva o objetivo desta campanha"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Número WhatsApp *</Label>
                <Select
                  value={formData.whatsapp_integration_id}
                  onValueChange={(value) => setFormData({ ...formData, whatsapp_integration_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o número" />
                  </SelectTrigger>
                  <SelectContent>
                    {whatsappNumbers.map(wa => (
                      <SelectItem key={wa.id} value={wa.id}>
                        {wa.phone_number} {wa.label && `(${wa.label})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="filters" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Dias sem interação (mínimo)</Label>
                  <Input
                    type="number"
                    value={formData.filters.last_interaction_days_min}
                    onChange={(e) => setFormData({
                      ...formData,
                      filters: { ...formData.filters, last_interaction_days_min: parseInt(e.target.value) }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Dias sem interação (máximo)</Label>
                  <Input
                    type="number"
                    value={formData.filters.last_interaction_days_max}
                    onChange={(e) => setFormData({
                      ...formData,
                      filters: { ...formData.filters, last_interaction_days_max: parseInt(e.target.value) }
                    })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Score mínimo</Label>
                  <Input
                    type="number"
                    value={formData.filters.score_min}
                    onChange={(e) => setFormData({
                      ...formData,
                      filters: { ...formData.filters, score_min: parseInt(e.target.value) }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Score máximo</Label>
                  <Input
                    type="number"
                    value={formData.filters.score_max}
                    onChange={(e) => setFormData({
                      ...formData,
                      filters: { ...formData.filters, score_max: parseInt(e.target.value) }
                    })}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="message" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Mensagem *</Label>
                <Textarea
                  value={formData.message_template}
                  onChange={(e) => setFormData({ ...formData, message_template: e.target.value })}
                  placeholder="Olá {nome}! Como posso ajudá-lo(a)?"
                  rows={6}
                />
                <p className="text-xs text-slate-500">
                  Use variáveis: {'{nome}'}, {'{interesse}'}, {'{score}'}
                </p>
              </div>
            </TabsContent>

            <TabsContent value="schedule" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Máximo de mensagens por dia</Label>
                <Input
                  type="number"
                  value={formData.max_messages_per_day}
                  onChange={(e) => setFormData({ ...formData, max_messages_per_day: parseInt(e.target.value) })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Intervalo mínimo (segundos)</Label>
                  <Input
                    type="number"
                    value={formData.interval_seconds_min}
                    onChange={(e) => setFormData({ ...formData, interval_seconds_min: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Intervalo máximo (segundos)</Label>
                  <Input
                    type="number"
                    value={formData.interval_seconds_max}
                    onChange={(e) => setFormData({ ...formData, interval_seconds_max: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Horário início</Label>
                  <Input
                    type="time"
                    value={formData.active_hours_start}
                    onChange={(e) => setFormData({ ...formData, active_hours_start: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Horário fim</Label>
                  <Input
                    type="time"
                    value={formData.active_hours_end}
                    onChange={(e) => setFormData({ ...formData, active_hours_end: e.target.value })}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-indigo-600">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingId ? 'Salvar' : 'Criar Campanha'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Pré-visualização de Leads</DialogTitle>
            <DialogDescription>Leads que serão contatados nesta campanha</DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            {previewLeads.length === 0 ? (
              <p className="text-center py-8 text-slate-500">Nenhum lead encontrado com os filtros atuais</p>
            ) : (
              <div className="space-y-2">
                {previewLeads.map((lead) => (
                  <div key={lead.id} className="p-3 border rounded-lg">
                    <p className="font-medium">{lead.name}</p>
                    <p className="text-sm text-slate-500">{lead.phone} • Score: {lead.score}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}