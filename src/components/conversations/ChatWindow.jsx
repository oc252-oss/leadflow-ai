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
  Loader2
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
  const messagesEndRef = useRef(null);

  useEffect(() => {
    setMessages(initialMessages || []);
  }, [initialMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!newMessage.trim() || sending || !conversation?.id) return;

    setSending(true);
    try {
      const user = await base44.auth.me();
      const messageContent = newMessage.trim();

      // Create message in Message entity
      const newMsg = await base44.entities.Message.create({
        company_id: conversation.company_id,
        unit_id: conversation.unit_id,
        conversation_id: conversation.id,
        lead_id: lead.id,
        sender_type: 'agent',
        sender_id: user.id,
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

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <Bot className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">Select a conversation</h3>
          <p className="text-slate-500">Choose a conversation from the list to start chatting</p>
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
            <h3 className="font-semibold text-slate-900">{lead?.name || 'Unknown'}</h3>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              {lead?.email && <span>{lead.email}</span>}
              {lead?.phone && <span>• {lead.phone}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {conversation.status === 'bot_active' && (
            <Button variant="outline" size="sm" onClick={handleTakeOver}>
              <User className="w-4 h-4 mr-2" />
              Take Over
            </Button>
          )}
          <Link to={createPageUrl('LeadDetail') + `?id=${lead?.id}`}>
            <Button variant="outline" size="sm">
              <ExternalLink className="w-4 h-4 mr-2" />
              View Lead
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
                  Call Lead
                </DropdownMenuItem>
              )}
              {lead?.email && (
                <DropdownMenuItem>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Email
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
            <p>No messages in this conversation yet</p>
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
                    {msg.sender_type === 'bot' ? 'AI Assistant' : 'You'}
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
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={sending}
            className="flex-1"
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