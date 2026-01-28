import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Send, Loader2, ThumbsUp, ThumbsDown } from 'lucide-react';
import { toast } from 'sonner';

export default function SimulationChat({ simulationId, assistantId, flowId, systemPrompt, greetingMessage }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [feedbackMode, setFeedbackMode] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Initialize with greeting message
    if (greetingMessage && messages.length === 0) {
      setMessages([{
        id: `msg_${Date.now()}`,
        sender_type: 'bot',
        content: greetingMessage,
        created_date: new Date().toISOString()
      }]);
    }
  }, [simulationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue;
    setInputValue('');
    
    // Add user message to chat (session only)
    const userMsg = {
      id: `msg_${Date.now()}`,
      sender_type: 'lead',
      content: userMessage,
      created_date: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const response = await base44.functions.invoke('processSimulationMessage', {
        userMessage,
        assistantId,
        flowId,
        systemPrompt,
        conversationHistory: messages
      });

      if (response.data?.success) {
        // Add AI response to chat (session only)
        const aiMsg = {
          id: `msg_${Date.now() + 1}`,
          sender_type: 'bot',
          content: response.data.aiResponse,
          created_date: new Date().toISOString()
        };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        toast.error('Erro ao processar mensagem');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao processar mensagem');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (messageId, isAdequate, idealResponse = '') => {
    try {
      const message = messages.find(m => m.id === messageId);
      await base44.asServiceRole.entities.TrainingFeedback.create({
        assistant_id: assistantId,
        simulation_id: simulationId,
        message_id: messageId,
        ai_response: message?.content,
        is_adequate: isAdequate,
        ideal_response: idealResponse,
        status: 'new'
      });

      toast.success('Feedback salvo!');
      setFeedbackMode(null);
    } catch (error) {
      console.error('Erro ao salvar feedback:', error);
      toast.error('Erro ao salvar feedback');
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b">
        <CardTitle className="text-base">Chat de Simulação</CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-500">
              <p>Inicie a conversa digitando uma mensagem</p>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <div key={msg.id} className="space-y-2">
                  <div className={`flex ${msg.sender_type === 'lead' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs px-4 py-2 rounded-lg ${
                      msg.sender_type === 'lead'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-900'
                    }`}>
                      <p className="text-sm">{msg.content}</p>
                      <p className="text-xs mt-1 opacity-70">
                        {new Date(msg.created_date).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  {/* Feedback para mensagens da IA */}
                  {msg.sender_type === 'bot' && (
                    <div className="flex items-center gap-2 px-4 py-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-green-600 hover:bg-green-50"
                        onClick={() => handleFeedback(msg.id, true)}
                      >
                        <ThumbsUp className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => setFeedbackMode(msg.id)}
                      >
                        <ThumbsDown className="w-4 h-4" />
                      </Button>
                    </div>
                  )}

                  {/* Formulário de feedback */}
                  {feedbackMode === msg.id && (
                    <div className="bg-amber-50 p-3 rounded-lg space-y-2">
                      <p className="text-sm font-medium">Qual seria a resposta ideal?</p>
                      <Input
                        placeholder="Digite a resposta ideal..."
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleFeedback(msg.id, false, e.target.value);
                            e.target.value = '';
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="border-t p-4 space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Digite sua mensagem..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={loading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={loading || !inputValue.trim()}
              className="gap-2 bg-indigo-600 hover:bg-indigo-700"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Enviar
            </Button>
          </div>
          <Badge variant="outline" className="text-xs">
            🔒 Sessão Local - Dados não são salvos
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}