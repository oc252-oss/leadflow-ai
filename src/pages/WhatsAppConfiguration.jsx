import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { AlertCircle, ArrowLeft, CheckCircle2, Clock, Settings, Zap, MessageCircle, Loader } from 'lucide-react';
import { toast } from 'sonner';

const DAYS_OF_WEEK = [
  { value: 'segunda', label: 'Segunda' },
  { value: 'terça', label: 'Terça' },
  { value: 'quarta', label: 'Quarta' },
  { value: 'quinta', label: 'Quinta' },
  { value: 'sexta', label: 'Sexta' },
  { value: 'sábado', label: 'Sábado' },
  { value: 'domingo', label: 'Domingo' }
];

export default function WhatsAppConfiguration() {
  const navigate = useNavigate();
  const [connection, setConnection] = useState(null);
  const [settings, setSettings] = useState(null);
  const [assistants, setAssistants] = useState([]);
  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load WhatsApp Connection
      const connections = await base44.entities.ChannelConnection.filter({ channel_type: 'whatsapp' });
      if (!connections.length || connections[0].status !== 'connected') {
        navigate(createPageUrl('ChannelsIntegrations'));
        toast.error('WhatsApp não está conectado');
        return;
      }

      setConnection(connections[0]);

      // Load Settings
      const existingSettings = await base44.entities.WhatsAppSettings.filter({ connection_id: connections[0].id });
      if (existingSettings.length > 0) {
        setSettings(existingSettings[0]);
      } else {
        setSettings({
          connection_id: connections[0].id,
          business_hours_start: '09:00',
          business_hours_end: '18:00',
          business_days: ['segunda', 'terça', 'quarta', 'quinta', 'sexta'],
          outside_hours_behavior: 'auto_reply',
          outside_hours_message: 'Olá! Estamos fora do horário comercial. Responderemos assim que possível 😊',
          fallback_action: 'transfer_human',
          is_active: true
        });
      }

      // Load Assistants
      const allAssistants = await base44.entities.AIAssistant.list('-created_date', 100);
      setAssistants(allAssistants || []);

      // Load Flows
      const allFlows = await base44.entities.AIConversationFlow.filter({ is_active: true }, '-priority', 100);
      setFlows(allFlows || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      if (settings.id) {
        await base44.entities.WhatsAppSettings.update(settings.id, settings);
      } else {
        await base44.entities.WhatsAppSettings.create(settings);
      }
      toast.success('Configurações salvas com sucesso');
    } catch (error) {
      toast.error('Erro ao salvar configurações');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (day) => {
    setSettings({
      ...settings,
      business_days: settings.business_days.includes(day)
        ? settings.business_days.filter(d => d !== day)
        : [...settings.business_days, day]
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!connection || connection.status !== 'connected') {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => navigate(createPageUrl('ChannelsIntegrations'))}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-yellow-900">WhatsApp não conectado</p>
              <p className="text-sm text-yellow-800 mt-1">Você precisa conectar um WhatsApp via QR Code antes de acessar as configurações.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigate(createPageUrl('ChannelsIntegrations'))}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-3xl font-bold text-slate-900">Configuração WhatsApp</h1>
          </div>
          <p className="text-slate-600 mt-2">{connection.phone_number}</p>
        </div>
      </div>

      {/* 1. Status da Conexão */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            Status da Conexão
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-xs text-slate-600">Status</p>
              <p className="text-sm font-bold text-green-700 mt-1 capitalize">{connection.status}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-xs text-slate-600">Número</p>
              <p className="text-sm font-bold text-blue-700 mt-1">{connection.phone_number}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1">
              Gerar novo QR Code
            </Button>
            <Button variant="outline" className="flex-1 text-red-600">
              Desconectar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 2. Servidor WhatsApp */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600" />
            Servidor WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-xs text-slate-600">Modo</p>
            <p className="text-sm font-bold text-blue-700 mt-1">WhatsApp Web (Servidor Externo)</p>
            <p className="text-xs text-slate-600 mt-2">Não depende do seu computador</p>
          </div>
          <div className="flex items-center gap-2 p-3 bg-slate-100 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-sm font-medium text-slate-700">Status: Online</span>
          </div>
        </CardContent>
      </Card>

      {/* 3. Roteamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-purple-600" />
            Roteamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Assistente Padrão</label>
            <Select value={settings?.default_assistant_id || ''} onValueChange={(value) => setSettings({ ...settings, default_assistant_id: value })}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Selecione um assistente" />
              </SelectTrigger>
              <SelectContent>
                {assistants.map(a => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500 mt-1">Assistente que responderá as mensagens</p>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Fluxo de IA Padrão</label>
            <Select value={settings?.default_flow_id || ''} onValueChange={(value) => setSettings({ ...settings, default_flow_id: value })}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Selecione um fluxo" />
              </SelectTrigger>
              <SelectContent>
                {flows.map(f => (
                  <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500 mt-1">Fluxo que estrutura a conversa</p>
          </div>
        </CardContent>
      </Card>

      {/* 4. Horário de Atendimento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-600" />
            Horário de Atendimento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Início</label>
              <Input type="time" value={settings?.business_hours_start} onChange={(e) => setSettings({ ...settings, business_hours_start: e.target.value })} className="mt-2" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Fim</label>
              <Input type="time" value={settings?.business_hours_end} onChange={(e) => setSettings({ ...settings, business_hours_end: e.target.value })} className="mt-2" />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">Dias de Atendimento</label>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map(day => (
                <button
                  key={day.value}
                  onClick={() => toggleDay(day.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    settings?.business_days?.includes(day.value)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Comportamento Fora do Horário</label>
            <Select value={settings?.outside_hours_behavior || 'auto_reply'} onValueChange={(value) => setSettings({ ...settings, outside_hours_behavior: value })}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto_reply">Resposta automática</SelectItem>
                <SelectItem value="queue">Enfileirar mensagem</SelectItem>
                <SelectItem value="wait">Aguardar resposta manual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Mensagem Automática</label>
            <Textarea
              value={settings?.outside_hours_message}
              onChange={(e) => setSettings({ ...settings, outside_hours_message: e.target.value })}
              placeholder="Olá! Estamos fora do horário..."
              className="mt-2"
              rows={3}
            />
            <p className="text-xs text-slate-500 mt-1">Enviada quando fora do horário comercial</p>
          </div>
        </CardContent>
      </Card>

      {/* 5. Fallback */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            Fallback
          </CardTitle>
        </CardHeader>
        <CardContent>
          <label className="text-sm font-medium text-slate-700">Quando o IA não conseguir responder</label>
          <Select value={settings?.fallback_action || 'transfer_human'} onValueChange={(value) => setSettings({ ...settings, fallback_action: value })}>
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="transfer_human">Transferir para humano</SelectItem>
              <SelectItem value="create_task">Criar uma tarefa</SelectItem>
              <SelectItem value="mark_no_response">Marcar como sem resposta</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-slate-500 mt-2">Ação executada automaticamente</p>
        </CardContent>
      </Card>

      {/* 6. Testes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-600" />
            Testes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button variant="outline" className="gap-2">
              <MessageCircle className="w-4 h-4" />
              Testar Chat
            </Button>
            <Button variant="outline" className="gap-2">
              <MessageCircle className="w-4 h-4" />
              Testar CLINIQ Voice
            </Button>
            <Button variant="outline" className="gap-2">
              <MessageCircle className="w-4 h-4" />
              Enviar Mensagem de Teste
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex gap-3 pt-4">
        <Button variant="outline" onClick={() => navigate(createPageUrl('ChannelsIntegrations'))}>
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={saving} className="flex-1 gap-2">
          {saving && <Loader className="w-4 h-4 animate-spin" />}
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
}