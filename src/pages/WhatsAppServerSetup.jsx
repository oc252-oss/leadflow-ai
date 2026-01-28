import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Loader, Copy, Eye, EyeOff, Server, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function WhatsAppServerSetup() {
  const [serverUrl, setServerUrl] = useState('');
  const [testChannelId, setTestChannelId] = useState('test_' + Date.now());
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [showUrl, setShowUrl] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);

  useEffect(() => {
    loadServerUrl();
  }, []);

  const loadServerUrl = async () => {
    try {
      const user = await base44.auth.me();
      if (user?.role === 'admin') {
        // Aqui você poderia carregar a URL se fosse armazenada em BD
        // Por enquanto, apenas mostramos a instrução
        setServerUrl('***configurar em variáveis de ambiente***');
      }
    } catch (error) {
      console.error('Erro ao carregar URL:', error);
    }
  };

  const testServerConnection = async () => {
    if (!serverUrl || serverUrl.includes('configurar')) {
      toast.error('Configure WHATSAPP_SERVER_URL nas variáveis de ambiente');
      return;
    }

    setTesting(true);
    setTestResult(null);
    setQrCode(null);

    try {
      const response = await base44.functions.invoke('generateWhatsAppQR', {
        channel_id: testChannelId
      });

      if (response.data) {
        setTestResult({
          status: response.data.status,
          phone_number: response.data.phone_number,
          success: true
        });

        if (response.data.qr_code) {
          setQrCode(response.data.qr_code);
        }

        toast.success('Conexão com servidor estabelecida!');
      } else {
        setTestResult({
          success: false,
          error: 'Resposta inválida do servidor'
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        error: error?.response?.data?.error || error.message || 'Erro ao conectar ao servidor'
      });
      toast.error(error?.response?.data?.error || 'Erro na conexão');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Configuração do Servidor WhatsApp</h1>
        <p className="text-slate-600 mt-2">Configure e teste a conexão com o servidor externo de WhatsApp Web</p>
      </div>

      {/* 1. URL do Servidor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5 text-blue-600" />
            URL do Servidor Externo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-sm text-slate-600 mb-2">Variável de Ambiente</p>
            <code className="text-sm font-mono text-blue-700">WHATSAPP_SERVER_URL</code>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-semibold">Como configurar (no Dashboard Base44):</p>
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>Acesse o <strong>Dashboard Base44</strong> (painel administrativo)</li>
                  <li>Vá para <strong>Settings → Environment Variables</strong></li>
                  <li>Crie/edite a variável <code className="bg-white px-2 py-1 rounded text-xs">WHATSAPP_SERVER_URL</code></li>
                  <li>Defina o valor: <code className="bg-white px-2 py-1 rounded text-xs">http://localhost:3001</code> ou <code className="bg-white px-2 py-1 rounded text-xs">https://whatsapp.seudominio.com</code></li>
                  <li>Salve e a aplicação relê automaticamente</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-100 rounded-lg border border-slate-300">
            <div className="flex items-center gap-2">
              {showUrl ? (
                <code className="text-xs font-mono text-slate-700 flex-1">{serverUrl}</code>
              ) : (
                <code className="text-xs font-mono text-slate-700 flex-1">{'*'.repeat(40)}</code>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowUrl(!showUrl)}
              >
                {showUrl ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Teste de Conexão */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-600" />
            Teste de Conexão
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">ID do Canal de Teste</label>
            <Input
              value={testChannelId}
              onChange={(e) => setTestChannelId(e.target.value)}
              placeholder="test_12345"
              className="mt-2"
            />
            <p className="text-xs text-slate-500 mt-1">ID único para este teste</p>
          </div>

          <Button
            onClick={testServerConnection}
            disabled={testing || serverUrl.includes('configurar')}
            className="w-full gap-2"
          >
            {testing && <Loader className="w-4 h-4 animate-spin" />}
            {testing ? 'Testando conexão...' : 'Testar Conexão com Servidor'}
          </Button>

          {/* Test Result */}
          {testResult && (
            <div className={`p-4 rounded-lg border ${
              testResult.success
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start gap-3">
                {testResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  {testResult.success ? (
                    <div className="space-y-2">
                      <p className="font-semibold text-green-900">✅ Conexão Bem-sucedida</p>
                      {testResult.status === 'pending' && (
                        <div className="text-sm text-green-800">
                          <p>Status: <Badge className="ml-2 bg-yellow-200 text-yellow-900">QR Code Gerado</Badge></p>
                          <p className="mt-2">QR Code pronto para escanear no WhatsApp</p>
                          <Button
                            onClick={() => setShowQRModal(true)}
                            variant="outline"
                            size="sm"
                            className="mt-2"
                          >
                            Ver QR Code
                          </Button>
                        </div>
                      )}
                      {testResult.status === 'connected' && (
                        <div className="text-sm text-green-800">
                          <p>Status: <Badge className="ml-2 bg-green-200 text-green-900">Conectado</Badge></p>
                          <p className="mt-2">Número: <code className="bg-white px-2 py-1 rounded text-xs">{testResult.phone_number}</code></p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="font-semibold text-red-900">❌ Erro na Conexão</p>
                      <p className="text-sm text-red-800">{testResult.error}</p>
                      <p className="text-xs text-red-700 mt-2">
                        Verifique se:
                        <br/>• O servidor está rodando
                        <br/>• A URL está correta
                        <br/>• Não há firewall bloqueando
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. Instruções */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Instruções de Deploy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="font-semibold text-slate-900 mb-2">Local (Desenvolvimento):</p>
            <code className="block bg-slate-100 p-3 rounded text-xs text-slate-700 mb-2">
              WHATSAPP_SERVER_URL=http://localhost:3001
            </code>
          </div>

          <div>
            <p className="font-semibold text-slate-900 mb-2">Produção (Domínio):</p>
            <code className="block bg-slate-100 p-3 rounded text-xs text-slate-700 mb-2">
              WHATSAPP_SERVER_URL=https://whatsapp.seudominio.com
            </code>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <p className="font-semibold text-slate-900 mb-2">Repositório do servidor:</p>
            <p className="text-slate-600">Certifique-se que o servidor Node.js com Baileys está rodando no endereço configurado acima.</p>
          </div>
        </CardContent>
      </Card>

      {/* QR Modal */}
      {showQRModal && qrCode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle>QR Code do WhatsApp</CardTitle>
              <button
                onClick={() => setShowQRModal(false)}
                className="text-slate-500 hover:text-slate-700"
              >
                ✕
              </button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center bg-white p-4 rounded-lg border border-slate-200">
                <img src={qrCode} alt="QR Code" className="w-64 h-64" />
              </div>
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 text-sm text-blue-800">
                <p className="font-semibold mb-1">Próximos passos:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Abra o WhatsApp no seu celular</li>
                  <li>Vá para Configurações → Dispositivos Vinculados</li>
                  <li>Escaneie este QR Code</li>
                </ol>
              </div>
              <Button
                onClick={() => setShowQRModal(false)}
                className="w-full"
              >
                Fechar
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}