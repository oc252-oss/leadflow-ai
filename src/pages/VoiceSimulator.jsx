import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, Send, RotateCcw, Play, AlertCircle, TrendingUp, Clock, MessageSquare, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function VoiceSimulator() {
  const [user, setUser] = useState(null);
  const [teamMember, setTeamMember] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Simulation config
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [callScenario, setCallScenario] = useState('positive');
  const [simulatedContext, setSimulatedContext] = useState({
    lead_name: 'Maria Silva',
    interest_type: 'Harmonização Facial',
    source: 'facebook_lead_ad',
    last_interaction_days: 7
  });

  // Simulation state
  const [isSimulating, setIsSimulating] = useState(false);
  const [conversation, setConversation] = useState([]);
  const [currentInput, setCurrentInput] = useState('');
  const [insights, setInsights] = useState({
    intent: 'unknown',
    objection: null,
    confidence: 0,
    funnel_stage: 'Atendimento Iniciado',
    score_change: 0,
    would_create_task: false,
    task_preview: '',
    final_outcome: null
  });
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const teamMembers = await base44.entities.TeamMember.filter({ user_email: currentUser.email });
      if (teamMembers.length > 0) {
        setTeamMember(teamMembers[0]);
        const voiceCampaigns = await base44.entities.VoiceCampaign.filter({ 
          company_id: teamMembers[0].company_id
        });
        setCampaigns(voiceCampaigns);
        
        const companiesData = await base44.entities.Company.filter({ 
          id: teamMembers[0].company_id 
        });
        setCompanies(companiesData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startSimulation = async () => {
    if (!selectedCampaign) {
      alert('Selecione uma campanha de voz');
      return;
    }

    setIsSimulating(true);
    setProcessing(true);

    try {
      const campaign = campaigns.find(c => c.id === selectedCampaign);
      const company = companies[0];

      const response = await base44.functions.invoke('processVoiceSimulation', {
        campaign_id: selectedCampaign,
        simulated_context: simulatedContext,
        company_context: { name: company?.name || 'clínica' },
        is_initial: true
      });

      setConversation([{
        role: 'assistant',
        content: response.data.voice_message,
        timestamp: new Date().toISOString()
      }]);

      setInsights(response.data.insights);
    } catch (error) {
      console.error('Error starting simulation:', error);
      alert('Erro ao iniciar simulação');
    } finally {
      setProcessing(false);
    }
  };

  const resetSimulation = () => {
    setIsSimulating(false);
    setConversation([]);
    setInsights({
      intent: 'unknown',
      objection: null,
      confidence: 0,
      funnel_stage: 'Atendimento Iniciado',
      score_change: 0,
      would_create_task: false,
      task_preview: '',
      final_outcome: null
    });
    setCurrentInput('');
  };

  const sendResponse = async (text) => {
    if (processing) return;

    const userMessage = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };

    setConversation(prev => [...prev, userMessage]);
    setCurrentInput('');
    setProcessing(true);

    try {
      const response = await base44.functions.invoke('processVoiceSimulation', {
        campaign_id: selectedCampaign,
        user_response: text,
        conversation_history: conversation,
        simulated_context: simulatedContext,
        current_insights: insights
      });

      if (response.data.voice_message) {
        const assistantMessage = {
          role: 'assistant',
          content: response.data.voice_message,
          timestamp: new Date().toISOString()
        };
        setConversation(prev => [...prev, assistantMessage]);
      }

      setInsights(response.data.insights);
    } catch (error) {
      console.error('Error processing response:', error);
      const errorMessage = {
        role: 'system',
        content: 'Erro ao processar resposta.',
        timestamp: new Date().toISOString()
      };
      setConversation(prev => [...prev, errorMessage]);
    } finally {
      setProcessing(false);
    }
  };

  const quickResponses = {
    positive: [
      'Sim, tenho interesse',
      'Pode sim, gostaria de agendar',
      'Quero saber mais',
      'Aceito a avaliação'
    ],
    timing: [
      'Agora não posso falar',
      'Me liga depois, à tarde',
      'Não é um bom momento',
      'Posso retornar mais tarde?'
    ],
    financial: [
      'Está muito caro',
      'Não tenho dinheiro agora',
      'Quanto custa?',
      'Tem desconto?'
    ],
    research: [
      'Estou pesquisando ainda',
      'Vou pensar melhor',
      'Preciso comparar preços',
      'Estou vendo outras clínicas'
    ],
    negative: [
      'Não tenho interesse',
      'Não quero mais contato',
      'Já fiz em outro lugar',
      'Não, obrigado'
    ]
  };

  const scenarioLabels = {
    positive: '✅ Interessado',
    timing: '⏰ Problema de Horário',
    financial: '💰 Questão Financeira',
    research: '🔍 Pesquisando',
    negative: '❌ Sem Interesse'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Simulador de Voz</h1>
          <p className="text-sm text-slate-600 mt-1">
            Teste suas campanhas de voz sem fazer ligações reais
          </p>
        </div>
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
          <AlertCircle className="w-3 h-3 mr-1" />
          Modo Simulação
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Configuração</CardTitle>
              <CardDescription>Configure o teste de voz</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Campanha de Voz*</Label>
                <Select 
                  value={selectedCampaign} 
                  onValueChange={setSelectedCampaign}
                  disabled={isSimulating}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma campanha" />
                  </SelectTrigger>
                  <SelectContent>
                    {campaigns.map(campaign => (
                      <SelectItem key={campaign.id} value={campaign.id}>
                        {campaign.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Cenário de Teste</Label>
                <Select 
                  value={callScenario} 
                  onValueChange={setCallScenario}
                  disabled={isSimulating}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(scenarioLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">
                  Selecione o tipo de resposta para simular
                </p>
              </div>

              <div className="pt-3 border-t space-y-3">
                <p className="text-sm font-medium text-slate-700">Contexto do Lead</p>
                
                <div className="space-y-2">
                  <Label className="text-xs">Nome</Label>
                  <Input
                    value={simulatedContext.lead_name}
                    onChange={(e) => setSimulatedContext({ ...simulatedContext, lead_name: e.target.value })}
                    disabled={isSimulating}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Interesse</Label>
                  <Input
                    value={simulatedContext.interest_type}
                    onChange={(e) => setSimulatedContext({ ...simulatedContext, interest_type: e.target.value })}
                    disabled={isSimulating}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Dias sem contato</Label>
                  <Input
                    type="number"
                    value={simulatedContext.last_interaction_days}
                    onChange={(e) => setSimulatedContext({ ...simulatedContext, last_interaction_days: parseInt(e.target.value) })}
                    disabled={isSimulating}
                  />
                </div>
              </div>

              {!isSimulating ? (
                <Button 
                  onClick={startSimulation} 
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                  disabled={!selectedCampaign}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Iniciar Simulação
                </Button>
              ) : (
                <Button 
                  onClick={resetSimulation} 
                  variant="outline" 
                  className="w-full"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reiniciar
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Insights Panel */}
          {isSimulating && (
            <Card className="border-indigo-200 bg-indigo-50/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  Análise em Tempo Real
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <p className="text-xs text-slate-600">Intent Detectado</p>
                  <Badge variant={
                    insights.intent === 'yes' ? 'default' : 
                    insights.intent === 'maybe' ? 'secondary' : 
                    insights.intent === 'no' ? 'destructive' : 'outline'
                  } className="uppercase">
                    {insights.intent === 'yes' ? '✓ SIM' : 
                     insights.intent === 'maybe' ? '⚠ TALVEZ' : 
                     insights.intent === 'no' ? '✗ NÃO' : '?'}
                  </Badge>
                  {insights.confidence > 0 && (
                    <p className="text-xs text-slate-500 mt-1">
                      Confiança: {insights.confidence}%
                    </p>
                  )}
                </div>

                {insights.objection && (
                  <div className="p-2 bg-amber-100 border border-amber-300 rounded text-xs">
                    <p className="font-medium text-amber-900">Objeção Detectada:</p>
                    <p className="text-amber-800">
                      {insights.objection === 'timing' && '⏰ Questão de Horário'}
                      {insights.objection === 'financial' && '💰 Preocupação Financeira'}
                      {insights.objection === 'research' && '🔍 Em Fase de Pesquisa'}
                    </p>
                  </div>
                )}

                <div className="space-y-1">
                  <p className="text-xs text-slate-600">Etapa do Funil</p>
                  <Badge variant="outline" className="bg-white">
                    {insights.funnel_stage}
                  </Badge>
                </div>

                {insights.final_outcome && (
                  <div className={cn(
                    "p-3 rounded-lg border text-sm",
                    insights.final_outcome === 'qualified' && "bg-green-50 border-green-300 text-green-900",
                    insights.final_outcome === 'follow_up' && "bg-blue-50 border-blue-300 text-blue-900",
                    insights.final_outcome === 'lost' && "bg-red-50 border-red-300 text-red-900"
                  )}>
                    <p className="font-medium mb-1">Resultado Final:</p>
                    <p>
                      {insights.final_outcome === 'qualified' && '✓ Lead Qualificado'}
                      {insights.final_outcome === 'follow_up' && '↻ Follow-up Agendado'}
                      {insights.final_outcome === 'lost' && '✗ Lead Perdido'}
                    </p>
                  </div>
                )}

                {insights.would_create_task && insights.task_preview && (
                  <div className="pt-2 border-t space-y-1">
                    <p className="text-xs font-medium text-slate-700">Tarefa que seria criada:</p>
                    <div className="p-2 bg-white rounded border text-xs text-slate-700">
                      {insights.task_preview}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Call Interface */}
        <div className="lg:col-span-2">
          <Card className="h-[calc(100vh-12rem)]">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Phone className="w-5 h-5 text-indigo-600" />
                  Simulação de Ligação
                </CardTitle>
                {isSimulating && (
                  <Badge className="bg-green-100 text-green-700 border-green-300">
                    Em Andamento
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0 h-[calc(100%-5rem)] flex flex-col">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {!isSimulating ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Phone className="w-16 h-16 text-slate-300 mb-4" />
                    <p className="text-slate-600 font-medium">Configure e inicie uma simulação</p>
                    <p className="text-sm text-slate-500 mt-1">
                      Teste seu script de voz sem fazer ligações reais
                    </p>
                  </div>
                ) : (
                  <>
                    {conversation.map((msg, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "flex gap-3",
                          msg.role === 'user' ? "justify-end" : "justify-start"
                        )}
                      >
                        {msg.role === 'assistant' && (
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Phone className="w-4 h-4 text-indigo-600" />
                          </div>
                        )}
                        <div
                          className={cn(
                            "max-w-[70%] rounded-2xl px-4 py-2.5 text-sm",
                            msg.role === 'user' 
                              ? "bg-slate-700 text-white" 
                              : msg.role === 'system'
                              ? "bg-red-100 text-red-800 border border-red-300"
                              : "bg-slate-100 text-slate-900"
                          )}
                        >
                          {msg.content}
                        </div>
                      </div>
                    ))}
                    {processing && (
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                          <Phone className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div className="bg-slate-100 rounded-2xl px-4 py-2.5">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Quick Responses */}
              {isSimulating && !insights.final_outcome && (
                <div className="border-t p-4 bg-slate-50">
                  <p className="text-xs font-medium text-slate-600 mb-2">Respostas Rápidas:</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {quickResponses[callScenario].map((response, idx) => (
                      <Button
                        key={idx}
                        onClick={() => sendResponse(response)}
                        disabled={processing}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        {response}
                      </Button>
                    ))}
                  </div>
                  
                  <div className="flex gap-2">
                    <Input
                      value={currentInput}
                      onChange={(e) => setCurrentInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendResponse(currentInput)}
                      placeholder="Ou digite sua resposta..."
                      disabled={processing}
                      className="flex-1"
                    />
                    <Button 
                      onClick={() => sendResponse(currentInput)} 
                      disabled={!currentInput.trim() || processing}
                      className="bg-indigo-600 hover:bg-indigo-700"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}