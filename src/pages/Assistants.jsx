import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, Plus, Pencil, Trash2, MessageSquare, Phone, Zap, Search } from 'lucide-react';
import { toast } from 'sonner';
import { getDefaultOrganization } from '@/components/singleCompanyMode';

export default function Assistants() {
  const [assistants, setAssistants] = useState([]);
  const [organization, setOrganization] = useState(null);
  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingAssistant, setEditingAssistant] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterChannel, setFilterChannel] = useState('all');
  const [filterUsageType, setFilterUsageType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    channel: 'whatsapp',
    assistant_type: 'qualificacao',
    tone: 'elegante',
    formality_level: 'high',
    greeting_message: '',
    system_prompt: '',
    behavior_rules: {
      elegant_tone: true,
      prioritize_evaluation: true,
      no_pricing: false,
      feminine_language: false,
      respect_hours: true
    },
    response_restrictions: {
      avoid_pricing: false,
      avoid_personal_info: false,
      require_confirmation: false
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

      const org = await getDefaultOrganization();
      setOrganization(org);

      if (!org) {
        toast.error('Organização não encontrada');
        return;
      }

      const [assistantsData, flowsData] = await Promise.all([
        base44.entities.Assistant.filter({ organization_id: org.id }),
        base44.entities.AIConversationFlow.list() // 🔥 CORREÇÃO AQUI
      ]);

      setAssistants(assistantsData || []);
      setFlows(flowsData || []);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!formData.name.trim()) {
        toast.error('Nome é obrigatório');
        return;
      }

      if (!organization) {
        toast.error('Organização não carregada');
        return;
      }

      const payload = {
        ...formData,
        organization_id: organization.id,
        brand_id: organization.id,
        default_flow_id: formData.default_flow_id || null
      };

      if (editingAssistant) {
        await base44.entities.Assistant.update(editingAssistant.id, payload);
        toast.success('Assistente atualizado');
      } else {
        await base44.entities.Assistant.create(payload);
        toast.success('Assistente criado com sucesso');
      }

      await loadData();
      handleCloseDialog();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar assistente');
    }
  };

  const handleEdit = (assistant) => {
    setEditingAssistant(assistant);
    setFormData({
      ...assistant,
      default_flow_id: assistant.default_flow_id || ''
    });
    setShowDialog(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Deseja excluir este assistente?')) return;
    await base44.entities.Assistant.delete(id);
    await loadData();
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingAssistant(null);
    setFormData({
      name: '',
      description: '',
      channel: 'whatsapp',
      assistant_type: 'qualificacao',
      tone: 'elegante',
      formality_level: 'high',
      greeting_message: '',
      system_prompt: '',
      behavior_rules: {
        elegant_tone: true,
        prioritize_evaluation: true,
        no_pricing: false,
        feminine_language: false,
        respect_hours: true
      },
      response_restrictions: {
        avoid_pricing: false,
        avoid_personal_info: false,
        require_confirmation: false
      },
      default_flow_id: '',
      can_use_voice: false,
      is_active: false
    });
  };

  const toggleActive = async (assistant) => {
    await base44.entities.Assistant.update(assistant.id, {
      is_active: !assistant.is_active
    });
    await loadData();
  };

  const filteredAssistants = assistants.filter(a =>
    a.name?.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (filterChannel === 'all' || a.channel === filterChannel) &&
    (filterUsageType === 'all' || a.assistant_type === filterUsageType) &&
    (filterStatus === 'all' || (filterStatus === 'active' ? a.is_active : !a.is_active))
  );

  if (loading) {
    return <div className="flex justify-center py-20">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Assistentes IA</h1>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="w-4 h-4 mr-2" /> Novo Assistente
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-3">
          <Input
            placeholder="Buscar assistente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="flex gap-3">
            <Select value={filterUsageType} onValueChange={setFilterUsageType}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Tipo de uso" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="qualificacao">Qualificação</SelectItem>
                <SelectItem value="reengajamento_7d">Reengajamento 7d</SelectItem>
                <SelectItem value="reengajamento_30d">Reengajamento 30d</SelectItem>
                <SelectItem value="reengajamento_90d">Reengajamento 90d</SelectItem>
                <SelectItem value="prospeccao_ativa">Prospecção Ativa</SelectItem>
                <SelectItem value="voz_reativacao">Voz - Reativação</SelectItem>
                <SelectItem value="voz_qualificacao">Voz - Qualificação</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Canal</TableHead>
              <TableHead>Tipo de Uso</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Fluxo</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAssistants.map(a => (
              <TableRow key={a.id}>
                <TableCell>{a.name}</TableCell>
                <TableCell className="capitalize">{a.channel}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {a.assistant_type?.replace(/_/g, ' ') || '-'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={a.is_active ? 'default' : 'secondary'}>{a.is_active ? 'Ativo' : 'Inativo'}</Badge>
                </TableCell>
                <TableCell>
                  {a.default_flow_id ? 'Configurado' : '-'}
                </TableCell>
                <TableCell className="flex gap-2">
                  <Button size="icon" variant="ghost" onClick={() => handleEdit(a)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => toggleActive(a)}>
                    <Zap className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(a.id)}>
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{editingAssistant ? 'Editar Assistente' : 'Novo Assistente'}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="general">
            <TabsList className="grid grid-cols-5">
              <TabsTrigger value="general">Geral</TabsTrigger>
              <TabsTrigger value="behavior">Comportamento</TabsTrigger>
              <TabsTrigger value="voice">Voz</TabsTrigger>
              <TabsTrigger value="messages">Mensagens</TabsTrigger>
              <TabsTrigger value="restrictions">Restrições</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4 mt-4">
              <Input
                placeholder="Nome do assistente"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />

              <Textarea
                placeholder="Descrição (opcional)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />

              <Select
                value={formData.channel}
                onValueChange={(v) => setFormData({ ...formData, channel: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Canal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="voice">Voz</SelectItem>
                  <SelectItem value="webchat">WebChat</SelectItem>
                  <SelectItem value="messenger">Messenger</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={formData.assistant_type}
                onValueChange={(v) => setFormData({ ...formData, assistant_type: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de uso" />
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

              <Select
                value={formData.default_flow_id}
                onValueChange={(v) =>
                  setFormData({ ...formData, default_flow_id: v || '' })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Fluxo padrão (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {flows.map(flow => (
                    <SelectItem key={flow.id} value={flow.id}>
                      {flow.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex justify-between items-center">
                <Label>Ativo</Label>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(v) =>
                    setFormData({ ...formData, is_active: v })
                  }
                />
              </div>
            </TabsContent>

            <TabsContent value="voice" className="space-y-4 mt-4">
              <Select
                value={formData.tone}
                onValueChange={(v) => setFormData({ ...formData, tone: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tom de voz" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="neutro">Neutro</SelectItem>
                  <SelectItem value="comercial">Comercial</SelectItem>
                  <SelectItem value="elegante">Elegante</SelectItem>
                  <SelectItem value="humanizado">Humanizado</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={formData.formality_level}
                onValueChange={(v) => setFormData({ ...formData, formality_level: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Nível de formalidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixo (informal)</SelectItem>
                  <SelectItem value="medium">Médio (semi-formal)</SelectItem>
                  <SelectItem value="high">Alto (muito formal)</SelectItem>
                </SelectContent>
              </Select>
            </TabsContent>

            <TabsContent value="restrictions" className="space-y-4 mt-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="text-sm font-medium">Evitar Preços</p>
                    <p className="text-xs text-slate-500">Não menciona valores ou preços</p>
                  </div>
                  <Switch
                    checked={formData.response_restrictions.avoid_pricing}
                    onCheckedChange={(v) => setFormData({
                      ...formData,
                      response_restrictions: { ...formData.response_restrictions, avoid_pricing: v }
                    })}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="text-sm font-medium">Evitar Dados Pessoais</p>
                    <p className="text-xs text-slate-500">Não solicita informações sensíveis</p>
                  </div>
                  <Switch
                    checked={formData.response_restrictions.avoid_personal_info}
                    onCheckedChange={(v) => setFormData({
                      ...formData,
                      response_restrictions: { ...formData.response_restrictions, avoid_personal_info: v }
                    })}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="text-sm font-medium">Exigir Confirmação</p>
                    <p className="text-xs text-slate-500">Pede confirmação antes de ações</p>
                  </div>
                  <Switch
                    checked={formData.response_restrictions.require_confirmation}
                    onCheckedChange={(v) => setFormData({
                      ...formData,
                      response_restrictions: { ...formData.response_restrictions, require_confirmation: v }
                    })}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}