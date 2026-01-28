import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Bot, 
  Send, 
  RotateCcw, 
  CheckCircle2, 
  Play, 
  Copy,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  MessageSquare,
  Settings,
  Activity
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { toast } from 'sonner';

export default function TreinarAssistente() {
  const [user, setUser] = useState(null);
  const [teamMember, setTeamMember] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Assistant configuration
  const [assistant, setAssistant] = useState(null);
  const [assistants, setAssistants] = useState([]);
  const [selectedAssistantId, setSelectedAssistantId] = useState('');
  
  // Training session
  const [session, setSession] = useState(null);
  const [greetingMessage, setGreetingMessage] = useState('');
  const [leadContext, setLeadContext] = useState({
    lead_name: 'Cliente Simulado',
    source: 'whatsapp',
    campaign_name: 'Campanha Teste',
    funnel_stage: 'Novo Lead',
    last_interaction_date: new Date().toISOString(),
    current_score: 0
  });
  
  // Behavior rules
  const [behaviorRules, setBehaviorRules] = useState({
    elegant_tone: true,
    prioritize_evaluation: true,
    no_pricing: false,
    feminine_language: false,
    respect_hours: true
  });
  
  // Chat
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [decisionLog, setDecisionLog] = useState([]);
  const [simulatedScore, setSimulatedScore] = useState(0);
  const [simulatedTemperature, setSimulatedTemperature] = useState('cold');

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
        
        // Load assistants
        const assistantsData = await base44.entities.Assistant.filter({ 
          unit_id: teamMembers[0].unit_id 
        });
        setAssistants(assistantsData);
        
        if (assistantsData.length > 0) {
          setSelectedAssistantId(assistantsData[0].id);
          setAssistant(assistantsData[0]);
          setGreetingMessage(assistantsData[0].greeting_message || 'Olá! Bem-vindo(a). Como posso ajudá-lo(a) hoje?');
          setBehaviorRules(assistantsData[0].behavior_rules || behaviorRules);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssistantChange = async (assistantId) => {
    setSelectedAssistantId(assistantId);
    const selected = assistants.find(a => a.id === assistantId);
    if (selected) {
      setAssistant(selected);
      setGreetingMessage(selected.greeting_message || 'Olá! Bem-vindo(a). Como posso ajudá-lo(a) hoje?');
      setBehaviorRules(selected.behavior_rules || behaviorRules);
      resetSimulation();
    }
  };

  const startSimulation = async () => {
    try {
      setLoading(true);
      
      // Create training session
      const newSession = await base44.entities.TrainingSession.create({
        company_id: teamMember.company_id,
        unit_id: teamMember.unit_id,
        assistant_id: assistant.id,
        user_email: user.email,
        simulated_lead_context: leadContext,
        messages: [],
        ai_decision_log: [],
        simulated_score: 0,
        simulated_temperature: 'cold'
      });
      
      setSession(newSession);
      setMessages([{
        role: 'assistant',
        content: greetingMessage,
        timestamp: new Date().toISOString()
      }]);
      setDecisionLog([]);
      setSimulatedScore(0);
      setSimulatedTemperature('cold');
      
      toast.success('Simulação iniciada');
    } catch (error) {
      console.error('Error starting simulation:', error);
      toast.error('Erro ao iniciar simulação');
    } finally {
      setLoading(false);
    }
  };

  const resetSimulation = () => {
    setSession(null);
    setMessages([]);
    setDecisionLog([]);
    setSimulatedScore(0);
    setSimulatedTemperature('cold');
  };

  const sendMessage = async () => {
    if (!userInput.trim() || !session) return;
    
    try {
      setIsProcessing(true);
      
      // Add user message
      const newMessages = [...messages, {
        role: 'user',
        content: userInput,
        timestamp: new Date().toISOString()
      }];
      setMessages(newMessages);
      setUserInput('');
      
      // Process with backend
      const response = await base44.functions.invoke('processSandboxConversation', {
        session_id: session.id,
        user_message: userInput,
        assistant_config: {
          system_prompt: assistant.system_prompt,
          behavior_rules: behaviorRules
        },
        lead_context: {
          ...leadContext,
          current_score: simulatedScore
        },
        conversation_history: messages
      });
      
      if (response.data.success) {
        // Add AI response
        setMessages([...newMessages, {
          role: 'assistant',
          content: response.data.response_text,
          timestamp: new Date().toISOString()
        }]);
        
        // Update decision log
        setDecisionLog([...decisionLog, response.data.decision_log]);
        setSimulatedScore(response.data.simulated_score);
        setSimulatedTemperature(response.data.simulated_temperature);
      } else {
        toast.error('Erro ao processar mensagem');
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Erro ao enviar mensagem');
    } finally {
      setIsProcessing(false);
    }
  };

  const saveGreeting = async () => {
    try {
      await base44.entities.Assistant.update(assistant.id, {
        greeting_message: greetingMessage
      });
      toast.success('Mensagem de saudação salva');
    } catch (error) {
      toast.error('Erro ao salvar saudação');
    }
  };

  const activateAssistant = async () => {
    try {
      await base44.entities.Assistant.update(assistant.id, {
        status: 'active',
        is_active: true,
        behavior_rules: behaviorRules
      });
      toast.success('Assistente ativado para produção!');
      loadData();
    } catch (error) {
      toast.error('Erro ao ativar assistente');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const temperatureColors = {
    cold: 'bg-blue-100 text-blue-700',
    warm: 'bg-amber-100 text-amber-700',
    hot: 'bg-red-100 text-red-700'
  };

  const temperatureLabels = {
    cold: 'Frio',
    warm: 'Morno',
    hot: 'Quente'
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">Treinar Assistente</h1>
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
              Modo Simulação
            </Badge>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Teste e aprove o assistente antes de ativá-lo em produção
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => window.location.reload()}>
            <Copy className="w-4 h-4 mr-2" />
            Duplicar Assistente
          </Button>
          {assistant?.status === 'training' && (
            <Button onClick={activateAssistant} className="bg-green-600 hover:bg-green-700">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Ativar para Produção
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN - Configuration */}
        <div className="lg:col-span-1 space-y-6">
          {/* Assistant Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bot className="w-4 h-4 text-slate-600" />
                Assistente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Selecionar Assistente</Label>
                <Select value={selectedAssistantId} onValueChange={handleAssistantChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha um assistente" />
                  </SelectTrigger>
                  <SelectContent>
                    {assistants.map(a => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {assistant && (
                <>
                  <div className="pt-3 border-t space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Status:</span>
                      <Badge variant={assistant.status === 'active' ? 'default' : 'secondary'}>
                        {assistant.status === 'active' ? 'Ativo' : assistant.status === 'training' ? 'Treinamento' : 'Inativo'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Canal:</span>
                      <span className="font-medium text-slate-900 capitalize">{assistant.channel}</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Greeting Message */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Mensagem de Saudação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={greetingMessage}
                onChange={(e) => setGreetingMessage(e.target.value)}
                rows={4}
                placeholder="Primeira mensagem do assistente..."
              />
              <div className="flex gap-2">
                <Button onClick={saveGreeting} variant="outline" size="sm" className="flex-1">
                  Salvar Saudação
                </Button>
                <Button onClick={resetSimulation} variant="outline" size="sm">
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Simulated Lead Context */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="w-4 h-4 text-slate-600" />
                Contexto do Lead (Simulado)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs">Nome do Lead</Label>
                <Input
                  value={leadContext.lead_name}
                  onChange={(e) => setLeadContext({ ...leadContext, lead_name: e.target.value })}
                  placeholder="Nome do cliente"
                />
              </div>
              <div>
                <Label className="text-xs">Origem</Label>
                <Select 
                  value={leadContext.source} 
                  onValueChange={(v) => setLeadContext({ ...leadContext, source: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="facebook_lead_ad">Facebook Lead Ad</SelectItem>
                    <SelectItem value="messenger">Messenger</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="webchat">WebChat</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Campanha</Label>
                <Input
                  value={leadContext.campaign_name}
                  onChange={(e) => setLeadContext({ ...leadContext, campaign_name: e.target.value })}
                  placeholder="Nome da campanha"
                />
              </div>
            </CardContent>
          </Card>

          {/* Behavior Rules */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Regras de Comportamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-normal">Tom elegante e comercial</Label>
                <Switch
                  checked={behaviorRules.elegant_tone}
                  onCheckedChange={(v) => setBehaviorRules({ ...behaviorRules, elegant_tone: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm font-normal">Priorizar avaliação</Label>
                <Switch
                  checked={behaviorRules.prioritize_evaluation}
                  onCheckedChange={(v) => setBehaviorRules({ ...behaviorRules, prioritize_evaluation: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm font-normal">Não mencionar preços</Label>
                <Switch
                  checked={behaviorRules.no_pricing}
                  onCheckedChange={(v) => setBehaviorRules({ ...behaviorRules, no_pricing: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm font-normal">Linguagem feminina</Label>
                <Switch
                  checked={behaviorRules.feminine_language}
                  onCheckedChange={(v) => setBehaviorRules({ ...behaviorRules, feminine_language: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm font-normal">Respeitar horário comercial</Label>
                <Switch
                  checked={behaviorRules.respect_hours}
                  onCheckedChange={(v) => setBehaviorRules({ ...behaviorRules, respect_hours: v })}
                />
              </div>
            </CardContent>
          </Card>

          {/* AI Decision Log */}
          {session && decisionLog.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="w-4 h-4 text-slate-600" />
                  Log de Decisões da IA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-80 overflow-y-auto">
                {decisionLog.map((log, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-700">{log.description}</span>
                      {log.data.score_change !== 0 && (
                        <Badge variant="outline" className={cn(
                          "text-xs",
                          log.data.score_change > 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                        )}>
                          {log.data.score_change > 0 ? '+' : ''}{log.data.score_change}
                        </Badge>
                      )}
                    </div>
                    {log.data.lead_updates && Object.keys(log.data.lead_updates).length > 0 && (
                      <div className="text-slate-600 space-y-1">
                        <p className="font-medium">Atualizações:</p>
                        {Object.entries(log.data.lead_updates).map(([key, value]) => (
                          value && <p key={key}>• {key}: {value}</p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* RIGHT COLUMN - Chat Simulation */}
        <div className="lg:col-span-2">
          <Card className="h-[calc(100vh-200px)]">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-slate-600" />
                  Simulação de Conversa
                </CardTitle>
                
                {session && (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-600">Score:</span>
                      <Badge variant="outline" className="font-mono">
                        {simulatedScore}/100
                      </Badge>
                    </div>
                    <Badge className={temperatureColors[simulatedTemperature]}>
                      {temperatureLabels[simulatedTemperature]}
                    </Badge>
                  </div>
                )}
              </div>
              {!session && (
                <CardDescription>
                  Inicie uma simulação para testar o assistente
                </CardDescription>
              )}
            </CardHeader>
            
            <CardContent className="p-0 flex flex-col h-[calc(100%-80px)]">
              {!session ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mx-auto">
                      <Bot className="w-8 h-8 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-slate-900">Pronto para começar?</p>
                      <p className="text-sm text-slate-600 mt-1">Configure o assistente e inicie a simulação</p>
                    </div>
                    <Button onClick={startSimulation} className="bg-indigo-600 hover:bg-indigo-700">
                      <Play className="w-4 h-4 mr-2" />
                      Iniciar Simulação
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {messages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "flex gap-3",
                          msg.role === 'user' ? "justify-end" : "justify-start"
                        )}
                      >
                        {msg.role === 'assistant' && (
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Bot className="w-4 h-4 text-indigo-600" />
                          </div>
                        )}
                        <div
                          className={cn(
                            "max-w-[70%] rounded-2xl px-4 py-2.5",
                            msg.role === 'user'
                              ? "bg-slate-800 text-white"
                              : "bg-white border border-slate-200"
                          )}
                        >
                          <p className="text-sm leading-relaxed">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                    
                    {isProcessing && (
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                          <Bot className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2.5">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input */}
                  <div className="p-4 border-t bg-slate-50">
                    <div className="flex gap-3">
                      <Input
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Digite como se fosse o cliente..."
                        disabled={isProcessing}
                        className="flex-1"
                      />
                      <Button 
                        onClick={sendMessage} 
                        disabled={!userInput.trim() || isProcessing}
                        className="bg-indigo-600 hover:bg-indigo-700"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}