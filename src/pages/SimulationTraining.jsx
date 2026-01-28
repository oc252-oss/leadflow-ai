import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader } from 'lucide-react';
import VoiceSimulationSetup from '../components/simulation/VoiceSimulationSetup';
import ChatSimulationSetup from '../components/simulation/ChatSimulationSetup';
import ChatSimulationInterface from '../components/simulation/ChatSimulationInterface';

export default function SimulationTraining() {
  const [loading, setLoading] = useState(true);
  const [assistants, setAssistants] = useState([]);
  const [flows, setFlows] = useState([]);
  const [chatSimulation, setChatSimulation] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [assistantsData, flowsData] = await Promise.all([
        base44.entities.Assistant.list('-updated_date', 100),
        base44.entities.AIConversationFlow.list('-updated_date', 100)
      ]);
      setAssistants(assistantsData);
      setFlows(flowsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChatStart = (config) => {
    setChatSimulation(config);
  };

  const handleChatRestart = () => {
    setChatSimulation(null);
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
      <h1 className="text-2xl font-bold text-slate-900">Simulação & Treinamento</h1>

      <Tabs defaultValue="voz" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="voz">🎧 Simulação de Voz</TabsTrigger>
          <TabsTrigger value="chat">💬 Simulação de Chat</TabsTrigger>
          <TabsTrigger value="treinamento">🧠 Treinamento Humano</TabsTrigger>
        </TabsList>

        <TabsContent value="voz" className="mt-6">
          <VoiceSimulationSetup assistants={assistants} />
        </TabsContent>

        <TabsContent value="chat" className="mt-6">
          {chatSimulation ? (
            <ChatSimulationInterface
              {...chatSimulation}
              onRestart={handleChatRestart}
            />
          ) : (
            <ChatSimulationSetup
              assistants={assistants}
              flows={flows}
              onStart={handleChatStart}
            />
          )}
        </TabsContent>

        <TabsContent value="treinamento" className="mt-6">
          <div className="text-center text-slate-500 py-12">
            Treinamento Humano em desenvolvimento
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}