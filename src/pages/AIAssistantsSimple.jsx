import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Bot, Plus, Pencil, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';

const usageTypes = [
  { value: 'qualification', label: 'Qualificação' },
  { value: 'reengagement_7d', label: 'Reengajamento 7 dias' },
  { value: 'reengagement_30d', label: 'Reengajamento 30 dias' },
  { value: 'prospection', label: 'Prospecção Ativa' }
];

const channels = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'voice', label: 'Voz' }
];

const tones = [
  { value: 'neutro', label: 'Neutro' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'elegante', label: 'Elegante' },
  { value: 'humanizado', label: 'Humanizado' }
];

export default function AIAssistantsSimple() {
  const [assistants, setAssistants] = useState([]);
  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingAssistant, setEditingAssistant] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    channel: 'whatsapp',
    usage_type: 'qualification',
    tone: 'elegante',
    ai_flow_id: '',
    is_active: false
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [assistantsData, flowsData] = await Promise.all([
        base44.entities.AIAssistant.list('-created_date', 100).catch(() => []),
        base44.entities.AIFlow.list('-created_date', 100).catch(() => [])
      ]);
      setAssistants(assistantsData || []);
      setFlows(flowsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      // Validations
      if (!formData.name?.trim()) {
        toast.error('Nome do assistente é obrigatório');
        return;
      }

      if (!formData.channel) {
        toast.error('Canal é obrigatório');
        return;
      }

      if (!formData.usage_type) {
        toast.error('Tipo de uso é obrigatório');
        return;
      }

      if (!formData.ai_flow_id) {
        toast.error('Fluxo de IA é obrigatório');
        return;
      }

      const dataToSave = {
        ...formData,
        name: formData.name.trim()
      };

      if (editingAssistant) {
        await base44.entities.AIAssistant.update(editingAssistant.id, dataToSave);
        toast.success('Assistente atualizado com sucesso');
      } else {
        await base44.entities.AIAssistant.create(dataToSave);
        toast.success('Assistente criado com sucesso! Você já pode usá-lo em canais.');
      }

      await loadData();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving assistant:', error);
      toast.error(`Erro ao salvar assistente: ${error.message || 'Tente novamente'}`);
    }
  };

  const handleEdit = (assistant) => {
    setEditingAssistant(assistant);
    setFormData({
      name: assistant.name || '',
      description: assistant.description || '',
      channel: assistant.channel || 'whatsapp',
      usage_type: assistant.usage_type || 'qualification',
      tone: assistant.tone || 'elegante',
      ai_flow_id: assistant.ai_flow_id || '',
      is_active: assistant.is_active !== false
    });
    setShowDialog(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este assistente?')) return;
    
    try {
      await base44.entities.AIAssistant.delete(id);
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
      name: '',
      description: '',
      channel: 'whatsapp',
      usage_type: 'qualification',
      tone: 'elegante',
      ai_flow_id: '',
      is_active: false
    });
  };

  const getFlowName = (flowId) => {
    return flows.find(f => f.id === flowId)?.name || flowId;
  };

  const filteredAssistants = assistants.filter(assistant =>
    assistant.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h1 className="text-3xl font-bold text-slate-900">Assistentes de IA</h1>
          <p className="text-slate-500 mt-1">Crie e gerencie assistentes de IA para seus canais</p>
        </div>
        <Button 
          onClick={() => setShowDialog(true)} 
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Assistente
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar assistentes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Canal</TableHead>
              <TableHead>Tipo de Uso</TableHead>
              <TableHead>Fluxo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAssistants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                  {assistants.length === 0 ? 'Nenhum assistente criado ainda' : 'Nenhum assistente encontrado'}
                </TableCell>
              </TableRow>
            ) : (
              filteredAssistants.map((assistant) => (
                <TableRow key={assistant.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4 text-indigo-600" />
                      {assistant.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {channels.find(c => c.value === assistant.channel)?.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {usageTypes.find(t => t.value === assistant.usage_type)?.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {getFlowName(assistant.ai_flow_id)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={assistant.is_active ? 'default' : 'secondary'}>
                      {assistant.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(assistant)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(assistant.id)}>
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingAssistant ? 'Editar Assistente' : 'Novo Assistente'}</DialogTitle>
            <DialogDescription>
              Crie um novo assistente de IA para atender seus clientes
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome do assistente"
              />
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição breve do assistente"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Canal *</Label>
                <Select value={formData.channel} onValueChange={(value) => setFormData({ ...formData, channel: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {channels.map(channel => (
                      <SelectItem key={channel.value} value={channel.value}>{channel.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tipo de Uso *</Label>
                <Select value={formData.usage_type} onValueChange={(value) => setFormData({ ...formData, usage_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {usageTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tom *</Label>
                <Select value={formData.tone} onValueChange={(value) => setFormData({ ...formData, tone: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tones.map(tone => (
                      <SelectItem key={tone.value} value={tone.value}>{tone.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Fluxo de IA *</Label>
                <Select value={formData.ai_flow_id} onValueChange={(value) => setFormData({ ...formData, ai_flow_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um fluxo" />
                  </SelectTrigger>
                  <SelectContent>
                    {flows.map(flow => (
                      <SelectItem key={flow.id} value={flow.id}>{flow.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <Label>Ativo</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700">
              {editingAssistant ? 'Atualizar' : 'Criar'} Assistente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}