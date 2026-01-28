import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit2, Trash2, Loader } from 'lucide-react';

export default function AIFlows() {
  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingFlow, setEditingFlow] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', objective: 'qualificacao' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadFlows();
  }, []);

  const loadFlows = async () => {
    try {
      const data = await base44.entities.AIFlow.list('-updated_date', 100);
      setFlows(data);
    } catch (error) {
      console.error('Erro ao carregar fluxos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (flow = null) => {
    if (flow) {
      setEditingFlow(flow);
      setFormData({ name: flow.name, description: flow.description, objective: flow.objective });
    } else {
      setEditingFlow(null);
      setFormData({ name: '', description: '', objective: 'qualificacao' });
    }
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;
    
    setIsSaving(true);
    try {
      if (editingFlow) {
        await base44.entities.AIFlow.update(editingFlow.id, formData);
      } else {
        await base44.entities.AIFlow.create(formData);
      }
      await loadFlows();
      setShowDialog(false);
    } catch (error) {
      console.error('Erro ao salvar fluxo:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Tem certeza que deseja deletar este fluxo?')) {
      try {
        await base44.entities.AIFlow.delete(id);
        await loadFlows();
      } catch (error) {
        console.error('Erro ao deletar fluxo:', error);
      }
    }
  };

  const handleToggleActive = async (flow) => {
    try {
      await base44.entities.AIFlow.update(flow.id, { is_active: !flow.is_active });
      await loadFlows();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Fluxos de IA</h1>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Fluxo
        </Button>
      </div>

      <div className="grid gap-4">
        {flows.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-slate-500">
              Nenhum fluxo criado ainda
            </CardContent>
          </Card>
        ) : (
          flows.map(flow => (
            <Card key={flow.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">{flow.name}</h3>
                    {flow.description && (
                      <p className="text-sm text-slate-600 mt-1">{flow.description}</p>
                    )}
                    <div className="flex gap-2 mt-3">
                      <Badge variant={flow.objective === 'qualificacao' ? 'default' : 'secondary'}>
                        {flow.objective}
                      </Badge>
                      <Badge variant={flow.is_active ? 'default' : 'outline'}>
                        {flow.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleToggleActive(flow)}
                    >
                      {flow.is_active ? 'Desativar' : 'Ativar'}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleOpenDialog(flow)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleDelete(flow.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingFlow ? 'Editar Fluxo' : 'Novo Fluxo de IA'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Nome *</label>
              <Input 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Nome do fluxo"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Descrição</label>
              <Input 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Descrição do fluxo"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Objetivo</label>
              <select 
                value={formData.objective}
                onChange={(e) => setFormData({...formData, objective: e.target.value})}
                className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md text-sm"
              >
                <option value="qualificacao">Qualificação</option>
                <option value="reengajamento">Reengajamento</option>
                <option value="prospeccao">Prospecção</option>
              </select>
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSave}
                disabled={!formData.name.trim() || isSaving}
                className="gap-2"
              >
                {isSaving && <Loader className="w-4 h-4 animate-spin" />}
                {editingFlow ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}