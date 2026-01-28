import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Send, 
  Bot, 
  User, 
  MoreVertical,
  Phone,
  Mail,
  ExternalLink,
  Loader2,
  Play
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from 'date-fns';
import { cn } from "@/lib/utils";

export default function ChatWindow({ conversation, lead, messages: initialMessages, onMessageSent }) {
  const [messages, setMessages] = useState(initialMessages || []);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [startingAI, setStartingAI] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const pollingIntervalRef = useRef(null);

  useEffect(() => {
    setMessages(initialMessages || []);
  }, [initialMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Real-time message polling
  useEffect(() => {
    if (!conversation?.id) return;

    const pollMessages = async () => {
      try {
        const freshMessages = await base44.entities.Message.filter(
          { conversation_id: conversation.id },
          'created_date'
        );
        
        // Only update if there are new messages
        if (freshMessages.length > messages.length || 
            (freshMessages.length > 0 && messages.length > 0 && 
             freshMessages[freshMessages.length - 1].id !== messages[messages.length - 1].id)) {
          setMessages(freshMessages);
        }
      } catch (error) {
        console.error('Error polling messages:', error);
      }
    };

    // Start polling
    pollingIntervalRef.current = setInterval(pollMessages, 2000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [conversation?.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    // Keep input focused for smooth typing
    if (inputRef.current && !sending && !startingAI) {
      inputRef.current.focus();
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || sending || !conversation?.id) return;

    setSending(true);
    try {
      const messageContent = newMessage.trim();
      
      // Determine sender type based on conversation status
      const senderType = conversation.status === 'bot_active' ? 'lead' : 'agent';
      const user = senderType === 'agent' ? await base44.auth.me() : null;

      // Create message in Message entity
      const newMsg = await base44.entities.Message.create({
        company_id: conversation.company_id,
        unit_id: conversation.unit_id,
        conversation_id: conversation.id,
        lead_id: lead.id,
        sender_type: senderType,
        sender_id: user?.id || null,
        content: messageContent,
        message_type: 'text',
        direction: 'outbound',
        read: true,
        delivered: true
      });

      // Update Conversation with last message preview
      await base44.entities.Conversation.update(conversation.id, {
        last_message_preview: messageContent.substring(0, 80),
        last_message_at: new Date().toISOString(),
        unread_count: 0
      });

      // Add message to UI immediately
      setMessages(prev => [...prev, newMsg]);
      setNewMessage('');

      // If bot is active, process answer for AI flow
      if (conversation.status === 'bot_active' && conversation.ai_flow_id) {
        try {
          const response = await base44.functions.invoke('processAIFlowAnswer', {
            conversation_id: conversation.id,
            user_message: messageContent
          });

          console.log('[ChatWindow] AI flow answer processed:', response.data);
        } catch (error) {
          console.error('Error processing AI flow answer:', error);
        }
      }
      
      // Reload full conversation data
      await onMessageSent?.();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTakeOver = async () => {
    try {
      await base44.entities.Conversation.update(conversation.id, {
        status: 'human_active'
      });
    } catch (error) {
      console.error('Error taking over conversation:', error);
    }
  };

  const handleStartAIQualification = async () => {
    setStartingAI(true);
    try {
      // Invoke the autoStartAIFlow function directly
      const response = await base44.functions.invoke('autoStartAIFlow', {
        conversation_id: conversation.id
      });
      
      if (response.data.success) {
        console.log(`[ChatWindow] AI Flow started for conversation ${conversation.id}`);
        // Reload messages and conversation data
        await onMessageSent?.();
      }
    } catch (error) {
      console.error('Error starting AI qualification:', error);
    } finally {
      setStartingAI(false);
    }
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <Bot className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">Selecione uma conversa</h3>
          <p className="text-slate-500">Escolha uma conversa da lista para começar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center text-white font-medium",
            lead?.temperature === 'hot' ? "bg-gradient-to-br from-orange-400 to-red-500" :
            lead?.temperature === 'warm' ? "bg-gradient-to-br from-amber-400 to-orange-500" :
            "bg-gradient-to-br from-slate-400 to-slate-500"
          )}>
            {lead?.name?.charAt(0) || '?'}
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">{lead?.name || 'Desconhecido'}</h3>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              {lead?.email && <span>{lead.email}</span>}
              {lead?.phone && <span>• {lead.phone}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {conversation.status !== 'bot_active' && conversation.ai_flow_id === null && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleStartAIQualification}
              disabled={startingAI}
            >
              {startingAI ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Iniciar Qualificação por IA
            </Button>
          )}
          {conversation.status === 'bot_active' && (
            <Button variant="outline" size="sm" onClick={handleTakeOver}>
              <User className="w-4 h-4 mr-2" />
              Assumir Atendimento
            </Button>
          )}
          <Link to={createPageUrl('LeadDetail') + `?id=${lead?.id}`}>
            <Button variant="outline" size="sm">
              <ExternalLink className="w-4 h-4 mr-2" />
              Ver Lead
            </Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {lead?.phone && (
                <DropdownMenuItem>
                  <Phone className="w-4 h-4 mr-2" />
                  Ligar para Lead
                </DropdownMenuItem>
              )}
              {lead?.email && (
                <DropdownMenuItem>
                  <Mail className="w-4 h-4 mr-2" />
                  Enviar Email
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <p>Nenhuma mensagem nesta conversa ainda</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex",
                msg.sender_type === 'lead' ? "justify-start" : "justify-end"
              )}
            >
              <div className={cn(
                "max-w-[70%] px-4 py-3 rounded-2xl",
                msg.sender_type === 'lead' 
                  ? "bg-white text-slate-900 shadow-sm" 
                  : msg.sender_type === 'bot'
                    ? "bg-violet-100 text-violet-900"
                    : "bg-indigo-600 text-white"
              )}>
                {msg.sender_type !== 'lead' && (
                  <div className={cn(
                    "flex items-center gap-1 mb-1 text-xs",
                    msg.sender_type === 'bot' ? "text-violet-600" : "text-indigo-200"
                  )}>
                    {msg.sender_type === 'bot' ? <Bot className="w-3 h-3" /> : <User className="w-3 h-3" />}
                    {msg.sender_type === 'bot' ? 'Assistente IA' : 'Você'}
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                <p className={cn(
                  "text-xs mt-1",
                  msg.sender_type === 'lead' ? "text-slate-400" : 
                  msg.sender_type === 'bot' ? "text-violet-500" : "text-indigo-200"
                )}>
                  {format(new Date(msg.created_date), 'HH:mm')}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-200 bg-white">
        <div className="flex items-center gap-3">
          <Input
            ref={inputRef}
            placeholder="Digite sua mensagem..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={sending}
            className="flex-1"
            autoFocus
          />
          <Button 
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}