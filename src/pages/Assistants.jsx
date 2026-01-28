import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, Plus, Pencil, Trash2, MessageSquare, Phone, Zap, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function Assistants() {
  const [assistants, setAssistants] = useState([]);
  const [units, setUnits] = useState([]);
  const [flows, setFlows] = useState([]);
  const [teamMember, setTeamMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingAssistant, setEditingAssistant] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterChannel, setFilterChannel] = useState('all');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    unit_id: '',
    channel: 'whatsapp',
    assistant_type: 'qualificacao',
    tone: 'elegante',
    greeting_message: '',
    system_prompt: '',
    behavior_rules: {
      elegant_tone: true,
      prioritize_evaluation: true,
      no_pricing: false,
      feminine_language: false,
      respect_hours: true
    },
    default_flow_id: '',
    can_use_voice: false,
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
        
        const [assistantsData, unitsData, flowsData] = await Promise.all([
          base44.entities.Assistant.filter({ 
            organization_id: teamMembers[0].organization_id 
          }),
          base44.entities.Unit.filter({ 
            organization_id: teamMembers[0].organization_id 
          }),
          base44.entities.AIConversationFlow.filter({ 
            organization_id: teamMembers[0].organization_id 
          })
        ]);
        
        setAssistants(assistantsData);
        setUnits(unitsData);
        setFlows(flowsData);
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
      if (!formData.name) {
        toast.error('Nome é obrigatório');
        return;
      }

      if (!formData.unit_id) {
        toast.error('Selecione uma unidade. Se não houver unidades, cadastre uma primeiro.');
        return;
      }

      const dataToSave = {
        ...formData,
        organization_id: teamMember.organization_id,
        brand_id: teamMember.brand_id
      };

      if (editingAssistant) {
        await base44.entities.Assistant.update(editingAssistant.id, dataToSave);
        toast.success('Assistente atualizado');
      } else {
        await base44.entities.Assistant.create(dataToSave);
        toast.success('Assistente criado');
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
      name: assistant.name || '',
      description: assistant.description || '',
      unit_id: assistant.unit_id || '',
      channel: assistant.channel || 'whatsapp',
      assistant_type: assistant.assistant_type || 'qualificacao',
      tone: assistant.tone || 'elegante',
      greeting_message: assistant.greeting_message || '',
      system_prompt: assistant.system_prompt || '',
      behavior_rules: assistant.behavior_rules || {
        elegant_tone: true,
        prioritize_evaluation: true,
        no_pricing: false,
        feminine_language: false,
        respect_hours: true
      },
      default_flow_id: assistant.default_flow_id || '',
      can_use_voice: assistant.can_use_voice || false,
      is_active: assistant.is_active || false
    });
    setShowDialog(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este assistente?')) return;
    
    try {
      await base44.entities.Assistant.delete(id);
      toast.success('Assistente excluído');
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
      name: '',
      description: '',
      unit_id: '',
      channel: 'whatsapp',
      assistant_type: 'qualificacao',
      tone: 'elegante',
      greeting_message: '',
      system_prompt: '',
      behavior_rules: {
        elegant_tone: true,
        prioritize_evaluation: true,
        no_pricing: false,
        feminine_language: false,
        respect_hours: true
      },
      default_flow_id: '',
      can_use_voice: false,
      is_active: false
    });
  };

  const toggleActive = async (assistant) => {
    try {
      await base44.entities.Assistant.update(assistant.id, {
        is_active: !assistant.is_active
      });
      await loadData();
      toast.success(assistant.is_active ? 'Assistente desativado' : 'Assistente ativado');
    } catch (error) {
      console.error('Error toggling assistant:', error);
      toast.error('Erro ao atualizar assistente');
    }
  };

  const filteredAssistants = assistants.filter(assistant => {
    const matchesSearch = assistant.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesChannel = filterChannel === 'all' || assistant.channel === filterChannel;
    return matchesSearch && matchesChannel;
  });

  const getUnitName = (unitId) => {
    const unit = units.find(u => u.id === unitId);
    return unit?.name || unitId;
  };

  const channelIcons = {
    whatsapp: MessageSquare,
    voice: Phone,
    webchat: MessageSquare,
    messenger: MessageSquare,
    instagram: MessageSquare
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
          <h1 className="text-3xl font-bold text-slate-900">Assistentes IA</h1>
          <p className="text-slate-500 mt-1">Configure assistentes de IA para chat e voz</p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="bg-indigo-600">
          <Plus className="w-4 h-4 mr-2" />
          Novo Assistente
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar assistentes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={filterChannel} onValueChange={setFilterChannel}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Canal" />
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
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead>Canal</TableHead>
              <TableHead>Tipo de Uso</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Fluxo Padrão</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAssistants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                  Nenhum assistente encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredAssistants.map((assistant) => {
                const ChannelIcon = channelIcons[assistant.channel] || Bot;
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
                      <div className="flex items-center gap-2">
                        <ChannelIcon className="w-4 h-4 text-slate-500" />
                        <span className="capitalize">{assistant.channel}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {assistant.assistant_type?.replace(/_/g, ' ') || '-'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={assistant.is_active ? 'default' : 'secondary'}>
                        {assistant.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {assistant.default_flow_id ? (
                        <Badge variant="outline">Configurado</Badge>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(assistant)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => toggleActive(assistant)}
                        >
                          <Zap className={`w-4 h-4 ${assistant.is_active ? 'text-green-600' : 'text-slate-400'}`} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(assistant.id)}>
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAssistant ? 'Editar Assistente' : 'Novo Assistente'}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">Geral</TabsTrigger>
              <TabsTrigger value="behavior">Comportamento</TabsTrigger>
              <TabsTrigger value="messages">Mensagens</TabsTrigger>
              <TabsTrigger value="integration">Integração</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Assistente WhatsApp Clínica SP"
                />
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Unidade *</Label>
                  <Select 
                    value={formData.unit_id} 
                    onValueChange={(value) => setFormData({ ...formData, unit_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a unidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.length === 0 ? (
                        <div className="p-4 text-sm text-slate-500 text-center">
                          Nenhuma unidade cadastrada
                        </div>
                      ) : (
                        units.map(unit => (
                          <SelectItem key={unit.id} value={unit.id}>{unit.name}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {units.length === 0 && (
                    <p className="text-xs text-amber-600">
                      ⚠️ Cadastre uma unidade antes de criar assistentes
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Canal</Label>
                  <Select 
                    value={formData.channel} 
                    onValueChange={(value) => {
                      setFormData({ 
                        ...formData, 
                        channel: value,
                        can_use_voice: value === 'voice'
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="voice">Voz</SelectItem>
                      <SelectItem value="webchat">WebChat</SelectItem>
                      <SelectItem value="messenger">Messenger</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Uso</Label>
                  <Select 
                    value={formData.assistant_type} 
                    onValueChange={(value) => setFormData({ ...formData, assistant_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="qualificacao">Qualificação</SelectItem>
                      <SelectItem value="reengajamento_7d">Reengajamento 7 dias</SelectItem>
                      <SelectItem value="reengajamento_30d">Reengajamento 30 dias</SelectItem>
                      <SelectItem value="reengajamento_90d">Reengajamento 90 dias</SelectItem>
                      <SelectItem value="prospeccao_ativa">Prospecção Ativa</SelectItem>
                      <SelectItem value="voz_reativacao">Voz - Reativação</SelectItem>
                      <SelectItem value="voz_qualificacao">Voz - Qualificação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tom de Comunicação</Label>
                  <Select 
                    value={formData.tone} 
                    onValueChange={(value) => setFormData({ ...formData, tone: value })}
                  >
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
              </div>

              <div className="space-y-2">
                <Label>Fluxo de IA Padrão</Label>
                <Select 
                  value={formData.default_flow_id} 
                  onValueChange={(value) => setFormData({ ...formData, default_flow_id: value })}
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

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label>Assistente Ativo</Label>
                  <p className="text-xs text-slate-500 mt-1">
                    Ativa o assistente em produção
                  </p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </TabsContent>

            <TabsContent value="behavior" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Prompt do Sistema</Label>
                <Textarea
                  value={formData.system_prompt}
                  onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                  placeholder="Instruções detalhadas de como a IA deve se comportar..."
                  rows={8}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-slate-500">
                  Define o comportamento base do assistente
                </p>
              </div>

              <div className="space-y-3">
                <Label>Regras de Comportamento</Label>
                
                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="text-sm font-medium">Tom Elegante</p>
                    <p className="text-xs text-slate-500">Usa linguagem formal e elegante</p>
                  </div>
                  <Switch
                    checked={formData.behavior_rules.elegant_tone}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      behavior_rules: { ...formData.behavior_rules, elegant_tone: checked }
                    })}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="text-sm font-medium">Priorizar Avaliação</p>
                    <p className="text-xs text-slate-500">Sempre oferece agendamento de avaliação</p>
                  </div>
                  <Switch
                    checked={formData.behavior_rules.prioritize_evaluation}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      behavior_rules: { ...formData.behavior_rules, prioritize_evaluation: checked }
                    })}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="text-sm font-medium">Não Falar Preços</p>
                    <p className="text-xs text-slate-500">Evita mencionar valores</p>
                  </div>
                  <Switch
                    checked={formData.behavior_rules.no_pricing}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      behavior_rules: { ...formData.behavior_rules, no_pricing: checked }
                    })}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="text-sm font-medium">Linguagem Feminina</p>
                    <p className="text-xs text-slate-500">Usa pronomes femininos (ela/dela)</p>
                  </div>
                  <Switch
                    checked={formData.behavior_rules.feminine_language}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      behavior_rules: { ...formData.behavior_rules, feminine_language: checked }
                    })}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="text-sm font-medium">Respeitar Horário</p>
                    <p className="text-xs text-slate-500">Não responde fora do horário comercial</p>
                  </div>
                  <Switch
                    checked={formData.behavior_rules.respect_hours}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      behavior_rules: { ...formData.behavior_rules, respect_hours: checked }
                    })}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="messages" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Mensagem de Saudação</Label>
                <Textarea
                  value={formData.greeting_message}
                  onChange={(e) => setFormData({ ...formData, greeting_message: e.target.value })}
                  placeholder="Olá! Bem-vindo à clínica..."
                  rows={4}
                />
                <p className="text-xs text-slate-500">
                  Primeira mensagem enviada ao lead
                </p>
              </div>
            </TabsContent>

            <TabsContent value="integration" className="space-y-4 mt-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-600">
                  Configurações de integração com canais serão disponibilizadas aqui.
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-indigo-600">
              {editingAssistant ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}