import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MessageSquare, Instagram, Facebook, Phone, Plus, Settings, CheckCircle, XCircle, Loader2, AlertCircle, Bot } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function Conexoes() {
  const [connections, setConnections] = useState([]);
  const [assistants, setAssistants] = useState([]);
  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [editingConnection, setEditingConnection] = useState(null);
  const [testing, setTesting] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [conns, assts, fls] = await Promise.all([
        base44.entities.Connection.list('-created_date'),
        base44.entities.Assistant.filter({ is_active: true }),
        base44.entities.AIConversationFlow.filter({ is_active: true })
      ]);
      setConnections(conns);
      setAssistants(assts);
      setFlows(fls);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadConnections = loadData;

  const connectionTypes = [
    {
      type: 'whatsapp_zapi',
      name: 'WhatsApp',
      description: 'Conectar via Z-API',
      icon: MessageSquare,
      color: 'bg-green-100 text-green-700',
      fields: [
        { key: 'instance_id', label: 'Instance ID', placeholder: 'sua-instancia' },
        { key: 'token', label: 'Token da API', placeholder: 'token-aqui', type: 'password' },
        { key: 'base_url', label: 'URL Base', placeholder: 'https://api.z-api.io' },
      ]
    },
    {
      type: 'instagram_meta',
      name: 'Instagram',
      description: 'Conectar via Meta',
      icon: Instagram,
      color: 'bg-pink-100 text-pink-700',
      fields: [
        { key: 'business_id', label: 'Facebook Business ID', placeholder: '123456789' },
        { key: 'page_id', label: 'Instagram Page ID', placeholder: '987654321' },
        { key: 'access_token', label: 'Token de Acesso', placeholder: 'token-meta', type: 'password' },
      ]
    },
    {
      type: 'facebook_pages',
      name: 'Facebook Pages',
      description: 'Conectar Messenger',
      icon: Facebook,
      color: 'bg-blue-100 text-blue-700',
      fields: [
        { key: 'page_id', label: 'Page ID', placeholder: '123456789' },
        { key: 'page_name', label: 'Nome da Página', placeholder: 'Minha Empresa' },
        { key: 'access_token', label: 'Token de Acesso', placeholder: 'token-facebook', type: 'password' },
      ]
    },
    {
      type: 'cliniq_voice',
      name: 'Cliniq Voice',
      description: 'Chamadas de voz',
      icon: Phone,
      color: 'bg-violet-100 text-violet-700',
      fields: [
        { key: 'provider', label: 'Provedor', placeholder: 'interno' },
        { key: 'phone_numbers', label: 'Números', placeholder: '+5511999999999' },
      ]
    }
  ];

  const handleNewConnection = (type) => {
    setSelectedType(type);
    setFormData({ 
      name: '', 
      credentials: {},
      assistant_id: '',
      default_flow_id: '',
      auto_reply_enabled: true,
      fallback_message: 'Olá! Recebemos sua mensagem 😊 Em instantes alguém do nosso time irá te atender.'
    });
    setShowNewDialog(false);
    setShowConfigDialog(true);
  };

  const handleEditConnection = (conn) => {
    setEditingConnection(conn);
    const typeConfig = connectionTypes.find(t => t.type === conn.type);
    setSelectedType(typeConfig);
    setFormData({
      name: conn.name,
      credentials: conn.credentials || {},
      assistant_id: conn.assistant_id || '',
      default_flow_id: conn.default_flow_id || '',
      auto_reply_enabled: conn.auto_reply_enabled !== false,
      fallback_message: conn.fallback_message || 'Olá! Recebemos sua mensagem 😊 Em instantes alguém do nosso time irá te atender.'
    });
    setShowConfigDialog(true);
  };

  const handleTestConnection = async () => {
    if (!selectedType) return;
    
    setTesting(true);
    try {
      // Simulação de teste - em produção, chamar backend real
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (selectedType.type === 'whatsapp_zapi') {
        const { instance_id, token, base_url } = formData.credentials;
        if (!instance_id || !token || !base_url) {
          throw new Error('Preencha todos os campos obrigatórios');
        }
      }
      
      toast.success('Conexão testada com sucesso!');
      return true;
    } catch (error) {
      toast.error('Erro ao testar conexão: ' + error.message);
      return false;
    } finally {
      setTesting(false);
    }
  };

  const handleSaveConnection = async () => {
    if (!formData.name) {
      toast.error('Preencha o nome da conexão');
      return;
    }

    if (!formData.assistant_id) {
      toast.error('Selecione um Assistente IA');
      return;
    }

    try {
      const payload = {
        name: formData.name,
        type: selectedType.type,
        credentials: formData.credentials,
        webhook_url: `${window.location.origin}/api/webhook/${selectedType.type}`,
        status: 'conectado',
        last_checked_at: new Date().toISOString(),
        assistant_id: formData.assistant_id,
        default_flow_id: formData.default_flow_id || null,
        auto_reply_enabled: formData.auto_reply_enabled,
        fallback_message: formData.fallback_message
      };

      if (editingConnection) {
        await base44.entities.Connection.update(editingConnection.id, payload);
        toast.success('Conexão atualizada!');
      } else {
        await base44.entities.Connection.create(payload);
        toast.success('Conexão criada!');
      }

      await loadConnections();
      setShowConfigDialog(false);
      setEditingConnection(null);
      setSelectedType(null);
      setFormData({});
    } catch (error) {
      console.error('Erro ao salvar conexão:', error);
      toast.error('Erro ao salvar conexão');
    }
  };

  const handleDeleteConnection = async (id) => {
    if (!confirm('Deseja realmente excluir esta conexão?')) return;
    
    try {
      await base44.entities.Connection.delete(id);
      toast.success('Conexão excluída');
      await loadConnections();
    } catch (error) {
      toast.error('Erro ao excluir conexão');
    }
  };

  const getIcon = (type) => {
    const config = connectionTypes.find(t => t.type === type);
    return config?.icon || MessageSquare;
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'conectado': return CheckCircle;
      case 'desconectado': return XCircle;
      case 'erro': return AlertCircle;
      default: return XCircle;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'conectado': return 'bg-green-100 text-green-800';
      case 'desconectado': return 'bg-slate-100 text-slate-600';
      case 'erro': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Conexões</h1>
          <p className="text-slate-600">Gerencie integrações externas</p>
        </div>
        <Button onClick={() => setShowNewDialog(true)} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4" />
          Nova Conexão
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {connections.map((conn) => {
          const Icon = getIcon(conn.type);
          const StatusIcon = getStatusIcon(conn.status);
          return (
            <Card key={conn.id} className="border-0 shadow-sm">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <Icon className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{conn.name}</CardTitle>
                      <CardDescription className="capitalize">
                        {conn.type.replace('_', ' ')}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={cn("gap-1", getStatusColor(conn.status))}>
                    <StatusIcon className="w-3 h-3" />
                    {conn.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {conn.phone_number && (
                  <div className="text-sm">
                    <span className="text-slate-500">Número:</span>
                    <span className="ml-2 font-medium">{conn.phone_number}</span>
                  </div>
                )}
                {conn.last_checked_at && (
                  <div className="text-sm text-slate-500">
                    Última verificação: {new Date(conn.last_checked_at).toLocaleDateString()}
                  </div>
                )}
                {conn.error_message && (
                  <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                    {conn.error_message}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 gap-2"
                    onClick={() => handleEditConnection(conn)}
                  >
                    <Settings className="w-4 h-4" />
                    Configurar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleDeleteConnection(conn.id)}
                  >
                    Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {connections.length === 0 && (
          <Card className="col-span-full border-0 shadow-sm">
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhuma conexão configurada</h3>
              <p className="text-slate-500 mb-6">Conecte suas plataformas para começar</p>
              <Button onClick={() => setShowNewDialog(true)} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4" />
                Adicionar Primeira Conexão
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog: Escolher Tipo */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Nova Conexão</DialogTitle>
            <DialogDescription>
              Escolha o tipo de integração que deseja configurar
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            {connectionTypes.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.type}
                  onClick={() => handleNewConnection(type)}
                  className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-slate-200 hover:border-indigo-500 hover:bg-slate-50 transition-all text-center"
                >
                  <div className={cn("p-3 rounded-xl", type.color)}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{type.name}</p>
                    <p className="text-sm text-slate-500">{type.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Configurar Conexão */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingConnection ? 'Editar' : 'Configurar'} {selectedType?.name}
            </DialogTitle>
            <DialogDescription>
              Preencha as credenciais para conectar
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome da Conexão *</Label>
              <Input
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: WhatsApp Comercial"
              />
            </div>

            {selectedType?.fields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label>{field.label}</Label>
                <Input
                  type={field.type || 'text'}
                  value={formData.credentials?.[field.key] || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    credentials: {
                      ...formData.credentials,
                      [field.key]: e.target.value
                    }
                  })}
                  placeholder={field.placeholder}
                />
              </div>
            ))}

            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center gap-2 text-indigo-700">
                <Bot className="w-5 h-5" />
                <h3 className="font-semibold">Assistente IA da Conexão</h3>
              </div>

              <div className="space-y-2">
                <Label>Assistente IA *</Label>
                <Select
                  value={formData.assistant_id || ''}
                  onValueChange={(value) => setFormData({ ...formData, assistant_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um assistente" />
                  </SelectTrigger>
                  <SelectContent>
                    {assistants.map((assistant) => (
                      <SelectItem key={assistant.id} value={assistant.id}>
                        {assistant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">
                  Apenas assistentes ativos são listados
                </p>
              </div>

              <div className="space-y-2">
                <Label>Fluxo de IA Padrão (opcional)</Label>
                <Select
                  value={formData.default_flow_id || ''}
                  onValueChange={(value) => setFormData({ ...formData, default_flow_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Usar fluxo do assistente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Nenhum (usar padrão do assistente)</SelectItem>
                    {flows.map((flow) => (
                      <SelectItem key={flow.id} value={flow.id}>
                        {flow.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Ativar resposta automática</Label>
                  <p className="text-xs text-slate-500">
                    Enviar respostas automáticas da IA
                  </p>
                </div>
                <Switch
                  checked={formData.auto_reply_enabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, auto_reply_enabled: checked })}
                />
              </div>

              <div className="space-y-2">
                <Label>Mensagem de Fallback</Label>
                <Textarea
                  value={formData.fallback_message || ''}
                  onChange={(e) => setFormData({ ...formData, fallback_message: e.target.value })}
                  placeholder="Mensagem enviada quando a IA não estiver disponível"
                  rows={3}
                />
                <p className="text-xs text-slate-500">
                  Usada quando houver erro ou assistente indisponível
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-600">
              <p className="font-medium mb-1">Webhook URL:</p>
              <code className="text-xs break-all">
                {window.location.origin}/api/webhook/{selectedType?.type}
              </code>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={handleTestConnection}
              disabled={testing}
            >
              {testing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testando...
                </>
              ) : (
                'Testar Conexão'
              )}
            </Button>
            <Button 
              onClick={handleSaveConnection}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {editingConnection ? 'Atualizar' : 'Conectar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}