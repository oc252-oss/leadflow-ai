import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Send, StopCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function TrainingChat({ config, onEnd }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Mensagem inicial do cliente
    const initialMessage = getInitialMessage();
    setMessages([{ role: 'client', content: initialMessage, timestamp: new Date() }]);

    // Timer de sessão
    const timer = setInterval(() => setSessionTime(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getInitialMessage = () => {
    const openings = {
      abertura: 'Oi, vi seu anúncio e fiquei interessado. Você poderia me explicar melhor?',
      qualificacao: 'Quanto custa? É caro?',
      objecoes: 'Tenho algumas dúvidas sobre esse produto.',
      conversao: 'Parece bom, mas quero pensar um pouco antes.',
      atendimento_completo: 'Olá, tudo bem? Procuro por uma solução.',
    };

    return openings[config.trainingType] || openings.atendimento_completo;
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'agent', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setTyping(true);

    try {
      const response = await base44.functions.invoke('processTrainingSimulation', {
        trainingType: config.trainingType,
        clientProfile: config.clientProfile,
        difficulty: config.difficulty,
        userMessage: input,
        conversationHistory: messages,
      });

      // Simular delay humano
      await new Promise(r => setTimeout(r, 800 + Math.random() * 1200));

      setTyping(false);
      setMessages(prev => [...prev, {
        role: 'client',
        content: response.data.response,
        timestamp: new Date(),
      }]);
    } catch (error) {
      console.error('Erro:', error);
      setTyping(false);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between border-b">
        <div>
          <h3 className="font-semibold text-slate-900">Treinamento em Andamento</h3>
          <p className="text-xs text-slate-500">
            {config.trainingType === 'abertura' ? 'Abertura de Conversa' : config.trainingType}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-slate-900">{formatTime(sessionTime)}</p>
          <Button
            onClick={() => onEnd(messages)}
            size="sm"
            variant="outline"
            className="mt-2 gap-2"
          >
            <StopCircle className="w-4 h-4" />
            Encerrar
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'agent' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-lg ${
                msg.role === 'agent'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-900'
              }`}
            >
              <p className="text-sm">{msg.content}</p>
              <p className={`text-xs mt-1 ${
                msg.role === 'agent' ? 'text-indigo-200' : 'text-slate-500'
              }`}>
                {msg.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}

        {typing && (
          <div className="flex gap-2">
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce delay-100" />
              <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce delay-200" />
            </div>
            <span className="text-xs text-slate-500">Cliente digitando...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </CardContent>

      <div className="border-t p-4 space-y-2">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !loading && handleSendMessage()}
            placeholder="Digite sua resposta..."
            disabled={loading}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={loading || !input.trim()}
            className="gap-2"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}