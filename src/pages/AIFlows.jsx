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
import { Bot, Plus, Pencil, Trash2, Star, Check, X, Search, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { hasFeature, getLimit, FEATURES } from '@/components/featureGates';
import UpgradeCTA from '@/components/UpgradeCTA';

export default function AIFlows() {
  const [flows, setFlows] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingFlow, setEditingFlow] = useState(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCompany, setFilterCompany] = useState('all');
  const [filterUnit, setFilterUnit] = useState('all');
  const [filterIndustry, setFilterIndustry] = useState('all');
  const [filterActive, setFilterActive] = useState('all');

  const [formData, setFormData] = useState({
    company_id: '',
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
      const user = await base44.auth.me();
      const teamMembers = await base44.entities.TeamMember.filter({ user_email: user.email });
      
      let currentCompany = null;
      if (teamMembers.length > 0) {
        const companiesData = await base44.entities.Company.filter({ id: teamMembers[0].company_id });
        currentCompany = companiesData[0];
        setCompany(currentCompany);
      }
      
      const [flowsData, companiesData, campaignsData] = await Promise.all([
        base44.entities.AIConversationFlow.list('-priority', 100),
        base44.entities.Company.list(),
        base44.entities.Campaign.list()
      ]);
      setFlows(flowsData);
      setCompanies(companiesData);
      setCampaigns(campaignsData);
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
        toast.error('Empresa e nome são obrigatórios');
        return;
      }

      const dataToSave = {
        ...formData,
        trigger_sources: formData.trigger_sources.length > 0 ? formData.trigger_sources : undefined,
        trigger_campaigns: formData.trigger_campaigns.length > 0 ? formData.trigger_campaigns : undefined,
        trigger_keywords: formData.trigger_keywords.length > 0 ? formData.trigger_keywords : undefined,
        unit_id: formData.unit_id || undefined,
        fallback_flow_id: formData.fallback_flow_id || undefined
      };

      if (editingFlow) {
        await base44.entities.AIConversationFlow.update(editingFlow.id, dataToSave);
        toast.success('Fluxo atualizado com sucesso');
      } else {
        await base44.entities.AIConversationFlow.create(dataToSave);
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
    setEditingQuestionIndex(-1);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      company_id: '',
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
    const company = companies.find(c => c.id === companyId);
    return company?.name || companyId;
  };

  const getCampaignName = (campaignId) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    return campaign?.campaign_name || campaignId;
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
          <h1 className="text-3xl font-bold text-slate-900">Fluxos de IA</h1>
          <p className="text-slate-500 mt-1">Configure os fluxos de qualificação automática por IA</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => window.location.href = '/AISimulator'} variant="outline">
            <Bot className="w-4 h-4 mr-2" />
            Testar Simulador
          </Button>
          <Button 
            onClick={() => {
              const plan = company?.plan || 'free';
              const canCreate = flows.length < getLimit(plan, 'ai_flows');
              if (!canCreate) {
                toast.error('Você atingiu o limite de fluxos do seu plano');
                return;
              }
              setShowDialog(true);
            }} 
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Fluxo
          </Button>
        </div>
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
            <Select value={filterIndustry} onValueChange={setFilterIndustry}>
              <SelectTrigger className="w-[150px]">
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

      {/* Upgrade CTA if at limit */}
      {company && flows.length >= getLimit(company.plan || 'free', 'ai_flows') && !hasFeature(company.plan, FEATURES.MULTIPLE_AI_FLOWS) && (
        <UpgradeCTA 
          feature={FEATURES.MULTIPLE_AI_FLOWS}
          message="Você atingiu o limite de fluxos de IA"
          inline={true}
          currentPlan={company.plan}
        />
      )}

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
                  <TableCell className="capitalize">
                    {industries.find(i => i.value === flow.industry)?.label || flow.industry || '-'}
                  </TableCell>
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
                    <Badge variant={flow.is_active ? 'default' : 'secondary'}>
                      {flow.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
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
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingFlow ? 'Editar Fluxo de IA' : 'Novo Fluxo de IA'}</DialogTitle>
            <DialogDescription>
              Configure o comportamento do fluxo de qualificação automática
            </DialogDescription>
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

            {/* General Tab */}
            <TabsContent value="general" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                <div className="space-y-2">
                  <Label>Unidade (opcional)</Label>
                  <Input
                    value={formData.unit_id}
                    onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })}
                    placeholder="ID da unidade"
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
            </TabsContent>

            {/* Triggers Tab */}
            <TabsContent value="triggers" className="space-y-4">
              <div className="space-y-2">
                <Label>Origens de Gatilho</Label>
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
                <Label>Campanhas Associadas</Label>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 border rounded-lg">
                  {campaigns.length === 0 ? (
                    <p className="text-sm text-slate-500">Nenhuma campanha disponível</p>
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
                <Label>Palavras-chave de Gatilho</Label>
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

            {/* Messages Tab */}
            <TabsContent value="messages" className="space-y-4">
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
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Mensagem de Transferência</Label>
                <Textarea
                  value={formData.handoff_message}
                  onChange={(e) => setFormData({ ...formData, handoff_message: e.target.value })}
                  placeholder="Mensagem antes de transferir para atendimento humano"
                  rows={4}
                />
              </div>
            </TabsContent>

            {/* Scoring Tab */}
            <TabsContent value="scoring" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Limite Hot Lead</Label>
                  <Input
                    type="number"
                    value={formData.hot_lead_threshold}
                    onChange={(e) => setFormData({ ...formData, hot_lead_threshold: parseInt(e.target.value) || 0 })}
                    placeholder="80"
                  />
                  <p className="text-xs text-slate-500">Pontuação mínima para lead quente</p>
                </div>
                <div className="space-y-2">
                  <Label>Limite Warm Lead</Label>
                  <Input
                    type="number"
                    value={formData.warm_lead_threshold}
                    onChange={(e) => setFormData({ ...formData, warm_lead_threshold: parseInt(e.target.value) || 0 })}
                    placeholder="50"
                  />
                  <p className="text-xs text-slate-500">Pontuação mínima para lead morno</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label>Atribuir Hot Leads Automaticamente</Label>
                  <p className="text-xs text-slate-500 mt-1">Atribui automaticamente leads quentes a agentes</p>
                </div>
                <Switch
                  checked={formData.auto_assign_hot_leads}
                  onCheckedChange={(checked) => setFormData({ ...formData, auto_assign_hot_leads: checked })}
                />
              </div>

              <div className="space-y-2">
                <Label>Função do Agente para Auto-Atribuição</Label>
                <Select value={formData.auto_assign_agent_role} onValueChange={(value) => setFormData({ ...formData, auto_assign_agent_role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales_agent">Agente de Vendas</SelectItem>
                    <SelectItem value="sales_manager">Gerente de Vendas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            {/* Questions Tab */}
            <TabsContent value="questions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">
                    {editingQuestionIndex >= 0 ? 'Editar Pergunta' : 'Adicionar Pergunta'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="ID (ex: q1_treatment)"
                      value={newQuestion.id}
                      onChange={(e) => setNewQuestion({ ...newQuestion, id: e.target.value })}
                    />
                    <Select value={newQuestion.field_to_update} onValueChange={(value) => setNewQuestion({ ...newQuestion, field_to_update: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Campo a atualizar" />
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
                    <Label>Respostas Esperadas</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newAnswer}
                        onChange={(e) => setNewAnswer(e.target.value)}
                        placeholder="Digite uma resposta"
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
                      placeholder="Impacto na Pontuação"
                      value={newQuestion.score_impact}
                      onChange={(e) => setNewQuestion({ ...newQuestion, score_impact: parseInt(e.target.value) || 0 })}
                    />
                    <Input
                      placeholder="Próximo Passo (ex: q2_urgency)"
                      value={newQuestion.next_step}
                      onChange={(e) => setNewQuestion({ ...newQuestion, next_step: e.target.value })}
                    />
                  </div>

                  <Button onClick={saveQuestion} variant="default" size="sm" className="w-full bg-indigo-600">
                    <Check className="w-4 h-4 mr-2" />
                    {editingQuestionIndex >= 0 ? 'Atualizar Pergunta' : 'Adicionar Pergunta'}
                  </Button>
                </CardContent>
              </Card>

              {/* Questions List */}
              {formData.qualification_questions.length > 0 && (
                <div className="space-y-2">
                  <Label>Perguntas Configuradas ({formData.qualification_questions.length})</Label>
                  {formData.qualification_questions.map((q, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-3 border rounded-lg bg-slate-50">
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => moveQuestion(idx, 'up')}
                          disabled={idx === 0}
                        >
                          <ChevronUp className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => moveQuestion(idx, 'down')}
                          disabled={idx === formData.qualification_questions.length - 1}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{q.id}</Badge>
                          <Badge variant="secondary" className="text-xs">Score: {q.score_impact}</Badge>
                        </div>
                        <div className="font-medium text-sm mt-1">{q.question}</div>
                        <div className="flex gap-4 mt-2 text-xs text-slate-500">
                          <span>Campo: {q.field_to_update || '-'}</span>
                          <span>Próximo: {q.next_step || 'handoff'}</span>
                        </div>
                        {q.expected_answers?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {q.expected_answers.map((ans, i) => (
                              <Badge key={i} variant="outline" className="text-xs">{ans}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => editQuestion(idx)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeQuestion(idx)}
                        >
                          <X className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Advanced Tab */}
            <TabsContent value="advanced" className="space-y-4">
              <div className="space-y-2">
                <Label>Fluxo de Fallback</Label>
                <Select value={formData.fallback_flow_id} onValueChange={(value) => setFormData({ ...formData, fallback_flow_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um fluxo de fallback" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Nenhum</SelectItem>
                    {flows
                      .filter(f => f.id !== editingFlow?.id)
                      .map(flow => (
                        <SelectItem key={flow.id} value={flow.id}>{flow.name}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">
                  Fluxo a ser usado se este falhar ou terminar
                </p>
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