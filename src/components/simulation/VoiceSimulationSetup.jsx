import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Phone, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function VoiceSimulationSetup({ assistants, onStartSimulation, isLoading }) {
  const [selectedAssistant, setSelectedAssistant] = useState('');
  const [callType, setCallType] = useState('qualificacao');
  const [leadName, setLeadName] = useState('');
  const [leadProfile, setLeadProfile] = useState('');
  const [voiceGender, setVoiceGender] = useState('feminine');
  const [voiceSpeed, setVoiceSpeed] = useState([1.0]);
  const [voiceTone, setVoiceTone] = useState('professional');

  const handleStart = async () => {
    if (!selectedAssistant || !leadName) {
      toast.error('Selecione um assistente e digite o nome do lead');
      return;
    }

    onStartSimulation({
      assistantId: selectedAssistant,
      callType,
      leadName,
      leadProfile,
      voiceSettings: {
        gender: voiceGender,
        speed: voiceSpeed[0],
        tone: voiceTone
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="w-5 h-5" />
          Configuração da Simulação de Voz
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Grid principal */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Assistente */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Assistente IA *</Label>
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

          {/* Tipo de Ligação */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Tipo de Ligação *</Label>
            <Select value={callType} onValueChange={setCallType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="qualificacao">Qualificação</SelectItem>
                <SelectItem value="reengajamento">Reengajamento</SelectItem>
                <SelectItem value="prospeccao">Prospecção Ativa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Nome do Lead */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Nome do Lead *</Label>
            <Input
              placeholder="Ex: João Silva"
              value={leadName}
              onChange={(e) => setLeadName(e.target.value)}
            />
          </div>

          {/* Perfil do Lead */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Perfil do Lead (Opcional)</Label>
            <Input
              placeholder="Ex: Proprietário de clínica, 35 anos"
              value={leadProfile}
              onChange={(e) => setLeadProfile(e.target.value)}
            />
          </div>
        </div>

        {/* Configurações de Voz */}
        <div className="border-t pt-6 space-y-4">
          <h3 className="font-semibold text-slate-900">Configurações de Voz</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Gênero */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Gênero da Voz</Label>
              <Select value={voiceGender} onValueChange={setVoiceGender}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="feminine">Feminina</SelectItem>
                  <SelectItem value="masculine">Masculina</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tom */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Tom da Voz</Label>
              <Select value={voiceTone} onValueChange={setVoiceTone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="neutral">Neutro</SelectItem>
                  <SelectItem value="professional">Profissional</SelectItem>
                  <SelectItem value="friendly">Amigável</SelectItem>
                  <SelectItem value="energetic">Energético</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Velocidade */}
          <div>
            <Label className="text-sm font-medium mb-3 block">
              Velocidade da Fala: {voiceSpeed[0].toFixed(1)}x
            </Label>
            <Slider
              value={voiceSpeed}
              onValueChange={setVoiceSpeed}
              min={0.8}
              max={1.5}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>0.8x (Lento)</span>
              <span>1.5x (Rápido)</span>
            </div>
          </div>
        </div>

        {/* Botão de Ação */}
        <Button
          onClick={handleStart}
          disabled={isLoading || !selectedAssistant}
          className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Gerando Script...
            </>
          ) : (
            <>
              <Phone className="w-4 h-4" />
              Iniciar Simulação de Voz
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}