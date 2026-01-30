import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Bot, User, Clock, MessageSquare } from 'lucide-react';
import ConversationList from '@/components/conversations/ConversationList';
import ChatWindow from '@/components/conversations/ChatWindow';

export default function Conversations() {
  const [conversations, setConversations] = useState([]);
  const [leads, setLeads] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [teamMember, setTeamMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
    
    // Polling para novas conversas
    const interval = setInterval(() => {
      checkNewConversations();
    }, 10000); // A cada 10 segundos
    
    return () => clearInterval(interval);
  }, []);

  const checkNewConversations = async () => {
    try {
      if (!teamMember) return;
      
      const allConvs = await base44.entities.Conversation.filter({
        assigned_agent_id: teamMember.id
      });
      
      if (allConvs.length > lastConversationCount) {
        // Nova conversa atribuída
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBi2Dz/LWhTsOFGS369+WRwwQVqzn77BcGQU+mNn1x20kBSh+zPLaizsKFF7U7O+vZBkFPJTY9MtyJgUpgM/z2IU2CRZotPD0ollBCEyo5e+qXBgEOY7W9Mp4LgUpg8/z14M4CxVptfDzpFlDDEyo5O6pXRkFOY7W8sp4LgUqhM/y1YM4ChVotfD0pF1FCkuo4+6rYBoGOY7V8sp5MAUrhM/y1YM4ChVotfDzpF1FCk6q4+6rYRsFO47V8sp5MAUrhM/y1IM4ChZptfDzpFxECk+q4+6rYRsFO47V88p5MAUrhM/y1IM4ChZptfDzpFxECk+q4+6rYRsFO47V88p5MAUrhM/y1IM4ChZptfD0pF1FCk+q4+6rYRsFO47V8sp5MAUrhM/y1YM4ChZptfDzpF1FCk+q4+6rYRsFO47V8sp5MAUrhM/y1IM4ChVptfDzpF1FCk+q4+6rYRsFO47V88p5MAUrhM/y1IM4ChVptfDzpF1FCk+q4+6rYRsFO47V8sp5MAUrhM/y1IM4ChVptfD0pF1FCk+q4+6rYRsFO47V8sp5MAUrhM/y1IM4ChVptfDzpF1FCk+q4+6rYRsFO47V88p5MAUrhM/y1IM4ChVptfDzpF1FCk+q4+6rYRsFO47V88p5MAUrhM/y1IM4ChVptfDzpF1FCk+q4+6rYRsFO47V88p5MAUrhM/y1IM4ChVptfDzpF1FCk+q4+6rYRsFO47V88p5MAUrhM/y1IM4ChVptfDzpF1FCk+q4+6rYRsFO47V88p5MAUrhM/y1IM4ChVptfDzpF1FCk+q4+6rYRsFO47V88p5MAUrhM/y1IM4ChVptfDzpF1FCk+q4+6rYRsFO47V88p5MAUrhM/y1IM4ChVptfDzpF1FCk+q4+6rYRsFO47V88p5MAUrhM/y1IM4ChVptfDzpF1FCk+q4+6rYRsFO47V88p5MAU=');
        audio.play().catch(() => {});
        
        toast('Nova Conversa Atribuída!', {
          description: 'Você tem uma nova conversa para atender',
          icon: <Bell className="w-4 h-4" />,
          duration: 5000
        });
      }
      
      setLastConversationCount(allConvs.length);
    } catch (error) {
      console.error('Erro ao verificar novas conversas:', error);
    }
  };

  useEffect(() => {
    // Auto-select conversation from URL
    const params = new URLSearchParams(window.location.search);
    const conversationId = params.get('conversation_id');
    
    if (conversationId && !selectedConversation) {
      console.log('[Conversations] Auto-selecting from URL:', conversationId);
      
      // First check in current conversations list
      const conv = conversations.find(c => c.id === conversationId);
      if (conv) {
        console.log('[Conversations] Found in list, selecting:', conversationId);
        handleSelectConversation(conv);
      } else {
        // Fetch directly if not in list yet
        console.log('[Conversations] Fetching conversation:', conversationId);
        base44.entities.Conversation.filter({ id: conversationId })
          .then(convs => {
            if (convs.length > 0) {
              console.log('[Conversations] Fetched and selecting:', conversationId);
              // Add to list if new
              setConversations(prev => {
                const exists = prev.some(c => c.id === conversationId);
                return exists ? prev : [convs[0], ...prev];
              });
              handleSelectConversation(convs[0]);
            }
          })
          .catch(err => console.error('[Conversations] Error fetching:', err));
      }
    }
  }, [selectedConversation, conversations]);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      const members = await base44.entities.TeamMember.filter({ user_email: user.email });
      
      if (members.length > 0) {
        setTeamMember(members[0]);
        const companyId = members[0].company_id;

        const [conversationsData, leadsData] = await Promise.all([
          base44.entities.Conversation.filter({ company_id: companyId }, '-last_message_at'),
          base44.entities.Lead.filter({ company_id: companyId })
        ]);

        setConversations(conversationsData);
        setLeads(leadsData);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = async (conv) => {
    setSelectedConversation(conv);
    
    // Load messages for this conversation
    try {
      const msgs = await base44.entities.Message.filter(
        { conversation_id: conv.id },
        'created_date'
      );
      setMessages(msgs);

      // Mark as read
      if (conv.unread_count > 0) {
        await base44.entities.Conversation.update(conv.id, { unread_count: 0 });
        setConversations(conversations.map(c => 
          c.id === conv.id ? { ...c, unread_count: 0 } : c
        ));
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };



  const filteredConversations = conversations.filter(conv => {
    const lead = leads.find(l => l.id === conv.lead_id);
    
    // Filter by status
    if (filter !== 'all' && conv.status !== filter) return false;
    
    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        lead?.name?.toLowerCase().includes(query) ||
        lead?.email?.toLowerCase().includes(query) ||
        conv.last_message_preview?.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  const selectedLead = selectedConversation 
    ? leads.find(l => l.id === selectedConversation.lead_id) 
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-12rem)] flex bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Sidebar */}
      <div className="w-96 border-r border-slate-200 flex flex-col">
        {/* Search & Filters */}
        <div className="p-4 border-b border-slate-200 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar conversas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList className="w-full">
              <TabsTrigger value="all" className="flex-1">Todas</TabsTrigger>
              <TabsTrigger value="bot_active" className="flex-1 gap-1">
                <Bot className="w-3 h-3" />
                IA
              </TabsTrigger>
              <TabsTrigger value="human_active" className="flex-1 gap-1">
                <User className="w-3 h-3" />
                Agente
              </TabsTrigger>
              <TabsTrigger value="waiting_response" className="flex-1 gap-1">
                <Clock className="w-3 h-3" />
                Aguardando
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Conversations list */}
        <div className="flex-1 overflow-y-auto">
          <ConversationList
            conversations={filteredConversations}
            leads={leads}
            selectedId={selectedConversation?.id}
            onSelect={handleSelectConversation}
          />
        </div>
      </div>

      {/* Chat window */}
      <ChatWindow
        conversation={selectedConversation}
        lead={selectedLead}
        messages={messages}
        onMessageSent={loadData}
      />
    </div>
  );
}