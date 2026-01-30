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
  Play,
  Info,
  Clock
} from 'lucide-react';
import LeadInfoPanel from './LeadInfoPanel';
import { useEffect as useEffectHook, useState as useStateHook } from 'react';
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
  const [showLeadInfo, setShowLeadInfo] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const [currentStage, setCurrentStage] = useState(null);

  useEffect(() => {
    setMessages(initialMessages || []);
    loadCurrentStage();
  }, [initialMessages]);

  const loadCurrentStage = async () => {
    if (!lead?.pipeline_stage_id) return;
    
    try {
      const stages = await base44.entities.PipelineStage.filter({ id: lead.pipeline_stage_id });
      if (stages.length > 0) {
        setCurrentStage(stages[0]);
      }
    } catch (error) {
      console.error('Error loading current stage:', error);
    }
  };

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
    if (!newMessage.trim() || sending || !conversation?.id || !lead?.id) return;

    setSending(true);
    try {
      const messageContent = newMessage.trim();
      
      // Get current user
      const user = await base44.auth.me();

      // Create message in Message entity
      const newMsg = await base44.entities.Message.create({
        company_id: conversation.company_id || null,
        unit_id: conversation.unit_id || null,
        conversation_id: conversation.id,
        lead_id: lead.id,
        sender_type: 'agent',
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

      // Se for atendimento humano, não processar IA
      // Apenas processar IA se status for bot_active E ai_active for true
      if (conversation.status === 'bot_active' && conversation.ai_active && conversation.ai_flow_id) {
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
      const user = await base44.auth.me();
      const teamMembers = await base44.entities.TeamMember.filter({ user_email: user.email });
      
      if (teamMembers.length === 0) {
        alert('Usuário não encontrado na equipe');
        return;
      }

      const teamMember = teamMembers[0];
      
      // Validar permissão (se não tiver o campo, permitir por padrão)
      if (teamMember.can_assume_conversation === false) {
        alert('Você não tem permissão para assumir conversas');
        return;
      }

      // Atualizar conversa - human_active permite enviar mensagens
      await base44.entities.Conversation.update(conversation.id, {
        status: 'human_active',
        ai_active: false,
        human_handoff: false,
        handoff_reason: 'manual_takeover',
        handoff_at: new Date().toISOString(),
        assigned_agent_id: teamMember.id
      });

      // Criar mensagem de sistema
      await base44.entities.Message.create({
        company_id: conversation.company_id,
        unit_id: conversation.unit_id,
        conversation_id: conversation.id,
        lead_id: lead.id,
        sender_type: 'system',
        content: `${user.full_name} assumiu o atendimento`,
        message_type: 'system_event',
        direction: 'inbound',
        delivered: true,
        read: true
      });

      // Criar log de atividade
      await base44.entities.ActivityLog.create({
        company_id: conversation.company_id,
        lead_id: lead.id,
        action: 'conversation_takeover',
        details: {
          user_name: user.full_name,
          user_email: user.email,
          conversation_id: conversation.id
        }
      });

      await onMessageSent?.();
    } catch (error) {
      console.error('Error taking over conversation:', error);
      alert('Erro ao assumir atendimento');
    }
  };

  const handleDisableAI = async () => {
    try {
      const user = await base44.auth.me();
      const teamMembers = await base44.entities.TeamMember.filter({ user_email: user.email });
      
      if (teamMembers.length === 0) {
        alert('Usuário não encontrado na equipe');
        return;
      }

      const teamMember = teamMembers[0];
      
      // Validar permissão (se não tiver o campo, permitir por padrão)
      if (teamMember.can_disable_ai === false) {
        alert('Você não tem permissão para desabilitar a IA');
        return;
      }

      // Atualizar conversa - status waiting permite humano enviar
      await base44.entities.Conversation.update(conversation.id, {
        ai_active: false,
        status: 'waiting',
        assigned_agent_id: teamMember.id
      });

      // Criar mensagem de sistema
      await base44.entities.Message.create({
        company_id: conversation.company_id,
        unit_id: conversation.unit_id,
        conversation_id: conversation.id,
        lead_id: lead.id,
        sender_type: 'system',
        content: `IA desabilitada por ${user.full_name} - Aguardando atendimento`,
        message_type: 'system_event',
        direction: 'inbound',
        delivered: true,
        read: true
      });

      // Criar log de atividade
      await base44.entities.ActivityLog.create({
        company_id: conversation.company_id,
        lead_id: lead.id,
        action: 'ai_disabled',
        details: {
          user_name: user.full_name,
          user_email: user.email,
          conversation_id: conversation.id
        }
      });

      await onMessageSent?.();
    } catch (error) {
      console.error('Error disabling AI:', error);
      alert('Erro ao desabilitar IA');
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
    <div className="flex-1 flex gap-0">
      {/* Chat Principal */}
      <div className={`flex flex-col bg-white transition-all ${showLeadInfo ? 'flex-1' : 'w-full'}`}>
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
          {/* Status Badges */}
          {currentStage && (
            <Badge 
              className={cn(
                "gap-1",
                currentStage.stage_type === 'new' && "bg-slate-100 text-slate-800",
                currentStage.stage_type === 'ai_handling' && "bg-violet-100 text-violet-800",
                currentStage.stage_type === 'qualified' && "bg-emerald-100 text-emerald-800",
                currentStage.stage_type === 'attended' && "bg-green-100 text-green-800",
                currentStage.stage_type === 'scheduled' && "bg-blue-100 text-blue-800",
                currentStage.stage_type === 'lost' && "bg-red-100 text-red-800"
              )}
            >
              {currentStage.name}
            </Badge>
          )}
          
          {conversation.status === 'bot_active' && conversation.ai_active && (
            <Badge className="bg-violet-100 text-violet-800 gap-1">
              <Bot className="w-3 h-3" />
              IA Ativa
            </Badge>
          )}
          {conversation.status === 'human_active' && (
            <Badge className="bg-green-100 text-green-800 gap-1">
              <User className="w-3 h-3" />
              Atendimento Humano
            </Badge>
          )}
          {conversation.status === 'waiting' && (
            <Badge className="bg-amber-100 text-amber-800 gap-1">
              <User className="w-3 h-3" />
              Aguardando Atendente
            </Badge>
          )}
          
          {lead?.qualification_score > 0 && (
            <Badge variant="outline" className="gap-1">
              Score: {lead.qualification_score}
            </Badge>
          )}
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowLeadInfo(!showLeadInfo)}
            title={showLeadInfo ? 'Ocultar informações' : 'Mostrar informações'}
          >
            <Info className="w-4 h-4" />
          </Button>
          
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
          
          {conversation.ai_active && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDisableAI}
              className="border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              <Bot className="w-4 h-4 mr-2" />
              Desabilitar IA
            </Button>
          )}
          
          {conversation.status !== 'human_active' && !conversation.assigned_agent_id && (
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
        {conversation.status === 'closed' ? (
          <div className="text-center text-slate-500 py-2">
            Conversa encerrada
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Input
              ref={inputRef}
              placeholder={
                conversation.status === 'bot_active' && conversation.ai_active 
                  ? "IA está respondendo..." 
                  : "Digite sua mensagem..."
              }
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
        )}
      </div>
    </div>

      {/* Painel de Informações do Lead */}
      {showLeadInfo && (
        <div className="w-80 flex-shrink-0 border-l border-slate-200 bg-slate-50 overflow-y-auto p-4">
          <LeadInfoPanel lead={lead} conversation={conversation} />
        </div>
      )}
    </div>
  );
}