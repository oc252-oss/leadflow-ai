import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, QrCode, Trash2, Loader, CheckCircle, Clock, XCircle } from 'lucide-react';

export default function WhatsAppIntegration() {
  const [integrations, setIntegrations] = useState([]);
  const [assistants, setAssistants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [formData, setFormData] = useState({
    label: '',
    ai_assistant_id: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [integrationsData, assistantsData] = await Promise.all([
        base44.entities.WhatsAppIntegration.list('-updated_date', 100),
        base44.entities.AIAssistant.filter({ is_active: true }, '-updated_date', 100)
      ]);
      setIntegrations(integrationsData);
      setAssistants(assistantsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setFormData({ label: '', ai_assistant_id: '' });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formData.label.trim() || !formData.ai_assistant_id) return;
    
    setIsSaving(true);
    try {
      await base44.entities.WhatsAppIntegration.create(formData);
      await loadData();
      setShowDialog(false);
    } catch (error) {
      console.error('Erro ao criar integração:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateQR = async (integration) => {
    if (!integration.ai_assistant_id) {
      alert('Selecione um Assistente antes de gerar QR Code');
      return;
    }

    setSelectedIntegration(integration);
    setQrLoading(true);
    setQrCode(null);
    setShowQRDialog(true);

    let pollInterval = null;
    let statusCheckInterval = null;

    try {
      // Iniciar função no servidor
      await base44.functions.invoke('generateWhatsAppQR', {
        integrationId: integration.id
      });

      // Polling para obter QR Code
      pollInterval = setInterval(async () => {
        try {
          const response = await base44.functions.invoke('generateWhatsAppQR', {
            integrationId: integration.id
          });

          if (response.data.qr_code) {
            setQrCode(response.data.qr_code);
            clearInterval(pollInterval);
            setQrLoading(false);

            // Começar a verificar status da conexão
            statusCheckInterval = setInterval(async () => {
              const statusResponse = await base44.functions.invoke('checkWhatsAppQRStatus', {
                integrationId: integration.id
              });

              if (statusResponse.data.connected) {
                clearInterval(statusCheckInterval);
                setShowQRDialog(false);
                await loadData();
                alert('✅ WhatsApp conectado com sucesso!');
              }
            }, 3000);

            // Timeout de 2 minutos para verificação de status
            setTimeout(() => {
              clearInterval(statusCheckInterval);
            }, 120000);
          }
        } catch (error) {
          console.error('Erro ao buscar QR Code:', error);
        }
      }, 2000);

      // Timeout de 30 segundos para gerar QR
      setTimeout(() => {
        if (pollInterval) clearInterval(pollInterval);
        setQrLoading(false);
      }, 30000);
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      if (pollInterval) clearInterval(pollInterval);
      if (statusCheckInterval) clearInterval(statusCheckInterval);
      setShowQRDialog(false);
      setQrLoading(false);
      alert('Erro ao gerar QR Code');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Tem certeza que deseja deletar esta integração?')) {
      try {
        await base44.entities.WhatsAppIntegration.delete(id);
        await loadData();
      } catch (error) {
        console.error('Erro ao deletar integração:', error);
      }
    }
  };

  const handleToggleActive = async (integration) => {
    try {
      await base44.entities.WhatsAppIntegration.update(integration.id, { 
        is_active: !integration.is_active 
      });
      await loadData();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const getAssistantName = (assistantId) => {
    const assistant = assistants.find(a => a.id === assistantId);
    return assistant?.name || 'Assistente não encontrado';
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <XCircle className="w-4 h-4 text-red-600" />;
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'connected':
        return 'Conectado';
      case 'pending':
        return 'Aguardando';
      default:
        return 'Desconectado';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Integração WhatsApp</h1>
        <Button onClick={handleOpenDialog} className="gap-2">
          <Plus className="w-4 h-4" />
          Nova Integração
        </Button>
      </div>

      <div className="grid gap-4">
        {integrations.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-slate-500">
              Nenhuma integração WhatsApp criada ainda
            </CardContent>
          </Card>
        ) : (
          integrations.map(integration => (
            <Card key={integration.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">{integration.label}</h3>
                    <p className="text-sm text-slate-600 mt-1">
                      Assistente: {getAssistantName(integration.ai_assistant_id)}
                    </p>
                    {integration.phone_number && (
                      <p className="text-sm text-slate-600">Número: {integration.phone_number}</p>
                    )}
                    <div className="flex gap-2 mt-3">
                      <Badge variant="outline" className="flex items-center gap-1">
                        {getStatusIcon(integration.status)}
                        {getStatusLabel(integration.status)}
                      </Badge>
                      <Badge variant={integration.is_active ? 'default' : 'outline'}>
                        {integration.is_active ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleGenerateQR(integration)}
                      disabled={qrLoading}
                      className="gap-2"
                    >
                      {qrLoading ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <QrCode className="w-4 h-4" />
                      )}
                      QR Code
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleToggleActive(integration)}
                    >
                      {integration.is_active ? 'Desativar' : 'Ativar'}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleDelete(integration.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Integração WhatsApp</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Rótulo *</label>
              <Input 
                value={formData.label}
                onChange={(e) => setFormData({...formData, label: e.target.value})}
                placeholder="Ex: WhatsApp Comercial"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Assistente de IA *</label>
              <select 
                value={formData.ai_assistant_id}
                onChange={(e) => setFormData({...formData, ai_assistant_id: e.target.value})}
                className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md text-sm"
              >
                <option value="">Selecione um assistente</option>
                {assistants.map(assistant => (
                  <option key={assistant.id} value={assistant.id}>{assistant.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSave}
                disabled={!formData.label.trim() || !formData.ai_assistant_id || isSaving}
                className="gap-2"
              >
                {isSaving && <Loader className="w-4 h-4 animate-spin" />}
                Criar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code WhatsApp</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {qrCode ? (
              <div className="flex justify-center p-4 bg-slate-50 rounded-lg">
                <img src={qrCode} alt="QR Code" className="w-64 h-64" />
              </div>
            ) : (
              <div className="text-center text-slate-500">
                Escaneie com seu telefone para conectar
              </div>
            )}
            <p className="text-xs text-slate-500 text-center">
              Escaneie este QR Code com o WhatsApp para conectar a integração.
            </p>
            <Button onClick={() => setShowQRDialog(false)} className="w-full">
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}