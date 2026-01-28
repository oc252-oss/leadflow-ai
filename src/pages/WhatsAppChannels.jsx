import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, QrCode, Trash2, RefreshCw, Plus, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import WhatsAppTestPanel from '@/components/WhatsAppTestPanel';

export default function WhatsAppChannels() {
  const [channels, setChannels] = useState([]);
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [formData, setFormData] = useState({ label: '', script_id: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [channelsData, scriptsData] = await Promise.all([
        base44.entities.WhatsAppChannel.list(),
        base44.entities.AIScript.filter({ is_approved: true, channel: 'whatsapp' })
      ]);
      setChannels(channelsData || []);
      setScripts(scriptsData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChannel = async () => {
    if (!formData.label || !formData.script_id) {
      toast.error('Nome e Script são obrigatórios');
      return;
    }

    try {
      await base44.entities.WhatsAppChannel.create({
        label: formData.label,
        script_id: formData.script_id,
        phone_number: '',
        status: 'disconnected'
      });

      setFormData({ label: '', script_id: '' });
      setShowCreateDialog(false);
      await loadData();
      toast.success('Conexão criada com sucesso!');
    } catch (error) {
      console.error('Erro ao criar conexão:', error);
      toast.error('Erro ao criar conexão: ' + error.message);
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
    if (!confirm('Tem certeza que deseja deletar esta conexão?')) return;

    try {
      await base44.entities.WhatsAppChannel.delete(channelId);
      toast.success('Conexão deletada');
      await loadData();
    } catch (error) {
      console.error('Erro ao deletar conexão:', error);
      toast.error('Erro ao deletar conexão');
    }
  };

  const getScriptName = (scriptId) => {
    const script = scripts.find(s => s.id === scriptId);
    return script?.name || 'Script não encontrado';
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Conexões</h1>
          <p className="text-sm text-slate-600 mt-1">Gerencie suas conexões de WhatsApp com Scripts aprovados</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" /> Nova Conexão
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Conexão WhatsApp</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {scripts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <AlertCircle className="w-8 h-8 text-amber-600 mb-2" />
                  <p className="text-sm font-medium text-slate-900">Nenhum script aprovado</p>
                  <p className="text-xs text-slate-600 mt-1">
                    Crie e aprove um script em Biblioteca de Scripts primeiro
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-sm font-medium">Nome da Conexão *</label>
                    <Input
                      placeholder="Ex: WhatsApp Comercial"
                      value={formData.label}
                      onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Script Aprovado *</label>
                    <Select value={formData.script_id} onValueChange={(value) => setFormData({ ...formData, script_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um script" />
                      </SelectTrigger>
                      <SelectContent>
                        {scripts.map(script => (
                          <SelectItem key={script.id} value={script.id}>
                            {script.name} ({script.version})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              <Button 
                onClick={handleCreateChannel} 
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                disabled={!formData.label || !formData.script_id}
              >
                Criar Conexão
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
       <p className="text-slate-600 mb-4">Nenhuma conexão criada ainda</p>
       {scripts.length === 0 ? (
         <div className="text-center">
           <p className="text-sm text-slate-500 mb-4">Crie um script aprovado em Biblioteca de Scripts primeiro</p>
           <Button onClick={() => setShowCreateDialog(true)} variant="outline" disabled>
             <Plus className="w-4 h-4 mr-2" /> Criar Conexão
           </Button>
         </div>
       ) : (
         <Button onClick={() => setShowCreateDialog(true)} variant="outline">
           <Plus className="w-4 h-4 mr-2" /> Criar Primeira Conexão
         </Button>
       )}
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
                    <div className="text-sm text-slate-600 space-y-1">
                       <p>Número: <span className="font-mono">{channel.phone_number || 'Desconectado'}</span></p>
                       <p>Script: <span className="font-medium">{getScriptName(channel.script_id)}</span></p>
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
                    {channel.status === 'connected' && (
                      <WhatsAppTestPanel channelId={channel.id} channelLabel={channel.label} />
                    )}
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Conectar {selectedChannel?.label}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4">
            {qrLoading ? (
              <div className="w-full aspect-square flex items-center justify-center bg-slate-100 rounded-lg">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            ) : qrCode ? (
              <>
                <div className="w-full aspect-square bg-white p-4 rounded-lg border border-slate-200">
                  <img
                    src={`data:image/svg+xml;base64,${qrCode}`}
                    alt="QR Code WhatsApp"
                    className="w-full h-full"
                  />
                </div>
                <Badge className="bg-amber-100 text-amber-800">Modo Teste Interno</Badge>
                <p className="text-sm text-slate-600 text-center">
                  Canal em modo teste. Clique no botão abaixo para simular conexão.
                </p>
                <Button 
                  onClick={() => handleSimulateConnection(selectedChannel)}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Simular Conexão
                </Button>
              </>
            ) : (
            <div className="text-center">
            <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <p className="text-slate-600">Erro ao gerar QR Code</p>
            </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}