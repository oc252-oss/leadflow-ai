import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Clock, RotateCw, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function WhatsAppChannelsMonitor() {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState({});

  useEffect(() => {
    loadChannels();
  }, []);

  const loadChannels = async () => {
    try {
      setLoading(true);
      const data = await base44.entities.WhatsAppChannel.list('-last_qr_generated_at', 50);
      setChannels(data || []);
    } catch (error) {
      console.error('Erro ao carregar canais:', error);
      toast.error('Erro ao carregar canais WhatsApp');
    } finally {
      setLoading(false);
    }
  };

  const refreshChannelStatus = async (channelId) => {
    try {
      setRefreshing(prev => ({ ...prev, [channelId]: true }));
      // Recarrega os dados do canal do servidor
      const updatedChannels = await base44.entities.WhatsAppChannel.list();
      const updated = updatedChannels.find(c => c.id === channelId);
      if (updated) {
        setChannels(prev => prev.map(c => c.id === channelId ? updated : c));
        toast.success('Status atualizado');
      }
    } catch (error) {
      console.error('Erro ao atualizar canal:', error);
      toast.error('Erro ao atualizar status');
    } finally {
      setRefreshing(prev => ({ ...prev, [channelId]: false }));
    }
  };

  const refreshAllChannels = async () => {
    try {
      setRefreshing(prev => ({ ...prev, all: true }));
      const data = await base44.entities.WhatsAppChannel.list('-last_qr_generated_at', 50);
      setChannels(data || []);
      toast.success('Todos os status atualizados');
    } catch (error) {
      console.error('Erro ao atualizar canais:', error);
      toast.error('Erro ao atualizar status');
    } finally {
      setRefreshing(prev => ({ ...prev, all: false }));
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'connected':
        return (
          <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Conectado
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Pendente
          </Badge>
        );
      case 'disconnected':
        return (
          <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Desconectado
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-100 text-slate-800">Desconhecido</Badge>
        );
    }
  };

  const hasIssues = channels.some(c => c.status === 'disconnected' || c.status === 'error');

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Alert se houver problemas */}
      {hasIssues && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-900">Instâncias com Problemas</p>
            <p className="text-sm text-red-700 mt-1">
              {channels.filter(c => c.status === 'disconnected' || c.status === 'error').length} instância(s) desconectada(s). Verifique a conexão do servidor.
            </p>
          </div>
        </div>
      )}

      {/* Header com botão global */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">
          Instâncias WhatsApp ({channels.length})
        </h3>
        <Button
          onClick={refreshAllChannels}
          disabled={refreshing.all}
          size="sm"
          variant="outline"
          className="gap-2"
        >
          <RotateCw className={`w-4 h-4 ${refreshing.all ? 'animate-spin' : ''}`} />
          {refreshing.all ? 'Atualizando...' : 'Atualizar Tudo'}
        </Button>
      </div>

      {/* Grid de canais */}
      {channels.length === 0 ? (
        <Card className="bg-slate-50">
          <CardContent className="py-8 text-center text-slate-600">
            Nenhuma instância WhatsApp conectada
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {channels.map(channel => (
            <Card key={channel.id} className={`${
              channel.status === 'disconnected' || channel.status === 'error'
                ? 'border-red-200 bg-red-50'
                : 'bg-white'
            }`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{channel.channel_id}</CardTitle>
                    {channel.phone_number && (
                      <p className="text-sm text-slate-600 mt-1">{channel.phone_number}</p>
                    )}
                  </div>
                  {getStatusBadge(channel.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-xs text-slate-600 space-y-1">
                  {channel.last_qr_generated_at && (
                    <p>
                      <span className="font-medium">Último QR:</span>{' '}
                      {new Date(channel.last_qr_generated_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  )}
                </div>

                <Button
                  onClick={() => refreshChannelStatus(channel.id)}
                  disabled={refreshing[channel.id]}
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                >
                  <RotateCw className={`w-3 h-3 ${refreshing[channel.id] ? 'animate-spin' : ''}`} />
                  {refreshing[channel.id] ? 'Atualizando...' : 'Atualizar Status'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}