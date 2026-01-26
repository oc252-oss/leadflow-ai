import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Bot, Plus, Pencil, Trash2, Star, Check, X, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function ConversationFlows() {
  const [flows, setFlows] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingFlow, setEditingFlow] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCompany, setFilterCompany] = useState('all');
  const [filterActive, setFilterActive] = useState('all');

  const [formData, setFormData] = useState({
    company_id: '',
    name: '',
    description: '',
    industry: 'aesthetics',
    is_default: false,
    is_active: true,
    greeting_message: '',
    outside_hours_message: '',
    handoff_message: '',
    qualification_questions: [],
    hot_lead_threshold: 80,
    warm_lead_threshold: 50,
  });

  const [newQuestion, setNewQuestion] = useState({
    id: '',
    question: '',
    field_to_update: '',
    expected_answers: [],
    score_impact: 0,
    next_step: 'handoff'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [flowsData, companiesData] = await Promise.all([
        base44.entities.AIConversationFlow.list('-created_date'),
        base44.entities.Company.list()
      ]);
      setFlows(flowsData);
      setCompanies(companiesData);
    } catch (error) {
      toast.error('Erro ao carregar dados');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!formData.company_id || !formData.name) {
        toast.error('Preencha os campos obrigatórios');
        return;
      }

      if (editingFlow) {
        await base44.entities.AIConversationFlow.update(editingFlow.id, formData);
        toast.success('Fluxo atualizado com sucesso');
      } else {
        await base44.entities.AIConversationFlow.create(formData);
        toast.success('Fluxo criado com sucesso');
      }

      await loadData();
      handleCloseDialog();
    } catch (error) {
      toast.error('Erro ao salvar fluxo');
      console.error(error);
    }
  };

  const handleEdit = (flow) => {
    setEditingFlow(flow);
    setFormData({
      company_id: flow.company_id || '',
      name: flow.name || '',
      description: flow.description || '',
      industry: flow.industry || 'aesthetics',
      is_default: flow.is_default || false,
      is_active: flow.is_active !== false,
      greeting_message: flow.greeting_message || '',
      outside_hours_message: flow.outside_hours_message || '',
      handoff_message: flow.handoff_message || '',
      qualification_questions: flow.qualification_questions || [],
      hot_lead_threshold: flow.hot_lead_threshold || 80,
      warm_lead_threshold: flow.warm_lead_threshold || 50,
    });
    setShowDialog(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este fluxo?')) return;
    
    try {
      await base44.entities.AIConversationFlow.delete(id);
      toast.success('Fluxo excluído com sucesso');
      await loadData();
    } catch (error) {
      toast.error('Erro ao excluir fluxo');
      console.error(error);
    }
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingFlow(null);
    setFormData({
      company_id: '',
      name: '',
      description: '',
      industry: 'aesthetics',
      is_default: false,
      is_active: true,
      greeting_message: '',
      outside_hours_message: '',
      handoff_message: '',
      qualification_questions: [],
      hot_lead_threshold: 80,
      warm_lead_threshold: 50,
    });
  };

  const handleAddQuestion = () => {
    if (!newQuestion.id || !newQuestion.question) {
      toast.error('Preencha ID e pergunta');
      return;
    }

    setFormData({
      ...formData,
      qualification_questions: [...formData.qualification_questions, { ...newQuestion }]
    });

    setNewQuestion({
      id: '',
      question: '',
      field_to_update: '',
      expected_answers: [],
      score_impact: 0,
      next_step: 'handoff'
    });
  };

  const handleRemoveQuestion = (index) => {
    setFormData({
      ...formData,
      qualification_questions: formData.qualification_questions.filter((_, i) => i !== index)
    });
  };

  const filteredFlows = flows.filter(flow => {
    const matchesSearch = flow.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCompany = filterCompany === 'all' || flow.company_id === filterCompany;
    const matchesActive = filterActive === 'all' || 
      (filterActive === 'active' ? flow.is_active : !flow.is_active);
    return matchesSearch && matchesCompany && matchesActive;
  });

  const getCompanyName = (companyId) => {
    const company = companies.find(c => c.id === companyId);
    return company?.name || companyId;
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
          <h1 className="text-3xl font-bold text-slate-900">Fluxos de Conversa IA</h1>
          <p className="text-slate-500 mt-1">Gerencie os fluxos de qualificação automática</p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          Novo Fluxo
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[250px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar fluxos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={filterCompany} onValueChange={setFilterCompany}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas empresas</SelectItem>
                {companies.map(company => (
                  <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterActive} onValueChange={setFilterActive}>
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

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Padrão</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Perguntas</TableHead>
              <TableHead>Thresholds</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFlows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                  Nenhum fluxo encontrado
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
                  <TableCell>{getCompanyName(flow.company_id)}</TableCell>
                  <TableCell>
                    {flow.is_default ? (
                      <Badge variant="default" className="bg-amber-100 text-amber-800">
                        <Star className="w-3 h-3 mr-1" />
                        Padrão
                      </Badge>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={flow.is_active ? 'default' : 'secondary'}>
                      {flow.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-slate-600">
                      {flow.qualification_questions?.length || 0} perguntas
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs space-y-1">
                      <div className="text-slate-600">Hot: {flow.hot_lead_threshold || 80}</div>
                      <div className="text-slate-600">Warm: {flow.warm_lead_threshold || 50}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingFlow ? 'Editar Fluxo' : 'Novo Fluxo'}</DialogTitle>
            <DialogDescription>
              Configure o fluxo de qualificação automática para leads
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome do fluxo"
                />
              </div>
              <div className="space-y-2">
                <Label>Empresa *</Label>
                <Select value={formData.company_id} onValueChange={(value) => setFormData({ ...formData, company_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map(company => (
                      <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
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
                placeholder="Descrição do fluxo"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <Label>Fluxo Padrão</Label>
                <Switch
                  checked={formData.is_default}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
                />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <Label>Ativo</Label>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </div>

            {/* Messages */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Mensagens</h3>
              
              <div className="space-y-2">
                <Label>Mensagem de Saudação</Label>
                <Textarea
                  value={formData.greeting_message}
                  onChange={(e) => setFormData({ ...formData, greeting_message: e.target.value })}
                  placeholder="Primeira mensagem enviada ao lead"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Mensagem Fora do Horário</Label>
                <Textarea
                  value={formData.outside_hours_message}
                  onChange={(e) => setFormData({ ...formData, outside_hours_message: e.target.value })}
                  placeholder="Mensagem enviada fora do horário comercial"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Mensagem de Transferência</Label>
                <Textarea
                  value={formData.handoff_message}
                  onChange={(e) => setFormData({ ...formData, handoff_message: e.target.value })}
                  placeholder="Mensagem antes de transferir para humano"
                  rows={3}
                />
              </div>
            </div>

            {/* Thresholds */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hot Lead Threshold</Label>
                <Input
                  type="number"
                  value={formData.hot_lead_threshold}
                  onChange={(e) => setFormData({ ...formData, hot_lead_threshold: parseInt(e.target.value) || 0 })}
                  placeholder="80"
                />
              </div>
              <div className="space-y-2">
                <Label>Warm Lead Threshold</Label>
                <Input
                  type="number"
                  value={formData.warm_lead_threshold}
                  onChange={(e) => setFormData({ ...formData, warm_lead_threshold: parseInt(e.target.value) || 0 })}
                  placeholder="50"
                />
              </div>
            </div>

            {/* Qualification Questions */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Perguntas de Qualificação</h3>
              
              {/* Existing Questions */}
              {formData.qualification_questions.length > 0 && (
                <div className="space-y-2">
                  {formData.qualification_questions.map((q, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 border rounded-lg bg-slate-50">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{q.id}</div>
                        <div className="text-sm text-slate-600 mt-1">{q.question}</div>
                        <div className="flex gap-4 mt-2 text-xs text-slate-500">
                          <span>Campo: {q.field_to_update || '-'}</span>
                          <span>Score: {q.score_impact || 0}</span>
                          <span>Próximo: {q.next_step || 'handoff'}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveQuestion(idx)}
                      >
                        <X className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Question */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Adicionar Pergunta</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="ID (ex: q1_treatment)"
                      value={newQuestion.id}
                      onChange={(e) => setNewQuestion({ ...newQuestion, id: e.target.value })}
                    />
                    <Input
                      placeholder="Campo (ex: interest_type)"
                      value={newQuestion.field_to_update}
                      onChange={(e) => setNewQuestion({ ...newQuestion, field_to_update: e.target.value })}
                    />
                  </div>
                  <Textarea
                    placeholder="Pergunta"
                    value={newQuestion.question}
                    onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                    rows={2}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      type="number"
                      placeholder="Score Impact"
                      value={newQuestion.score_impact}
                      onChange={(e) => setNewQuestion({ ...newQuestion, score_impact: parseInt(e.target.value) || 0 })}
                    />
                    <Input
                      placeholder="Next Step (ex: q2_urgency)"
                      value={newQuestion.next_step}
                      onChange={(e) => setNewQuestion({ ...newQuestion, next_step: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleAddQuestion} variant="outline" size="sm" className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Pergunta
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700">
              <Check className="w-4 h-4 mr-2" />
              {editingFlow ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}