import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { getDefaultOrganization, getDefaultUnit, isSingleCompanyMode } from '@/components/singleCompanyMode';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Phone, Play, Pause, Trash2, Edit, BarChart3, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from 'sonner';
import VoiceCampaignForm from '../components/voice/VoiceCampaignForm';
import VoiceCallLogs from '../components/voice/VoiceCallLogs';
import VoiceCampaignStats from '../components/voice/VoiceCampaignStats';

export default function VoiceCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [organization, setOrganization] = useState(null);
  const [unit, setUnit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [runningCampaignId, setRunningCampaignId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const org = await getDefaultOrganization();
      const unitData = org ? await getDefaultUnit(org.id) : null;
      
      setOrganization(org);
      setUnit(unitData);

      if (org) {
        const campaignsData = await base44.entities.VoiceCampaign.filter({
          organization_id: org.id
        }, '-created_date').catch(() => []);
        setCampaigns(campaignsData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCampaign = async (data) => {
    try {
      if (editingCampaign) {
        await base44.entities.VoiceCampaign.update(editingCampaign.id, data);
        toast.success('Campanha atualizada');
      } else {
        await base44.entities.VoiceCampaign.create({
          ...data,
          organization_id: organization.id,
          unit_id: unit?.id || null
        });
        toast.success('Campanha criada');
      }
      await loadData();
      setShowForm(false);
      setEditingCampaign(null);
    } catch (error) {
      console.error('Error saving campaign:', error);
      toast.error('Erro ao salvar campanha');
    }
  };

  const handleRunCampaign = async (campaignId) => {
    try {
      setRunningCampaignId(campaignId);
      const response = await base44.functions.invoke('startVoiceCampaign', {
        campaign_id: campaignId
      });

      if (response.data.success) {
        toast.success(`${response.data.calls_made} chamadas iniciadas`);
        await loadData();
      } else {
        toast.error(response.data.message || 'Erro ao iniciar campanha');
      }
    } catch (error) {
      console.error('Error running campaign:', error);
      toast.error('Erro ao executar campanha');
    } finally {
      setRunningCampaignId(null);
    }
  };

  const handleToggleCampaign = async (campaign) => {
    try {
      await base44.entities.VoiceCampaign.update(campaign.id, {
        is_active: !campaign.is_active
      });
      await loadData();
    } catch (error) {
      console.error('Error toggling campaign:', error);
      toast.error('Erro ao atualizar campanha');
    }
  };

  const handleDeleteCampaign = async (campaignId) => {
    if (!confirm('Tem certeza que deseja deletar esta campanha?')) return;

    try {
      await base44.entities.VoiceCampaign.delete(campaignId);
      toast.success('Campanha deletada');
      await loadData();
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast.error('Erro ao deletar campanha');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Campanhas de Voz</h1>
          <p className="text-slate-500 mt-1">Reengajamento por AI com chamadas de voz</p>
        </div>
        <Button 
          onClick={() => {
            setEditingCampaign(null);
            setShowForm(true);
          }}
          className="bg-indigo-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Campanha
        </Button>
      </div>

      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList>
          <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
          <TabsTrigger value="calls">Log de Chamadas</TabsTrigger>
          <TabsTrigger value="stats">Estatísticas</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          {campaigns.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Phone className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhuma campanha</h3>
                  <p className="text-sm text-slate-500 mb-6">
                    Crie sua primeira campanha de voz para reengajar leads
                  </p>
                  <Button 
                    onClick={() => {
                      setEditingCampaign(null);
                      setShowForm(true);
                    }}
                    className="bg-indigo-600"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Campanha
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {campaigns.map((campaign) => (
                <Card key={campaign.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle>{campaign.name}</CardTitle>
                          <Badge variant={campaign.is_active ? 'default' : 'secondary'}>
                            {campaign.is_active ? 'Ativa' : 'Inativa'}
                          </Badge>
                          <Badge variant="outline">{campaign.inactivity_days} dias</Badge>
                        </div>
                        <p className="text-sm text-slate-500">{campaign.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRunCampaign(campaign.id)}
                          disabled={runningCampaignId === campaign.id}
                        >
                          {runningCampaignId === campaign.id ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Play className="w-4 h-4 mr-2" />
                          )}
                          Executar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingCampaign(campaign);
                            setShowForm(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600"
                          onClick={() => handleDeleteCampaign(campaign.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm italic text-slate-600">"{campaign.script_text}"</p>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="bg-slate-50 p-3 rounded">
                        <p className="text-xs text-slate-500">Total de Chamadas</p>
                        <p className="text-2xl font-bold text-slate-900">{campaign.total_calls_made || 0}</p>
                      </div>
                      <div className="bg-green-50 p-3 rounded">
                        <p className="text-xs text-green-700">Respostas Positivas</p>
                        <p className="text-2xl font-bold text-green-600">{campaign.total_positive_responses || 0}</p>
                      </div>
                      <div className="bg-yellow-50 p-3 rounded">
                        <p className="text-xs text-yellow-700">Indefinidas</p>
                        <p className="text-2xl font-bold text-yellow-600">{campaign.total_maybe_responses || 0}</p>
                      </div>
                      <div className="bg-red-50 p-3 rounded">
                        <p className="text-xs text-red-700">Respostas Negativas</p>
                        <p className="text-2xl font-bold text-red-600">{campaign.total_negative_responses || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="calls">
          <VoiceCallLogs campaigns={campaigns} />
        </TabsContent>

        <TabsContent value="stats">
          <VoiceCampaignStats campaigns={campaigns} />
        </TabsContent>
      </Tabs>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCampaign ? 'Editar Campanha' : 'Nova Campanha de Voz'}
            </DialogTitle>
          </DialogHeader>
          <VoiceCampaignForm
            campaign={editingCampaign}
            onSave={handleSaveCampaign}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}