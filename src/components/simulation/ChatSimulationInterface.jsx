import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RotateCcw, Send, AlertCircle, Loader } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function ChatSimulationInterface({ 
  assistantId, 
  assistantName,
  channel,
  source,
  leadName,
  initialMessage,
  flowId,
  onRestart 
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  // Iniciar simulação com mensagem de abertura
  useEffect(() => {
    const initChat = async () => {
      setIsLoading(true);
      try {
        // Enviar mensagem inicial e obter resposta da IA
        const response = await base44.functions.invoke('processChatSimulation', {
          assistantId,
          userMessage: initialMessage,
          conversationHistory: [],
          flowId
        });

        // Simular delay de digitação
        setTimeout(() => {
          setMessages([
            {
              id: Math.random(),
              sender: 'lead',
              text: initialMessage,
              timestamp: new Date()
            },
            {
              id: Math.random(),
              sender: 'ia',
              text: response.data.message,
              timestamp: new Date(Date.now() + response.data.delay)
            }
          ]);
          setIsLoading(false);
        }, response.data.delay);
      } catch (error) {
        toast.error('Erro ao iniciar simulação');
        console.error(error);
        setIsLoading(false);
      }
    };

    initChat();
  }, []);

  // Auto-scroll para última mensagem
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setIsTyping(true);

    // Adicionar mensagem do usuário
    const newMessages = [
      ...messages,
      {
        id: Math.random(),
        sender: 'lead',
        text: userMessage,
        timestamp: new Date()
      }
    ];
    setMessages(newMessages);

    try {
      // Processar resposta da IA
      const response = await base44.functions.invoke('processChatSimulation', {
        assistantId,
        userMessage,
        conversationHistory: newMessages.filter(m => m.sender),
        flowId
      });

      // Simular delay com indicador de digitação
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            id: Math.random(),
            sender: 'ia',
            text: response.data.message,
            timestamp: new Date()
          }
        ]);
        setIsTyping(false);
      }, response.data.delay);
    } catch (error) {
      toast.error('Erro ao processar resposta');
      console.error(error);
      setIsTyping(false);
    }
  };

  const channelEmoji = {
    whatsapp: '💬',
    instagram: '📷',
    messenger: '👤',
    webchat: '🌐'
  };

  const sourceLabel = {
    facebook_lead_ad: 'Facebook Ads',
    instagram: 'Instagram',
    webchat: 'Site',
    manual: 'Manual'
  };

  return (
    <div className="flex flex-col h-[700px] space-y-4">
      {/* Aviso de Simulação */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="pt-4 pb-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-900">Modo Simulação — nenhuma mensagem real será enviada</p>
            <p className="text-xs text-amber-700 mt-1">Conversa isolada para testes e treinamento</p>
          </div>
        </CardContent>
      </Card>

      {/* Header do Chat */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Assistente</p>
              <p className="text-lg font-semibold text-slate-900">{assistantName}</p>
            </div>
            <div className="text-right space-y-1">
              <div className="flex gap-2 justify-end">
                <Badge variant="outline">{channelEmoji[channel]} {channel}</Badge>
                <Badge variant="outline">{sourceLabel[source]}</Badge>
              </div>
              <p className="text-xs text-slate-600">Chat com {leadName}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Área de Mensagens */}
      <Card className="flex-1 border-2 border-indigo-200 overflow-hidden flex flex-col">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-3">
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <Loader className="w-6 h-6 animate-spin text-indigo-600" />
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'ia' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-xs rounded-2xl px-4 py-2 ${
                        msg.sender === 'ia'
                          ? 'bg-slate-100 text-slate-900 rounded-bl-none'
                          : 'bg-indigo-600 text-white rounded-br-none'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                      <p className={`text-xs mt-1 ${msg.sender === 'ia' ? 'text-slate-500' : 'text-indigo-200'}`}>
                        {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 rounded-2xl rounded-bl-none px-4 py-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}} />
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}} />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>
      </Card>

      {/* Input */}
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !isTyping && handleSendMessage()}
          placeholder="Digite sua mensagem..."
          disabled={isTyping || isLoading}
        />
        <Button
          onClick={handleSendMessage}
          disabled={!input.trim() || isTyping || isLoading}
          className="bg-indigo-600 hover:bg-indigo-700"
          size="icon"
        >
          {isTyping ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
        <Button
          onClick={onRestart}
          variant="outline"
          size="icon"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}