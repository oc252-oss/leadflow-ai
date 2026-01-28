import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone } from 'lucide-react';
import VoiceSimulationCall from './VoiceSimulationCall';

export default function VoiceSimulationSetup({ assistants }) {
  const [selectedAssistant, setSelectedAssistant] = useState(null);
  const [leadName, setLeadName] = useState('');
  const [leadContext, setLeadContext] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);

  const handleStartSimulation = () => {
    if (!selectedAssistant) return;
    setIsSimulating(true);
  };

  const handleEndSimulation = () => {
    setIsSimulating(false);
  };

  if (isSimulating && selectedAssistant) {
    return (
      <VoiceSimulationCall 
        assistant={selectedAssistant}
        leadName={leadName || 'Cliente'}
        leadContext={leadContext}
        onEnd={handleEndSimulation}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Simulação de Ligação de Voz</CardTitle>
        <p className="text-sm text-slate-500 mt-1">Teste um assistente como se fosse uma ligação real</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Seleção de Assistente */}
        <div>
          <label className="text-sm font-semibold text-slate-700">Selecione um Assistente *</label>
          <p className="text-xs text-slate-500 mt-1 mb-3">Apenas assistentes configurados para voz</p>
          
          {assistants.length === 0 ? (
            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
              <p className="text-sm text-amber-700">Nenhum assistente configurado para voz. Configure um em Assistentes de IA.</p>
            </div>
          ) : (
            <div className="grid gap-2">
              {assistants.map(assistant => (
                <button
                  key={assistant.id}
                  onClick={() => setSelectedAssistant(assistant)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    selectedAssistant?.id === assistant.id
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <p className="font-medium text-slate-900">{assistant.name}</p>
                  <p className="text-xs text-slate-500 mt-1">{assistant.description || 'Sem descrição'}</p>
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded capitalize">
                      {assistant.channel}
                    </span>
                    <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded capitalize">
                      {assistant.tone}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedAssistant && (
          <>
            {/* Nome do Lead */}
            <div>
              <label className="text-sm font-medium text-slate-700">Nome do Lead (opcional)</label>
              <Input 
                value={leadName}
                onChange={(e) => setLeadName(e.target.value)}
                placeholder="Ex: João Silva"
                className="mt-2"
              />
            </div>

            {/* Contexto */}
            <div>
              <label className="text-sm font-medium text-slate-700">Contexto do Lead (opcional)</label>
              <Input 
                value={leadContext}
                onChange={(e) => setLeadContext(e.target.value)}
                placeholder="Ex: Interessado em Botox"
                className="mt-2"
              />
            </div>

            {/* Botão de Iniciar */}
            <Button 
              onClick={handleStartSimulation}
              className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-lg gap-2"
            >
              <Phone className="w-5 h-5" />
              Iniciar Simulação de Ligação
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}