import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Phone, RotateCcw, PhoneOff, AlertCircle, Volume2, Loader } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function VoiceSimulationCallInteractive({ assistant, leadName, leadContext, onEnd }) {
  const [callStatus, setCallStatus] = useState('calling'); // calling, speaking, listening, waiting_input
  const [callDuration, setCallDuration] = useState(0);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentIaResponse, setCurrentIaResponse] = useState(null);
  const [speakingDuration, setSpeakingDuration] = useState(0);

  // Iniciar ligação com mensagem de abertura
  useEffect(() => {
    const startCall = async () => {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simular chamada
      
      // Mensagem de abertura do assistente
      const openingMessage = (assistant.greeting_message || `Oi, tudo bem? Aqui é da clínica, eu falo com ${leadName}?`);
      
      setConversationHistory([{
        speaker: 'ia',
        text: openingMessage
      }]);
      
      setCallStatus('speaking');
      const duration = Math.max(2, Math.ceil(openingMessage.split(' ').length / 2.5));
      simulateSpeaking(duration);
    };

    startCall();
  }, []);

  // Simular duração da fala
  const simulateSpeaking = (duration) => {
    setSpeakingDuration(0);
    let elapsed = 0;

    const timer = setInterval(() => {
      elapsed += 0.5;
      setSpeakingDuration(elapsed);

      if (elapsed >= duration) {
        clearInterval(timer);
        setCallStatus('waiting_input');
      }
    }, 500);
  };

  // Contador de duração da ligação
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration(d => d + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;

    setIsProcessing(true);
    
    try {
      // Adicionar mensagem do usuário ao histórico
      setConversationHistory(prev => [...prev, {
        speaker: 'lead',
        text: userInput
      }]);

      // Processar resposta da IA
      const response = await base44.functions.invoke('processVoiceSimulation', {
        assistantId: assistant.id,
        userMessage: userInput,
        conversationHistory: conversationHistory.concat([{ speaker: 'lead', text: userInput }])
      });

      // Adicionar resposta da IA
      setConversationHistory(prev => [...prev, {
        speaker: 'ia',
        text: response.data.iaResponse
      }]);

      setCurrentIaResponse(response.data.iaResponse);
      setCallStatus('speaking');
      simulateSpeaking(response.data.estimatedDuration);
      setUserInput('');
    } catch (error) {
      toast.error('Erro ao processar resposta da IA');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestart = () => {
    setConversationHistory([]);
    setUserInput('');
    setCallStatus('calling');
    setCallDuration(0);
    setSpeakingDuration(0);
    setCurrentIaResponse(null);
  };

  const getStatusText = () => {
    if (callStatus === 'calling') return 'Chamando…';
    if (callStatus === 'speaking') return 'Assistente falando…';
    if (callStatus === 'waiting_input') return 'Aguardando sua resposta…';
    return 'Ligação ativa';
  };

  return (
    <div className="space-y-6">
      {/* Aviso de Simulação */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="pt-4 pb-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-900">Simulação de voz — áudio real será ativado na produção</p>
            <p className="text-xs text-amber-700 mt-1">Você está testando o comportamento e as mensagens do assistente em um cenário de ligação real</p>
          </div>
        </CardContent>
      </Card>

      {/* Header */}
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

      {/* Status da Ligação */}
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <div className="relative w-20 h-20 flex items-center justify-center bg-indigo-100 rounded-full">
            <Phone className="w-10 h-10 text-indigo-600" />
            {callStatus !== 'ended' && (
              <>
                <div className="absolute inset-0 rounded-full border-2 border-indigo-600 animate-pulse" />
                <div className="absolute inset-0 rounded-full border-2 border-indigo-600 animate-pulse" style={{animationDelay: '0.5s'}} />
              </>
            )}
          </div>
        </div>
        <div>
          <p className="text-lg font-semibold text-slate-900">{getStatusText()}</p>
          <p className="text-sm text-slate-600">Com {leadName}</p>
        </div>
      </div>

      {/* Histórico de Conversa */}
      <Card className="border-2 border-indigo-200">
        <CardContent className="pt-6">
          <ScrollArea className="h-80 pr-4">
            <div className="space-y-4">
              {conversationHistory.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.speaker === 'ia' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[80%] rounded-lg p-4 ${
                    msg.speaker === 'ia'
                      ? 'bg-indigo-50 border border-indigo-200'
                      : 'bg-slate-100 border border-slate-200'
                  }`}>
                    <Badge className={msg.speaker === 'ia' ? 'bg-indigo-600 mb-2' : 'bg-slate-600 mb-2'}>
                      {msg.speaker === 'ia' ? 'IA' : 'VOCÊ'}
                    </Badge>
                    <p className="text-slate-900 leading-relaxed">{msg.text}</p>
                    {msg.speaker === 'ia' && callStatus === 'speaking' && currentIaResponse === msg.text && (
                      <div className="mt-2 flex gap-2 items-center text-xs text-indigo-600 font-medium">
                        <Volume2 className="w-4 h-4" />
                        <span>Falando ({Math.ceil(speakingDuration)}s)</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Input de Resposta */}
      {callStatus === 'waiting_input' && (
        <div className="flex gap-2">
          <Input
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Digite sua resposta..."
            disabled={isProcessing}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!userInput.trim() || isProcessing}
            className="bg-indigo-600 hover:bg-indigo-700 gap-2"
          >
            {isProcessing ? <Loader className="w-4 h-4 animate-spin" /> : 'Enviar'}
          </Button>
        </div>
      )}

      {callStatus === 'speaking' && (
        <div className="flex justify-center">
          <div className="flex gap-1">
            <div className="w-2 h-6 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0s'}} />
            <div className="w-2 h-6 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}} />
            <div className="w-2 h-6 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}} />
          </div>
        </div>
      )}

      {/* Controles */}
      <div className="flex gap-2 justify-center">
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
          onClick={onEnd}
        >
          <PhoneOff className="w-4 h-4" />
          Encerrar Ligação
        </Button>
      </div>
    </div>
  );
}