import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { MessageCircle, Loader, RefreshCw, Copy, CheckCircle2, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function WhatsAppConnect({ connection, onRefresh }) {
  const [loading, setLoading] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [pollingActive, setPollingActive] = useState(false);

  const serverUrl = import.meta.env.VITE_WHATSAPP_SERVER_URL || 'http://localhost:3001';
  const channelId = connection?.id || '';

  useEffect(() => {
    if (showQRModal && connection?.status === 'waiting_qr') {
      startPolling();
    }
  }, [showQRModal, connection?.status]);

  useEffect(() => {
    if (!pollingActive) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${serverUrl}/whatsapp/qrcode/${channelId}`);
        if (!response.ok) throw new Error('Erro ao buscar QR');

        const data = await response.json();
        setQrCode(data.qr_code || null);

        if (connection?.id) {
          await base44.entities.ChannelConnection.update(connection.id, {
            qr_code_base64: data.qr_code || '',
            phone_number: data.phone_number || '',
            status: data.status
          });

          if (data.status === 'connected') {
            setShowQRModal(false);
            setPollingActive(false);
            onRefresh();
            toast.success(`WhatsApp conectado em ${data.phone_number}`);
          }
        }
      } catch (error) {
        console.error('Erro no polling:', error);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [pollingActive, channelId, connection?.id]);

  const startPolling = () => {
    setPollingActive(true);
  };

  const handleGenerateQR = async () => {
    setLoading(true);
    try {
      let connectionId = connection?.id;

      if (!connectionId) {
        const newConnection = await base44.entities.ChannelConnection.create({
          channel_type: 'whatsapp',
          status: 'waiting_qr'
        });
        connectionId = newConnection.id;
      } else {
        await base44.entities.ChannelConnection.update(connectionId, {
          status: 'waiting_qr'
        });
      }

      const response = await fetch(`${serverUrl}/whatsapp/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId: `ch_${connectionId}` })
      });

      if (!response.ok) throw new Error('Falha ao conectar ao servidor WhatsApp');

      const qrResponse = await fetch(`${serverUrl}/whatsapp/qrcode/ch_${connectionId}`);
      if (qrResponse.ok) {
        const qrData = await qrResponse.json();
        setQrCode(qrData.qr_code);
      }

      setShowQRModal(true);
      onRefresh();
    } catch (error) {
      toast.error('Erro ao gerar QR Code');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!connection?.id) return;

    try {
      await fetch(`${serverUrl}/whatsapp/disconnect/ch_${connection.id}`, {
        method: 'POST'
      }).catch(() => {});

      await base44.entities.ChannelConnection.update(connection.id, {
        status: 'disconnected',
        phone_number: '',
        qr_code_base64: ''
      });

      setQrCode(null);
      setShowQRModal(false);
      toast.success('WhatsApp desconectado');
      onRefresh();
    } catch (error) {
      toast.error('Erro ao desconectar');
      console.error(error);
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      disconnected: '⊘ Desconectado',
      waiting_qr: '⏳ Aguardando QR',
      connected: '✓ Conectado'
    };
    return labels[status] || 'Desconectado';
  };

  const getStatusColor = (status) => {
    const colors = {
      disconnected: 'bg-slate-100 text-slate-800',
      waiting_qr: 'bg-blue-100 text-blue-800',
      connected: 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-slate-100';
  };

  return (
    <>
      <Card className="bg-gradient-to-br from-slate-50 to-white border-slate-200 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-green-500 to-emerald-500" />
        
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-lg">WhatsApp</CardTitle>
                <p className="text-xs text-slate-500 mt-1">Instância Web • Baileys Real</p>
              </div>
            </div>
            <Badge className={`${getStatusColor(connection?.status || 'disconnected')} capitalize`}>
              {getStatusLabel(connection?.status || 'disconnected')}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Connected Status */}
          {connection?.status === 'connected' && connection?.phone_number && (
            <>
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-green-900">Conectado com sucesso</p>
                    <p className="text-sm font-bold text-green-700 mt-1.5">{connection.phone_number}</p>
                    <p className="text-xs text-green-600 mt-2">Pronto para receber e enviar mensagens</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-600">URL do Webhook</p>
                <div className="flex gap-2 items-center bg-slate-100 px-3 py-2 rounded border border-slate-300">
                  <input
                    type="text"
                    value={`${serverUrl}/webhook/${connection.id}`}
                    readOnly
                    className="text-xs text-slate-700 bg-transparent outline-none flex-1"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${serverUrl}/webhook/${connection.id}`);
                      toast.success('URL copiada');
                    }}
                    className="p-1 hover:bg-slate-200 rounded"
                  >
                    <Copy className="w-4 h-4 text-slate-600" />
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Waiting QR */}
          {connection?.status === 'waiting_qr' && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 flex items-start gap-2">
              <Loader className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5 animate-spin" />
              <div>
                <p className="text-xs font-semibold text-blue-900">Aguardando escaneamento</p>
                <p className="text-xs text-blue-700 mt-1">Abra o QR Code e escaneie com seu WhatsApp</p>
              </div>
            </div>
          )}

          {/* Disconnected */}
          {connection?.status === 'disconnected' && (
            <div className="bg-slate-100 p-4 rounded-lg border border-slate-300 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-slate-900">Não conectado</p>
                <p className="text-xs text-slate-600 mt-1">Clique abaixo para conectar uma instância WhatsApp</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            {connection?.status !== 'connected' ? (
              <Button
                onClick={handleGenerateQR}
                disabled={loading}
                className="flex-1 gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                {loading ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <MessageCircle className="w-4 h-4" />
                )}
                {loading ? 'Gerando QR...' : 'Conectar WhatsApp'}
              </Button>
            ) : (
              <Button
                onClick={handleDisconnect}
                variant="outline"
                className="flex-1"
              >
                Desconectar
              </Button>
            )}
          </div>

          {/* Info Text */}
          <div className="bg-slate-50 p-3 rounded border border-slate-200 text-xs text-slate-600">
            <p><strong>💡 Dica:</strong> Use um número dedicado para o negócio. Isso evita misturar mensagens pessoais com atendimento ao cliente.</p>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Escaneie o QR Code</DialogTitle>
            <DialogDescription>
              Use seu WhatsApp para escanear o QR Code abaixo
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4">
            {qrCode ? (
              <>
                <div className="bg-white p-4 rounded-lg border">
                  <img
                    src={qrCode}
                    alt="QR Code WhatsApp"
                    className="w-56 h-56"
                  />
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Aguardando confirmação...
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Loader className="w-8 h-8 animate-spin text-indigo-600" />
                <p className="text-sm text-slate-600">Gerando QR Code...</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}