import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Play, RotateCcw, CheckCircle2, MessageSquare, Phone } from 'lucide-react';
import { toast } from 'sonner';
import SimulationChat from '@/components/simulation/SimulationChat';
import AdjustmentsPanel from '@/components/simulation/AdjustmentsPanel';
import VoiceSimulationSetup from '@/components/simulation/VoiceSimulationSetup';
import VoiceSimulationCall from '@/components/simulation/VoiceSimulationCall';
import VoiceScriptEditor from '@/components/simulation/VoiceScriptEditor';
import ScriptApprovalPanel from '@/components/simulation/ScriptApprovalPanel';

export default function SimulationTraining() {
  const [assistants, setAssistants] = useState([]);
  const [flows, setFlows] = useState([]);
  const [selectedAssistant, setSelectedAssistant] = useState('');
  const [selectedFlow, setSelectedFlow] = useState('');
  const [leadName, setLeadName] = useState('');
  const [leadInterest, setLeadInterest] = useState('');
  const [leadUrgency, setLeadUrgency] = useState('exploring');
  
  const [activeConversation, setActiveConversation] = useState(null);
  const [simulationHistory, setSimulationHistory] = useState([]);
  const [assistant, setAssistant] = useState(null);
  const [loading, setLoading] = useState(false);
  const [voiceSimulation, setVoiceSimulation] = useState(null);
  const [voiceScript, setVoiceScript] = useState([]);
  const [voiceSettings, setVoiceSettings] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [assistantsData, flowsData] = await Promise.all([
        base44.entities.AIAssistant.list(),
        base44.entities.AIFlow.list()
      ]);
      setAssistants(assistantsData || []);
      setFlows(flowsData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar assistentes');
    }
  };

  const handleStartSimulation = async () => {
    if (!selectedAssistant || !leadName) {
      toast.error('Selecione um assistente e digite o nome do lead');
      return;
    }

    setLoading(true);
    try {
      // Criar conversa de simulação
      const conversation = await base44.asServiceRole.entities.Conversation.create({
        lead_id: `sim_${Date.now()}`, // Fake lead ID para simulação
        unit_id: 'simulation',
        company_id: 'simulation',
        channel: 'simulation',
        status: 'bot_active',
        ai_active: true,
        priority: 'normal',
        ai_flow_id: selectedFlow || null
      });

      // Carregar assistente
       const assistantData = await base44.entities.AIAssistant.filter({ id: selectedAssistant });
       setAssistant(assistantData[0]);

      // Enviar mensagem de saudação
      if (assistantData[0]?.greeting_message) {
        await base44.asServiceRole.entities.Message.create({
          conversation_id: conversation.id,
          lead_id: `sim_${Date.now()}`,
          company_id: 'simulation',
          unit_id: 'simulation',
          sender_type: 'bot',
          content: assistantData[0].greeting_message,
          message_type: 'text',
          direction: 'outbound',
          delivered: true
        });
      }

      setActiveConversation(conversation);
      toast.success('Simulação iniciada!');
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao iniciar simulação');
    } finally {
      setLoading(false);
    }
  };

  const handleRestartSimulation = () => {
    setActiveConversation(null);
    setSelectedAssistant('');
    setSelectedFlow('');
    setLeadName('');
    setLeadInterest('');
    setLeadUrgency('exploring');
    setAssistant(null);
  };

  const handleSaveAdjustments = async (edits) => {
    try {
      await base44.asServiceRole.entities.AIAssistant.update(selectedAssistant, {
        system_prompt: edits.system_prompt,
        greeting_message: edits.greeting_message,
        behavior_rules: edits.behavior_rules
      });
      setAssistant({...assistant, ...edits});
    } catch (error) {
      console.error('Erro:', error);
      throw error;
    }
  };

  const handleMarkReadyForProduction = async () => {
    if (!selectedAssistant) return;
    try {
      await base44.asServiceRole.entities.Assistant.update(selectedAssistant, {
        is_active: true
      });
      toast.success('Assistente marcado como pronto para produção!');
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao atualizar assistente');
    }
  };

  const handleStartVoiceSimulation = async (config) => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('generateVoiceSimulation', config);
      
      if (response.data?.success) {
        setVoiceScript(response.data.script);
        setVoiceSettings(config.voiceSettings);
        setVoiceSimulation(config);
        toast.success('Script de voz gerado com sucesso!');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao gerar script de voz');
    } finally {
      setLoading(false);
    }
  };

  const handleRestartVoiceSimulation = () => {
    setVoiceSimulation(null);
    setVoiceScript([]);
    setVoiceSettings(null);
  };

  if (activeConversation) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Simulação de Chat em Andamento</h1>
            <p className="text-slate-600 mt-2">
              Assistente: <Badge>{assistant?.name}</Badge>
              {selectedFlow && <Badge className="ml-2">{flows.find(f => f.id === selectedFlow)?.name}</Badge>}
            </p>
          </div>
          <Button
            onClick={handleRestartSimulation}
            variant="outline"
            className="gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reiniciar
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat */}
          <div className="lg:col-span-2 space-y-4">
            <SimulationChat
              conversationId={activeConversation.id}
              assistantId={selectedAssistant}
              systemPrompt={assistant?.system_prompt}
            />

            <ScriptApprovalPanel
              assistantId={selectedAssistant}
              usageType={selectedAssistant}
              channel="webchat"
              systemPrompt={assistant?.system_prompt}
              greetingMessage={assistant?.greeting_message}
              tone={assistant?.tone}
              behaviorRules={assistant?.behavior_rules}
            />
          </div>

          {/* Adjustments & Info */}
          <div className="space-y-4">
            <AdjustmentsPanel
              assistant={assistant}
              onSave={handleSaveAdjustments}
            />

            {/* Metadata */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Informações da Simulação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-slate-600">Lead</p>
                  <p className="font-medium">{leadName}</p>
                </div>
                {leadInterest && (
                  <div>
                    <p className="text-slate-600">Interesse</p>
                    <p className="font-medium">{leadInterest}</p>
                  </div>
                )}
                <div>
                  <p className="text-slate-600">Urgência</p>
                  <Badge>{leadUrgency}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <Button
                  onClick={handleMarkReadyForProduction}
                  className="w-full gap-2 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Pronto para Produção
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (voiceSimulation) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Simulação de Voz em Andamento</h1>
            <p className="text-slate-600 mt-2">
              Assistente: <Badge>{assistants.find(a => a.id === voiceSimulation.assistantId)?.name}</Badge>
            </p>
          </div>
          <Button
            onClick={handleRestartVoiceSimulation}
            variant="outline"
            className="gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reiniciar
          </Button>
        </div>

        <Tabs defaultValue="call" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="call" className="gap-2">
              <Phone className="w-4 h-4" />
              Simulação
            </TabsTrigger>
            <TabsTrigger value="script" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              Editar Script
            </TabsTrigger>
          </TabsList>

          <TabsContent value="call" className="mt-6">
            <VoiceSimulationCall
              script={voiceScript}
              assistantId={voiceSimulation.assistantId}
              callType={voiceSimulation.callType}
              leadName={voiceSimulation.leadName}
              voiceSettings={voiceSettings}
            />
          </TabsContent>

          <TabsContent value="script" className="mt-6 space-y-4">
            <VoiceScriptEditor
              script={voiceScript}
              assistantId={voiceSimulation.assistantId}
              callType={voiceSimulation.callType}
            />

            <ScriptApprovalPanel
              assistantId={voiceSimulation.assistantId}
              usageType={voiceSimulation.callType}
              channel="voice"
              systemPrompt={assistants.find(a => a.id === voiceSimulation.assistantId)?.system_prompt}
              greetingMessage={assistants.find(a => a.id === voiceSimulation.assistantId)?.greeting_message}
              tone={assistants.find(a => a.id === voiceSimulation.assistantId)?.tone}
              behaviorRules={assistants.find(a => a.id === voiceSimulation.assistantId)?.behavior_rules}
              voiceSettings={voiceSettings}
              conversationHistory={voiceScript}
            />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Simulação & Treinamento de IA</h1>
        <p className="text-slate-600 mt-2">
          Teste, treine e ajuste seus assistentes antes de ativar em produção
        </p>
      </div>

      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="chat" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="voice" className="gap-2">
            <Phone className="w-4 h-4" />
            Voz (CLINIQ Voice)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Iniciar Simulação de Chat</CardTitle>
            </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Assistente */}
            <div>
              <label className="text-sm font-medium mb-2 block">Assistente IA *</label>
              <Select value={selectedAssistant} onValueChange={setSelectedAssistant}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um assistente..." />
                </SelectTrigger>
                <SelectContent>
                  {assistants.map(asst => (
                    <SelectItem key={asst.id} value={asst.id}>
                      {asst.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Flow */}
            <div>
              <label className="text-sm font-medium mb-2 block">Fluxo de IA (Opcional)</label>
              <Select value={selectedFlow} onValueChange={setSelectedFlow}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um fluxo..." />
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

            {/* Lead Name */}
            <div>
              <label className="text-sm font-medium mb-2 block">Nome do Lead *</label>
              <Input
                placeholder="Ex: João Silva"
                value={leadName}
                onChange={(e) => setLeadName(e.target.value)}
              />
            </div>

            {/* Interest */}
            <div>
              <label className="text-sm font-medium mb-2 block">Interesse (Opcional)</label>
              <Input
                placeholder="Ex: Implante dentário"
                value={leadInterest}
                onChange={(e) => setLeadInterest(e.target.value)}
              />
            </div>

            {/* Urgency */}
            <div>
              <label className="text-sm font-medium mb-2 block">Urgência</label>
              <Select value={leadUrgency} onValueChange={setLeadUrgency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Imediata</SelectItem>
                  <SelectItem value="this_week">Esta Semana</SelectItem>
                  <SelectItem value="this_month">Este Mês</SelectItem>
                  <SelectItem value="exploring">Explorando</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleStartSimulation}
            disabled={loading}
            className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Iniciar Simulação
          </Button>
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="voice" className="mt-6">
          <VoiceSimulationSetup
            assistants={assistants}
            onStartSimulation={handleStartVoiceSimulation}
            isLoading={loading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}