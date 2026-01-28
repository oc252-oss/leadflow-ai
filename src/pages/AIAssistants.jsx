import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit2, Trash2, Loader, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AIAssistants() {
  const [assistants, setAssistants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [defaultBrand, setDefaultBrand] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingAssistant, setEditingAssistant] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    channel: 'whatsapp',
    tone: 'elegante',
    greeting_message: '',
    system_prompt: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Carregar marca padrão para modo single company
      const brands = await base44.entities.Brand.list('-updated_date', 1);
      if (brands?.length > 0) {
        setDefaultBrand(brands[0]);
      }

      const assistantsData = await base44.entities.Assistant.list('-updated_date', 100);
      setAssistants(assistantsData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (assistant = null) => {
    if (assistant) {
      setEditingAssistant(assistant);
      setFormData({
        name: assistant.name,
        channel: assistant.channel,
        tone: assistant.tone,
        greeting_message: assistant.greeting_message || '',
        system_prompt: assistant.system_prompt || ''
      });
    } else {
      setEditingAssistant(null);
      setFormData({
        name: '',
        channel: 'whatsapp',
        tone: 'elegante',
        greeting_message: '',
        system_prompt: ''
      });
    }
    setShowDialog(true);
  };

  const isFormValid = formData.name.trim() && formData.channel;

  const handleSave = async () => {
    if (!isFormValid) return;
    
    setIsSaving(true);
    try {
      const dataToSave = {
        ...formData,
        ...(defaultBrand && { brand_id: defaultBrand.id })
      };

      if (editingAssistant) {
        await base44.entities.Assistant.update(editingAssistant.id, dataToSave);
      } else {
        if (!defaultBrand?.id) {
          alert('Erro: Marca não foi carregada');
          return;
        }
        await base44.entities.Assistant.create(dataToSave);
      }
      await loadData();
      setShowDialog(false);
    } catch (error) {
      console.error('Erro ao salvar assistente:', error);
      alert('Erro ao salvar: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Tem certeza que deseja deletar este assistente?')) {
      try {
        await base44.entities.Assistant.delete(id);
        await loadData();
      } catch (error) {
        console.error('Erro ao deletar assistente:', error);
      }
    }
  };

  const handleToggleActive = async (assistant) => {
    try {
      await base44.entities.Assistant.update(assistant.id, { is_active: !assistant.is_active });
      await loadData();
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
        <h1 className="text-2xl font-bold text-slate-900">Assistentes de IA</h1>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Assistente
        </Button>
      </div>

      <div className="grid gap-4">
        {assistants.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-slate-500">
              Nenhum assistente criado ainda
            </CardContent>
          </Card>
        ) : (
          assistants.map(assistant => (
            <Card key={assistant.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">{assistant.name}</h3>
                    {assistant.greeting_message && (
                      <p className="text-sm text-slate-600 mt-1">"{assistant.greeting_message}"</p>
                    )}
                    <div className="flex gap-2 mt-3 flex-wrap">
                      <Badge variant="secondary" className="capitalize">
                        {assistant.channel}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {assistant.tone}
                      </Badge>
                      <Badge variant={assistant.is_active ? 'default' : 'outline'}>
                        {assistant.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleToggleActive(assistant)}
                    >
                      {assistant.is_active ? 'Desativar' : 'Ativar'}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleOpenDialog(assistant)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleDelete(assistant.id)}
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingAssistant ? 'Editar Assistente' : 'Novo Assistente de IA'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Nome *</label>
              <Input 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Nome do assistente"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Canal *</label>
              <select 
                value={formData.channel}
                onChange={(e) => setFormData({...formData, channel: e.target.value})}
                className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md text-sm"
              >
                <option value="whatsapp">WhatsApp</option>
                <option value="voice">Voz</option>
                <option value="instagram">Instagram</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Tom de Voz</label>
              <select 
                value={formData.tone}
                onChange={(e) => setFormData({...formData, tone: e.target.value})}
                className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md text-sm"
              >
                <option value="neutro">Neutro</option>
                <option value="comercial">Comercial</option>
                <option value="elegante">Elegante</option>
                <option value="humanizado">Humanizado</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Mensagem de Saudação</label>
              <Input 
                value={formData.greeting_message}
                onChange={(e) => setFormData({...formData, greeting_message: e.target.value})}
                placeholder="Ex: Olá! Como posso ajudar?"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Instrução do Sistema</label>
              <textarea 
                value={formData.system_prompt}
                onChange={(e) => setFormData({...formData, system_prompt: e.target.value})}
                placeholder="Instruções para o comportamento do assistente"
                className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md text-sm h-24"
              />
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSave}
                disabled={!isFormValid || isSaving}
                className="gap-2"
              >
                {isSaving && <Loader className="w-4 h-4 animate-spin" />}
                {editingAssistant ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}