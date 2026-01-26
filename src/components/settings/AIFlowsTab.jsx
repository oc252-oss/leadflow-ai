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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Bot, Plus, Pencil, Trash2, Star, Check, X, Search, ChevronUp, ChevronDown, Copy, GripVertical } from 'lucide-react';
import { toast } from 'sonner';

export default function AIFlowsTab({ company }) {
  const [flows, setFlows] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingFlow, setEditingFlow] = useState(null);
  
  const [filterCompany, setFilterCompany] = useState('all');
  const [filterUnit, setFilterUnit] = useState('all');
  const [filterIndustry, setFilterIndustry] = useState('all');
  const [filterActive, setFilterActive] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    company_id: company?.id || '',
    unit_id: '',
    name: '',
    description: '',
    industry: 'aesthetics',
    is_default: false,
    is_active: true,
    priority: 0,
    trigger_sources: [],
    trigger_campaigns: [],
    trigger_keywords: [],
    greeting_message: '',
    outside_hours_message: '',
    handoff_message: '',
    qualification_questions: [],
    hot_lead_threshold: 80,
    warm_lead_threshold: 50,
    auto_assign_hot_leads: true,
    auto_assign_agent_role: 'sales_agent',
    fallback_flow_id: ''
  });

  const [newKeyword, setNewKeyword] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(-1);
  const [newQuestion, setNewQuestion] = useState({
    id: '',
    question: '',
    field_to_update: '',
    expected_answers: [],
    score_impact: 0,
    next_step: 'handoff'
  });

  const industries = [
    { value: 'aesthetics', label: 'Estética' },
    { value: 'dentistry', label: 'Odontologia' },
    { value: 'healthcare', label: 'Saúde' },
    { value: 'retail', label: 'Varejo' },
    { value: 'services', label: 'Serviços' },
    { value: 'education', label: 'Educação' },
    { value: 'other', label: 'Outro' }
  ];

  const triggerSources = [
    { value: 'facebook_lead_ad', label: 'Facebook Lead Ad' },
    { value: 'messenger', label: 'Messenger' },
    { value: 'webchat', label: 'WebChat' },
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'email', label: 'Email' }
  ];

  const leadFields = [
    { value: 'interest_type', label: 'Tipo de Interesse' },
    { value: 'urgency_level', label: 'Nível de Urgência' },
    { value: 'budget_range', label: 'Faixa de Orçamento' },
    { value: 'location', label: 'Localização' },
    { value: 'notes', label: 'Observações' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('Loading AI Flows data...');
      
      const [flowsData, companiesData, campaignsData] = await Promise.all([
        base44.entities.AIConversationFlow.list('-priority', 100),
        base44.entities.Company.list(),
        base44.entities.Campaign.list()
      ]);
      
      console.log('Data loaded successfully:', {
        flows: flowsData.length,
        companies: companiesData.length,
        campaigns: campaignsData.length
      });
      
      setFlows(flowsData);
      setCompanies(companiesData);
      setCampaigns(campaignsData);
    } catch (error) {
      console.error('Error loading AI flows data:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data
      });
      
      const errorMessage = error.response?.data?.message || error.message || 'Erro desconhecido';
      toast.error(`Erro ao carregar dados: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      // Validation
      if (!formData.company_id) {
        toast.error('Empresa é obrigatória');
        console.error('Validation error: company_id is required');
        return;
      }

      if (!formData.name || formData.name.trim() === '') {
        toast.error('Nome é obrigatório');
        console.error('Validation error: name is required');
        return;
      }

      // Check for duplicate default flow
      if (formData.is_default && !editingFlow) {
        const existingDefault = flows.find(f => f.company_id === formData.company_id && f.is_default);
        if (existingDefault) {
          toast.error('Já existe um fluxo padrão para esta empresa');
          console.error('Validation error: default flow already exists for company', formData.company_id);
          return;
        }
      }

      // Prepare data - only include fields that have values
      const dataToSave = {
        company_id: formData.company_id,
        name: formData.name.trim(),
        description: formData.description || undefined,
        industry: formData.industry,
        is_default: formData.is_default,
        is_active: formData.is_active,
        priority: formData.priority || 0,
        greeting_message: formData.greeting_message || undefined,
        outside_hours_message: formData.outside_hours_message || undefined,
        handoff_message: formData.handoff_message || undefined,
        hot_lead_threshold: formData.hot_lead_threshold,
        warm_lead_threshold: formData.warm_lead_threshold,
        auto_assign_hot_leads: formData.auto_assign_hot_leads,
        auto_assign_agent_role: formData.auto_assign_agent_role,
      };

      // Only include optional fields if they have values
      if (formData.unit_id && formData.unit_id.trim() !== '') {
        dataToSave.unit_id = formData.unit_id.trim();
      }

      if (formData.trigger_sources && formData.trigger_sources.length > 0) {
        dataToSave.trigger_sources = formData.trigger_sources;
      }

      if (formData.trigger_campaigns && formData.trigger_campaigns.length > 0) {
        dataToSave.trigger_campaigns = formData.trigger_campaigns;
      }

      if (formData.trigger_keywords && formData.trigger_keywords.length > 0) {
        dataToSave.trigger_keywords = formData.trigger_keywords;
      }

      if (formData.qualification_questions && formData.qualification_questions.length > 0) {
        dataToSave.qualification_questions = formData.qualification_questions;
      }

      if (formData.fallback_flow_id && formData.fallback_flow_id !== '') {
        dataToSave.fallback_flow_id = formData.fallback_flow_id;
      }

      console.log('Saving AI Flow:', editingFlow ? 'UPDATE' : 'CREATE', dataToSave);

      if (editingFlow) {
        const updated = await base44.entities.AIConversationFlow.update(editingFlow.id, dataToSave);
        console.log('Flow updated successfully:', updated);
        toast.success('Fluxo atualizado com sucesso');
      } else {
        const created = await base44.entities.AIConversationFlow.create(dataToSave);
        console.log('Flow created successfully:', created);
        toast.success('Fluxo criado com sucesso');
      }

      await loadData();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving AI flow:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data
      });
      
      const errorMessage = error.response?.data?.message || error.message || 'Erro desconhecido';
      toast.error(`Erro ao salvar fluxo: ${errorMessage}`);
    }
  };

  const handleEdit = (flow) => {
    setEditingFlow(flow);
    setFormData({
      company_id: flow.company_id || '',
      unit_id: flow.unit_id || '',
      name: flow.name || '',
      description: flow.description || '',
      industry: flow.industry || 'aesthetics',
      is_default: flow.is_default || false,
      is_active: flow.is_active !== false,
      priority: flow.priority || 0,
      trigger_sources: flow.trigger_sources || [],
      trigger_campaigns: flow.trigger_campaigns || [],
      trigger_keywords: flow.trigger_keywords || [],
      greeting_message: flow.greeting_message || '',
      outside_hours_message: flow.outside_hours_message || '',
      handoff_message: flow.handoff_message || '',
      qualification_questions: flow.qualification_questions || [],
      hot_lead_threshold: flow.hot_lead_threshold || 80,
      warm_lead_threshold: flow.warm_lead_threshold || 50,
      auto_assign_hot_leads: flow.auto_assign_hot_leads !== false,
      auto_assign_agent_role: flow.auto_assign_agent_role || 'sales_agent',
      fallback_flow_id: flow.fallback_flow_id || ''
    });
    setShowDialog(true);
  };

  const handleDuplicate = async (flow) => {
    setFormData({
      company_id: flow.company_id || '',
      unit_id: flow.unit_id || '',
      name: `${flow.name} (Cópia)`,
      description: flow.description || '',
      industry: flow.industry || 'aesthetics',
      is_default: false,
      is_active: false,
      priority: flow.priority || 0,
      trigger_sources: flow.trigger_sources || [],
      trigger_campaigns: flow.trigger_campaigns || [],
      trigger_keywords: flow.trigger_keywords || [],
      greeting_message: flow.greeting_message || '',
      outside_hours_message: flow.outside_hours_message || '',
      handoff_message: flow.handoff_message || '',
      qualification_questions: flow.qualification_questions || [],
      hot_lead_threshold: flow.hot_lead_threshold || 80,
      warm_lead_threshold: flow.warm_lead_threshold || 50,
      auto_assign_hot_leads: flow.auto_assign_hot_leads !== false,
      auto_assign_agent_role: flow.auto_assign_agent_role || 'sales_agent',
      fallback_flow_id: flow.fallback_flow_id || ''
    });
    setShowDialog(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este fluxo?')) return;
    
    try {
      console.log('Deleting flow:', id);
      await base44.entities.AIConversationFlow.delete(id);
      console.log('Flow deleted successfully');
      toast.success('Fluxo excluído com sucesso');
      await loadData();
    } catch (error) {
      console.error('Error deleting AI flow:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data
      });
      
      const errorMessage = error.response?.data?.message || error.message || 'Erro desconhecido';
      toast.error(`Erro ao excluir fluxo: ${errorMessage}`);
    }
  };

  const handleToggleActive = async (flow) => {
    try {
      console.log('Toggling active status for flow:', flow.id, 'from', flow.is_active, 'to', !flow.is_active);
      await base44.entities.AIConversationFlow.update(flow.id, { is_active: !flow.is_active });
      console.log('Status toggled successfully');
      toast.success('Status atualizado com sucesso');
      await loadData();
    } catch (error) {
      console.error('Error toggling active status:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data
      });
      
      const errorMessage = error.response?.data?.message || error.message || 'Erro desconhecido';
      toast.error(`Erro ao atualizar status: ${errorMessage}`);
    }
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingFlow(null);
    setEditingQuestionIndex(-1);
    setFormData({
      company_id: company?.id || '',
      unit_id: '',
      name: '',
      description: '',
      industry: 'aesthetics',
      is_default: false,
      is_active: true,
      priority: 0,
      trigger_sources: [],
      trigger_campaigns: [],
      trigger_keywords: [],
      greeting_message: '',
      outside_hours_message: '',
      handoff_message: '',
      qualification_questions: [],
      hot_lead_threshold: 80,
      warm_lead_threshold: 50,
      auto_assign_hot_leads: true,
      auto_assign_agent_role: 'sales_agent',
      fallback_flow_id: ''
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

  const toggleTriggerSource = (source) => {
    if (formData.trigger_sources.includes(source)) {
      setFormData({ ...formData, trigger_sources: formData.trigger_sources.filter(s => s !== source) });
    } else {
      setFormData({ ...formData, trigger_sources: [...formData.trigger_sources, source] });
    }
  };

  const toggleCampaign = (campaignId) => {
    if (formData.trigger_campaigns.includes(campaignId)) {
      setFormData({ ...formData, trigger_campaigns: formData.trigger_campaigns.filter(c => c !== campaignId) });
    } else {
      setFormData({ ...formData, trigger_campaigns: [...formData.trigger_campaigns, campaignId] });
    }
  };

  const addKeyword = () => {
    if (newKeyword && !formData.trigger_keywords.includes(newKeyword)) {
      setFormData({ ...formData, trigger_keywords: [...formData.trigger_keywords, newKeyword] });
      setNewKeyword('');
    }
  };

  const removeKeyword = (keyword) => {
    setFormData({ ...formData, trigger_keywords: formData.trigger_keywords.filter(k => k !== keyword) });
  };

  const addAnswerToQuestion = () => {
    if (newAnswer && !newQuestion.expected_answers.includes(newAnswer)) {
      setNewQuestion({ ...newQuestion, expected_answers: [...newQuestion.expected_answers, newAnswer] });
      setNewAnswer('');
    }
  };

  const removeAnswerFromQuestion = (answer) => {
    setNewQuestion({ ...newQuestion, expected_answers: newQuestion.expected_answers.filter(a => a !== answer) });
  };

  const saveQuestion = () => {
    if (!newQuestion.question) {
      toast.error('Pergunta é obrigatória');
      return;
    }

    const questionToSave = {
      ...newQuestion,
      id: newQuestion.id || `q${formData.qualification_questions.length + 1}`
    };

    if (editingQuestionIndex >= 0) {
      const updated = [...formData.qualification_questions];
      updated[editingQuestionIndex] = questionToSave;
      setFormData({ ...formData, qualification_questions: updated });
      toast.success('Pergunta atualizada');
    } else {
      setFormData({ ...formData, qualification_questions: [...formData.qualification_questions, questionToSave] });
      toast.success('Pergunta adicionada');
    }

    setEditingQuestionIndex(-1);
    setNewQuestion({
      id: '',
      question: '',
      field_to_update: '',
      expected_answers: [],
      score_impact: 0,
      next_step: 'handoff'
    });
  };

  const editQuestion = (index) => {
    setNewQuestion(formData.qualification_questions[index]);
    setEditingQuestionIndex(index);
  };

  const removeQuestion = (index) => {
    setFormData({
      ...formData,
      qualification_questions: formData.qualification_questions.filter((_, i) => i !== index)
    });
  };

  const moveQuestion = (index, direction) => {
    const newQuestions = [...formData.qualification_questions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newQuestions.length) return;
    
    [newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]];
    setFormData({ ...formData, qualification_questions: newQuestions });
  };

  const handleQuestionDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(formData.qualification_questions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setFormData({ ...formData, qualification_questions: items });
  };

  const filteredFlows = flows.filter(flow => {
    const matchesSearch = flow.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCompany = filterCompany === 'all' || flow.company_id === filterCompany;
    const matchesUnit = filterUnit === 'all' || flow.unit_id === filterUnit;
    const matchesIndustry = filterIndustry === 'all' || flow.industry === filterIndustry;
    const matchesActive = filterActive === 'all' || 
      (filterActive === 'active' ? flow.is_active : !flow.is_active);
    return matchesSearch && matchesCompany && matchesUnit && matchesIndustry && matchesActive;
  });

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
          <h3 className="text-lg font-semibold">AI Conversation Flows</h3>
          <p className="text-sm text-slate-500">Configure automated qualification flows</p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          Novo Fluxo
        </Button>
      </div>

      {/* Filters */}
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
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Empresa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {companies.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterIndustry} onValueChange={setFilterIndustry}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Segmento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {industries.map(ind => (
              <SelectItem key={ind.value} value={ind.value}>{ind.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterActive} onValueChange={setFilterActive}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead>Segmento</TableHead>
              <TableHead>Prioridade</TableHead>
              <TableHead>Padrão</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFlows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-slate-500">
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
                  <TableCell>{flow.unit_id || '-'}</TableCell>
                  <TableCell className="capitalize">{flow.industry}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{flow.priority || 0}</Badge>
                  </TableCell>
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
                    <Switch
                      checked={flow.is_active}
                      onCheckedChange={() => handleToggleActive(flow)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(flow)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDuplicate(flow)}>
                        <Copy className="w-4 h-4" />
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
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingFlow ? 'Editar Fluxo' : 'Novo Fluxo'}</DialogTitle>
            <DialogDescription>Configure o fluxo de qualificação automática</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="general">Geral</TabsTrigger>
              <TabsTrigger value="triggers">Gatilhos</TabsTrigger>
              <TabsTrigger value="messages">Mensagens</TabsTrigger>
              <TabsTrigger value="scoring">Pontuação</TabsTrigger>
              <TabsTrigger value="questions">Perguntas</TabsTrigger>
              <TabsTrigger value="advanced">Avançado</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Empresa *</Label>
                  <Select value={formData.company_id} onValueChange={(value) => setFormData({ ...formData, company_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Unidade</Label>
                  <Input
                    value={formData.unit_id}
                    onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })}
                    placeholder="ID da unidade (opcional)"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome do fluxo"
                />
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Segmento</Label>
                  <Select value={formData.industry} onValueChange={(value) => setFormData({ ...formData, industry: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {industries.map(ind => (
                        <SelectItem key={ind.value} value={ind.value}>{ind.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Prioridade</Label>
                  <Input
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <Label>Padrão</Label>
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
            </TabsContent>

            <TabsContent value="triggers" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Origens</Label>
                <div className="flex flex-wrap gap-2">
                  {triggerSources.map(source => (
                    <Button
                      key={source.value}
                      type="button"
                      variant={formData.trigger_sources.includes(source.value) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleTriggerSource(source.value)}
                      className={formData.trigger_sources.includes(source.value) ? 'bg-indigo-600' : ''}
                    >
                      {source.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Campanhas</Label>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 border rounded-lg">
                  {campaigns.length === 0 ? (
                    <p className="text-sm text-slate-500">Nenhuma campanha</p>
                  ) : (
                    campaigns.map(campaign => (
                      <Button
                        key={campaign.id}
                        type="button"
                        variant={formData.trigger_campaigns.includes(campaign.id) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleCampaign(campaign.id)}
                        className={formData.trigger_campaigns.includes(campaign.id) ? 'bg-indigo-600' : ''}
                      >
                        {campaign.campaign_name}
                      </Button>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Palavras-chave</Label>
                <div className="flex gap-2">
                  <Input
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    placeholder="Digite uma palavra-chave"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                  />
                  <Button type="button" onClick={addKeyword} variant="outline">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.trigger_keywords.map((keyword, idx) => (
                    <Badge key={idx} variant="secondary" className="gap-1">
                      {keyword}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => removeKeyword(keyword)} />
                    </Badge>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="messages" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Saudação</Label>
                <Textarea
                  value={formData.greeting_message}
                  onChange={(e) => setFormData({ ...formData, greeting_message: e.target.value })}
                  placeholder="Primeira mensagem"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Fora do Horário</Label>
                <Textarea
                  value={formData.outside_hours_message}
                  onChange={(e) => setFormData({ ...formData, outside_hours_message: e.target.value })}
                  placeholder="Mensagem fora do horário"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Transferência</Label>
                <Textarea
                  value={formData.handoff_message}
                  onChange={(e) => setFormData({ ...formData, handoff_message: e.target.value })}
                  placeholder="Antes de transferir"
                  rows={4}
                />
              </div>
            </TabsContent>

            <TabsContent value="scoring" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hot Lead</Label>
                  <Input
                    type="number"
                    value={formData.hot_lead_threshold}
                    onChange={(e) => setFormData({ ...formData, hot_lead_threshold: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Warm Lead</Label>
                  <Input
                    type="number"
                    value={formData.warm_lead_threshold}
                    onChange={(e) => setFormData({ ...formData, warm_lead_threshold: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <Label>Auto-atribuir Hot Leads</Label>
                <Switch
                  checked={formData.auto_assign_hot_leads}
                  onCheckedChange={(checked) => setFormData({ ...formData, auto_assign_hot_leads: checked })}
                />
              </div>

              <div className="space-y-2">
                <Label>Função do Agente</Label>
                <Select value={formData.auto_assign_agent_role} onValueChange={(value) => setFormData({ ...formData, auto_assign_agent_role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales_agent">Agente de Vendas</SelectItem>
                    <SelectItem value="sales_manager">Gerente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="questions" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">
                    {editingQuestionIndex >= 0 ? 'Editar Pergunta' : 'Nova Pergunta'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="ID"
                      value={newQuestion.id}
                      onChange={(e) => setNewQuestion({ ...newQuestion, id: e.target.value })}
                    />
                    <Select value={newQuestion.field_to_update} onValueChange={(value) => setNewQuestion({ ...newQuestion, field_to_update: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Campo" />
                      </SelectTrigger>
                      <SelectContent>
                        {leadFields.map(field => (
                          <SelectItem key={field.value} value={field.value}>{field.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Textarea
                    placeholder="Pergunta *"
                    value={newQuestion.question}
                    onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                    rows={2}
                  />

                  <div className="space-y-2">
                    <Label>Respostas</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newAnswer}
                        onChange={(e) => setNewAnswer(e.target.value)}
                        placeholder="Resposta"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAnswerToQuestion())}
                      />
                      <Button type="button" onClick={addAnswerToQuestion} variant="outline" size="sm">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {newQuestion.expected_answers.map((answer, idx) => (
                        <Badge key={idx} variant="secondary" className="gap-1">
                          {answer}
                          <X className="w-3 h-3 cursor-pointer" onClick={() => removeAnswerFromQuestion(answer)} />
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      type="number"
                      placeholder="Score"
                      value={newQuestion.score_impact}
                      onChange={(e) => setNewQuestion({ ...newQuestion, score_impact: parseInt(e.target.value) || 0 })}
                    />
                    <Input
                      placeholder="Próximo (q2, handoff, finish)"
                      value={newQuestion.next_step}
                      onChange={(e) => setNewQuestion({ ...newQuestion, next_step: e.target.value })}
                    />
                  </div>

                  <Button onClick={saveQuestion} variant="default" size="sm" className="w-full bg-indigo-600">
                    <Check className="w-4 h-4 mr-2" />
                    {editingQuestionIndex >= 0 ? 'Atualizar' : 'Adicionar'}
                  </Button>
                </CardContent>
              </Card>

              {formData.qualification_questions.length > 0 && (
                <div className="space-y-2">
                  <Label>Perguntas ({formData.qualification_questions.length})</Label>
                  <DragDropContext onDragEnd={handleQuestionDragEnd}>
                    <Droppable droppableId="questions">
                      {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                          {formData.qualification_questions.map((q, idx) => (
                            <Draggable key={idx} draggableId={String(idx)} index={idx}>
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className="flex items-start gap-2 p-3 border rounded-lg bg-slate-50"
                                >
                                  <div {...provided.dragHandleProps}>
                                    <GripVertical className="w-4 h-4 text-slate-400" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs">{q.id}</Badge>
                                      <Badge variant="secondary" className="text-xs">Score: {q.score_impact}</Badge>
                                    </div>
                                    <div className="text-sm mt-1">{q.question}</div>
                                    {q.expected_answers?.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-2">
                                        {q.expected_answers.map((ans, i) => (
                                          <Badge key={i} variant="outline" className="text-xs">{ans}</Badge>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => editQuestion(idx)}>
                                      <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => removeQuestion(idx)}>
                                      <X className="w-4 h-4 text-red-600" />
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
                </div>
              )}
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Fluxo de Fallback</Label>
                <Select value={formData.fallback_flow_id} onValueChange={(value) => setFormData({ ...formData, fallback_flow_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Nenhum" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Nenhum</SelectItem>
                    {flows.filter(f => f.id !== editingFlow?.id).map(flow => (
                      <SelectItem key={flow.id} value={flow.id}>{flow.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
          </Tabs>

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