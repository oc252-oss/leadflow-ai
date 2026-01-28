import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, QrCode, Trash2, RefreshCw, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function WhatsAppChannels() {
  const [channels, setChannels] = useState([]);
  const [assistants, setAssistants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [formData, setFormData] = useState({ label: '', assistant_id: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [channelsData, assistantsData] = await Promise.all([
        base44.entities.WhatsAppChannel.list(),
        base44.entities.AIAssistant.list()
      ]);
      setChannels(channelsData || []);
      setAssistants(assistantsData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChannel = async () => {
    if (!formData.label || !formData.assistant_id) {
      alert('Preencha todos os campos');
      return;
    }

    try {
      await base44.entities.WhatsAppChannel.create({
        label: formData.label,
        assistant_id: formData.assistant_id,
        phone_number: '',
        status: 'disconnected'
      });

      setFormData({ label: '', assistant_id: '' });
      setShowCreateDialog(false);
      await loadData();
    } catch (error) {
      console.error('Erro ao criar canal:', error);
      alert('Erro ao criar canal');
    }
  };

  const handleGenerateQR = async (channel) => {
    setSelectedChannel(channel);
    setQrLoading(true);
    setQrCode(null);
    setShowQRDialog(true);

    try {
      const response = await base44.functions.invoke('simulateWhatsAppQR', {
        channelId: channel.id
      });

      if (response.data?.qr_code) {
        setQrCode(response.data.qr_code);
        setQrLoading(false);
      } else {
        setQrLoading(false);
        toast.error('Erro ao gerar QR Code');
      }
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      setQrLoading(false);
      toast.error('Erro ao gerar QR Code');
    }
  };

  const handleSimulateConnection = async (channel) => {
    try {
      const response = await base44.functions.invoke('simulateWhatsAppConnection', {
        channelId: channel.id
      });

      if (response.data?.success) {
        toast.success('Canal conectado com sucesso!');
        setShowQRDialog(false);
        await loadData();
      }
    } catch (error) {
      console.error('Erro ao conectar canal:', error);
      toast.error('Erro ao conectar canal');
    }
  };

  const handleDeleteChannel = async (channelId) => {
    if (!confirm('Tem certeza que deseja deletar este canal?')) return;

    try {
      await base44.entities.WhatsAppChannel.delete(channelId);
      await loadData();
    } catch (error) {
      console.error('Erro ao deletar canal:', error);
      alert('Erro ao deletar canal');
    }
  };

  const getAssistantName = (assistantId) => {
    const assistant = assistants.find(a => a.id === assistantId);
    return assistant?.name || 'Assistente não encontrado';
  };

  const getStatusColor = (status) => {
    const colors = {
      connected: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      disconnected: 'bg-red-100 text-red-800'
    };
    return colors[status] || colors.disconnected;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Canais WhatsApp</h1>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" /> Novo Canal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Canal WhatsApp</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Rótulo</label>
                <Input
                  placeholder="Ex: WhatsApp Comercial"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Assistente IA</label>
                <Select value={formData.assistant_id} onValueChange={(value) => setFormData({ ...formData, assistant_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um assistente" />
                  </SelectTrigger>
                  <SelectContent>
                    {assistants.map(assistant => (
                      <SelectItem key={assistant.id} value={assistant.id}>
                        {assistant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreateChannel} className="w-full bg-indigo-600 hover:bg-indigo-700">
                Criar Canal
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : channels.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="w-12 h-12 text-slate-300 mb-4" />
            <p className="text-slate-600 mb-4">Nenhum canal criado ainda</p>
            <Button onClick={() => setShowCreateDialog(true)} variant="outline">
              <Plus className="w-4 h-4 mr-2" /> Criar Primeiro Canal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {channels.map(channel => (
            <Card key={channel.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-5 h-5 text-indigo-600" />
                      <h3 className="font-semibold text-lg">{channel.label}</h3>
                      <Badge className={getStatusColor(channel.status)}>
                        {channel.status === 'connected' ? '🟢' : channel.status === 'pending' ? '🟡' : '🔴'} {channel.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-slate-600">
                      <p>Número: <span className="font-mono">{channel.phone_number || 'Desconectado'}</span></p>
                      <p>Assistente: <span className="font-medium">{getAssistantName(channel.assistant_id)}</span></p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleGenerateQR(channel)}
                      disabled={channel.status === 'connected'}
                    >
                      <QrCode className="w-4 h-4 mr-2" /> QR Code
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteChannel(channel.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog QR Code */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Conectar {selectedChannel?.label}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-8">
            {qrLoading ? (
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            ) : qrCode ? (
              <div className="space-y-4 w-full">
                <img src={qrCode} alt="QR Code" className="w-full aspect-square" />
                <p className="text-sm text-slate-600 text-center">
                  Escaneie o QR Code com seu WhatsApp para conectar este canal
                </p>
              </div>
            ) : (
              <p className="text-red-600">Erro ao gerar QR Code</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}