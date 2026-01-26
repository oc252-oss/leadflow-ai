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
  }, []);

  useEffect(() => {
    // Check URL params for specific lead conversation
    const urlParams = new URLSearchParams(window.location.search);
    const leadId = urlParams.get('lead');
    if (leadId && conversations.length > 0) {
      const conv = conversations.find(c => c.lead_id === leadId);
      if (conv) {
        handleSelectConversation(conv);
      }
    }
  }, [conversations]);

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

  const handleOpenChat = async (lead) => {
    try {
      setLoading(true);
      
      // Create or get conversation via backend
      const response = await base44.functions.invoke('createOrGetConversation', {
        lead_id: lead.id,
        company_id: teamMember.company_id,
        unit_id: teamMember.unit_id
      });

      if (response.data.conversation) {
        const conversation = response.data.conversation;
        
        // Add to conversations list if new
        if (!conversations.find(c => c.id === conversation.id)) {
          setConversations([conversation, ...conversations]);
        }

        // Select the conversation
        await handleSelectConversation(conversation);
      }
    } catch (error) {
      console.error('Error opening chat:', error);
    } finally {
      setLoading(false);
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
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList className="w-full">
              <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
              <TabsTrigger value="bot_active" className="flex-1 gap-1">
                <Bot className="w-3 h-3" />
                AI
              </TabsTrigger>
              <TabsTrigger value="human_active" className="flex-1 gap-1">
                <User className="w-3 h-3" />
                Agent
              </TabsTrigger>
              <TabsTrigger value="waiting_response" className="flex-1 gap-1">
                <Clock className="w-3 h-3" />
                Wait
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
        onOpenChat={handleOpenChat}
        availableLeads={leads}
      />
    </div>
  );
}