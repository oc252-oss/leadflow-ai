import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MessageSquare, 
  Instagram, 
  Facebook, 
  Globe, 
  Phone,
  Bot,
  Zap,
  Settings,
  Plus,
  Activity,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  GripVertical
} from 'lucide-react';
import { toast } from 'sonner';
import { getDefaultOrganization } from '@/components/singleCompanyMode';

export default function IntegrationHub() {
  const [organization, setOrganization] = useState(null);
  const [integrations, setIntegrations] = useState([]);
  const [flows, setFlows] = useState([]);
  const [assistants, setAssistants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const org = await getDefaultOrganization();
      setOrganization(org);

      if (org) {
        const [whatsappData, instagramData, facebookData, flowsData, assistantsData] = await Promise.all([
          base44.entities.WhatsAppIntegration?.filter({ organization_id: org.id }).catch(() => []) || [],
          base44.entities.FacebookIntegration?.filter({ organization_id: org.id }).catch(() => []) || [],
          base44.entities.FacebookIntegration?.filter({ organization_id: org.id }).catch(() => []) || [],
          base44.entities.AIConversationFlow.filter({ organization_id: org.id }).catch(() => []),
          base44.entities.Assistant.filter({ organization_id: org.id }).catch(() => [])
        ]);

        // Consolidate integrations
        const allIntegrations = [
          ...(whatsappData || []).map(i => ({ ...i, type: 'whatsapp', icon: MessageSquare })),
          ...(instagramData || []).map(i => ({ ...i, type: 'instagram', icon: Instagram })),
          ...(facebookData || []).map(i => ({ ...i, type: 'facebook', icon: Facebook }))
        ];

        setIntegrations(allIntegrations);
        setFlows(flowsData || []);
        setAssistants(assistantsData || []);
      }
    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const getChannelColor = (type) => {
    const colors = {
      whatsapp: 'bg-green-50 border-green-200',
      instagram: 'bg-pink-50 border-pink-200',
      facebook: 'bg-blue-50 border-blue-200',
      voice: 'bg-purple-50 border-purple-200',
      webchat: 'bg-indigo-50 border-indigo-200'
    };
    return colors[type] || 'bg-slate-50 border-slate-200';
  };

  const getChannelBadgeColor = (type) => {
    const colors = {
      whatsapp: 'bg-green-100 text-green-800',
      instagram: 'bg-pink-100 text-pink-800',
      facebook: 'bg-blue-100 text-blue-800',
      voice: 'bg-purple-100 text-purple-800',
      webchat: 'bg-indigo-100 text-indigo-800'
    };
    return colors[type] || 'bg-slate-100 text-slate-800';
  };

  const filteredIntegrations = integrations.filter(i =>
    (i.label || i.account_name || i.page_name || '').toLowerCase().includes(searchTerm.toLowerCase()) &&
    (filterStatus === 'all' || (filterStatus === 'active' ? i.is_active : !i.is_active))
  );

  const activeIntegrations = integrations.filter(i => i.is_active).length;
  const activeFlows = flows.filter(f => f.is_active).length;
  const totalAssistants = assistants.length;

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Central de Automações</h1>
        <p className="text-slate-500 mt-1">Gerencie integrações de canais e fluxos de IA em um único lugar</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Integrações Ativas</p>
                <p className="text-2xl font-bold mt-1">{activeIntegrations}</p>
              </div>
              <Activity className="w-8 h-8 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total de Canais</p>
                <p className="text-2xl font-bold mt-1">{integrations.length}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Fluxos Ativos</p>
                <p className="text-2xl font-bold mt-1">{activeFlows}</p>
              </div>
              <Zap className="w-8 h-8 text-amber-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Assistentes IA</p>
                <p className="text-2xl font-bold mt-1">{totalAssistants}</p>
              </div>
              <Bot className="w-8 h-8 text-indigo-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="integrations" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="integrations">Integrações de Canais</TabsTrigger>
          <TabsTrigger value="flows">Fluxos de IA</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoramento</TabsTrigger>
        </TabsList>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Integrações de Canais</CardTitle>
                  <CardDescription>Visualize e gerencie todos os canais conectados</CardDescription>
                </div>
                <Input
                  placeholder="Buscar integração..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>
            </CardHeader>
            <CardContent>
              {filteredIntegrations.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-500">Nenhuma integração encontrada</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredIntegrations.map(integration => (
                    <div key={integration.id} className={`border-2 rounded-lg p-4 ${getChannelColor(integration.type)}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white rounded-lg">
                            {integration.type === 'whatsapp' && <MessageSquare className="w-5 h-5 text-green-600" />}
                            {integration.type === 'instagram' && <Instagram className="w-5 h-5 text-pink-600" />}
                            {integration.type === 'facebook' && <Facebook className="w-5 h-5 text-blue-600" />}
                          </div>
                          <div>
                            <p className="font-semibold capitalize">{integration.type}</p>
                            <p className="text-sm text-slate-600">{integration.label || integration.account_name || integration.page_name}</p>
                          </div>
                        </div>
                        <Badge className={getChannelBadgeColor(integration.type)}>
                          {integration.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>

                      <div className="space-y-2 text-sm">
                        {integration.assistant_id && (
                          <div className="flex items-center gap-2">
                            <Bot className="w-4 h-4 text-indigo-600" />
                            <span>Assistente vinculado</span>
                          </div>
                        )}
                        {integration.default_flow_id && (
                          <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-amber-600" />
                            <span>Fluxo configurado</span>
                          </div>
                        )}
                        {integration.status && (
                          <div className="flex items-center gap-2">
                            {integration.status === 'connected' ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-red-600" />
                            )}
                            <span className="capitalize">{integration.status}</span>
                          </div>
                        )}
                      </div>

                      <Button variant="outline" size="sm" className="w-full mt-3">
                        <Settings className="w-4 h-4 mr-2" />
                        Configurar
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Flows Tab */}
        <TabsContent value="flows" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Fluxos de IA</CardTitle>
                  <CardDescription>Automações baseadas em lógica condicional</CardDescription>
                </div>
                <Button className="bg-indigo-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Fluxo
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {flows.length === 0 ? (
                <div className="text-center py-12">
                  <Zap className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-500">Nenhum fluxo criado</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {flows.map(flow => (
                    <Card key={flow.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <GripVertical className="w-4 h-4 text-slate-400 cursor-grab" />
                              <h4 className="font-semibold">{flow.name}</h4>
                              <Badge variant={flow.is_active ? 'default' : 'secondary'}>
                                {flow.is_active ? 'Ativo' : 'Inativo'}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-600">{flow.description}</p>
                            
                            {flow.qualification_questions?.length > 0 && (
                              <div className="mt-3 pt-3 border-t">
                                <p className="text-xs font-medium text-slate-600 mb-2">
                                  {flow.qualification_questions.length} perguntas configuradas
                                </p>
                                <div className="space-y-1">
                                  {flow.qualification_questions.slice(0, 3).map((q, idx) => (
                                    <div key={idx} className="text-xs text-slate-500 ml-6">
                                      • {q.question.substring(0, 50)}...
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          <Button variant="ghost" size="icon">
                            <Settings className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Status dos Canais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {['whatsapp', 'instagram', 'facebook', 'webchat'].map(channel => {
                    const count = integrations.filter(i => i.type === channel).length;
                    const activeCount = integrations.filter(i => i.type === channel && i.is_active).length;
                    return (
                      <div key={channel} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          {channel === 'whatsapp' && <MessageSquare className="w-4 h-4 text-green-600" />}
                          {channel === 'instagram' && <Instagram className="w-4 h-4 text-pink-600" />}
                          {channel === 'facebook' && <Facebook className="w-4 h-4 text-blue-600" />}
                          {channel === 'webchat' && <Globe className="w-4 h-4 text-indigo-600" />}
                          <span className="capitalize font-medium text-sm">{channel}</span>
                        </div>
                        <Badge variant="outline">
                          {activeCount}/{count}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Saúde do Sistema
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Integrações</span>
                      <span className="font-medium">{activeIntegrations}/{integrations.length}</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${(activeIntegrations / (integrations.length || 1)) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Fluxos</span>
                      <span className="font-medium">{activeFlows}/{flows.length}</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-amber-600 h-2 rounded-full" 
                        style={{ width: `${(activeFlows / (flows.length || 1)) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Assistentes</span>
                      <span className="font-medium">{totalAssistants}</span>
                    </div>
                    <div className="text-xs text-slate-600 mt-2">
                      Sistema operando normalmente
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}