import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Phone, Settings, Copy, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function WhatsAppProduction() {
  const [activeTab, setActiveTab] = useState('setup');
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newLabel, setNewLabel] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      const response = await base44.functions.invoke('whatsappWebInit', {
        action: 'getIntegrations'
      });
      setIntegrations(response.data.integrations);
    } catch (error) {
      console.error('Erro ao carregar integrações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIntegration = async () => {
    if (!newLabel.trim()) {
      toast.error('Digite um nome para a integração');
      return;
    }

    try {
      await base44.functions.invoke('whatsappWebInit', {
        action: 'createIntegration',
        label: newLabel
      });
      toast.success('Integração criada com sucesso');
      setNewLabel('');
      loadIntegrations();
    } catch (error) {
      toast.error('Erro ao criar integração');
      console.error(error);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">WhatsApp Real — Produção</h1>
        <p className="text-slate-600 mt-2">Integração com WhatsApp via provedor externo</p>
      </div>

      {/* Aviso Crítico */}
      <Card className="bg-red-50 border-red-200">
        <CardContent className="pt-6 flex gap-4">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p className="font-semibold text-red-900">⚠️ Ambiente de Produção</p>
            <p className="text-sm text-red-700">
              Esta não é uma simulação. Toda mensagem recebida:
            </p>
            <ul className="text-sm text-red-700 space-y-1 ml-4 list-disc">
              <li>Cria um Lead real na base de dados</li>
              <li>Cria uma Conversa real</li>
              <li>Envia respostas reais para o WhatsApp</li>
              <li>Gera logs e histórico permanente</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Integração via Provedor Externo */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6 flex gap-4">
          <Phone className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p className="font-semibold text-blue-900">✓ Conexão WhatsApp Realizada</p>
            <p className="text-sm text-blue-700">
              WhatsApp Web conectado via provedor externo. Base44 funciona como orquestrador de mensagens, processando respostas e gerando Leads em tempo real.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Novo Setup */}
      <Card>
        <CardHeader>
          <CardTitle>Criar Nova Integração</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Identificação</label>
            <Input
              placeholder="Ex: WhatsApp Principal, Atendimento Clientes"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
            />
          </div>
          <Button
            onClick={handleCreateIntegration}
            className="w-full bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Criar Integração
          </Button>
        </CardContent>
      </Card>

      {/* Lista de Integrações */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : integrations.length > 0 ? (
        <div className="space-y-4">
          {integrations.map(integration => (
            <Card key={integration.id} className="bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-lg">{integration.label}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {integration.phoneNumber && (
                  <div>
                    <p className="text-sm font-medium text-slate-900">Telefone Conectado</p>
                    <p className="text-slate-600 mt-1">{integration.phoneNumber}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium text-slate-900 mb-2">Webhook URL</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={integration.webhookUrl}
                      readOnly
                      className="flex-1 px-3 py-2 bg-white border rounded-lg text-sm font-mono"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => copyToClipboard(integration.webhookUrl, integration.id)}
                    >
                      {copiedId === integration.id ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-slate-600 mt-2">
                    Cole esta URL no seu provedor WhatsApp para receber mensagens.
                  </p>
                </div>

                <div className="pt-2 border-t border-green-200">
                  <Badge className={`bg-${integration.status === 'connected' ? 'green' : 'yellow'}-600`}>
                    {integration.status === 'connected' ? '✓ Conectado' : '⏳ Aguardando Mensagens'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center text-slate-500">
            Nenhuma integração criada ainda. Crie uma acima.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Plus({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function Badge({ children, className }) {
  return <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white ${className}`}>{children}</span>;
}