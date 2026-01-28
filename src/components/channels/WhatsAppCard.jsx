import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, QrCode, Loader, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function WhatsAppCard({ integration, onRefresh }) {
  const [loading, setLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const getStatusColor = (status) => {
    return {
      disconnected: 'bg-slate-100 text-slate-800',
      awaiting_qr: 'bg-blue-100 text-blue-800',
      connected: 'bg-green-100 text-green-800',
      error: 'bg-red-100 text-red-800',
    }[status] || 'bg-slate-100';
  };

  const handleGenerateQR = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('whatsappWebInit', {
        action: 'createIntegration',
        label: integration?.label || 'WhatsApp Session'
      });

      await base44.entities.ChannelIntegration.create({
        channel_type: 'whatsapp',
        label: integration?.label || 'WhatsApp Session',
        status: 'awaiting_qr',
        qr_code: response.data.integration.qrCode || '',
        webhook_url: response.data.integration.webhookUrl
      });

      toast.success('QR Code gerado. Escaneie para conectar.');
      setShowQR(true);
      onRefresh();
    } catch (error) {
      toast.error('Erro ao gerar QR Code');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!integration?.id) return;

    try {
      await base44.entities.ChannelIntegration.update(integration.id, {
        status: 'disconnected',
        qr_code: '',
        connected_account: ''
      });
      toast.success('WhatsApp desconectado');
      setShowQR(false);
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
              <p className="text-xs text-slate-500">Integração via Web</p>
            </div>
          </div>
          <Badge className={getStatusColor(integration?.status || 'disconnected')}>
            {integration?.status === 'disconnected' && '⊘ Desconectado'}
            {integration?.status === 'awaiting_qr' && '⏳ Aguardando QR'}
            {integration?.status === 'connected' && '✓ Conectado'}
            {integration?.status === 'error' && '✕ Erro'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* QR Code Display */}
        {showQR && integration?.qr_code && (
          <div className="bg-slate-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-slate-900 mb-3">Escaneie com seu WhatsApp:</p>
            <div className="bg-white p-4 rounded-lg border flex justify-center">
              <img
                src={integration.qr_code}
                alt="QR Code WhatsApp"
                className="w-48 h-48"
              />
            </div>
            <p className="text-xs text-slate-600 text-center mt-3">
              QR Code expira em 60 segundos
            </p>
          </div>
        )}

        {/* Connected Account */}
        {integration?.status === 'connected' && integration?.connected_account && (
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <p className="text-xs text-slate-600 font-medium">Telefone Conectado</p>
            <p className="text-sm font-medium text-green-900 mt-1">{integration.connected_account}</p>
          </div>
        )}

        {/* Webhook URL */}
        {integration?.webhook_url && (
          <div className="bg-slate-50 p-3 rounded-lg">
            <p className="text-xs text-slate-600 font-medium mb-2">Webhook URL</p>
            <p className="text-xs font-mono text-slate-700 truncate">{integration.webhook_url}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {integration?.status !== 'connected' ? (
            <Button
              onClick={handleGenerateQR}
              disabled={loading}
              className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <QrCode className="w-4 h-4" />
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