import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { AlertCircle, Play } from 'lucide-react';

export default function TrainingSetup({ onStart, userHistory }) {
  const [trainingType, setTrainingType] = useState('');
  const [clientProfile, setClientProfile] = useState('');
  const [difficulty, setDifficulty] = useState([1]);

  const trainingTypes = [
    { value: 'abertura', label: 'Abertura de Conversa' },
    { value: 'qualificacao', label: 'Qualificação de Lead' },
    { value: 'objecoes', label: 'Manejo de Objeções' },
    { value: 'conversao', label: 'Conversão para Venda' },
    { value: 'atendimento_completo', label: 'Atendimento Completo' },
  ];

  const clientProfiles = [
    { value: 'indeciso', label: 'Cliente Indeciso' },
    { value: 'sensivel_preco', label: 'Sensível a Preço' },
    { value: 'frio', label: 'Cliente Frio' },
    { value: 'quente', label: 'Cliente Quente' },
    { value: 'desconfiado', label: 'Cliente Desconfiado' },
    { value: 'comparando_concorrencia', label: 'Comparando Concorrência' },
  ];

  const difficultyLabels = {
    1: 'Iniciante',
    2: 'Intermediário',
    3: 'Avançado',
    4: 'Especialista',
  };

  const getSuggestedTraining = () => {
    if (!userHistory || userHistory.length === 0) return null;

    const avgScores = {};
    userHistory.forEach(session => {
      if (session.feedback?.criteria) {
        Object.entries(session.feedback.criteria).forEach(([key, value]) => {
          avgScores[key] = (avgScores[key] || 0) + value;
        });
      }
    });

    Object.keys(avgScores).forEach(key => {
      avgScores[key] = avgScores[key] / userHistory.length;
    });

    const lowestScore = Object.entries(avgScores).sort((a, b) => a[1] - b[1])[0];

    if (!lowestScore) return null;

    const criteriaToTraining = {
      empatia: 'abertura',
      conducao_para_avaliacao: 'qualificacao',
      postura_comercial: 'objecoes',
      clareza: 'conversao',
    };

    return criteriaToTraining[lowestScore[0]] || null;
  };

  const suggestedTraining = getSuggestedTraining();

  const handleStart = () => {
    if (!trainingType || !clientProfile) {
      alert('Selecione tipo de treinamento e perfil de cliente');
      return;
    }

    onStart({
      trainingType,
      clientProfile,
      difficulty: difficulty[0],
      startedAt: new Date(),
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Painel de Configuração */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Configuração do Treinamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Tipo de Treinamento */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-900">
                Tipo de Treinamento
              </label>
              <Select value={trainingType} onValueChange={setTrainingType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um tipo" />
                </SelectTrigger>
                <SelectContent>
                  {trainingTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Perfil do Cliente */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-900">
                Perfil do Cliente
              </label>
              <Select value={clientProfile} onValueChange={setClientProfile}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um perfil" />
                </SelectTrigger>
                <SelectContent>
                  {clientProfiles.map(profile => (
                    <SelectItem key={profile.value} value={profile.value}>
                      {profile.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Nível de Dificuldade */}
            <div className="space-y-4">
              <label className="text-sm font-medium text-slate-900">
                Nível de Dificuldade: <span className="text-indigo-600">{difficultyLabels[difficulty[0]]}</span>
              </label>
              <Slider
                value={difficulty}
                onValueChange={setDifficulty}
                min={1}
                max={4}
                step={1}
                className="w-full"
              />
              <div className="grid grid-cols-4 gap-2 text-xs text-slate-500">
                <span>Iniciante</span>
                <span>Intermediário</span>
                <span>Avançado</span>
                <span>Especialista</span>
              </div>
            </div>

            {/* Sugestão Automática */}
            {suggestedTraining && (
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-sm text-blue-900">
                  💡 <strong>Sugestão:</strong> Com base no seu desempenho, recomendamos focar em <strong>{trainingTypes.find(t => t.value === suggestedTraining)?.label}</strong>.
                </p>
              </div>
            )}

            <Button
              onClick={handleStart}
              className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 gap-2"
              disabled={!trainingType || !clientProfile}
            >
              <Play className="w-5 h-5" />
              Iniciar Treinamento
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Info Lateral */}
      <Card className="lg:col-span-1 bg-amber-50 border-amber-200">
        <CardContent className="pt-6 space-y-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-900">Isolado</p>
              <p className="text-xs text-amber-700 mt-1">
                Este treinamento não cria leads, conversas ou envia mensagens reais.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-amber-200">
            <p className="font-medium text-amber-900 text-sm mb-2">Como Funciona:</p>
            <ul className="text-xs text-amber-700 space-y-2 list-disc ml-4">
              <li>IA atua como cliente</li>
              <li>Você treina atendimento</li>
              <li>Feedback automático ao final</li>
              <li>Dificuldade se ajusta automaticamente</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}