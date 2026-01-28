import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MessageSquare, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function WhatsAppTestPanel({ channelId, channelLabel }) {
  const [leads, setLeads] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedLead, setSelectedLead] = useState('');
  const [selectedConversation, setSelectedConversation] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);

  useEffect(() => {
    loadLeads();
  }, [channelId]);

  const loadLeads = async () => {
    try {
      const leadsData = await base44.entities.Lead.list('-created_date', 50);
      setLeads(leadsData || []);
    } catch (error) {
      console.error('Erro ao carregar leads:', error);
      toast.error('Erro ao carregar leads');
    }
  };

  const loadConversations = async () => {
    if (!selectedLead) return;
    try {
      const convsData = await base44.entities.Conversation.filter({
        lead_id: selectedLead,
        channel: 'whatsapp'
      });
      setConversations(convsData || []);
      if (convsData && convsData.length > 0) {
        setSelectedConversation(convsData[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
      toast.error('Erro ao carregar conversas');
    }
  };

  const handleSendTestMessage = async () => {
    if (!selectedLead || !testMessage) {
      toast.error('Selecione um lead e insira uma mensagem');
      return;
    }

    setLoading(true);
    try {
      const response = await base44.functions.invoke('simulateWhatsAppMessage', {
        channelId,
        leadId: selectedLead,
        message: testMessage
      });

      if (response.data?.success) {
        setTestMessage('');
        setSelectedConversation(response.data.conversationId);
        await loadConversations();
        toast.success('Mensagem enviada ao IA!');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao enviar mensagem');
    } finally {
      setLoading(false);
    }
  };

  const handleSendAIResponse = async () => {
    if (!selectedConversation || !aiResponse) {
      toast.error('Selecione uma conversa e insira a resposta');
      return;
    }

    setLoading(true);
    try {
      const response = await base44.functions.invoke('simulateWhatsAppResponse', {
        conversationId: selectedConversation,
        aiResponse
      });

      if (response.data?.success) {
        setAiResponse('');
        toast.success('Resposta IA enviada!');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao enviar resposta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <MessageSquare className="w-4 h-4" />
          Testar Canal
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Teste de WhatsApp - {channelLabel}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Selecionar Lead */}
          <div>
            <label className="text-sm font-medium">Selecionar Lead</label>
            <Select value={selectedLead} onValueChange={(value) => {
              setSelectedLead(value);
              loadConversations();
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha um lead..." />
              </SelectTrigger>
              <SelectContent>
                {leads.map(lead => (
                  <SelectItem key={lead.id} value={lead.id}>
                    {lead.name} ({lead.phone || lead.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Enviar Mensagem de Teste */}
          <Card className="bg-slate-50">
            <CardHeader>
              <CardTitle className="text-base">Enviar Mensagem de Teste</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="Digite a mensagem de teste..."
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                className="h-24"
              />
              <Button
                onClick={handleSendTestMessage}
                disabled={loading}
                className="w-full"
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Enviar Mensagem
              </Button>
            </CardContent>
          </Card>

          {/* Enviar Resposta IA */}
          {conversations.length > 0 && (
            <Card className="bg-slate-50">
              <CardHeader>
                <CardTitle className="text-base">Resposta do IA</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Conversa Ativa</label>
                  <Select value={selectedConversation} onValueChange={setSelectedConversation}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {conversations.map(conv => (
                        <SelectItem key={conv.id} value={conv.id}>
                          {conv.id.substring(0, 8)}... - {conv.status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Textarea
                  placeholder="Simulando resposta do IA..."
                  value={aiResponse}
                  onChange={(e) => setAiResponse(e.target.value)}
                  className="h-24"
                />
                <Button
                  onClick={handleSendAIResponse}
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  Enviar Resposta IA
                </Button>
              </CardContent>
            </Card>
          )}

          <Badge className="bg-blue-100 text-blue-800">
            Modo Teste Interno - Sem servidor externo
          </Badge>
        </div>
      </DialogContent>
    </Dialog>
  );
}