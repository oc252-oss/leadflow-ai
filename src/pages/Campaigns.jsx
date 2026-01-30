import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { getDefaultOrganization, isSingleCompanyMode } from '@/components/singleCompanyMode';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Plus, 
  Target, 
  TrendingUp, 
  Users, 
  Facebook,
  Search,
  MoreVertical,
  Edit2,
  Trash2,
  Loader2,
  BarChart3
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const platformConfig = {
  facebook: { icon: Facebook, color: 'bg-blue-100 text-blue-600' },
  instagram: { icon: Target, color: 'bg-pink-100 text-pink-600' },
  google: { icon: Target, color: 'bg-red-100 text-red-600' },
  manual: { icon: Target, color: 'bg-slate-100 text-slate-600' }
};

function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [assistants, setAssistants] = useState([]);
  const [flows, setFlows] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    assistant_id: '',
    flow_id: '',
    connection_id: '',
    trigger_type: 'manual',
    status: 'rascunho'
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [campaignsData, assistantsData, flowsData, connectionsData] = await Promise.all([
        base44.entities.Campaign.list('-created_date', 100),
        base44.entities.Assistant.list(),
        base44.entities.AIFlow.list(),
        base44.entities.Connection.list()
      ]);

      setCampaigns(campaignsData);
      setAssistants(assistantsData);
      setFlows(flowsData);
      setConnections(connectionsData);
    } catch (error) {
      console.error('Error loading campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.assistant_id) return;
    
    setSaving(true);
    try {
      if (editingCampaign) {
        await base44.entities.Campaign.update(editingCampaign.id, formData);
        await loadData();
      } else {
        await base44.entities.Campaign.create(formData);
        await loadData();
      }
      
      setShowAddDialog(false);
      setEditingCampaign(null);
      setFormData({
        name: '',
        assistant_id: '',
        flow_id: '',
        connection_id: '',
        trigger_type: 'manual',
        status: 'rascunho'
      });
    } catch (error) {
      console.error('Error saving campaign:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (campaign) => {
    setEditingCampaign(campaign);
    setFormData({
      name: campaign.name,
      assistant_id: campaign.assistant_id || '',
      flow_id: campaign.flow_id || '',
      connection_id: campaign.connection_id || '',
      trigger_type: campaign.trigger_type || 'manual',
      status: campaign.status
    });
    setShowAddDialog(true);
  };

  const handleDelete = async (campaignId) => {
    try {
      await base44.entities.Campaign.delete(campaignId);
      setCampaigns(campaigns.filter(c => c.id !== campaignId));
    } catch (error) {
      console.error('Error deleting campaign:', error);
    }
  };

  const filteredCampaigns = campaigns.filter(c =>
    c.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter(c => c.status === 'ativa').length,
    totalContacted: campaigns.reduce((sum, c) => sum + (c.leads_contacted || 0), 0),
    totalResponded: campaigns.reduce((sum, c) => sum + (c.leads_responded || 0), 0)
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total de Campanhas</p>
                <p className="text-2xl font-bold text-slate-900">{stats.totalCampaigns}</p>
              </div>
              <div className="p-3 rounded-xl bg-indigo-100">
                <Target className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Campanhas Ativas</p>
                <p className="text-2xl font-bold text-slate-900">{stats.activeCampaigns}</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-100">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Leads Contatados</p>
                <p className="text-2xl font-bold text-slate-900">{stats.totalContacted}</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-100">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Respostas</p>
                <p className="text-2xl font-bold text-slate-900">{stats.totalResponded}</p>
              </div>
              <div className="p-3 rounded-xl bg-violet-100">
                <BarChart3 className="w-5 h-5 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar campanhas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Campanha
        </Button>
      </div>

      {/* Campaigns table */}
      <Card className="border-0 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Assistente IA</TableHead>
              <TableHead>Conexão</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Contatados</TableHead>
              <TableHead className="text-center">Respondidos</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCampaigns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                  Nenhuma campanha encontrada
                </TableCell>
              </TableRow>
            ) : (
              filteredCampaigns.map((campaign) => {
                const assistant = assistants.find(a => a.id === campaign.assistant_id);
                const connection = connections.find(c => c.id === campaign.connection_id);

                return (
                  <TableRow key={campaign.id}>
                    <TableCell>
                      <p className="font-medium text-slate-900">{campaign.name}</p>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-600">{assistant?.name || '-'}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-600">{connection?.name || '-'}</span>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        campaign.status === 'ativa' ? "bg-emerald-100 text-emerald-700" :
                        campaign.status === 'pausada' ? "bg-amber-100 text-amber-700" :
                        "bg-slate-100 text-slate-700"
                      )}>
                        {campaign.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-medium">{campaign.leads_contacted || 0}</TableCell>
                    <TableCell className="text-center font-medium">{campaign.leads_responded || 0}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(campaign)}>
                            <Edit2 className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => handleDelete(campaign.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingCampaign ? 'Editar Campanha' : 'Nova Campanha'}</DialogTitle>
            <DialogDescription>
              Configure quando e como a IA deve agir
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Reengajamento 7 dias"
              />
            </div>

            <div className="space-y-2">
              <Label>Assistente IA *</Label>
              <Select
                value={formData.assistant_id}
                onValueChange={(value) => setFormData({ ...formData, assistant_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {assistants.map(assistant => (
                    <SelectItem key={assistant.id} value={assistant.id}>
                      {assistant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Fluxo IA (Opcional)</Label>
              <Select
                value={formData.flow_id}
                onValueChange={(value) => setFormData({ ...formData, flow_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Nenhum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Nenhum</SelectItem>
                  {flows.map(flow => (
                    <SelectItem key={flow.id} value={flow.id}>
                      {flow.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Conexão</Label>
              <Select
                value={formData.connection_id}
                onValueChange={(value) => setFormData({ ...formData, connection_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {connections.map(conn => (
                    <SelectItem key={conn.id} value={conn.id}>
                      {conn.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Disparo</Label>
                <Select
                  value={formData.trigger_type}
                  onValueChange={(value) => setFormData({ ...formData, trigger_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="automatico">Automático</SelectItem>
                    <SelectItem value="agendado">Agendado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rascunho">Rascunho</SelectItem>
                    <SelectItem value="ativa">Ativa</SelectItem>
                    <SelectItem value="pausada">Pausada</SelectItem>
                    <SelectItem value="finalizada">Finalizada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddDialog(false);
              setEditingCampaign(null);
            }}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!formData.name || !formData.assistant_id || saving}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingCampaign ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Campaigns;