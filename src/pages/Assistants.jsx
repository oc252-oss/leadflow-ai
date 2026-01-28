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

  const [formData, setFormData] = useState({
    name: '',
    description: '',
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
    await base44.entities.Assistant.update(assistant.id, {
      is_active: !assistant.is_active
    });
    await loadData();
  };

  const filteredAssistants = assistants.filter(a =>
    a.name?.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (filterChannel === 'all' || a.channel === filterChannel)
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
        <CardContent className="pt-6 flex gap-4">
          <Input
            placeholder="Buscar assistente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </CardContent>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Canal</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Fluxo</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAssistants.map(a => (
              <TableRow key={a.id}>
                <TableCell>{a.name}</TableCell>
                <TableCell>{a.channel}</TableCell>
                <TableCell>
                  <Badge>{a.is_active ? 'Ativo' : 'Inativo'}</Badge>
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
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="general">Geral</TabsTrigger>
              <TabsTrigger value="behavior">Comportamento</TabsTrigger>
              <TabsTrigger value="messages">Mensagens</TabsTrigger>
              <TabsTrigger value="integration">Integração</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4 mt-4">
              <Input
                placeholder="Nome do assistente"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />

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
                  <SelectItem value="">Nenhum</SelectItem>
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
