import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, Pencil, Trash2, GripVertical, Star, Award, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function SalesFunnelTab({ company }) {
  const [stages, setStages] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingStage, setEditingStage] = useState(null);
  
  const [selectedCompany, setSelectedCompany] = useState(company?.id || '');
  const [selectedUnit, setSelectedUnit] = useState('');

  const [formData, setFormData] = useState({
    company_id: '',
    stage_name: '',
    position: 0,
    is_active: true,
    is_initial: false,
    is_success: false,
    is_lost: false,
    color: '#6366f1'
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      loadStages();
    }
  }, [selectedCompany, selectedUnit]);

  const loadData = async () => {
    try {
      setLoading(true);
      const companiesData = await base44.entities.Company.list();
      setCompanies(companiesData);
      
      if (company?.id) {
        setSelectedCompany(company.id);
      } else if (companiesData.length > 0) {
        setSelectedCompany(companiesData[0].id);
      }
    } catch (error) {
      toast.error('Erro ao carregar dados');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadStages = async () => {
    try {
      const filter = { company_id: selectedCompany };
      if (selectedUnit) {
        filter.unit_id = selectedUnit;
      }
      const stagesData = await base44.entities.FunnelStage.filter(filter, 'position');
      setStages(stagesData);
    } catch (error) {
      toast.error('Erro ao carregar estágios');
      console.error(error);
    }
  };

  const handleSave = async () => {
    try {
      if (!formData.stage_name || !selectedCompany) {
        toast.error('Nome do estágio é obrigatório');
        return;
      }

      const dataToSave = {
        ...formData,
        company_id: selectedCompany,
        position: editingStage ? formData.position : stages.length
      };

      if (editingStage) {
        await base44.entities.FunnelStage.update(editingStage.id, dataToSave);
        toast.success('Estágio atualizado');
      } else {
        await base44.entities.FunnelStage.create(dataToSave);
        toast.success('Estágio criado');
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
      company_id: stage.company_id || '',
      stage_name: stage.stage_name || '',
      position: stage.position || 0,
      is_active: stage.is_active !== false,
      is_initial: stage.is_initial || false,
      is_success: stage.is_success || false,
      is_lost: stage.is_lost || false,
      color: stage.color || '#6366f1'
    });
    setShowDialog(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este estágio?')) return;
    
    try {
      await base44.entities.FunnelStage.delete(id);
      toast.success('Estágio excluído');
      await loadStages();
    } catch (error) {
      toast.error('Erro ao excluir estágio');
      console.error(error);
    }
  };

  const handleToggleActive = async (stage) => {
    try {
      await base44.entities.FunnelStage.update(stage.id, { is_active: !stage.is_active });
      toast.success('Status atualizado');
      await loadStages();
    } catch (error) {
      toast.error('Erro ao atualizar status');
    }
  };

  const handleToggleMarker = async (stage, field) => {
    try {
      // If setting this as initial/success/lost, unset others
      if (!stage[field]) {
        const updates = [];
        
        // Unset the same marker from other stages
        stages.forEach(s => {
          if (s.id !== stage.id && s[field]) {
            updates.push(base44.entities.FunnelStage.update(s.id, { [field]: false }));
          }
        });

        await Promise.all(updates);
      }

      await base44.entities.FunnelStage.update(stage.id, { [field]: !stage[field] });
      toast.success('Marcador atualizado');
      await loadStages();
    } catch (error) {
      toast.error('Erro ao atualizar marcador');
    }
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingStage(null);
    setFormData({
      company_id: '',
      stage_name: '',
      position: 0,
      is_active: true,
      is_initial: false,
      is_success: false,
      is_lost: false,
      color: '#6366f1'
    });
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const items = Array.from(stages);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update positions
    const updates = items.map((item, index) => 
      base44.entities.FunnelStage.update(item.id, { position: index })
    );

    try {
      setStages(items);
      await Promise.all(updates);
      toast.success('Ordem atualizada');
    } catch (error) {
      toast.error('Erro ao reordenar');
      await loadStages(); // Reload on error
    }
  };

  const getCompanyName = (companyId) => {
    const comp = companies.find(c => c.id === companyId);
    return comp?.name || companyId;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Sales Funnel Stages</h3>
          <p className="text-sm text-slate-500">Configure your sales pipeline stages</p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          Novo Estágio
        </Button>
      </div>

      {/* Company Selector */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Empresa</Label>
          <Select value={selectedCompany} onValueChange={setSelectedCompany}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a empresa" />
            </SelectTrigger>
            <SelectContent>
              {companies.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Unidade (opcional)</Label>
          <Input
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
            placeholder="ID da unidade"
          />
        </div>
      </div>

      {/* Stages List */}
      <Card className="p-6">
        {stages.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <p>Nenhum estágio configurado</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => setShowDialog(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar primeiro estágio
            </Button>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="stages">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                  {stages.map((stage, index) => (
                    <Draggable key={stage.id} draggableId={stage.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`flex items-center gap-3 p-4 border rounded-lg bg-white ${
                            snapshot.isDragging ? 'shadow-lg' : ''
                          }`}
                        >
                          <div {...provided.dragHandleProps}>
                            <GripVertical className="w-5 h-5 text-slate-400 cursor-grab" />
                          </div>

                          <div 
                            className="w-1 h-12 rounded-full" 
                            style={{ backgroundColor: stage.color }}
                          />

                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{stage.stage_name}</span>
                              <Badge variant="outline" className="text-xs">
                                Posição {stage.position}
                              </Badge>
                              {stage.is_initial && (
                                <Badge className="bg-blue-100 text-blue-700 text-xs gap-1">
                                  <Star className="w-3 h-3" />
                                  Inicial
                                </Badge>
                              )}
                              {stage.is_success && (
                                <Badge className="bg-green-100 text-green-700 text-xs gap-1">
                                  <Award className="w-3 h-3" />
                                  Sucesso
                                </Badge>
                              )}
                              {stage.is_lost && (
                                <Badge className="bg-red-100 text-red-700 text-xs gap-1">
                                  <XCircle className="w-3 h-3" />
                                  Perdido
                                </Badge>
                              )}
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
                              onClick={() => handleDelete(stage.id)}
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
      </Card>

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingStage ? 'Editar Estágio' : 'Novo Estágio'}</DialogTitle>
            <DialogDescription>Configure um estágio do funil de vendas</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome do Estágio *</Label>
              <Input
                value={formData.stage_name}
                onChange={(e) => setFormData({ ...formData, stage_name: e.target.value })}
                placeholder="Ex: Novo Lead"
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
                  <Label>Estágio Inicial</Label>
                  <p className="text-xs text-slate-500">Novos leads começam aqui</p>
                </div>
                <Switch
                  checked={formData.is_initial}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_initial: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label>Estágio de Sucesso</Label>
                  <p className="text-xs text-slate-500">Venda ganha</p>
                </div>
                <Switch
                  checked={formData.is_success}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_success: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label>Estágio de Perda</Label>
                  <p className="text-xs text-slate-500">Venda perdida</p>
                </div>
                <Switch
                  checked={formData.is_lost}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_lost: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label>Ativo</Label>
                  <p className="text-xs text-slate-500">Estágio visível no sistema</p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700">
              {editingStage ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}