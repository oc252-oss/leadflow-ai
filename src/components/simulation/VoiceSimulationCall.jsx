import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Volume2, ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

export default function VoiceSimulationCall({ script, assistantId, callType, leadName, voiceSettings }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playing, setPlaying] = useState(null);
  const [feedbackMode, setFeedbackMode] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [savingFeedback, setSavingFeedback] = useState(false);

  const currentSpeech = script[currentIndex];
  const isAISpeech = currentSpeech?.speaker === 'ai';

  const handlePlayAudio = async () => {
    try {
      setPlaying(currentIndex);
      // Simular reprodução de áudio TTS
      // Em produção, integraria com serviço TTS real
      toast.success(`Reproduzindo fala da IA...`);
      setTimeout(() => setPlaying(null), 2000);
    } catch (error) {
      toast.error('Erro ao reproduzir áudio');
    }
  };

  const handleNext = () => {
    if (currentIndex < script.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setFeedbackMode(null);
    } else {
      toast.success('Simulação finalizada!');
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setFeedbackMode(null);
    }
  };

  const handleSaveFeedback = async (isAdequate) => {
    if (isAdequate && !feedbackText) {
      await saveFeedbackToDatabase(isAdequate, '');
      return;
    }

    if (!isAdequate && !feedbackText) {
      toast.error('Digite a fala ideal para feedback inadequado');
      return;
    }

    await saveFeedbackToDatabase(isAdequate, feedbackText);
  };

  const saveFeedbackToDatabase = async (isAdequate, idealSpeech) => {
    setSavingFeedback(true);
    try {
      await base44.asServiceRole.entities.VoiceTrainingFeedback.create({
        assistant_id: assistantId,
        simulation_id: `sim_${Date.now()}`,
        sequence_number: currentIndex,
        ai_speech: currentSpeech.text,
        is_adequate: isAdequate,
        ideal_speech: idealSpeech,
        feedback_notes: feedbackText,
        call_type: callType,
        voice_settings: voiceSettings,
        status: 'new'
      });

      toast.success('Feedback salvo!');
      setFeedbackMode(null);
      setFeedbackText('');
      handleNext();
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao salvar feedback');
    } finally {
      setSavingFeedback(false);
    }
  };

  const progress = ((currentIndex + 1) / script.length) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">{leadName}</h3>
                <p className="text-sm text-slate-600">
                  Fala {currentIndex + 1} de {script.length}
                </p>
              </div>
              <Badge>{callType}</Badge>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-slate-600">{Math.round(progress)}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Speech Card */}
      <Card className={isAISpeech ? 'border-indigo-200 bg-indigo-50' : 'border-slate-200'}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Badge variant={isAISpeech ? 'default' : 'secondary'}>
              {isAISpeech ? 'IA' : 'Lead Simulado'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Texto da Fala */}
          <div className="bg-white p-4 rounded-lg border">
            <p className="text-lg leading-relaxed text-slate-900">{currentSpeech?.text}</p>
          </div>

          {/* Controles de Áudio */}
          {isAISpeech && (
            <Button
              onClick={handlePlayAudio}
              disabled={playing === currentIndex}
              variant="outline"
              className="w-full gap-2"
            >
              {playing === currentIndex ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Reproduzindo...
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4" />
                  Ouvir Fala (TTS)
                </>
              )}
            </Button>
          )}

          {/* Feedback para IA */}
          {isAISpeech && !feedbackMode && (
            <div className="flex gap-2 pt-2 border-t">
              <Button
                onClick={() => setFeedbackMode('adequate')}
                variant="outline"
                className="flex-1 gap-2 text-green-600 hover:bg-green-50"
              >
                <ThumbsUp className="w-4 h-4" />
                Adequada
              </Button>
              <Button
                onClick={() => setFeedbackMode('inadequate')}
                variant="outline"
                className="flex-1 gap-2 text-red-600 hover:bg-red-50"
              >
                <ThumbsDown className="w-4 h-4" />
                Inadequada
              </Button>
            </div>
          )}

          {/* Formulário de Feedback */}
          {feedbackMode && (
            <div className="border-t pt-4 space-y-3 bg-amber-50 p-3 rounded-lg">
              <p className="text-sm font-medium">
                {feedbackMode === 'inadequate' ? 'Qual seria a fala ideal?' : 'Comentários (opcional)'}
              </p>
              <textarea
                placeholder={feedbackMode === 'inadequate' ? 'Digite a fala ideal...' : 'Escreva suas observações...'}
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                className="w-full p-2 border rounded-lg text-sm h-20 resize-none"
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => handleSaveFeedback(feedbackMode === 'adequate')}
                  disabled={savingFeedback}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                >
                  {savingFeedback ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Salvar Feedback
                </Button>
                <Button
                  onClick={() => setFeedbackMode(null)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex gap-2">
        <Button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          variant="outline"
          className="flex-1"
        >
          ← Anterior
        </Button>
        <Button
          onClick={handleNext}
          disabled={currentIndex === script.length - 1}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700"
        >
          {currentIndex === script.length - 1 ? 'Finalizar' : 'Próximo →'}
        </Button>
      </div>
    </div>
  );
}