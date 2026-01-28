import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, ChevronRight } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ChatSimulationSetup({ assistants, flows, onStart }) {
  const [selectedAssistant, setSelectedAssistant] = useState(null);
  const [selectedFlow, setSelectedFlow] = useState(null);
  const [channel, setChannel] = useState('whatsapp');
  const [source, setSource] = useState('facebook_lead_ad');
  const [leadName, setLeadName] = useState('');
  const [initialMessage, setInitialMessage] = useState('');

  const handleStart = () => {
    if (!selectedAssistant) return;
    onStart({
      assistantId: selectedAssistant.id,
      assistantName: selectedAssistant.name,
      flowId: selectedFlow?.id,
      channel,
      source,
      leadName: leadName || 'Lead',
      initialMessage: initialMessage || `Oi, tudo bem? Vi um anúncio sobre ${selectedAssistant.description || 'vocês'} e gostaria de mais informações.`
    });
  };

  const channels = [
    { value: 'whatsapp', label: '💬 WhatsApp' },
    { value: 'instagram', label: '📷 Instagram' },
    { value: 'messenger', label: '👤 Messenger' },
    { value: 'webchat', label: '🌐 WebChat' }
  ];

  const sources = [
    { value: 'facebook_lead_ad', label: 'Facebook Ads' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'webchat', label: 'Site' },
    { value: 'manual', label: 'Manual' }
  ];

  return (
    <div className="space-y-6">
      {/* Seleção de Assistente */}
      <Card>
        <CardHeader>
          <CardTitle>Selecione um Assistente</CardTitle>
        </CardHeader>
        <CardContent>
          {assistants.length === 0 ? (
            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
              <p className="text-sm text-amber-700">Nenhum assistente disponível. Configure um em Assistentes de IA.</p>
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
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <p className="font-medium text-slate-900">{assistant.name}</p>
                  <p className="text-sm text-slate-500 mt-1">{assistant.description || 'Sem descrição'}</p>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedAssistant && (
        <>
          {/* Configurações */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configurações da Simulação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Canal */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Canal Simulado</label>
                <Select value={channel} onValueChange={setChannel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {channels.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Origem */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Origem do Lead</label>
                <Select value={source} onValueChange={setSource}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sources.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Fluxo de IA (opcional) */}
              {flows.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Fluxo de IA (opcional)</label>
                  <Select value={selectedFlow?.id || ''} onValueChange={(id) => {
                    if (id) setSelectedFlow(flows.find(f => f.id === id));
                    else setSelectedFlow(null);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sem fluxo específico" />
                    </SelectTrigger>
                    <SelectContent>
                      {flows.map(f => (
                        <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Nome do Lead */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Nome do Lead (opcional)</label>
                <Input
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  placeholder="Ex: João Silva"
                />
              </div>

              {/* Mensagem Inicial */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Mensagem Inicial (opcional)</label>
                <Input
                  value={initialMessage}
                  onChange={(e) => setInitialMessage(e.target.value)}
                  placeholder="A IA responderá automaticamente"
                />
              </div>
            </CardContent>
          </Card>

          {/* Botão Start */}
          <Button
            onClick={handleStart}
            className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-lg gap-2"
          >
            <MessageSquare className="w-5 h-5" />
            Iniciar Simulação de Chat
            <ChevronRight className="w-5 h-5" />
          </Button>
        </>
      )}
    </div>
  );
}