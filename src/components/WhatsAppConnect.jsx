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
import { MessageCircle, Loader, RefreshCw } from 'lucide-react';
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
      <Card className="bg-white">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-green-600" />
              <div>
                <CardTitle className="text-lg">WhatsApp</CardTitle>
                <p className="text-xs text-slate-500">Web - Baileys Real</p>
              </div>
            </div>
            <Badge className={getStatusColor(connection?.status || 'disconnected')}>
              {getStatusLabel(connection?.status || 'disconnected')}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {connection?.status === 'connected' && connection?.phone_number && (
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <p className="text-xs text-slate-600 font-medium">Número Conectado</p>
              <p className="text-sm font-medium text-green-900 mt-1">{connection.phone_number}</p>
            </div>
          )}

          <div className="flex gap-2">
            {connection?.status !== 'connected' ? (
              <Button
                onClick={handleGenerateQR}
                disabled={loading}
                className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
              >
                {loading ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  '▢'
                )}
                Conectar WhatsApp
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