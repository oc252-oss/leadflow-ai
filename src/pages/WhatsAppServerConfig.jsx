import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, CheckCircle2, Loader, Server, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function WhatsAppServerConfig() {
  const navigate = useNavigate();
  const [serverUrl, setServerUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    checkExistingConfig();
  }, []);

  const checkExistingConfig = async () => {
    try {
      const user = await base44.auth.me();
      if (!user) return;

      // Tenta carregar URL salva (se implementar persistência em BD)
      // Por enquanto apenas verifica se a variável está setada
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const validateUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSave = async () => {
    setError('');

    if (!serverUrl.trim()) {
      setError('Informe a URL do servidor');
      return;
    }

    if (!validateUrl(serverUrl)) {
      setError('URL inválida. Use http://localhost:3001 ou https://dominio.com');
      return;
    }

    setLoading(true);

    try {
      // Aqui você poderia salvar em BD se necessário
      // Por enquanto, apenas confirma que a URL está válida
      
      // Testa conexão rápida
      const response = await fetch(`${serverUrl}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel_id: 'test_' + Date.now() }),
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        throw new Error(`Servidor retornou: ${response.status}`);
      }

      setSaved(true);
      toast.success('✅ Servidor configurado com sucesso!');

      setTimeout(() => {
        navigate(createPageUrl('ChannelsIntegrations'));
      }, 1500);
    } catch (err) {
      setError(`Erro ao conectar: ${err.message}`);
      toast.error('Verifique a URL e tente novamente');
    } finally {
      setLoading(false);
    }
  };

  if (saved) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="flex justify-center">
              <CheckCircle2 className="w-16 h-16 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Servidor Configurado!</h2>
            <p className="text-slate-600">A conexão com o servidor WhatsApp foi validada.</p>
            <p className="text-sm text-slate-500">Redirecionando...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Server className="w-6 h-6 text-blue-600" />
            </div>
            <CardTitle>Servidor WhatsApp</CardTitle>
          </div>
          <p className="text-sm text-slate-600">Configure a URL do servidor externo</p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* URL Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">URL do Servidor</label>
            <Input
              type="url"
              placeholder="http://localhost:3001"
              value={serverUrl}
              onChange={(e) => {
                setServerUrl(e.target.value);
                setError('');
              }}
              disabled={loading}
              className="font-mono"
            />
            <p className="text-xs text-slate-500">
              Exemplo: <code className="bg-slate-100 px-1.5 py-0.5 rounded">http://localhost:3001</code> ou <code className="bg-slate-100 px-1.5 py-0.5 rounded">https://whatsapp.seudominio.com</code>
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Info */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
            <p className="text-xs font-semibold text-blue-900">ℹ️ Informações:</p>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Servidor Node.js com Baileys rodando externamente</li>
              <li>• Não é código dentro do Base44</li>
              <li>• Gera QR Code real do WhatsApp Web</li>
            </ul>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={loading || !serverUrl.trim()}
            className="w-full gap-2"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Testando conexão...
              </>
            ) : (
              <>
                Configurar e Continuar
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>

          {/* Help */}
          <p className="text-center text-xs text-slate-600">
            Precisa de ajuda? Consulte a documentação de deploy
          </p>
        </CardContent>
      </Card>
    </div>
  );
}