import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, CheckCircle, XCircle, Loader2, QrCode, Phone } from 'lucide-react';
import { toast } from 'sonner';

export default function WhatsAppTab({ company }) {
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [selectedMode, setSelectedMode] = useState('provider');
  
  const [formData, setFormData] = useState({
    company_id: company?.id || '',
    unit_id: '',
    integration_type: 'provider',
    provider: 'zapi',
    phone_number: '',
    instance_id: '',
    api_key: '',
    api_token: '',
    webhook_url: ''
  });

  const [qrCode, setQrCode] = useState('');

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      const data = await base44.entities.WhatsAppIntegration.filter({
        company_id: company.id
      });
      setIntegrations(data);
      
      if (data.length > 0) {
        const integration = data[0];
        setFormData({
          company_id: integration.company_id,
          unit_id: integration.unit_id || '',
          integration_type: integration.integration_type,
          provider: integration.provider || 'zapi',
          phone_number: integration.phone_number || '',
          instance_id: integration.instance_id || '',
          api_key: integration.api_key || '',
          api_token: integration.api_token || '',
          webhook_url: integration.webhook_url || ''
        });
        setSelectedMode(integration.integration_type);
        if (integration.qr_code) {
          setQrCode(integration.qr_code);
        }
      }
    } catch (error) {
      console.error('Error loading WhatsApp integrations:', error);
      toast.error('Erro ao carregar integrações');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      if (!formData.company_id) {
        toast.error('Empresa é obrigatória');
        return;
      }

      if (formData.integration_type === 'provider' && !formData.provider) {
        toast.error('Provedor é obrigatório');
        return;
      }

      if (formData.integration_type === 'provider' && !formData.api_key) {
        toast.error('API Key é obrigatória');
        return;
      }

      console.log('Saving WhatsApp integration:', formData);

      if (integrations.length > 0) {
        await base44.entities.WhatsAppIntegration.update(integrations[0].id, formData);
        toast.success('Integração atualizada');
      } else {
        await base44.entities.WhatsAppIntegration.create(formData);
        toast.success('Integração criada');
      }

      await loadIntegrations();
    } catch (error) {
      console.error('Error saving WhatsApp integration:', error);
      toast.error('Erro ao salvar integração');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateQR = async () => {
    try {
      setQrLoading(true);
      console.log('Generating QR code for WhatsApp Web...');

      const response = await base44.functions.invoke('generateWhatsAppQR', {
        company_id: company.id
      });

      if (response.data.qr_code) {
        setQrCode(response.data.qr_code);
        toast.success('QR Code gerado! Escaneie com seu WhatsApp');
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error('Erro ao gerar QR Code');
    } finally {
      setQrLoading(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setSaving(true);
      console.log('Testing WhatsApp connection...');

      const response = await base44.functions.invoke('testWhatsAppConnection', {
        integration_id: integrations[0]?.id
      });

      if (response.data.success) {
        toast.success('Conexão OK!');
      } else {
        toast.error('Falha na conexão');
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      toast.error('Erro ao testar conexão');
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      connected: { label: 'Conectado', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      disconnected: { label: 'Desconectado', color: 'bg-slate-100 text-slate-800', icon: XCircle },
      error: { label: 'Erro', color: 'bg-red-100 text-red-800', icon: XCircle }
    };
    const { label, color, icon: Icon } = config[status] || config.disconnected;
    return (
      <Badge className={color}>
        <Icon className="w-3 h-3 mr-1" />
        {label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  const currentIntegration = integrations[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">WhatsApp Integration</h3>
          <p className="text-sm text-slate-500">Configure WhatsApp for automated conversations</p>
        </div>
        {currentIntegration && getStatusBadge(currentIntegration.status)}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Modo de Integração</CardTitle>
          <CardDescription>Escolha como conectar o WhatsApp</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedMode} onValueChange={(value) => {
            setSelectedMode(value);
            setFormData({ ...formData, integration_type: value });
          }}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="provider">Provider (Z-API)</TabsTrigger>
              <TabsTrigger value="meta">Meta Cloud API</TabsTrigger>
              <TabsTrigger value="web">WhatsApp Web</TabsTrigger>
            </TabsList>

            <TabsContent value="provider" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Provedor</Label>
                <Select value={formData.provider} onValueChange={(value) => setFormData({ ...formData, provider: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zapi">Z-API</SelectItem>
                    <SelectItem value="gupshup">Gupshup</SelectItem>
                    <SelectItem value="360dialog">360Dialog</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Número do WhatsApp</Label>
                <Input
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  placeholder="5511999999999"
                />
              </div>

              <div className="space-y-2">
                <Label>Instance ID</Label>
                <Input
                  value={formData.instance_id}
                  onChange={(e) => setFormData({ ...formData, instance_id: e.target.value })}
                  placeholder="Instance ID"
                />
              </div>

              <div className="space-y-2">
                <Label>API Key</Label>
                <Input
                  type="password"
                  value={formData.api_key}
                  onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                  placeholder="API Key"
                />
              </div>

              <div className="space-y-2">
                <Label>API Token</Label>
                <Input
                  type="password"
                  value={formData.api_token}
                  onChange={(e) => setFormData({ ...formData, api_token: e.target.value })}
                  placeholder="Token"
                />
              </div>

              <div className="space-y-2">
                <Label>Webhook URL</Label>
                <Input
                  value={formData.webhook_url}
                  onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
                  placeholder="https://..."
                  disabled
                />
                <p className="text-xs text-slate-500">
                  Configure este webhook no painel do provedor: {window.location.origin}/api/functions/whatsappWebhook
                </p>
              </div>
            </TabsContent>

            <TabsContent value="meta" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Phone Number ID</Label>
                <Input
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  placeholder="Phone Number ID from Meta"
                />
              </div>

              <div className="space-y-2">
                <Label>Access Token</Label>
                <Input
                  type="password"
                  value={formData.api_key}
                  onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                  placeholder="Meta Cloud API Token"
                />
              </div>

              <div className="space-y-2">
                <Label>Webhook URL</Label>
                <Input
                  value={formData.webhook_url}
                  placeholder="Configure in Meta Dashboard"
                  disabled
                />
                <p className="text-xs text-slate-500">
                  Configure este webhook no Meta Business: {window.location.origin}/api/functions/whatsappWebhook
                </p>
              </div>
            </TabsContent>

            <TabsContent value="web" className="space-y-4 mt-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">
                  ⚠️ Modo experimental: Use apenas para testes. Para produção, use Provider ou Meta Cloud API.
                </p>
              </div>

              {!qrCode ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <QrCode className="w-16 h-16 text-slate-300" />
                  <p className="text-sm text-slate-500">Gere um QR Code para conectar</p>
                  <Button onClick={handleGenerateQR} disabled={qrLoading}>
                    {qrLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <QrCode className="w-4 h-4 mr-2" />
                        Gerar QR Code
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <img src={qrCode} alt="QR Code" className="w-64 h-64 border rounded-lg" />
                  <p className="text-sm text-slate-600">Escaneie com o WhatsApp do seu celular</p>
                  <Button variant="outline" onClick={handleGenerateQR} disabled={qrLoading}>
                    Regenerar QR Code
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 mt-6">
            <Button onClick={handleSave} disabled={saving} className="bg-indigo-600">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Configuração'
              )}
            </Button>
            {currentIntegration && selectedMode !== 'web' && (
              <Button variant="outline" onClick={handleTestConnection} disabled={saving}>
                <Phone className="w-4 h-4 mr-2" />
                Testar Conexão
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {currentIntegration && (
        <Card>
          <CardHeader>
            <CardTitle>Status da Integração</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">Tipo:</span>
              <span className="text-sm font-medium capitalize">{currentIntegration.integration_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">Provedor:</span>
              <span className="text-sm font-medium uppercase">{currentIntegration.provider || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">Número:</span>
              <span className="text-sm font-medium">{currentIntegration.phone_number || 'Não configurado'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">Última sincronização:</span>
              <span className="text-sm font-medium">
                {currentIntegration.last_sync ? new Date(currentIntegration.last_sync).toLocaleString() : 'Nunca'}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}