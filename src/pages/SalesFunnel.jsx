import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { GripVertical, Plus, Pencil, Trash2, Check, AlertCircle, Target, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';

export default function SalesFunnel() {
  const [stages, setStages] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingStage, setEditingStage] = useState(null);

  const [formData, setFormData] = useState({
    stage_name: '',
    color: '#6366f1',
    is_active: true,
    is_initial: false,
    is_success: false,
    is_lost: false
  });

  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      loadStages();
    }
  }, [selectedCompany]);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const companiesData = await base44.entities.Company.list();
      setCompanies(companiesData);
      
      if (companiesData.length > 0) {
        const user = await base44.auth.me();
        const teamMembers = await base44.entities.TeamMember.filter({ user_email: user.email });
        
        if (teamMembers.length > 0) {
          setSelectedCompany(teamMembers[0].company_id);
        } else {
          setSelectedCompany(companiesData[0].id);
        }
      }
    } catch (error) {
      toast.error('Erro ao carregar empresas');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadStages = async () => {
    try {
      setLoading(true);
      const stagesData = await base44.entities.FunnelStage.filter(
        { company_id: selectedCompany },
        'position',
        100
      );
      setStages(stagesData);
    } catch (error) {
      toast.error('Erro ao carregar estágios');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!formData.stage_name) {
        toast.error('Nome do estágio é obrigatório');
        return;
      }

      const position = editingStage ? editingStage.position : stages.length;

      const dataToSave = {
        company_id: selectedCompany,
        stage_name: formData.stage_name,
        position: position,
        color: formData.color,
        is_active: formData.is_active,
        is_initial: formData.is_initial,
        is_success: formData.is_success,
        is_lost: formData.is_lost
      };

      if (editingStage) {
        await base44.entities.FunnelStage.update(editingStage.id, dataToSave);
        toast.success('Estágio atualizado com sucesso');
      } else {
        await base44.entities.FunnelStage.create(dataToSave);
        toast.success('Estágio criado com sucesso');
      }

      await loadStages();
      handleCloseDialog();
    } catch (error) {
      toast.error('Erro ao salvar estágio');
      console.error(error);
    }
  };

  const handleEdit = (stage) => {
    setEditingStage(stage);
    setFormData({
      stage_name: stage.stage_name || '',
      color: stage.color || '#6366f1',
      is_active: stage.is_active !== false,
      is_initial: stage.is_initial || false,
      is_success: stage.is_success || false,
      is_lost: stage.is_lost || false
    });
    setShowDialog(true);
  };

  const handleDelete = async (stage) => {
    if (!confirm(`Tem certeza que deseja excluir o estágio "${stage.stage_name}"?`)) return;
    
    try {
      await base44.entities.FunnelStage.delete(stage.id);
      toast.success('Estágio excluído com sucesso');
      await loadStages();
      
      // Reorder remaining stages
      const remaining = stages.filter(s => s.id !== stage.id);
      for (let i = 0; i < remaining.length; i++) {
        if (remaining[i].position !== i) {
          await base44.entities.FunnelStage.update(remaining[i].id, { position: i });
        }
      }
    } catch (error) {
      toast.error('Erro ao excluir estágio');
      console.error(error);
    }
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingStage(null);
    setFormData({
      stage_name: '',
      color: '#6366f1',
      is_active: true,
      is_initial: false,
      is_success: false,
      is_lost: false
    });
  };

  const handleToggleActive = async (stage) => {
    try {
      await base44.entities.FunnelStage.update(stage.id, {
        is_active: !stage.is_active
      });
      toast.success('Status atualizado');
      await loadStages();
    } catch (error) {
      toast.error('Erro ao atualizar status');
      console.error(error);
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const items = Array.from(stages);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update local state immediately for better UX
    setStages(items);

    // Update positions in database
    try {
      for (let i = 0; i < items.length; i++) {
        if (items[i].position !== i) {
          await base44.entities.FunnelStage.update(items[i].id, { position: i });
        }
      }
      toast.success('Ordem atualizada');
    } catch (error) {
      toast.error('Erro ao atualizar ordem');
      await loadStages(); // Reload on error
    }
  };

  const getStageIcon = (stage) => {
    if (stage.is_initial) return <Target className="w-4 h-4 text-blue-600" />;
    if (stage.is_success) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (stage.is_lost) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Funil de Vendas</h1>
          <p className="text-slate-500 mt-1">Configure os estágios do funil para sua empresa</p>
        </div>
        <Button 
          onClick={() => setShowDialog(true)} 
          className="bg-indigo-600 hover:bg-indigo-700"
          disabled={!selectedCompany}
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Estágio
        </Button>
      </div>

      {/* Company Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <Label>Empresa</Label>
            <Select value={selectedCompany} onValueChange={setSelectedCompany}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma empresa" />
              </SelectTrigger>
              <SelectContent>
                {companies.map(company => (
                  <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stages List */}
      {selectedCompany && (
        <Card>
          <CardHeader>
            <CardTitle>Estágios do Funil ({stages.length})</CardTitle>
            <CardDescription>
              Arraste para reordenar os estágios
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stages.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">Nenhum estágio configurado</p>
                <Button 
                  onClick={() => setShowDialog(true)} 
                  variant="outline" 
                  className="mt-4"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Estágio
                </Button>
              </div>
            ) : (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="stages">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-2"
                    >
                      {stages.map((stage, index) => (
                        <Draggable key={stage.id} draggableId={stage.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`flex items-center gap-3 p-4 border rounded-lg bg-white transition-shadow ${
                                snapshot.isDragging ? 'shadow-lg' : ''
                              }`}
                            >
                              <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                                <GripVertical className="w-5 h-5 text-slate-400" />
                              </div>

                              <div
                                className="w-1 h-12 rounded"
                                style={{ backgroundColor: stage.color }}
                              />

                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{stage.stage_name}</span>
                                  {getStageIcon(stage)}
                                  {stage.is_initial && (
                                    <Badge variant="secondary" className="text-xs">Inicial</Badge>
                                  )}
                                  {stage.is_success && (
                                    <Badge className="bg-green-100 text-green-800 text-xs">Sucesso</Badge>
                                  )}
                                  {stage.is_lost && (
                                    <Badge className="bg-red-100 text-red-800 text-xs">Perdido</Badge>
                                  )}
                                </div>
                                <div className="text-sm text-slate-500 mt-1">
                                  Posição: {index + 1}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={stage.is_active}
                                  onCheckedChange={() => handleToggleActive(stage)}
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(stage)}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(stage)}
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingStage ? 'Editar Estágio' : 'Novo Estágio'}</DialogTitle>
            <DialogDescription>
              Configure o estágio do funil de vendas
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Estágio *</Label>
              <Input
                value={formData.stage_name}
                onChange={(e) => setFormData({ ...formData, stage_name: e.target.value })}
                placeholder="Ex: Novo Lead, Qualificado, Proposta Enviada"
              />
            </div>

            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-20 h-10"
                />
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="#6366f1"
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label>Ativo</Label>
                  <p className="text-xs text-slate-500">Estágio disponível para uso</p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-blue-600" />
                    Estágio Inicial
                  </Label>
                  <p className="text-xs text-slate-500">Novos leads começam aqui</p>
                </div>
                <Switch
                  checked={formData.is_initial}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_initial: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    Venda Ganha
                  </Label>
                  <p className="text-xs text-slate-500">Marca lead como convertido</p>
                </div>
                <Switch
                  checked={formData.is_success}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_success: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-red-600" />
                    Venda Perdida
                  </Label>
                  <p className="text-xs text-slate-500">Marca lead como perdido</p>
                </div>
                <Switch
                  checked={formData.is_lost}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_lost: checked })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700">
              <Check className="w-4 h-4 mr-2" />
              {editingStage ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}