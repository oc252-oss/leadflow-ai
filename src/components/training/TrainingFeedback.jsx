import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { base44 } from '@/api/base44Client';
import { RefreshCw, TrendingUp, AlertCircle } from 'lucide-react';

export default function TrainingFeedback({ config, messages, onRestart, onChangeDifficulty, onChangeProfile }) {
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateFeedback();
  }, []);

  const generateFeedback = async () => {
    try {
      const response = await base44.functions.invoke('processTrainingSimulation', {
        action: 'generateFeedback',
        trainingType: config.trainingType,
        clientProfile: config.clientProfile,
        difficulty: config.difficulty,
        conversationHistory: messages,
      });

      setFeedback(response.data);
    } catch (error) {
      console.error('Erro ao gerar feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!feedback) return null;

  const criteria = [
    { key: 'clareza', label: 'Clareza', score: feedback.criteria?.clareza || 0 },
    { key: 'empatia', label: 'Empatia', score: feedback.criteria?.empatia || 0 },
    { key: 'postura_comercial', label: 'Postura Comercial', score: feedback.criteria?.postura_comercial || 0 },
    { key: 'conducao_para_avaliacao', label: 'Condução para Avaliação', score: feedback.criteria?.conducao_para_avaliacao || 0 },
  ];

  const getScoreColor = (score) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-blue-600';
    if (score >= 4) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Nota Geral */}
      <Card className="bg-gradient-to-br from-indigo-50 to-violet-50 border-indigo-200">
        <CardContent className="pt-8">
          <div className="text-center">
            <div className="text-6xl font-bold text-indigo-600 mb-2">
              {feedback.overallScore}
            </div>
            <p className="text-slate-600">Nota final do treinamento</p>
            {feedback.previousScore && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <p className="text-sm text-green-600">
                  +{(feedback.overallScore - feedback.previousScore).toFixed(1)} pontos desde último treino
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Avaliação por Critério */}
      <Card>
        <CardHeader>
          <CardTitle>Avaliação por Critério</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={criteria}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis domain={[0, 10]} />
              <Tooltip />
              <Bar dataKey="score" fill="#4f46e5" />
            </BarChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-2 gap-4 mt-6">
            {criteria.map(c => (
              <div key={c.key} className="p-3 rounded-lg bg-slate-50">
                <p className="text-sm font-medium text-slate-900">{c.label}</p>
                <p className={`text-2xl font-bold mt-1 ${getScoreColor(c.score)}`}>
                  {c.score}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sugestões */}
      <Card>
        <CardHeader>
          <CardTitle>Sugestões de Melhoria</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {feedback.suggestions && feedback.suggestions.length > 0 ? (
            feedback.suggestions.map((suggestion, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-sm text-blue-900">{suggestion}</p>
              </div>
            ))
          ) : (
            <p className="text-slate-500 text-sm">Nenhuma sugestão adicional.</p>
          )}
        </CardContent>
      </Card>

      {/* Frases que Funcionaram */}
      {feedback.goodPhrases && feedback.goodPhrases.length > 0 && (
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-900">✅ Frases que Funcionaram</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {feedback.goodPhrases.map((phrase, idx) => (
              <div key={idx} className="text-sm text-green-700 italic">
                "{phrase}"
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Próximas Ações */}
      <Card>
        <CardHeader>
          <CardTitle>Próximas Ações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={onRestart}
            variant="outline"
            className="w-full gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refazer Treinamento
          </Button>
          {feedback.suggestedDifficulty && feedback.suggestedDifficulty !== config.difficulty && (
            <Button
              onClick={() => onChangeDifficulty(feedback.suggestedDifficulty)}
              className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700"
            >
              <TrendingUp className="w-4 h-4" />
              Aumentar para Nível {feedback.suggestedDifficulty}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}