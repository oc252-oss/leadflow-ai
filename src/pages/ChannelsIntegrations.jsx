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
import UnitSelector from "@/components/UnitSelector";
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

export default function ChannelsIntegrations() {
  const [whatsappIntegrations, setWhatsappIntegrations] = useState([]);
  const [instagramIntegrations, setInstagramIntegrations] = useState([]);
  const [facebookIntegrations, setFacebookIntegrations] = useState([]);
  const [units, setUnits] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [assistants, setAssistants] = useState([]);
  const [flows, setFlows] = useState([]);
  const [teamMember, setTeamMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeUnitId, setActiveUnitId] = useState('');
  
  // WhatsApp QR Code
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [generatingQR, setGeneratingQR] = useState(false);
  const [qrFormData, setQrFormData] = useState({
    unit_id: '',
    assigned_agent_email: '',
    assistant_id: '',
    flow_id: '',
    label: ''
  });

  // WhatsApp Provider
  const [showProviderDialog, setShowProviderDialog] = useState(false);
  const [providerFormData, setProviderFormData] = useState({
    provider: 'zapi',
    unit_id: '',
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
    unit_id: '',
    account_name: '',
    page_id: '',
    access_token: '',
    direct_messages: true,
    comments: false,
    assistant_id: '',
    flow_id: '',
    label: ''
  });

  // Facebook
  const [showFacebookDialog, setShowFacebookDialog] = useState(false);
  const [facebookFormData, setFacebookFormData] = useState({
    unit_id: '',
    page_name: '',
    page_id: '',
    access_token: '',
    messenger: true,
    ad_comments: false,
    assistant_id: '',
    flow_id: '',
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
      const user = await base44.auth.me();
      const members = await base44.entities.TeamMember.filter({ user_email: user.email });
      
      if (members.length > 0) {
        setTeamMember(members[0]);
        const unitId = members[0].unit_id;

        const [whatsappData, instagramData, facebookData, unitsData, allTeamMembers, assistantsData, flowsData] = await Promise.all([
          base44.entities.WhatsAppIntegration.filter({ unit_id: unitId || members[0].organization_id }),
          base44.entities.FacebookIntegration ? base44.entities.FacebookIntegration.filter({ unit_id: unitId || members[0].organization_id }).catch(() => []) : Promise.resolve([]),
          base44.entities.FacebookIntegration ? base44.entities.FacebookIntegration.filter({ unit_id: unitId || members[0].organization_id }).catch(() => []) : Promise.resolve([]),
          unitId ? base44.entities.Unit.filter({ id: unitId }) : base44.entities.Unit.filter({ organization_id: members[0].organization_id }),
          base44.entities.TeamMember.filter({ organization_id: members[0].organization_id }),
          base44.entities.Assistant.filter({ organization_id: members[0].organization_id }),
          base44.entities.AIConversationFlow.filter({ organization_id: members[0].organization_id })
        ]);

        setWhatsappIntegrations(whatsappData);
        setInstagramIntegrations(instagramData);
        setFacebookIntegrations(facebookData);
        setUnits(unitsData);
        setTeamMembers(allTeamMembers);
        setAssistants(assistantsData);
        setFlows(flowsData);
        
        // Auto-select first unit if available
        if (unitsData.length > 0 && !activeUnitId) {
          setActiveUnitId(unitsData[0].id);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQR = async () => {
    if (!qrFormData.unit_id) {
      toast.error('Selecione uma unidade');
      return;
    }

    setGeneratingQR(true);
    try {
      const response = await base44.functions.invoke('generateWhatsAppQRWeb', {
        unit_id: qrFormData.unit_id,
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
    if (!providerFormData.unit_id || !providerFormData.instance_id || !providerFormData.api_key) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      await base44.entities.WhatsAppIntegration.create({
        unit_id: providerFormData.unit_id,
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
      setProviderFormData({ provider: 'zapi', unit_id: '', assigned_agent_email: '', assistant_id: '', flow_id: '', instance_id: '', api_key: '', api_token: '', phone_number: '', label: '' });
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
        companyId: '${teamMember?.company_id || 'YOUR_COMPANY_ID'}',
        unitId: '${teamMember?.unit_id || 'YOUR_UNIT_ID'}',
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

  // Filter data by active unit
  const filteredWhatsapp = activeUnitId 
    ? whatsappIntegrations.filter(i => i.unit_id === activeUnitId)
    : whatsappIntegrations;

  const filteredInstagram = activeUnitId
    ? instagramIntegrations.filter(i => i.unit_id === activeUnitId)
    : instagramIntegrations;

  const filteredFacebook = activeUnitId
    ? facebookIntegrations.filter(i => i.unit_id === activeUnitId)
    : facebookIntegrations;
  
  const filteredAssistants = activeUnitId 
    ? assistants.filter(a => a.unit_id === activeUnitId)
    : assistants;

  const filteredTeamMembers = activeUnitId
    ? teamMembers.filter(tm => tm.unit_id === activeUnitId)
    : teamMembers;

  const hasAssistants = filteredAssistants.length > 0;

  return (
    <div className="space-y-8">
      {/* Header with Unit Selector */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Canais & Integrações</h1>
          <p className="text-slate-500 mt-1">Conecte e gerencie todos os canais de atendimento</p>
        </div>
        {units.length > 0 && (
          <UnitSelector 
            value={activeUnitId} 
            onChange={setActiveUnitId}
            teamMember={teamMember}
          />
        )}
      </div>

      {/* Alert if no units */}
      {units.length === 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="py-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-900">Nenhuma unidade cadastrada</h3>
                <p className="text-sm text-amber-700 mt-1">
                  Para conectar canais de atendimento, você precisa cadastrar ao menos uma unidade.
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-3 border-amber-600 text-amber-700 hover:bg-amber-100"
                  onClick={() => window.location.href = '/Units'}
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  Cadastrar Unidade
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
              {units.length === 0 ? (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <p className="text-xs text-slate-600 text-center">
                    Cadastre uma unidade antes
                  </p>
                </div>
              ) : (
                <Button 
                  onClick={() => {
                    setQrFormData({ ...qrFormData, unit_id: activeUnitId });
                    setShowQRDialog(true);
                  }} 
                  variant="outline" 
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Novo QR Code
                </Button>
              )}
              {filteredWhatsapp.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-medium text-slate-600">QR Codes conectados:</p>
                  {filteredWhatsapp.filter(w => w.integration_type === 'web').map(wa => (
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
              {units.length === 0 ? (
                <Button disabled className="w-full" variant="outline">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Cadastre unidade
                </Button>
              ) : (
                <Button 
                  onClick={() => {
                    setProviderFormData({ ...providerFormData, unit_id: activeUnitId });
                    setShowProviderDialog(true);
                  }}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Conectar Provider
                </Button>
              )}
              {filteredWhatsapp.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-medium text-slate-600">Providers conectados:</p>
                  {filteredWhatsapp.filter(w => w.integration_type === 'provider').map(wa => (
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

          {filteredInstagram.length > 0 && (
            <div className="space-y-2">
              {filteredInstagram.map(ig => (
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

          {filteredFacebook.length > 0 && (
            <div className="space-y-2">
              {filteredFacebook.map(fb => (
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
              {(filteredWhatsapp.length + filteredInstagram.length + filteredFacebook.length) === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                    Nenhum canal conectado
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {filteredWhatsapp.map((integration) => {
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
                  {filteredInstagram.map((integration) => {
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
                  {filteredFacebook.map((integration) => {
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
              <Label>Unidade *</Label>
              <Select
                value={qrFormData.unit_id}
                onValueChange={(value) => setQrFormData({ ...qrFormData, unit_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a unidade" />
                </SelectTrigger>
                <SelectContent>
                  {units.map(unit => (
                    <SelectItem key={unit.id} value={unit.id}>{unit.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
                  {filteredAssistants.map(assistant => (
                    <SelectItem key={assistant.id} value={assistant.id}>{assistant.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Fluxo de IA (opcional)</Label>
              <Select
                value={qrFormData.flow_id}
                onValueChange={(value) => setQrFormData({ ...qrFormData, flow_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Nenhum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Nenhum</SelectItem>
                  {flows.map(flow => (
                    <SelectItem key={flow.id} value={flow.id}>{flow.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
              disabled={generatingQR || !qrFormData.unit_id}
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
            <div className="grid grid-cols-2 gap-4">
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
                <Label>Unidade *</Label>
                <Select
                  value={providerFormData.unit_id}
                  onValueChange={(value) => setProviderFormData({ ...providerFormData, unit_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map(unit => (
                      <SelectItem key={unit.id} value={unit.id}>{unit.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
                  {filteredAssistants.map(assistant => (
                    <SelectItem key={assistant.id} value={assistant.id}>{assistant.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Fluxo de IA</Label>
              <Select
                value={providerFormData.flow_id}
                onValueChange={(value) => setProviderFormData({ ...providerFormData, flow_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Nenhum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Nenhum</SelectItem>
                  {flows.map(flow => (
                    <SelectItem key={flow.id} value={flow.id}>{flow.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Unidade *</Label>
                <Select
                  value={instagramFormData.unit_id}
                  onValueChange={(value) => setInstagramFormData({ ...instagramFormData, unit_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map(unit => (
                      <SelectItem key={unit.id} value={unit.id}>{unit.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Nome da Conta *</Label>
                <Input
                  value={instagramFormData.account_name}
                  onChange={(e) => setInstagramFormData({ ...instagramFormData, account_name: e.target.value })}
                  placeholder="@sua_conta"
                />
              </div>
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
                  {filteredAssistants.map(assistant => (
                    <SelectItem key={assistant.id} value={assistant.id}>{assistant.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Unidade *</Label>
                <Select
                  value={facebookFormData.unit_id}
                  onValueChange={(value) => setFacebookFormData({ ...facebookFormData, unit_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map(unit => (
                      <SelectItem key={unit.id} value={unit.id}>{unit.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Nome da Página *</Label>
                <Input
                  value={facebookFormData.page_name}
                  onChange={(e) => setFacebookFormData({ ...facebookFormData, page_name: e.target.value })}
                  placeholder="Nome da página"
                />
              </div>
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
                  {filteredAssistants.map(assistant => (
                    <SelectItem key={assistant.id} value={assistant.id}>{assistant.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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