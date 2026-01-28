import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Send, RotateCcw, Play, MessageSquare, Phone, Globe, AlertCircle, TrendingUp, ArrowRight } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function AISimulator() {
  const [user, setUser] = useState(null);
  const [teamMember, setTeamMember] = useState(null);
  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(true);

  // Simulation config
  const [selectedFlow, setSelectedFlow] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('whatsapp');
  const [simulatedContext, setSimulatedContext] = useState({
    lead_name: 'João Silva',
    interest_type: 'Botox',
    source: 'facebook_lead_ad',
    last_interaction_days: 3
  });

  // Simulation state
  const [isSimulating, setIsSimulating] = useState(false);
  const [messages, setMessages] = useState([]);
  const [currentInput, setCurrentInput] = useState('');
  const [insights, setInsights] = useState({
    lead_updates: {},
    score: 0,
    funnel_stage: 'Novo Lead',
    temperature: 'cold',
    would_create_task: false,
    would_handoff: false
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
        const aiFlows = await base44.entities.AIConversationFlow.filter({ 
          company_id: teamMembers[0].company_id,
          is_active: true
        });
        setFlows(aiFlows);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startSimulation = () => {
    if (!selectedFlow) {
      alert('Selecione um fluxo de IA');
      return;
    }

    setIsSimulating(true);
    const flow = flows.find(f => f.id === selectedFlow);
    
    // Add greeting message
    setMessages([{
      role: 'assistant',
      content: flow?.greeting_message || 'Olá! Como posso ajudar?',
      timestamp: new Date().toISOString()
    }]);

    setInsights({
      lead_updates: { funnel_stage: 'Atendimento Iniciado' },
      score: 10,
      funnel_stage: 'Atendimento Iniciado',
      temperature: 'cold',
      would_create_task: false,
      would_handoff: false
    });
  };

  const resetSimulation = () => {
    setIsSimulating(false);
    setMessages([]);
    setInsights({
      lead_updates: {},
      score: 0,
      funnel_stage: 'Novo Lead',
      temperature: 'cold',
      would_create_task: false,
      would_handoff: false
    });
    setCurrentInput('');
  };

  const sendMessage = async () => {
    if (!currentInput.trim() || processing) return;

    const userMessage = {
      role: 'user',
      content: currentInput,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentInput('');
    setProcessing(true);

    try {
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
    } catch (error) {
      console.error('Error processing simulation:', error);
      const errorMessage = {
        role: 'system',
        content: 'Erro ao processar mensagem. Tente novamente.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setProcessing(false);
    }
  };

  const channelIcons = {
    whatsapp: MessageSquare,
    voice: Phone,
    webchat: Globe
  };

  const channelLabels = {
    whatsapp: 'WhatsApp',
    voice: 'Voz',
    webchat: 'Web Chat'
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
          <h1 className="text-2xl font-bold text-slate-900">Simulador de IA</h1>
          <p className="text-sm text-slate-600 mt-1">
            Teste seus assistentes de IA sem criar leads ou conversas reais
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
              <CardDescription>Configure o ambiente de teste</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Fluxo de IA*</Label>
                <Select 
                  value={selectedFlow} 
                  onValueChange={setSelectedFlow}
                  disabled={isSimulating}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um fluxo" />
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

              <div className="space-y-2">
                <Label>Canal Simulado</Label>
                <Select 
                  value={selectedChannel} 
                  onValueChange={setSelectedChannel}
                  disabled={isSimulating}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(channelLabels).map(channel => {
                      const Icon = channelIcons[channel];
                      return (
                        <SelectItem key={channel} value={channel}>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            {channelLabels[channel]}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-3 border-t space-y-3">
                <p className="text-sm font-medium text-slate-700">Contexto do Lead Simulado</p>
                
                <div className="space-y-2">
                  <Label className="text-xs">Nome</Label>
                  <Input
                    value={simulatedContext.lead_name}
                    onChange={(e) => setSimulatedContext({ ...simulatedContext, lead_name: e.target.value })}
                    disabled={isSimulating}
                    placeholder="João Silva"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Interesse</Label>
                  <Input
                    value={simulatedContext.interest_type}
                    onChange={(e) => setSimulatedContext({ ...simulatedContext, interest_type: e.target.value })}
                    disabled={isSimulating}
                    placeholder="Botox"
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
                      <SelectItem value="webchat">Web Chat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Dias desde último contato</Label>
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
                  disabled={!selectedFlow}
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
                  Insights em Tempo Real
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <p className="text-xs text-slate-600">Score</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-indigo-600 h-2 rounded-full transition-all" 
                        style={{ width: `${insights.score}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-slate-900">{insights.score}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-slate-600">Temperatura</p>
                  <Badge variant={
                    insights.temperature === 'hot' ? 'destructive' : 
                    insights.temperature === 'warm' ? 'default' : 'secondary'
                  }>
                    {insights.temperature === 'hot' ? 'Quente' : 
                     insights.temperature === 'warm' ? 'Morno' : 'Frio'}
                  </Badge>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-slate-600">Etapa do Funil</p>
                  <Badge variant="outline" className="bg-white">
                    {insights.funnel_stage}
                  </Badge>
                </div>

                {Object.keys(insights.lead_updates).length > 0 && (
                  <div className="pt-2 border-t space-y-1">
                    <p className="text-xs font-medium text-slate-700">Campos que seriam atualizados:</p>
                    {Object.entries(insights.lead_updates).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2 text-xs">
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span className="text-slate-600">{key}:</span>
                        <span className="font-medium text-slate-900">{value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {insights.would_create_task && (
                  <div className="p-2 bg-green-100 border border-green-300 rounded text-xs text-green-800">
                    ✓ Uma tarefa seria criada
                  </div>
                )}

                {insights.would_handoff && (
                  <div className="p-2 bg-amber-100 border border-amber-300 rounded text-xs text-amber-800">
                    ⚠ Transferência para humano seria ativada
                  </div>
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
                  <Bot className="w-5 h-5 text-indigo-600" />
                  Conversa Simulada
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
                    <Bot className="w-16 h-16 text-slate-300 mb-4" />
                    <p className="text-slate-600 font-medium">Configure e inicie uma simulação</p>
                    <p className="text-sm text-slate-500 mt-1">
                      Teste seu assistente sem criar dados reais
                    </p>
                  </div>
                ) : (
                  <>
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
                            "max-w-[70%] rounded-2xl px-4 py-2.5 text-sm",
                            msg.role === 'user' 
                              ? "bg-indigo-600 text-white" 
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
                          <Bot className="w-4 h-4 text-indigo-600" />
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
                      placeholder="Digite sua mensagem..."
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