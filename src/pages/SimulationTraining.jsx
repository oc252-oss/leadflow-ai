import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Play, RotateCcw, CheckCircle2, MessageSquare, Phone, Plus } from 'lucide-react';
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
  
  const [activeChatSimulation, setActiveChatSimulation] = useState(null);
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
        base44.entities.Assistant.list('-updated_date', 100),
        base44.entities.AIConversationFlow.list('-updated_date', 100)
      ]);
      setAssistants(assistantsData || []);
      setFlows(flowsData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    }
  };

  const handleStartChatSimulation = async () => {
    if (!selectedAssistant || !selectedFlow || !leadName.trim()) {
      toast.error('Selecione Assistente, Fluxo e digite o nome do lead');
      return;
    }

    setLoading(true);
    try {
      const selectedAssistantData = assistants.find(a => a.id === selectedAssistant);
      const selectedFlowData = flows.find(f => f.id === selectedFlow);
      
      setAssistant(selectedAssistantData);
      setActiveChatSimulation({
        id: `sim_${Date.now()}`,
        assistantId: selectedAssistant,
        flowId: selectedFlow,
        leadName: leadName.trim(),
        startedAt: new Date().toISOString()
      });
      
      toast.success('Simulação de chat iniciada!');
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao iniciar simulação');
    } finally {
      setLoading(false);
    }
  };

  const handleRestartChatSimulation = () => {
    setActiveChatSimulation(null);
    setSelectedAssistant('');
    setSelectedFlow('');
    setLeadName('');
    setAssistant(null);
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

  if (activeChatSimulation) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Simulação de Chat</h1>
            <p className="text-slate-600 mt-2">
              Lead: <Badge>{activeChatSimulation.leadName}</Badge>
              <Badge className="ml-2">{assistant?.name}</Badge>
            </p>
          </div>
          <Button
            onClick={handleRestartChatSimulation}
            variant="outline"
            className="gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Encerrar
          </Button>
        </div>

        <SimulationChat
          simulationId={activeChatSimulation.id}
          assistantId={selectedAssistant}
          flowId={selectedFlow}
          systemPrompt={assistant?.system_prompt}
          greetingMessage={assistant?.greeting_message}
        />
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
          Teste seus assistentes com fluxos antes de ativar em produção
        </p>
      </div>

      {/* Empty States Check */}
      {assistants.length === 0 || flows.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assistants.length === 0 && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="pt-6 space-y-4">
                <div>
                  <h3 className="font-semibold text-amber-900 mb-2">Nenhum Assistente encontrado</h3>
                  <p className="text-sm text-amber-800 mb-4">Crie um assistente em "Assistentes de IA" para começar.</p>
                </div>
                <Button className="w-full gap-2" variant="outline" onClick={() => window.location.href = createPageUrl('AIAssistants')}>
                  <Plus className="w-4 h-4" />
                  Criar Assistente
                </Button>
              </CardContent>
            </Card>
          )}
          {flows.length === 0 && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="pt-6 space-y-4">
                <div>
                  <h3 className="font-semibold text-amber-900 mb-2">Nenhum Fluxo encontrado</h3>
                  <p className="text-sm text-amber-800 mb-4">Crie um fluxo em "Fluxos de IA" para testar.</p>
                </div>
                <Button className="w-full gap-2" variant="outline" onClick={() => window.location.href = createPageUrl('AIFlows')}>
                  <Plus className="w-4 h-4" />
                  Criar Fluxo
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
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
                    <label className="text-sm font-medium mb-2 block">Fluxo de IA *</label>
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
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium mb-2 block">Nome do Lead *</label>
                    <Input
                      placeholder="Ex: João Silva"
                      value={leadName}
                      onChange={(e) => setLeadName(e.target.value)}
                    />
                  </div>
                </div>

                <Button
                  onClick={handleStartChatSimulation}
                  disabled={loading || !selectedAssistant || !selectedFlow || !leadName.trim()}
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
      )}
    </div>
  );
}