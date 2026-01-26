import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
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

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [leads, setLeads] = useState([]);
  const [teamMember, setTeamMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [formData, setFormData] = useState({
    campaign_name: '',
    platform: 'facebook',
    objective: 'lead_generation',
    external_campaign_id: '',
    external_adset_id: '',
    external_ad_id: '',
    adset_name: '',
    ad_name: '',
    status: 'active'
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      const members = await base44.entities.TeamMember.filter({ user_email: user.email });
      
      if (members.length > 0) {
        setTeamMember(members[0]);
        const companyId = members[0].company_id;

        const [campaignsData, leadsData] = await Promise.all([
          base44.entities.Campaign.filter({ company_id: companyId }, '-created_date'),
          base44.entities.Lead.filter({ company_id: companyId })
        ]);

        // Calculate leads per campaign
        const campaignsWithStats = campaignsData.map(campaign => ({
          ...campaign,
          leads_count: leadsData.filter(l => l.campaign_id === campaign.id).length,
          conversions_count: leadsData.filter(l => l.campaign_id === campaign.id && l.funnel_stage === 'closed_won').length
        }));

        setCampaigns(campaignsWithStats);
        setLeads(leadsData);
      }
    } catch (error) {
      console.error('Error loading campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.campaign_name) return;
    
    setSaving(true);
    try {
      if (editingCampaign) {
        await base44.entities.Campaign.update(editingCampaign.id, formData);
        setCampaigns(campaigns.map(c => 
          c.id === editingCampaign.id ? { ...c, ...formData } : c
        ));
      } else {
        const newCampaign = await base44.entities.Campaign.create({
          ...formData,
          company_id: teamMember.company_id
        });
        setCampaigns([{ ...newCampaign, leads_count: 0, conversions_count: 0 }, ...campaigns]);
      }
      
      setShowAddDialog(false);
      setEditingCampaign(null);
      setFormData({
        campaign_name: '',
        platform: 'facebook',
        objective: 'lead_generation',
        external_campaign_id: '',
        external_adset_id: '',
        external_ad_id: '',
        adset_name: '',
        ad_name: '',
        status: 'active'
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
      campaign_name: campaign.campaign_name,
      platform: campaign.platform,
      objective: campaign.objective || 'lead_generation',
      external_campaign_id: campaign.external_campaign_id || '',
      external_adset_id: campaign.external_adset_id || '',
      external_ad_id: campaign.external_ad_id || '',
      adset_name: campaign.adset_name || '',
      ad_name: campaign.ad_name || '',
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
    c.campaign_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.adset_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.ad_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter(c => c.status === 'active').length,
    totalLeads: campaigns.reduce((sum, c) => sum + (c.leads_count || 0), 0),
    totalConversions: campaigns.reduce((sum, c) => sum + (c.conversions_count || 0), 0)
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
                <p className="text-sm text-slate-500">Total Campaigns</p>
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
                <p className="text-sm text-slate-500">Active Campaigns</p>
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
                <p className="text-sm text-slate-500">Total Leads</p>
                <p className="text-2xl font-bold text-slate-900">{stats.totalLeads}</p>
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
                <p className="text-sm text-slate-500">Conversions</p>
                <p className="text-2xl font-bold text-slate-900">{stats.totalConversions}</p>
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
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Campaign
        </Button>
      </div>

      {/* Campaigns table */}
      <Card className="border-0 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Leads</TableHead>
              <TableHead className="text-center">Conversions</TableHead>
              <TableHead className="text-center">Conv. Rate</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCampaigns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                  No campaigns found
                </TableCell>
              </TableRow>
            ) : (
              filteredCampaigns.map((campaign) => {
                const platform = platformConfig[campaign.platform] || platformConfig.manual;
                const PlatformIcon = platform.icon;
                const convRate = campaign.leads_count > 0 
                  ? ((campaign.conversions_count / campaign.leads_count) * 100).toFixed(1)
                  : 0;

                return (
                  <TableRow key={campaign.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-slate-900">{campaign.campaign_name}</p>
                        {campaign.adset_name && (
                          <p className="text-xs text-slate-500">Ad Set: {campaign.adset_name}</p>
                        )}
                        {campaign.ad_name && (
                          <p className="text-xs text-slate-500">Ad: {campaign.ad_name}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium", platform.color)}>
                        <PlatformIcon className="w-3.5 h-3.5" />
                        <span className="capitalize">{campaign.platform}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        campaign.status === 'active' ? "bg-emerald-100 text-emerald-700" :
                        campaign.status === 'paused' ? "bg-amber-100 text-amber-700" :
                        "bg-slate-100 text-slate-700"
                      )}>
                        {campaign.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-medium">{campaign.leads_count}</TableCell>
                    <TableCell className="text-center font-medium">{campaign.conversions_count}</TableCell>
                    <TableCell className="text-center">
                      <span className={cn(
                        "font-medium",
                        convRate >= 20 ? "text-emerald-600" :
                        convRate >= 10 ? "text-amber-600" :
                        "text-slate-600"
                      )}>
                        {convRate}%
                      </span>
                    </TableCell>
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
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => handleDelete(campaign.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
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
            <DialogTitle>{editingCampaign ? 'Edit Campaign' : 'Add Campaign'}</DialogTitle>
            <DialogDescription>
              {editingCampaign ? 'Update campaign details' : 'Create a new campaign to track leads'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Campaign Name *</Label>
              <Input
                value={formData.campaign_name}
                onChange={(e) => setFormData({ ...formData, campaign_name: e.target.value })}
                placeholder="Summer Sale 2024"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Platform</Label>
                <Select
                  value={formData.platform}
                  onValueChange={(value) => setFormData({ ...formData, platform: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="google">Google</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Objective</Label>
                <Select
                  value={formData.objective}
                  onValueChange={(value) => setFormData({ ...formData, objective: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead_generation">Lead Generation</SelectItem>
                    <SelectItem value="messages">Messages</SelectItem>
                    <SelectItem value="conversions">Conversions</SelectItem>
                    <SelectItem value="traffic">Traffic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Facebook Campaign ID</Label>
              <Input
                value={formData.external_campaign_id}
                onChange={(e) => setFormData({ ...formData, external_campaign_id: e.target.value })}
                placeholder="123456789"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ad Set Name</Label>
                <Input
                  value={formData.adset_name}
                  onChange={(e) => setFormData({ ...formData, adset_name: e.target.value })}
                  placeholder="Audience A"
                />
              </div>
              <div className="space-y-2">
                <Label>Ad Name</Label>
                <Input
                  value={formData.ad_name}
                  onChange={(e) => setFormData({ ...formData, ad_name: e.target.value })}
                  placeholder="Creative 1"
                />
              </div>
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
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddDialog(false);
              setEditingCampaign(null);
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!formData.campaign_name || saving}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingCampaign ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}