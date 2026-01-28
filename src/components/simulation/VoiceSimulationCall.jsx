import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, Pause, Play, RotateCcw, PhoneOff, AlertCircle, Volume2 } from 'lucide-react';
import { toast } from 'sonner';

const CALL_SEQUENCE = [
  {
    speaker: 'ia',
    text: 'Oi, tudo bem? Aqui é da clínica, eu falo com [NOME]?',
    duration: 4
  },
  {
    speaker: 'lead',
    text: '[Lead responde]',
    duration: 3
  },
  {
    speaker: 'ia',
    text: 'Perfeito! Eu estou te ligando porque você teve contato com a gente recentemente, e eu queria entender rapidinho como posso te ajudar.',
    duration: 6
  },
  {
    speaker: 'lead',
    text: '[Lead responde]',
    duration: 3
  },
  {
    speaker: 'ia',
    text: 'Legal! Então me diz uma coisa, hoje você está buscando mais informação ou já pensa em fazer um procedimento?',
    duration: 5
  },
  {
    speaker: 'lead',
    text: '[Lead responde]',
    duration: 3
  },
  {
    speaker: 'ia',
    text: 'Entendi. Seria para agora ou mais para frente?',
    duration: 3
  },
  {
    speaker: 'lead',
    text: '[Lead responde]',
    duration: 3
  },
  {
    speaker: 'ia',
    text: 'Perfeito! Pelo que você me contou, o melhor próximo passo é uma avaliação com um de nossos especialistas, para entender certinho seu caso e te orientar da melhor forma.',
    duration: 7
  },
  {
    speaker: 'lead',
    text: '[Lead responde]',
    duration: 3
  },
  {
    speaker: 'ia',
    text: 'Ótimo! Vou encaminhar seu contato para nossa equipe, e uma de nossas consultoras fala com você ainda hoje, tudo bem?',
    duration: 6
  },
  {
    speaker: 'lead',
    text: '[Lead confirma]',
    duration: 2
  }
];

export default function VoiceSimulationCall({ assistant, leadName, leadContext, onEnd }) {
  const [callStatus, setCallStatus] = useState('calling'); // calling, speaking, listening, ended
  const [currentStep, setCurrentStep] = useState(0);
  const [callDuration, setCallDuration] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [speakingDuration, setSpeakingDuration] = useState(0);

  // Simular progresso da ligação
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration(d => d + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Simular status da fala da IA
  useEffect(() => {
    if (currentStep >= CALL_SEQUENCE.length) {
      setCallStatus('ended');
      return;
    }

    const step = CALL_SEQUENCE[currentStep];
    if (step.speaker === 'ia') {
      setCallStatus('speaking');
      setSpeakingDuration(0);

      const speakingTimer = setInterval(() => {
        setSpeakingDuration(d => {
          if (d >= step.duration) {
            setCallStatus('listening');
            clearInterval(speakingTimer);
            return step.duration;
          }
          return d + 0.5;
        });
      }, 500);

      const nextStepTimer = setTimeout(() => {
        setCurrentStep(currentStep + 1);
      }, step.duration * 1000);

      return () => {
        clearInterval(speakingTimer);
        clearTimeout(nextStepTimer);
      };
    }
  }, [currentStep]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusText = () => {
    if (callStatus === 'calling') return 'Chamando…';
    if (callStatus === 'speaking') return 'Assistente falando…';
    if (callStatus === 'listening') return 'Escutando sua resposta…';
    return 'Ligação encerrada';
  };

  const getCurrentMessage = () => {
    if (currentStep < CALL_SEQUENCE.length) {
      return CALL_SEQUENCE[currentStep].text.replace('[NOME]', leadName);
    }
    return null;
  };

  const handleFeedback = (isAdequate) => {
    setFeedback(isAdequate);
    toast.success(isAdequate ? 'Resposta marcada como adequada' : 'Resposta marcada como inadequada');
    setTimeout(() => {
      setCurrentStep(currentStep + 1);
      setFeedback(null);
    }, 1500);
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setCallDuration(0);
    setFeedback(null);
    setCallStatus('calling');
    setSpeakingDuration(0);
  };

  const handleEnd = () => {
    onEnd();
  };

  return (
    <div className="space-y-6">
      {/* Header - Informações da Simulação */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Assistente</p>
              <p className="text-lg font-semibold text-slate-900">{assistant.name}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-600">Duração</p>
              <p className="text-2xl font-mono font-bold text-indigo-600">{formatTime(callDuration)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Animação de Chamada */}
      <Card className="border-2 border-indigo-200">
        <CardContent className="pt-8 pb-8">
          <div className="space-y-6">
            {/* Status da Ligação */}
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="relative w-20 h-20 flex items-center justify-center bg-indigo-100 rounded-full">
                  <Phone className="w-10 h-10 text-indigo-600" />
                  {isPlaying && (
                    <>
                      <div className="absolute inset-0 rounded-full border-2 border-indigo-600 animate-pulse" />
                      <div className="absolute inset-0 rounded-full border-2 border-indigo-600 animate-pulse" style={{animationDelay: '0.5s'}} />
                    </>
                  )}
                </div>
              </div>
              <p className="text-lg font-semibold text-slate-900">Ligação em Andamento...</p>
              <p className="text-sm text-slate-600 mt-1">Com {leadName}</p>
            </div>

            {/* Barra de Progresso */}
            <div className="bg-slate-200 h-1 rounded-full overflow-hidden">
              <div 
                className="bg-indigo-600 h-full transition-all duration-300"
                style={{width: `${Math.min(((currentStep + 1) / 16) * 100, 100)}%`}}
              />
            </div>
            <p className="text-xs text-slate-500 text-center">Fala {currentStep + 1} de 16</p>

            {/* Mensagem Atual */}
            <div className="bg-slate-50 rounded-lg p-6 border border-slate-200 min-h-[120px] flex flex-col justify-center">
              <div className="flex gap-3 items-start">
                <Badge className="bg-indigo-600 flex-shrink-0">IA</Badge>
                <div className="flex-1">
                  <p className="text-slate-900 leading-relaxed">
                    {currentStep === 0 ? getGreetingMessage() : 'Continuando a conversa...'}
                  </p>
                  {isPlaying && (
                    <div className="mt-3 flex gap-1 items-center">
                      <span className="text-xs text-slate-500">Ouvir Fala (TTS)</span>
                      <div className="flex gap-1">
                        <div className="w-1 h-4 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0s'}} />
                        <div className="w-1 h-4 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}} />
                        <div className="w-1 h-4 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Feedback */}
            {feedback === null && (
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline"
                  onClick={() => handleFeedback(true)}
                  className="border-green-200 text-green-700 hover:bg-green-50"
                >
                  ✓ Adequada
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => handleFeedback(false)}
                  className="border-red-200 text-red-700 hover:bg-red-50"
                >
                  ✗ Inadequada
                </Button>
              </div>
            )}

            {feedback !== null && (
              <div className={`p-4 rounded-lg text-center text-sm font-medium ${
                feedback 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {feedback ? 'Resposta adequada! Próximo...' : 'Resposta inadequada. Próximo...'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Controles */}
      <div className="flex gap-2 justify-center">
        <Button 
          variant="outline"
          size="icon"
          onClick={() => setIsPlaying(!isPlaying)}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>
        <Button 
          variant="outline"
          size="icon"
          onClick={handleRestart}
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
        <Button 
          variant="destructive"
          className="gap-2"
          onClick={handleEnd}
        >
          <PhoneOff className="w-4 h-4" />
          Encerrar Ligação
        </Button>
      </div>
    </div>
  );
}