import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  MessageSquare, 
  Instagram, 
  Facebook, 
  Globe, 
  Phone,
  QrCode,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Copy,
  Code,
  Building2,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";
import { getDefaultOrganization, getDefaultUnit, isSingleCompanyMode } from '@/components/singleCompanyMode';
import IntegrationStatusPanel from '@/components/channels/IntegrationStatusPanel';
import IntegrationFlowSelector from '@/components/channels/IntegrationFlowSelector';

export default function ChannelsIntegrations() {
  const [whatsappIntegrations, setWhatsappIntegrations] = useState([]);
  const [instagramIntegrations, setInstagramIntegrations] = useState([]);
  const [facebookIntegrations, setFacebookIntegrations] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [assistants, setAssistants] = useState([]);
  const [flows, setFlows] = useState([]);
  const [organization, setOrganization] = useState(null);
  const [unit, setUnit] = useState(null);
  const [loading, setLoading] = useState(true);
  const singleCompanyMode = isSingleCompanyMode();
  
  // WhatsApp QR Code
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [generatingQR, setGeneratingQR] = useState(false);
  const [qrFormData, setQrFormData] = useState({
    assigned_agent_email: '',
    assistant_id: '',
    flow_id: '',
    label: ''
  });

  // WhatsApp Provider
  const [showProviderDialog, setShowProviderDialog] = useState(false);
  const [providerFormData, setProviderFormData] = useState({
    provider: 'zapi',
    assigned_agent_email: '',
    assistant_id: '',
    flow_id: '',
    instance_id: '',
    api_key: '',
    api_token: '',
    phone_number: '',
    label: ''
  });

  // Instagram
  const [showInstagramDialog, setShowInstagramDialog] = useState(false);
  const [instagramFormData, setInstagramFormData] = useState({
    account_name: '',
    page_id: '',
    access_token: '',
    direct_messages: true,
    comments: false,
    assistant_id: '',
    label: ''
  });

  // Facebook
  const [showFacebookDialog, setShowFacebookDialog] = useState(false);
  const [facebookFormData, setFacebookFormData] = useState({
    page_name: '',
    page_id: '',
    access_token: '',
    messenger: true,
    ad_comments: false,
    assistant_id: '',
    label: ''
  });

  // Webchat
  const [showWebchatDialog, setShowWebchatDialog] = useState(false);
  const [webchatScript, setWebchatScript] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load default organization and unit for single company mode
      const org = await getDefaultOrganization();
      const unitData = org ? await getDefaultUnit(org.id) : null;
      
      setOrganization(org);
      setUnit(unitData);

      if (org && unitData) {
        const [whatsappData, instagramData, facebookData, allTeamMembers, assistantsData, flowsData] = await Promise.all([
          base44.entities.WhatsAppIntegration.filter({ unit_id: unitData.id }),
          base44.entities.FacebookIntegration ? base44.entities.FacebookIntegration.filter({ unit_id: unitData.id }).catch(() => []) : Promise.resolve([]),
          base44.entities.FacebookIntegration ? base44.entities.FacebookIntegration.filter({ unit_id: unitData.id }).catch(() => []) : Promise.resolve([]),
          base44.entities.TeamMember.filter({ organization_id: org.id }),
          base44.entities.Assistant.filter({ organization_id: org.id, unit_id: unitData.id }),
          base44.entities.AIConversationFlow.filter({ organization_id: org.id, unit_id: unitData.id })
        ]);

        setWhatsappIntegrations(whatsappData);
        setInstagramIntegrations(instagramData);
        setFacebookIntegrations(facebookData);
        setTeamMembers(allTeamMembers);
        setAssistants(assistantsData);
        setFlows(flowsData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQR = async () => {
    if (!unit) {
      toast.error('Unidade padrão não configurada');
      return;
    }

    setGeneratingQR(true);
    try {
      const response = await base44.functions.invoke('generateWhatsAppQRWeb', {
        unit_id: unit.id,
        label: qrFormData.label || 'WhatsApp Web',
        assigned_agent_email: qrFormData.assigned_agent_email || null,
        assistant_id: qrFormData.assistant_id || null,
        default_flow_id: qrFormData.flow_id || null
      });

      if (response.data?.qr_code) {
        setQrCode(response.data.qr_code);
        toast.success('QR Code gerado com sucesso');
        await loadData();
      }
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      toast.error('Erro ao gerar QR Code');
    } finally {
      setGeneratingQR(false);
    }
  };

  const handleConnectProvider = async () => {
    if (!unit || !providerFormData.instance_id || !providerFormData.api_key) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      await base44.entities.WhatsAppIntegration.create({
        unit_id: unit.id,
        integration_type: 'provider',
        provider: providerFormData.provider,
        phone_number: providerFormData.phone_number,
        instance_id: providerFormData.instance_id,
        api_key: providerFormData.api_key,
        api_token: providerFormData.api_token,
        default_flow_id: providerFormData.flow_id || null,
        assigned_agent_email: providerFormData.assigned_agent_email || null,
        assistant_id: providerFormData.assistant_id || null,
        label: providerFormData.label || `${providerFormData.provider} - ${providerFormData.phone_number}`,
        is_active: true,
        status: 'connected'
      });

      toast.success('WhatsApp Provider conectado com sucesso');
      setShowProviderDialog(false);
      setProviderFormData({ provider: 'zapi', assigned_agent_email: '', assistant_id: '', flow_id: '', instance_id: '', api_key: '', api_token: '', phone_number: '', label: '' });
      await loadData();
    } catch (error) {
      console.error('Erro ao conectar provider:', error);
      toast.error('Erro ao conectar provider');
    }
  };

  const handleGenerateWebchatScript = () => {
    const script = `<!-- CLINIQ.AI Chat Widget -->
<script>
  (function() {
    const script = document.createElement('script');
    script.src = 'https://cdn.cliniq.ai/widget.js';
    script.async = true;
    script.onload = function() {
      CliniqChat.init({
        organizationId: '${organization?.id || 'YOUR_ORG_ID'}',
        unitId: '${unit?.id || 'YOUR_UNIT_ID'}',
        position: 'bottom-right',
        theme: 'light'
      });
    };
    document.body.appendChild(script);
  })();
</script>`;
    
    setWebchatScript(script);
    setShowWebchatDialog(true);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para área de transferência');
  };

  const getStatusBadge = (status) => {
    const config = {
      connected: { icon: CheckCircle2, color: 'bg-green-100 text-green-700', label: 'Conectado' },
      disconnected: { icon: XCircle, color: 'bg-slate-100 text-slate-700', label: 'Desconectado' },
      error: { icon: AlertCircle, color: 'bg-red-100 text-red-700', label: 'Erro' }
    };
    
    const { icon: Icon, color, label } = config[status] || config.disconnected;
    
    return (
      <Badge className={cn("gap-1", color)}>
        <Icon className="w-3 h-3" />
        {label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // In single company mode, all data is from the default unit
  const filteredTeamMembers = teamMembers;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Canais & Integrações</h1>
        <p className="text-slate-500 mt-1">Conecte e gerencie todos os canais de atendimento</p>
      </div>

      {/* Status Panel */}
      <IntegrationStatusPanel 
        whatsappIntegrations={whatsappIntegrations}
        instagramIntegrations={instagramIntegrations}
        facebookIntegrations={facebookIntegrations}
      />

      {/* WhatsApp Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-green-600" />
          <h2 className="text-xl font-semibold text-slate-900">WhatsApp</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* WhatsApp QR Code */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <QrCode className="w-4 h-4" />
                WhatsApp QR Code
              </CardTitle>
              <CardDescription>WebChat via WhatsApp Web</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-800">
                  ⚠️ Experimental – indicado para testes
                </p>
              </div>
              <Button 
                onClick={() => setShowQRDialog(true)}
                variant="outline" 
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo QR Code
              </Button>
              {whatsappIntegrations.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-medium text-slate-600">QR Codes conectados:</p>
                  {whatsappIntegrations.filter(w => w.integration_type === 'web').map(wa => (
                    <Badge key={wa.id} variant="outline" className="block w-full text-left p-2">
                      {wa.label || 'WhatsApp Web'} - {wa.status}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* WhatsApp API Oficial */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Facebook className="w-4 h-4" />
                WhatsApp API Oficial
              </CardTitle>
              <CardDescription>Via Facebook Business</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" disabled>
                <Facebook className="w-4 h-4 mr-2" />
                Conectar WhatsApp API
              </Button>
              <p className="text-xs text-slate-500 mt-2">Em breve</p>
            </CardContent>
          </Card>

          {/* WhatsApp Provider */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">WhatsApp Provider</CardTitle>
              <CardDescription>Z-API, Gupshup, 360Dialog</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={() => setShowProviderDialog(true)}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Conectar Provider
              </Button>
              {whatsappIntegrations.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-medium text-slate-600">Providers conectados:</p>
                  {whatsappIntegrations.filter(w => w.integration_type === 'provider').map(wa => (
                    <Badge key={wa.id} variant="secondary" className="block w-full text-left p-2 text-xs">
                      <span className="font-medium">{wa.provider?.toUpperCase()}</span> - {wa.phone_number}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Instagram Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Instagram className="w-5 h-5 text-pink-600" />
          <h2 className="text-xl font-semibold text-slate-900">Instagram</h2>
        </div>

        <div className="space-y-3">
           <Button 
             onClick={() => setShowInstagramDialog(true)}
             className="w-full bg-pink-600 hover:bg-pink-700"
           >
             <Plus className="w-4 h-4 mr-2" />
             Conectar Conta Instagram
           </Button>

           {instagramIntegrations.length > 0 && (
             <div className="space-y-2">
               {instagramIntegrations.map(ig => (
                <Card key={ig.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{ig.account_name || ig.page_name}</p>
                        <p className="text-xs text-slate-500">{ig.label}</p>
                        <div className="flex gap-2 mt-2">
                          {ig.direct_messages && <Badge className="text-xs">DM</Badge>}
                          {ig.comments && <Badge className="text-xs">Comentários</Badge>}
                        </div>
                      </div>
                      <Badge className={ig.status === 'connected' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}>
                        {ig.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Facebook Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Facebook className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-semibold text-slate-900">Facebook</h2>
        </div>

        <div className="space-y-3">
           <Button 
             onClick={() => setShowFacebookDialog(true)}
             className="w-full bg-blue-600 hover:bg-blue-700"
           >
             <Plus className="w-4 h-4 mr-2" />
             Conectar Página Facebook
           </Button>

           {facebookIntegrations.length > 0 && (
             <div className="space-y-2">
               {facebookIntegrations.map(fb => (
                <Card key={fb.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{fb.page_name}</p>
                        <p className="text-xs text-slate-500">{fb.label}</p>
                        <div className="flex gap-2 mt-2">
                          {fb.messenger && <Badge className="text-xs">Messenger</Badge>}
                          {fb.ad_comments && <Badge className="text-xs">Ads</Badge>}
                        </div>
                      </div>
                      <Badge className={fb.status === 'connected' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}>
                        {fb.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Webchat Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-indigo-600" />
          <h2 className="text-xl font-semibold text-slate-900">Chat Web</h2>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Chat Widget</CardTitle>
            <CardDescription>Widget de chat para seu website</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleGenerateWebchatScript}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              <Code className="w-4 h-4 mr-2" />
              Gerar Script de Instalação
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Status Geral */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">Todas as Integrações</h2>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Canal</TableHead>
                <TableHead>Label/Conta</TableHead>
                <TableHead>Agente Responsável</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assistente</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {(whatsappIntegrations.length + instagramIntegrations.length + facebookIntegrations.length) === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                      Nenhum canal conectado
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {whatsappIntegrations.map((integration) => {
                    const assistant = assistants.find(a => a.id === integration.assistant_id);
                    const agent = teamMembers.find(tm => tm.user_email === integration.assigned_agent_email);

                    return (
                      <TableRow key={integration.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-green-600" />
                            <span className="font-medium">WhatsApp</span>
                            <Badge variant="secondary" className="text-xs">{integration.integration_type}</Badge>
                          </div>
                        </TableCell>
                        <TableCell>{integration.label || integration.phone_number || '-'}</TableCell>
                        <TableCell>{agent?.user_email?.split('@')[0] || '-'}</TableCell>
                        <TableCell>{getStatusBadge(integration.status)}</TableCell>
                        <TableCell>{assistant?.name || '-'}</TableCell>
                      </TableRow>
                    );
                  })}
                  {instagramIntegrations.map((integration) => {
                    const assistant = assistants.find(a => a.id === integration.assistant_id);

                    return (
                      <TableRow key={integration.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Instagram className="w-4 h-4 text-pink-600" />
                            <span className="font-medium">Instagram</span>
                          </div>
                        </TableCell>
                        <TableCell>{integration.account_name || integration.label || '-'}</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell>{getStatusBadge(integration.status)}</TableCell>
                        <TableCell>{assistant?.name || '-'}</TableCell>
                      </TableRow>
                    );
                  })}
                  {facebookIntegrations.map((integration) => {
                    const assistant = assistants.find(a => a.id === integration.assistant_id);

                    return (
                      <TableRow key={integration.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Facebook className="w-4 h-4 text-blue-600" />
                            <span className="font-medium">Facebook</span>
                          </div>
                        </TableCell>
                        <TableCell>{integration.page_name || integration.label || '-'}</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell>{getStatusBadge(integration.status)}</TableCell>
                        <TableCell>{assistant?.name || '-'}</TableCell>
                      </TableRow>
                    );
                  })}
                </>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Gerar QR Code WhatsApp</DialogTitle>
            <DialogDescription>
              Configure e gere um novo QR Code
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Agente Responsável (opcional)</Label>
              <Select
                value={qrFormData.assigned_agent_email}
                onValueChange={(value) => setQrFormData({ ...qrFormData, assigned_agent_email: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Nenhum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Nenhum</SelectItem>
                  {filteredTeamMembers.map(tm => (
                    <SelectItem key={tm.id} value={tm.user_email}>{tm.user_email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Assistente IA (opcional)</Label>
              <Select
                value={qrFormData.assistant_id}
                onValueChange={(value) => setQrFormData({ ...qrFormData, assistant_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Nenhum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Nenhum</SelectItem>
                  {assistants.map(assistant => (
                    <SelectItem key={assistant.id} value={assistant.id}>{assistant.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <IntegrationFlowSelector 
              flows={flows}
              selectedFlowId={qrFormData.flow_id}
              onFlowChange={(value) => setQrFormData({ ...qrFormData, flow_id: value })}
              channelType="whatsapp"
              label="Fluxo de IA (opcional)"
            />

            <div className="space-y-2">
              <Label>Label (ex: Recepção, Comercial)</Label>
              <Input
                value={qrFormData.label}
                onChange={(e) => setQrFormData({ ...qrFormData, label: e.target.value })}
                placeholder="Identificação do QR Code"
              />
            </div>

            {qrCode && (
              <div className="flex flex-col items-center gap-3 p-4 border rounded-lg bg-slate-50">
                <img src={qrCode} alt="QR Code WhatsApp" className="w-64 h-64" />
                <p className="text-sm text-slate-600 text-center">
                  Escaneie este QR Code com o WhatsApp para conectar
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowQRDialog(false);
              setQrCode('');
            }}>
              Cancelar
            </Button>
            <Button 
              onClick={handleGenerateQR}
              disabled={generatingQR || !unit}
              className="bg-green-600 hover:bg-green-700"
            >
              {generatingQR && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Gerar QR Code
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Provider Dialog */}
      <Dialog open={showProviderDialog} onOpenChange={setShowProviderDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Conectar WhatsApp via Provider</DialogTitle>
            <DialogDescription>
              Configure a conexão com o provider de WhatsApp
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Provider *</Label>
              <Select
                value={providerFormData.provider}
                onValueChange={(value) => setProviderFormData({ ...providerFormData, provider: value })}
              >
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
              <Label>Número de Telefone</Label>
              <Input
                value={providerFormData.phone_number}
                onChange={(e) => setProviderFormData({ ...providerFormData, phone_number: e.target.value })}
                placeholder="+55 11 99999-9999"
              />
            </div>

            <div className="space-y-2">
              <Label>Agente Responsável (opcional)</Label>
              <Select
                value={providerFormData.assigned_agent_email}
                onValueChange={(value) => setProviderFormData({ ...providerFormData, assigned_agent_email: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Nenhum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Nenhum</SelectItem>
                  {filteredTeamMembers.map(tm => (
                    <SelectItem key={tm.id} value={tm.user_email}>{tm.user_email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Instance ID *</Label>
                <Input
                  value={providerFormData.instance_id}
                  onChange={(e) => setProviderFormData({ ...providerFormData, instance_id: e.target.value })}
                  placeholder="Instance ID"
                />
              </div>

              <div className="space-y-2">
                <Label>API Key *</Label>
                <Input
                  value={providerFormData.api_key}
                  onChange={(e) => setProviderFormData({ ...providerFormData, api_key: e.target.value })}
                  placeholder="API Key"
                  type="password"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>API Token (opcional)</Label>
              <Input
                value={providerFormData.api_token}
                onChange={(e) => setProviderFormData({ ...providerFormData, api_token: e.target.value })}
                placeholder="Token adicional se necessário"
                type="password"
              />
            </div>

            <div className="space-y-2">
              <Label>Assistente IA</Label>
              <Select
                value={providerFormData.assistant_id}
                onValueChange={(value) => setProviderFormData({ ...providerFormData, assistant_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Nenhum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Nenhum</SelectItem>
                  {assistants.map(assistant => (
                    <SelectItem key={assistant.id} value={assistant.id}>{assistant.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <IntegrationFlowSelector 
              flows={flows}
              selectedFlowId={providerFormData.flow_id}
              onFlowChange={(value) => setProviderFormData({ ...providerFormData, flow_id: value })}
              channelType="whatsapp"
              label="Fluxo de IA"
            />

            <div className="space-y-2">
              <Label>Label (ex: Comercial, Pós-venda)</Label>
              <Input
                value={providerFormData.label}
                onChange={(e) => setProviderFormData({ ...providerFormData, label: e.target.value })}
                placeholder="Identificação"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProviderDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleConnectProvider}
              className="bg-green-600 hover:bg-green-700"
            >
              Conectar Provider
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Instagram Dialog */}
      <Dialog open={showInstagramDialog} onOpenChange={setShowInstagramDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Conectar Conta Instagram</DialogTitle>
            <DialogDescription>
              Configure uma nova conta Instagram para atendimento
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome da Conta *</Label>
              <Input
                value={instagramFormData.account_name}
                onChange={(e) => setInstagramFormData({ ...instagramFormData, account_name: e.target.value })}
                placeholder="@sua_conta"
              />
            </div>

            <div className="space-y-2">
              <Label>Page ID</Label>
              <Input
                value={instagramFormData.page_id}
                onChange={(e) => setInstagramFormData({ ...instagramFormData, page_id: e.target.value })}
                placeholder="ID da página"
              />
            </div>

            <div className="space-y-2">
              <Label>Access Token</Label>
              <Input
                value={instagramFormData.access_token}
                onChange={(e) => setInstagramFormData({ ...instagramFormData, access_token: e.target.value })}
                placeholder="Token de acesso"
                type="password"
              />
            </div>

            <div className="space-y-2">
              <Label>Assistente IA</Label>
              <Select
                value={instagramFormData.assistant_id}
                onValueChange={(value) => setInstagramFormData({ ...instagramFormData, assistant_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Nenhum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Nenhum</SelectItem>
                  {assistants.map(assistant => (
                    <SelectItem key={assistant.id} value={assistant.id}>{assistant.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <IntegrationFlowSelector 
              flows={flows}
              selectedFlowId={instagramFormData.flow_id}
              onFlowChange={(value) => setInstagramFormData({ ...instagramFormData, flow_id: value })}
              channelType="instagram"
              label="Fluxo de IA (opcional)"
            />

            <div className="space-y-3">
              <Label>Habilitar em:</Label>
              <div className="flex items-center justify-between p-3 border rounded">
                <Label htmlFor="ig-dm">Direct Messages</Label>
                <Switch
                  id="ig-dm"
                  checked={instagramFormData.direct_messages}
                  onCheckedChange={(checked) => 
                    setInstagramFormData({ ...instagramFormData, direct_messages: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between p-3 border rounded">
                <Label htmlFor="ig-comments">Comentários</Label>
                <Switch
                  id="ig-comments"
                  checked={instagramFormData.comments}
                  onCheckedChange={(checked) => 
                    setInstagramFormData({ ...instagramFormData, comments: checked })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Label (opcional)</Label>
              <Input
                value={instagramFormData.label}
                onChange={(e) => setInstagramFormData({ ...instagramFormData, label: e.target.value })}
                placeholder="Identificação"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInstagramDialog(false)}>
              Cancelar
            </Button>
            <Button className="bg-pink-600 hover:bg-pink-700">
              Conectar Instagram
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Facebook Dialog */}
      <Dialog open={showFacebookDialog} onOpenChange={setShowFacebookDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Conectar Página Facebook</DialogTitle>
            <DialogDescription>
              Configure uma nova página Facebook para atendimento
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome da Página *</Label>
              <Input
                value={facebookFormData.page_name}
                onChange={(e) => setFacebookFormData({ ...facebookFormData, page_name: e.target.value })}
                placeholder="Nome da página"
              />
            </div>

            <div className="space-y-2">
              <Label>Page ID</Label>
              <Input
                value={facebookFormData.page_id}
                onChange={(e) => setFacebookFormData({ ...facebookFormData, page_id: e.target.value })}
                placeholder="ID da página"
              />
            </div>

            <div className="space-y-2">
              <Label>Access Token</Label>
              <Input
                value={facebookFormData.access_token}
                onChange={(e) => setFacebookFormData({ ...facebookFormData, access_token: e.target.value })}
                placeholder="Token de acesso"
                type="password"
              />
            </div>

            <div className="space-y-2">
              <Label>Assistente IA</Label>
              <Select
                value={facebookFormData.assistant_id}
                onValueChange={(value) => setFacebookFormData({ ...facebookFormData, assistant_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Nenhum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Nenhum</SelectItem>
                  {assistants.map(assistant => (
                    <SelectItem key={assistant.id} value={assistant.id}>{assistant.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <IntegrationFlowSelector 
              flows={flows}
              selectedFlowId={facebookFormData.flow_id}
              onFlowChange={(value) => setFacebookFormData({ ...facebookFormData, flow_id: value })}
              channelType="facebook"
              label="Fluxo de IA (opcional)"
            />

            <div className="space-y-3">
              <Label>Habilitar em:</Label>
              <div className="flex items-center justify-between p-3 border rounded">
                <Label htmlFor="fb-messenger">Messenger</Label>
                <Switch
                  id="fb-messenger"
                  checked={facebookFormData.messenger}
                  onCheckedChange={(checked) => 
                    setFacebookFormData({ ...facebookFormData, messenger: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between p-3 border rounded">
                <Label htmlFor="fb-ads">Comentários de Anúncios</Label>
                <Switch
                  id="fb-ads"
                  checked={facebookFormData.ad_comments}
                  onCheckedChange={(checked) => 
                    setFacebookFormData({ ...facebookFormData, ad_comments: checked })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Label (opcional)</Label>
              <Input
                value={facebookFormData.label}
                onChange={(e) => setFacebookFormData({ ...facebookFormData, label: e.target.value })}
                placeholder="Identificação"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFacebookDialog(false)}>
              Cancelar
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700">
              Conectar Facebook
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Webchat Script Dialog */}
      <Dialog open={showWebchatDialog} onOpenChange={setShowWebchatDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Script de Instalação do Chat Widget</DialogTitle>
            <DialogDescription>
              Copie e cole este código antes do fechamento da tag &lt;/body&gt; do seu site
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="relative">
              <pre className="bg-slate-900 text-slate-100 rounded-lg p-4 overflow-x-auto text-sm">
                <code>{webchatScript}</code>
              </pre>
              <Button
                size="sm"
                variant="secondary"
                className="absolute top-2 right-2"
                onClick={() => copyToClipboard(webchatScript)}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copiar
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowWebchatDialog(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}