import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Bot, Plus, Pencil, Trash2, MessageSquare, Phone, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '../utils';

export default function AssistentesIA() {
  const [assistants, setAssistants] = useState([]);
  const [flows, setFlows] = useState([]);
  const [voiceCampaigns, setVoiceCampaigns] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingAssistant, setEditingAssistant] = useState(null);
  const [teamMember, setTeamMember] = useState(null);

  const [formData, setFormData] = useState({
    organization_id: '',
    brand_id: '',
    unit_id: '',
    name: '',
    description: '',
    status: 'training',
    channel: 'whatsapp',
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
    is_active: false
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const user = await base44.auth.me();
      const teamMembers = await base44.entities.TeamMember.filter({ user_email: user.email });
      
      if (teamMembers.length > 0) {
        setTeamMember(teamMembers[0]);
        
        const [assistantsData, flowsData, voiceCampaignsData, unitsData] = await Promise.all([
          base44.entities.Assistant.filter({ organization_id: teamMembers[0].organization_id }),
          base44.entities.AIConversationFlow.filter({ organization_id: teamMembers[0].organization_id }),
          base44.entities.VoiceCampaign.filter({ organization_id: teamMembers[0].organization_id }),
          base44.entities.Unit.filter({ organization_id: teamMembers[0].organization_id })
        ]);
        
        setAssistants(assistantsData);
        setFlows(flowsData);
        setVoiceCampaigns(voiceCampaignsData);
        setUnits(unitsData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!formData.name || !formData.organization_id || !formData.brand_id || !formData.unit_id) {
        toast.error('Preencha todos os campos obrigatórios');
        return;
      }

      if (editingAssistant) {
        await base44.entities.Assistant.update(editingAssistant.id, formData);
        toast.success('Assistente atualizado com sucesso');
      } else {
        await base44.entities.Assistant.create(formData);
        toast.success('Assistente criado com sucesso');
      }

      await loadData();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving assistant:', error);
      toast.error('Erro ao salvar assistente');
    }
  };

  const handleEdit = (assistant) => {
    setEditingAssistant(assistant);
    setFormData({
      organization_id: assistant.organization_id,
      brand_id: assistant.brand_id,
      unit_id: assistant.unit_id,
      name: assistant.name || '',
      description: assistant.description || '',
      status: assistant.status || 'training',
      channel: assistant.channel || 'whatsapp',
      default_flow_id: assistant.default_flow_id || '',
      greeting_message: assistant.greeting_message || '',
      system_prompt: assistant.system_prompt || '',
      behavior_rules: assistant.behavior_rules || formData.behavior_rules,
      is_active: assistant.is_active || false
    });
    setShowDialog(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este assistente?')) return;
    
    try {
      await base44.entities.Assistant.delete(id);
      toast.success('Assistente excluído com sucesso');
      await loadData();
    } catch (error) {
      console.error('Error deleting assistant:', error);
      toast.error('Erro ao excluir assistente');
    }
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingAssistant(null);
    setFormData({
      organization_id: teamMember?.organization_id || '',
      brand_id: teamMember?.brand_id || '',
      unit_id: teamMember?.unit_id || '',
      name: '',
      description: '',
      status: 'training',
      channel: 'whatsapp',
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
      is_active: false
    });
  };

  const getUnitName = (unitId) => {
    const unit = units.find(u => u.id === unitId);
    return unit?.name || unitId;
  };

  const channelIcons = {
    whatsapp: MessageSquare,
    messenger: MessageSquare,
    webchat: MessageSquare,
    instagram: MessageSquare,
    voice: Phone
  };

  const statusColors = {
    training: 'bg-amber-100 text-amber-700',
    active: 'bg-green-100 text-green-700',
    inactive: 'bg-slate-100 text-slate-700'
  };

  const statusLabels = {
    training: 'Treinamento',
    active: 'Ativo',
    inactive: 'Inativo'
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Assistentes IA</h1>
          <p className="text-sm text-slate-600 mt-1">
            Gerencie seus assistentes de chat e voz
          </p>
        </div>
        <Button 
          onClick={() => {
            setFormData({
              ...formData,
              organization_id: teamMember?.organization_id || '',
              brand_id: teamMember?.brand_id || '',
              unit_id: teamMember?.unit_id || ''
            });
            setShowDialog(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Assistente
        </Button>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Canal</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assistants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                  Nenhum assistente criado ainda
                </TableCell>
              </TableRow>
            ) : (
              assistants.map((assistant) => {
                const Icon = channelIcons[assistant.channel] || Bot;
                return (
                  <TableRow key={assistant.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Bot className="w-4 h-4 text-indigo-600" />
                        {assistant.name}
                      </div>
                    </TableCell>
                    <TableCell>{getUnitName(assistant.unit_id)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {assistant.channel === 'voice' ? 'Voz' : 'Chat'}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-slate-500" />
                        {assistant.channel}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[assistant.status]}>
                        {statusLabels[assistant.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => window.location.href = createPageUrl('TreinarAssistente')}
                        >
                          <Zap className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleEdit(assistant)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDelete(assistant.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAssistant ? 'Editar Assistente' : 'Novo Assistente'}
            </DialogTitle>
            <DialogDescription>
              Configure o assistente de IA para atendimento
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Assistente Principal"
                />
              </div>
              <div className="space-y-2">
                <Label>Unidade *</Label>
                <Select 
                  value={formData.unit_id} 
                  onValueChange={(v) => setFormData({ ...formData, unit_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map(unit => (
                      <SelectItem key={unit.id} value={unit.id}>{unit.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição do assistente"
                rows={2}
              />
            </div>

            {/* Channel & Type */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Canal Principal</Label>
                <Select 
                  value={formData.channel} 
                  onValueChange={(v) => setFormData({ ...formData, channel: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="messenger">Messenger</SelectItem>
                    <SelectItem value="webchat">WebChat</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="voice">Voz</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(v) => setFormData({ ...formData, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="training">Treinamento</SelectItem>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Flow Association */}
            <div className="space-y-2">
              <Label>Fluxo de IA Padrão</Label>
              <Select 
                value={formData.default_flow_id} 
                onValueChange={(v) => setFormData({ ...formData, default_flow_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um fluxo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Nenhum</SelectItem>
                  {flows.map(flow => (
                    <SelectItem key={flow.id} value={flow.id}>{flow.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Messages */}
            <div className="space-y-2">
              <Label>Primeira Mensagem</Label>
              <Textarea
                value={formData.greeting_message}
                onChange={(e) => setFormData({ ...formData, greeting_message: e.target.value })}
                placeholder="Olá! Como posso ajudá-lo(a) hoje?"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Prompt do Sistema</Label>
              <Textarea
                value={formData.system_prompt}
                onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                placeholder="Instruções de comportamento para o assistente..."
                rows={6}
              />
            </div>

            {/* Behavior Rules */}
            <div className="space-y-3 p-4 border rounded-lg">
              <Label className="text-sm font-medium">Regras de Comportamento</Label>
              
              <div className="flex items-center justify-between">
                <Label className="text-sm font-normal">Tom elegante e comercial</Label>
                <Switch
                  checked={formData.behavior_rules.elegant_tone}
                  onCheckedChange={(v) => setFormData({ 
                    ...formData, 
                    behavior_rules: { ...formData.behavior_rules, elegant_tone: v }
                  })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label className="text-sm font-normal">Priorizar convite para avaliação</Label>
                <Switch
                  checked={formData.behavior_rules.prioritize_evaluation}
                  onCheckedChange={(v) => setFormData({ 
                    ...formData, 
                    behavior_rules: { ...formData.behavior_rules, prioritize_evaluation: v }
                  })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label className="text-sm font-normal">Não mencionar preços</Label>
                <Switch
                  checked={formData.behavior_rules.no_pricing}
                  onCheckedChange={(v) => setFormData({ 
                    ...formData, 
                    behavior_rules: { ...formData.behavior_rules, no_pricing: v }
                  })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label className="text-sm font-normal">Linguagem feminina</Label>
                <Switch
                  checked={formData.behavior_rules.feminine_language}
                  onCheckedChange={(v) => setFormData({ 
                    ...formData, 
                    behavior_rules: { ...formData.behavior_rules, feminine_language: v }
                  })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label className="text-sm font-normal">Respeitar horário comercial</Label>
                <Switch
                  checked={formData.behavior_rules.respect_hours}
                  onCheckedChange={(v) => setFormData({ 
                    ...formData, 
                    behavior_rules: { ...formData.behavior_rules, respect_hours: v }
                  })}
                />
              </div>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label>Ativo em Produção</Label>
                <p className="text-xs text-slate-500 mt-1">
                  Permite que o assistente atenda conversas reais
                </p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700">
              {editingAssistant ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}