import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QrCode, Loader, AlertCircle, Phone, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function WhatsAppWebSetup({ onSessionStart }) {
  const [status, setStatus] = useState('idle'); // idle, generating_qr, waiting, connected
  const [qrCode, setQrCode] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState(null);
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const data = await base44.entities.WhatsAppIntegration.list('-updated_date', 10);
      setSessions(data.filter(s => s.is_active));
    } catch (error) {
      console.error('Erro ao carregar sessões:', error);
    }
  };

  const handleGenerateQR = async () => {
    setStatus('generating_qr');
    try {
      const response = await base44.functions.invoke('whatsappWebInit', {
        action: 'initSession'
      });

      setSessionId(response.data.sessionId);
      setQrCode(response.data.qrCode);
      setStatus('waiting');

      // Verificar status a cada 2 segundos
      const checkStatus = setInterval(async () => {
        try {
          const statusResponse = await base44.functions.invoke('whatsappWebInit', {
            action: 'getStatus',
            sessionId: response.data.sessionId
          });

          if (statusResponse.data.connected) {
            setStatus('connected');
            setPhoneNumber(statusResponse.data.phoneNumber);
            clearInterval(checkStatus);
            toast.success('WhatsApp conectado com sucesso!');
            setTimeout(() => loadSessions(), 1000);
          }
        } catch (error) {
          console.error('Erro ao verificar status:', error);
        }
      }, 2000);

      // Parar de verificar após 2 minutos
      setTimeout(() => clearInterval(checkStatus), 120000);
    } catch (error) {
      toast.error('Erro ao gerar QR Code');
      console.error(error);
      setStatus('idle');
    }
  };

  const handleReconnect = async (session) => {
    // Implementar reconexão se necessário
    toast.info('Reconectando...');
  };

  return (
    <div className="space-y-6">
      {/* Status Atual */}
      {sessions.length > 0 && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="space-y-4">
              {sessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 bg-white rounded-lg border border-green-200">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-slate-900">{session.label}</p>
                      <p className="text-sm text-slate-600">{session.phone_number}</p>
                    </div>
                  </div>
                  <Badge className="bg-green-600">Conectado</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Novo QR Code */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Conectar WhatsApp
          </CardTitle>
          <p className="text-sm text-slate-500 mt-2">Escaneie o código QR com seu WhatsApp oficial</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'idle' && (
            <>
              <p className="text-sm text-slate-600">
                Clique abaixo para gerar um QR Code. Escaneie com seu telefone para conectar.
              </p>
              <Button 
                onClick={handleGenerateQR}
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 gap-2"
              >
                <QrCode className="w-5 h-5" />
                Gerar QR Code
              </Button>
            </>
          )}

          {(status === 'generating_qr' || status === 'waiting') && (
            <div className="space-y-4">
              {qrCode && (
                <>
                  <div className="bg-white p-6 rounded-lg border-2 border-indigo-200 flex justify-center">
                    <img 
                      src={qrCode} 
                      alt="QR Code WhatsApp" 
                      className="w-64 h-64"
                    />
                  </div>
                  <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 flex gap-3">
                    <Loader className="w-5 h-5 text-blue-600 flex-shrink-0 animate-spin mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Aguardando confirmação...</p>
                      <p className="text-xs text-blue-700 mt-1">Escaneie o QR Code acima com seu WhatsApp</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {status === 'connected' && (
            <div className="p-4 rounded-lg bg-green-50 border border-green-200 space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-semibold text-green-900">WhatsApp Conectado!</p>
                  <p className="text-sm text-green-700 mt-1">{phoneNumber}</p>
                </div>
              </div>
              <p className="text-xs text-green-600">Seu assistente de IA está pronto para atender no WhatsApp real.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="pt-6 flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm space-y-2">
            <p className="font-medium text-amber-900">Ambiente Real</p>
            <p className="text-amber-700">
              Esta é uma conexão real com WhatsApp. Mensagens recebidas aqui criarão Conversas e Leads reais na base de dados.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}