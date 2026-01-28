import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Loader } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function WhatsAppCardSimple({ connection, onRefresh }) {
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState(connection?.qr_code_base64 || null);

  useEffect(() => {
    if (connection?.status === 'waiting_qr') {
      fetchQRCode();
    }
  }, [connection?.status]);

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

  const handleGenerateQR = async () => {
    setLoading(true);
    try {
      // Chamar API externa para gerar QR
      const response = await fetch('https://api.whatsapp-provider.com/whatsapp/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'initiate' })
      });

      if (!response.ok) throw new Error('Falha ao gerar QR');

      // Salvar status como waiting_qr
      if (connection?.id) {
        await base44.entities.ChannelConnection.update(connection.id, {
          status: 'waiting_qr'
        });
      } else {
        await base44.entities.ChannelConnection.create({
          channel_type: 'whatsapp',
          status: 'waiting_qr'
        });
      }

      toast.success('QR Code gerado. Escaneie para conectar.');
      onRefresh();
    } catch (error) {
      toast.error('Erro ao gerar QR Code');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQRCode = async () => {
    try {
      const response = await fetch('https://api.whatsapp-provider.com/whatsapp/qrcode', {
        method: 'GET'
      });

      if (!response.ok) throw new Error('Falha ao buscar QR');

      const data = await response.json();
      setQrCode(data.qr_code_base64);

      if (connection?.id) {
        await base44.entities.ChannelConnection.update(connection.id, {
          qr_code_base64: data.qr_code_base64
        });
      }
    } catch (error) {
      console.error('Erro ao buscar QR Code:', error);
    }
  };

  const handleDisconnect = async () => {
    if (!connection?.id) return;

    try {
      await base44.entities.ChannelConnection.update(connection.id, {
        status: 'disconnected',
        phone_number: '',
        qr_code_base64: ''
      });
      setQrCode(null);
      toast.success('WhatsApp desconectado');
      onRefresh();
    } catch (error) {
      toast.error('Erro ao desconectar');
    }
  };

  return (
    <Card className="bg-white">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-green-600" />
            <div>
              <CardTitle className="text-lg">WhatsApp</CardTitle>
              <p className="text-xs text-slate-500">Web - Testes</p>
            </div>
          </div>
          <Badge className={getStatusColor(connection?.status || 'disconnected')}>
            {getStatusLabel(connection?.status || 'disconnected')}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* QR Code Display */}
        {qrCode && connection?.status === 'waiting_qr' && (
          <div className="bg-slate-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-slate-900 mb-3">Escaneie com seu WhatsApp:</p>
            <div className="bg-white p-4 rounded-lg border flex justify-center">
              <img
                src={qrCode}
                alt="QR Code WhatsApp"
                className="w-48 h-48"
              />
            </div>
          </div>
        )}

        {/* Connected Account */}
        {connection?.status === 'connected' && connection?.phone_number && (
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <p className="text-xs text-slate-600 font-medium">Conectado em</p>
            <p className="text-sm font-medium text-green-900 mt-1">{connection.phone_number}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
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
              Gerar QR Code
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
  );
}