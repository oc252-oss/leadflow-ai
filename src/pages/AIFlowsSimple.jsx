import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Bot, Plus, Pencil, Trash2, Search, Edit3 } from 'lucide-react';
import { toast } from 'sonner';

const flowTypes = [
  { value: 'qualification', label: 'Qualificação' },
  { value: 'reengagement_7d', label: 'Reengajamento 7 dias' },
  { value: 'reengagement_30d', label: 'Reengajamento 30 dias' },
  { value: 'prospection', label: 'Prospecção Ativa' }
];

export default function AIFlowsSimple() {
  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingFlow, setEditingFlow] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'qualification',
    messages: {
      greeting: '',
      outside_hours: '',
      handoff: ''
    },
    is_active: true
  });

  useEffect(() => {
    loadFlows();
  }, []);

  const loadFlows = async () => {
    try {
      setLoading(true);
      const data = await base44.entities.AIFlow.list('-created_date', 100);
      setFlows(data || []);
    } catch (error) {
      console.error('Error loading flows:', error);
      toast.error('Erro ao carregar fluxos');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!formData.name?.trim()) {
        toast.error('Nome do fluxo é obrigatório');
        return;
      }

      if (!formData.type) {
        toast.error('Tipo de fluxo é obrigatório');
        return;
      }

      const dataToSave = {
        ...formData,
        name: formData.name.trim()
      };

      if (editingFlow) {
        await base44.entities.AIFlow.update(editingFlow.id, dataToSave);
        toast.success('Fluxo atualizado com sucesso');
      } else {
        await base44.entities.AIFlow.create(dataToSave);
        toast.success('Fluxo criado com sucesso');
      }

      await loadFlows();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving flow:', error);
      toast.error(`Erro ao salvar fluxo: ${error.message || 'Tente novamente'}`);
    }
  };

  const handleEdit = (flow) => {
    setEditingFlow(flow);
    setFormData({
      name: flow.name || '',
      description: flow.description || '',
      type: flow.type || 'qualification',
      messages: flow.messages || {
        greeting: '',
        outside_hours: '',
        handoff: ''
      },
      is_active: flow.is_active !== false
    });
    setShowDialog(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este fluxo?')) return;
    
    try {
      await base44.entities.AIFlow.delete(id);
      toast.success('Fluxo excluído com sucesso');
      await loadFlows();
    } catch (error) {
      console.error('Error deleting flow:', error);
      toast.error('Erro ao excluir fluxo');
    }
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingFlow(null);
    setFormData({
      name: '',
      description: '',
      type: 'qualification',
      messages: {
        greeting: '',
        outside_hours: '',
        handoff: ''
      },
      is_active: true
    });
  };

  const filteredFlows = flows.filter(flow =>
    flow.name?.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="text-3xl font-bold text-slate-900">Fluxos de IA</h1>
          <p className="text-slate-500 mt-1">Configure fluxos de qualificação automática</p>
        </div>
        <Button 
          onClick={() => setShowDialog(true)} 
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Fluxo
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar fluxos..."
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
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFlows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-slate-500">
                  {flows.length === 0 ? 'Nenhum fluxo criado ainda' : 'Nenhum fluxo encontrado'}
                </TableCell>
              </TableRow>
            ) : (
              filteredFlows.map((flow) => (
                <TableRow key={flow.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4 text-indigo-600" />
                      {flow.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {flowTypes.find(t => t.value === flow.type)?.label || flow.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={flow.is_active ? 'default' : 'secondary'}>
                      {flow.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => window.location.href = createPageUrl(`AIFlowEditor?flowId=${flow.id}`)}
                        title="Editor visual"
                      >
                        <Edit3 className="w-4 h-4 text-indigo-600" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(flow)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(flow.id)}>
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
            <DialogTitle>{editingFlow ? 'Editar Fluxo de IA' : 'Novo Fluxo de IA'}</DialogTitle>
            <DialogDescription>
              Configure um novo fluxo de qualificação automática
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome do fluxo"
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {flowTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição do fluxo"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Mensagem de Saudação</Label>
              <Textarea
                value={formData.messages.greeting}
                onChange={(e) => setFormData({
                  ...formData,
                  messages: { ...formData.messages, greeting: e.target.value }
                })}
                placeholder="Primeira mensagem do assistente"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Mensagem Fora do Horário</Label>
              <Textarea
                value={formData.messages.outside_hours}
                onChange={(e) => setFormData({
                  ...formData,
                  messages: { ...formData.messages, outside_hours: e.target.value }
                })}
                placeholder="Mensagem para fora do horário comercial"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Mensagem de Transferência</Label>
              <Textarea
                value={formData.messages.handoff}
                onChange={(e) => setFormData({
                  ...formData,
                  messages: { ...formData.messages, handoff: e.target.value }
                })}
                placeholder="Mensagem antes de transferir para atendimento humano"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700">
              {editingFlow ? 'Atualizar' : 'Criar'} Fluxo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}