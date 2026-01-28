import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bot, 
  Phone, 
  User, 
  Send, 
  RotateCcw, 
  Play, 
  MessageSquare, 
  AlertCircle, 
  TrendingUp, 
  Clock,
  Target,
  CheckCircle2,
  Award,
  Zap
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { toast } from 'sonner';

export default function SimulationTraining() {
  const [user, setUser] = useState(null);
  const [teamMember, setTeamMember] = useState(null);
  const [assistants, setAssistants] = useState([]);
  const [flows, setFlows] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMode, setActiveMode] = useState('ai_text');

  // Common state
  const [isSimulating, setIsSimulating] = useState(false);
  const [messages, setMessages] = useState([]);
  const [currentInput, setCurrentInput] = useState('');
  const [processing, setProcessing] = useState(false);

  // Configuration
  const [selectedAssistant, setSelectedAssistant] = useState('');
  const [selectedFlow, setSelectedFlow] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [simulatedContext, setSimulatedContext] = useState({
    lead_name: 'João Silva',
    interest_type: 'Botox',
    source: 'facebook_lead_ad',
    last_interaction_days: 7
  });

  // Insights
  const [insights, setInsights] = useState({
    intent: 'unknown',
    objection: null,
    score: 0,
    funnel_stage: 'Novo Lead',
    temperature: 'cold',
    would_create_task: false,
    would_handoff: false,
    task_preview: ''
  });

  // Training metrics
  const [trainingMetrics, setTrainingMetrics] = useState({
    response_time: 0,
    tone_score: 0,
    accuracy_score: 0,
    overall_score: 0
  });

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
        const [assistantsData, aiFlows, voiceCampaigns, companiesData] = await Promise.all([
          base44.entities.Assistant.filter({ 
            organization_id: teamMembers[0].organization_id,
            is_active: true
          }),
          base44.entities.AIConversationFlow.filter({ 
            organization_id: teamMembers[0].organization_id,
            is_active: true
          }),
          base44.entities.VoiceCampaign.filter({ 
            organization_id: teamMembers[0].organization_id
          }),
          base44.entities.Company.filter({ 
            id: teamMembers[0].company_id 
          })
        ]);
        setAssistants(assistantsData);
        setFlows(aiFlows);
        setCampaigns(voiceCampaigns);
        setCompanies(companiesData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startSimulation = async () => {
    if (!selectedAssistant) {
      toast.error('Selecione um assistente');
      return;
    }

    if (activeMode === 'ai_text' && !selectedFlow) {
      toast.error('Selecione um fluxo de IA');
      return;
    }

    if (activeMode === 'ai_voice' && !selectedCampaign) {
      toast.error('Selecione uma campanha de voz');
      return;
    }

    setIsSimulating(true);
    setProcessing(true);

    try {
      if (activeMode === 'ai_text') {
        const flow = flows.find(f => f.id === selectedFlow);
        setMessages([{
          role: 'assistant',
          content: flow?.greeting_message || 'Olá! Como posso ajudar?',
          timestamp: new Date().toISOString()
        }]);
        setInsights({
          ...insights,
          score: 10,
          funnel_stage: 'Atendimento Iniciado'
        });
      } else if (activeMode === 'ai_voice') {
        const response = await base44.functions.invoke('processVoiceSimulation', {
          campaign_id: selectedCampaign,
          simulated_context: simulatedContext,
          company_context: { name: companies[0]?.name || 'clínica' },
          is_initial: true
        });

        setMessages([{
          role: 'assistant',
          content: response.data.voice_message,
          timestamp: new Date().toISOString()
        }]);
        setInsights(response.data.insights);
      } else if (activeMode === 'human_training') {
        // Human training mode - AI plays as lead
        setMessages([{
          role: 'user',
          content: `Olá, vi o anúncio de vocês sobre ${simulatedContext.interest_type}. Gostaria de saber mais.`,
          timestamp: new Date().toISOString()
        }]);
        setInsights({
          ...insights,
          funnel_stage: 'Atendimento Iniciado'
        });
      }
    } catch (error) {
      console.error('Error starting simulation:', error);
      toast.error('Erro ao iniciar simulação');
    } finally {
      setProcessing(false);
    }
  };

  const resetSimulation = () => {
    setIsSimulating(false);
    setMessages([]);
    setInsights({
      intent: 'unknown',
      objection: null,
      score: 0,
      funnel_stage: 'Novo Lead',
      temperature: 'cold',
      would_create_task: false,
      would_handoff: false,
      task_preview: ''
    });
    setTrainingMetrics({
      response_time: 0,
      tone_score: 0,
      accuracy_score: 0,
      overall_score: 0
    });
    setCurrentInput('');
  };

  const sendMessage = async () => {
    if (!currentInput.trim() || processing) return;

    const startTime = Date.now();

    const userMessage = {
      role: activeMode === 'human_training' ? 'assistant' : 'user',
      content: currentInput,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentInput('');
    setProcessing(true);

    try {
      if (activeMode === 'ai_text') {
        const response = await base44.functions.invoke('processAISimulation', {
          flow_id: selectedFlow,
          message: currentInput,
          conversation_history: messages,
          simulated_context: simulatedContext,
          current_insights: insights
        });

        const assistantMessage = {
          role: 'assistant',
          content: response.data.response,
          timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, assistantMessage]);
        setInsights(response.data.insights);

      } else if (activeMode === 'ai_voice') {
        const response = await base44.functions.invoke('processVoiceSimulation', {
          campaign_id: selectedCampaign,
          user_response: currentInput,
          conversation_history: messages,
          simulated_context: simulatedContext,
          current_insights: insights
        });

        if (response.data.voice_message) {
          const assistantMessage = {
            role: 'assistant',
            content: response.data.voice_message,
            timestamp: new Date().toISOString()
          };
          setMessages(prev => [...prev, assistantMessage]);
        }

        setInsights(response.data.insights);

      } else if (activeMode === 'human_training') {
        // Evaluate human response and generate lead reply
        const responseTime = Date.now() - startTime;
        
        const evaluationResponse = await base44.integrations.Core.InvokeLLM({
          prompt: `Você é um avaliador de atendimento ao cliente de uma clínica estética.

Contexto do Lead:
- Nome: ${simulatedContext.lead_name}
- Interesse: ${simulatedContext.interest_type}
- Origem: ${simulatedContext.source}

Histórico da conversa:
${messages.map(m => `${m.role === 'user' ? 'Lead' : 'Atendente'}: ${m.content}`).join('\n')}

Resposta do Atendente: "${currentInput}"

Avalie esta resposta e retorne:
1. Tom (profissional, empático, claro) - score 0-100
2. Precisão (respondeu bem, ofereceu solução) - score 0-100
3. Uma resposta simulada do lead
4. Se o lead ficou mais interessado (sim/não)

Seja crítico mas construtivo.`,
          response_json_schema: {
            type: "object",
            properties: {
              tone_score: { type: "number" },
              accuracy_score: { type: "number" },
              lead_reply: { type: "string" },
              increased_interest: { type: "boolean" },
              feedback: { type: "string" }
            }
          }
        });

        const leadMessage = {
          role: 'user',
          content: evaluationResponse.lead_reply,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, leadMessage]);

        // Update metrics
        const overallScore = Math.round((evaluationResponse.tone_score + evaluationResponse.accuracy_score) / 2);
        setTrainingMetrics({
          response_time: responseTime,
          tone_score: evaluationResponse.tone_score,
          accuracy_score: evaluationResponse.accuracy_score,
          overall_score: overallScore
        });

        // Update insights
        setInsights(prev => ({
          ...prev,
          score: Math.min(100, prev.score + (evaluationResponse.increased_interest ? 10 : -5)),
          temperature: overallScore >= 80 ? 'hot' : overallScore >= 60 ? 'warm' : 'cold'
        }));

        if (evaluationResponse.feedback) {
          toast.info(evaluationResponse.feedback, { duration: 5000 });
        }
      }
    } catch (error) {
      console.error('Error processing message:', error);
      toast.error('Erro ao processar mensagem');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const modeIcons = {
    ai_text: MessageSquare,
    ai_voice: Phone,
    human_training: User
  };

  const ModeIcon = modeIcons[activeMode];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Simulação & Treinamento</h1>
          <p className="text-sm text-slate-600 mt-1">
            Teste assistentes de IA e treine sua equipe sem criar dados reais
          </p>
        </div>
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
          <AlertCircle className="w-3 h-3 mr-1" />
          Modo Sandbox
        </Badge>
      </div>

      {/* Mode Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Selecione o Modo</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeMode} onValueChange={(val) => { setActiveMode(val); resetSimulation(); }}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="ai_text" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                IA - Texto
              </TabsTrigger>
              <TabsTrigger value="ai_voice" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                IA - Voz
              </TabsTrigger>
              <TabsTrigger value="human_training" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Treinamento Humano
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ai_text" className="mt-4">
              <p className="text-sm text-slate-600">
                Teste conversas via WhatsApp/Chat com seu assistente de IA
              </p>
            </TabsContent>

            <TabsContent value="ai_voice" className="mt-4">
              <p className="text-sm text-slate-600">
                Simule ligações de voz (texto) das suas campanhas
              </p>
            </TabsContent>

            <TabsContent value="human_training" className="mt-4">
              <p className="text-sm text-slate-600">
                Pratique atendimento - a IA age como lead e avalia suas respostas
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="w-4 h-4" />
                Configuração
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Assistente IA*</Label>
                <Select 
                  value={selectedAssistant} 
                  onValueChange={setSelectedAssistant}
                  disabled={isSimulating}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {assistants
                      .filter(a => activeMode === 'ai_voice' ? a.can_use_voice : true)
                      .map(assistant => (
                        <SelectItem key={assistant.id} value={assistant.id}>
                          {assistant.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {activeMode === 'ai_text' && (
                <div className="space-y-2">
                  <Label>Fluxo de IA*</Label>
                  <Select 
                    value={selectedFlow} 
                    onValueChange={setSelectedFlow}
                    disabled={isSimulating}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {flows.map(flow => (
                        <SelectItem key={flow.id} value={flow.id}>
                          {flow.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {activeMode === 'ai_voice' && (
                <div className="space-y-2">
                  <Label>Campanha de Voz*</Label>
                  <Select 
                    value={selectedCampaign} 
                    onValueChange={setSelectedCampaign}
                    disabled={isSimulating}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
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
              )}

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
                  <Label className="text-xs">Origem</Label>
                  <Select 
                    value={simulatedContext.source} 
                    onValueChange={(val) => setSimulatedContext({ ...simulatedContext, source: val })}
                    disabled={isSimulating}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="facebook_lead_ad">Facebook</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                    </SelectContent>
                  </Select>
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
                >
                  <Play className="w-4 h-4 mr-2" />
                  Iniciar
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
                  {activeMode === 'human_training' ? 'Suas Métricas' : 'Insights'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {activeMode === 'human_training' ? (
                  <>
                    <div className="space-y-1">
                      <p className="text-xs text-slate-600">Score Geral</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-200 rounded-full h-2">
                          <div 
                            className="bg-indigo-600 h-2 rounded-full transition-all" 
                            style={{ width: `${trainingMetrics.overall_score}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{trainingMetrics.overall_score}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 bg-white rounded border">
                        <p className="text-xs text-slate-600">Tom</p>
                        <p className="text-lg font-bold text-slate-900">{trainingMetrics.tone_score}</p>
                      </div>
                      <div className="p-2 bg-white rounded border">
                        <p className="text-xs text-slate-600">Precisão</p>
                        <p className="text-lg font-bold text-slate-900">{trainingMetrics.accuracy_score}</p>
                      </div>
                    </div>

                    {trainingMetrics.response_time > 0 && (
                      <div className="p-2 bg-white rounded border text-xs">
                        <Clock className="w-3 h-3 inline mr-1" />
                        Tempo de resposta: {(trainingMetrics.response_time / 1000).toFixed(1)}s
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {activeMode === 'ai_text' && (
                      <div className="space-y-1">
                        <p className="text-xs text-slate-600">Score</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-200 rounded-full h-2">
                            <div 
                              className="bg-indigo-600 h-2 rounded-full transition-all" 
                              style={{ width: `${insights.score}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{insights.score}</span>
                        </div>
                      </div>
                    )}

                    {insights.intent && insights.intent !== 'unknown' && (
                      <div className="space-y-1">
                        <p className="text-xs text-slate-600">Intent</p>
                        <Badge variant={
                          insights.intent === 'yes' ? 'default' : 
                          insights.intent === 'maybe' ? 'secondary' : 
                          'destructive'
                        }>
                          {insights.intent.toUpperCase()}
                        </Badge>
                      </div>
                    )}

                    {insights.objection && (
                      <div className="p-2 bg-amber-100 border border-amber-300 rounded text-xs text-amber-800">
                        Objeção: {insights.objection}
                      </div>
                    )}

                    <div className="space-y-1">
                      <p className="text-xs text-slate-600">Etapa do Funil</p>
                      <Badge variant="outline" className="bg-white">
                        {insights.funnel_stage}
                      </Badge>
                    </div>

                    {insights.would_create_task && (
                      <div className="p-2 bg-green-100 border border-green-300 rounded text-xs text-green-800">
                        <CheckCircle2 className="w-3 h-3 inline mr-1" />
                        Tarefa seria criada
                      </div>
                    )}

                    {insights.task_preview && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-slate-600 mb-1">Preview da Tarefa:</p>
                        <p className="text-xs text-slate-700">{insights.task_preview}</p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Chat Interface */}
        <div className="lg:col-span-2">
          <Card className="h-[calc(100vh-12rem)]">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <ModeIcon className="w-5 h-5 text-indigo-600" />
                  {activeMode === 'human_training' ? 'Sessão de Treinamento' : 'Conversa Simulada'}
                </CardTitle>
                {isSimulating && (
                  <Badge className="bg-green-100 text-green-700 border-green-300">
                    Ativo
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0 h-[calc(100%-5rem)] flex flex-col">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {!isSimulating ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <ModeIcon className="w-16 h-16 text-slate-300 mb-4" />
                    <p className="text-slate-600 font-medium">Configure e inicie uma simulação</p>
                    <p className="text-sm text-slate-500 mt-1">
                      {activeMode === 'human_training' 
                        ? 'Pratique seu atendimento e receba feedback em tempo real' 
                        : 'Teste sem criar dados reais no sistema'}
                    </p>
                  </div>
                ) : (
                  <>
                    {messages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "flex gap-3",
                          (msg.role === 'user' && activeMode !== 'human_training') || 
                          (msg.role === 'assistant' && activeMode === 'human_training')
                            ? "justify-end" : "justify-start"
                        )}
                      >
                        {((msg.role === 'assistant' && activeMode !== 'human_training') || 
                          (msg.role === 'user' && activeMode === 'human_training')) && (
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                            activeMode === 'human_training' ? "bg-green-100" : "bg-indigo-100"
                          )}>
                            {activeMode === 'human_training' ? (
                              <User className="w-4 h-4 text-green-600" />
                            ) : (
                              <ModeIcon className="w-4 h-4 text-indigo-600" />
                            )}
                          </div>
                        )}
                        <div
                          className={cn(
                            "max-w-[70%] rounded-2xl px-4 py-2.5 text-sm",
                            (msg.role === 'user' && activeMode !== 'human_training') || 
                            (msg.role === 'assistant' && activeMode === 'human_training')
                              ? "bg-indigo-600 text-white" 
                              : "bg-slate-100 text-slate-900"
                          )}
                        >
                          {msg.content}
                        </div>
                      </div>
                    ))}
                    {processing && (
                      <div className="flex gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center",
                          activeMode === 'human_training' ? "bg-green-100" : "bg-indigo-100"
                        )}>
                          <ModeIcon className={cn(
                            "w-4 h-4",
                            activeMode === 'human_training' ? "text-green-600" : "text-indigo-600"
                          )} />
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

              {/* Input */}
              {isSimulating && (
                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <Input
                      value={currentInput}
                      onChange={(e) => setCurrentInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder={
                        activeMode === 'human_training' 
                          ? "Digite sua resposta como atendente..." 
                          : "Digite sua mensagem..."
                      }
                      disabled={processing}
                      className="flex-1"
                    />
                    <Button 
                      onClick={sendMessage} 
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