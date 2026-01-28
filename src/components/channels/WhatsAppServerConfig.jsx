import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Loader, Server, Wifi, WifiOff } from 'lucide-react';
import { toast } from 'sonner';

export default function WhatsAppServerConfig({ onConfigured }) {
  const [serverUrl, setServerUrl] = useState('');
  const [status, setStatus] = useState('untested');
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastTestedAt, setLastTestedAt] = useState(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const configs = await base44.entities.WhatsAppServerSettings.filter({ is_active: true }, '-created_date', 1);
      if (configs.length > 0) {
        setServerUrl(configs[0].server_url);
        setStatus(configs[0].status);
        setLastTestedAt(configs[0].last_tested_at);
      }
    } catch (error) {
      console.error('Erro ao carregar config:', error);
    } finally {
      setLoading(false);
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

  const testConnection = async () => {
    if (!serverUrl.trim()) {
      toast.error('Informe a URL do servidor');
      return;
    }

    if (!validateUrl(serverUrl)) {
      toast.error('URL inválida');
      return;
    }

    setTesting(true);
    try {
      const response = await fetch(`${serverUrl}/connect`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        setStatus('online');
        setLastTestedAt(new Date().toISOString());
        toast.success('✅ Servidor online');
      } else {
        setStatus('offline');
        toast.error('❌ Servidor offline');
      }
    } catch (error) {
      setStatus('offline');
      toast.error('Erro ao conectar ao servidor');
    } finally {
      setTesting(false);
    }
  };

  const saveConfig = async () => {
    if (!serverUrl.trim()) {
      toast.error('Informe a URL do servidor');
      return;
    }

    if (!validateUrl(serverUrl)) {
      toast.error('URL inválida');
      return;
    }

    if (status !== 'online') {
      toast.error('Teste a conexão antes de salvar');
      return;
    }

    setSaving(true);
    try {
      const configs = await base44.entities.WhatsAppServerSettings.filter({ is_active: true }, '-created_date', 1);
      
      const configData = {
        server_url: serverUrl,
        status: status,
        last_tested_at: lastTestedAt,
        is_active: true
      };

      if (configs.length > 0) {
        await base44.entities.WhatsAppServerSettings.update(configs[0].id, configData);
      } else {
        await base44.entities.WhatsAppServerSettings.create(configData);
      }

      toast.success('✅ Configuração salva com sucesso');
      if (onConfigured) onConfigured();
    } catch (error) {
      toast.error('Erro ao salvar configuração');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader className="w-6 h-6 animate-spin text-indigo-600" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-blue-600" />
            Configuração do Servidor WhatsApp
          </div>
          <Badge variant={status === 'online' ? 'default' : 'secondary'} className="gap-1">
            {status === 'online' ? (
              <>
                <Wifi className="w-3 h-3" />
                Online
              </>
            ) : status === 'offline' ? (
              <>
                <WifiOff className="w-3 h-3" />
                Offline
              </>
            ) : (
              'Não testado'
            )}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* URL Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">URL do Servidor WhatsApp</label>
          <Input
            type="url"
            placeholder="https://seu-servidor.com"
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
            disabled={testing || saving}
            className="font-mono"
          />
          <p className="text-xs text-slate-500">
            Exemplo: <code className="bg-slate-100 px-1.5 py-0.5 rounded">http://localhost:3001</code> ou <code className="bg-slate-100 px-1.5 py-0.5 rounded">https://whatsapp.seudominio.com</code>
          </p>
        </div>

        {/* Last Tested */}
        {lastTestedAt && status === 'online' && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-green-800">
              <p className="font-semibold">Testado com sucesso</p>
              <p>{new Date(lastTestedAt).toLocaleString('pt-BR')}</p>
            </div>
          </div>
        )}

        {status === 'offline' && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-red-800">
              <p className="font-semibold">Servidor offline</p>
              <p>Verifique a URL e tente novamente</p>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={testConnection}
            disabled={testing || saving || !serverUrl.trim()}
            variant="outline"
            className="flex-1"
          >
            {testing && <Loader className="w-4 h-4 animate-spin mr-2" />}
            {testing ? 'Testando...' : 'Testar Conexão'}
          </Button>
          <Button
            onClick={saveConfig}
            disabled={saving || status !== 'online'}
            className="flex-1"
          >
            {saving && <Loader className="w-4 h-4 animate-spin mr-2" />}
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>

        {/* Info */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 space-y-1">
          <p className="font-semibold">ℹ️ Informações:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Servidor Node.js com Baileys rodando externamente</li>
            <li>Gera QR Code real do WhatsApp Web</li>
            <li>Necessário testar antes de salvar</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}