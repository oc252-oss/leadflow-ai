import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Zap, 
  Play, 
  Pause,
  Trash2,
  Edit2,
  Clock,
  User,
  MessageSquare,
  Star,
  ArrowRight,
  Bell,
  Loader2,
  Phone
} from 'lucide-react';
import { cn } from "@/lib/utils";
import VoiceCampaignsList from '@/components/voice/VoiceCampaignsList';
import VoiceCampaignForm from '@/components/voice/VoiceCampaignForm';
import { hasFeature, FEATURES } from '@/components/featureGates';
import UpgradeCTA from '@/components/UpgradeCTA';

const triggerConfig = {
  new_lead: { icon: User, color: 'bg-blue-100 text-blue-600', label: 'New Lead' },
  score_change: { icon: Star, color: 'bg-amber-100 text-amber-600', label: 'Score Change' },
  no_response: { icon: Clock, color: 'bg-red-100 text-red-600', label: 'No Response' },
  stage_change: { icon: ArrowRight, color: 'bg-purple-100 text-purple-600', label: 'Stage Change' },
  keyword: { icon: MessageSquare, color: 'bg-emerald-100 text-emerald-600', label: 'Keyword Match' },
  time_based: { icon: Clock, color: 'bg-indigo-100 text-indigo-600', label: 'Time Based' }
};

function Automations() {
  const [activeTab, setActiveTab] = useState('rules');
  const [automations, setAutomations] = useState([]);
  const [voiceCampaigns, setVoiceCampaigns] = useState([]);
  const [teamMember, setTeamMember] = useState(null);
  const [company, setCompany] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showVoiceDialog, setShowVoiceDialog] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState(null);
  const [editingVoiceCampaign, setEditingVoiceCampaign] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trigger_type: 'new_lead',
    conditions: [],
    actions: [],
    is_active: true,
    priority: 0
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
        
        const [automationsData, companiesData, teamMembersData, voiceCampaignsData] = await Promise.all([
          base44.entities.AutomationRule.filter({ company_id: companyId }, '-created_date'),
          base44.entities.Company.filter({ id: companyId }),
          base44.entities.TeamMember.filter({ company_id: companyId, status: 'active' }),
          base44.entities.VoiceCampaign.filter({ company_id: companyId }, '-created_date')
        ]);
        
        setAutomations(automationsData);
        setCompany(companiesData[0]);
        setTeamMembers(teamMembersData);
        setVoiceCampaigns(voiceCampaignsData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name) return;
    
    setSaving(true);
    try {
      if (editingAutomation) {
        await base44.entities.AutomationRule.update(editingAutomation.id, formData);
        setAutomations(automations.map(a => 
          a.id === editingAutomation.id ? { ...a, ...formData } : a
        ));
      } else {
        const newAutomation = await base44.entities.AutomationRule.create({
          ...formData,
          company_id: teamMember.company_id
        });
        setAutomations([newAutomation, ...automations]);
      }
      
      setShowAddDialog(false);
      setEditingAutomation(null);
      setFormData({
        name: '',
        description: '',
        trigger_type: 'new_lead',
        conditions: [],
        actions: [],
        is_active: true,
        priority: 0
      });
    } catch (error) {
      console.error('Error saving automation:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (automation) => {
    try {
      await base44.entities.AutomationRule.update(automation.id, { 
        is_active: !automation.is_active 
      });
      setAutomations(automations.map(a => 
        a.id === automation.id ? { ...a, is_active: !a.is_active } : a
      ));
    } catch (error) {
      console.error('Error toggling automation:', error);
    }
  };

  const handleDelete = async (automationId) => {
    try {
      await base44.entities.AutomationRule.delete(automationId);
      setAutomations(automations.filter(a => a.id !== automationId));
    } catch (error) {
      console.error('Error deleting automation:', error);
    }
  };

  // Voice Campaign handlers
  const handleVoiceCampaignSave = async (data) => {
    if (!teamMember) return;
    
    setSaving(true);
    try {
      if (editingVoiceCampaign) {
        await base44.entities.VoiceCampaign.update(editingVoiceCampaign.id, data);
        setVoiceCampaigns(voiceCampaigns.map(c => 
          c.id === editingVoiceCampaign.id ? { ...c, ...data } : c
        ));
      } else {
        const newCampaign = await base44.entities.VoiceCampaign.create({
          ...data,
          company_id: teamMember.company_id
        });
        setVoiceCampaigns([newCampaign, ...voiceCampaigns]);
      }
      
      setShowVoiceDialog(false);
      setEditingVoiceCampaign(null);
    } catch (error) {
      console.error('Error saving voice campaign:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleVoiceCampaignEdit = (campaign) => {
    setEditingVoiceCampaign(campaign);
    setShowVoiceDialog(true);
  };

  const handleVoiceCampaignDelete = async (campaignId) => {
    try {
      await base44.entities.VoiceCampaign.delete(campaignId);
      setVoiceCampaigns(voiceCampaigns.filter(c => c.id !== campaignId));
    } catch (error) {
      console.error('Error deleting voice campaign:', error);
    }
  };

  const handleVoiceCampaignToggle = async (campaign) => {
    try {
      await base44.entities.VoiceCampaign.update(campaign.id, { 
        is_active: !campaign.is_active 
      });
      setVoiceCampaigns(voiceCampaigns.map(c => 
        c.id === campaign.id ? { ...c, is_active: !c.is_active } : c
      ));
    } catch (error) {
      console.error('Error toggling voice campaign:', error);
    }
  };

  const handleVoiceCampaignDuplicate = async (campaign) => {
    try {
      const duplicated = await base44.entities.VoiceCampaign.create({
        ...campaign,
        id: undefined,
        name: `${campaign.name} (Cópia)`
      });
      setVoiceCampaigns([duplicated, ...voiceCampaigns]);
    } catch (error) {
      console.error('Error duplicating voice campaign:', error);
    }
  };

  const handleEdit = (automation) => {
    setEditingAutomation(automation);
    setFormData({
      name: automation.name,
      description: automation.description || '',
      trigger_type: automation.trigger_type,
      conditions: automation.conditions || [],
      actions: automation.actions || [],
      is_active: automation.is_active,
      priority: automation.priority || 0
    });
    setShowAddDialog(true);
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Automations</h2>
          <p className="text-slate-500 mt-1">
            Manage automation rules and voice campaigns
          </p>
        </div>
        <Button onClick={() => window.location.href = '/VoiceSimulator'} variant="outline">
          <Phone className="w-4 h-4 mr-2" />
          Test Voice Simulator
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="rules" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Automation Rules
          </TabsTrigger>
          {hasFeature(company?.plan, FEATURES.VOICE_CAMPAIGNS) && (
            <TabsTrigger value="voice" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Voice Campaigns
            </TabsTrigger>
          )}
        </TabsList>

        {/* RULES TAB */}
        <TabsContent value="rules" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowAddDialog(true)} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Automation Rule
            </Button>
          </div>

          {automations.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
              <Zap className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No automations yet</h3>
            <p className="text-slate-500 mb-4">Create your first automation to streamline your workflow</p>
            <Button onClick={() => setShowAddDialog(true)} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Automation
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {automations.map((automation) => {
            const trigger = triggerConfig[automation.trigger_type] || triggerConfig.new_lead;
            const TriggerIcon = trigger.icon;

            return (
              <Card key={automation.id} className={cn(
                "border-0 shadow-sm transition-all",
                !automation.is_active && "opacity-60"
              )}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2.5 rounded-xl", trigger.color.split(' ')[0])}>
                        <TriggerIcon className={cn("w-5 h-5", trigger.color.split(' ')[1])} />
                      </div>
                      <div>
                        <CardTitle className="text-base">{automation.name}</CardTitle>
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {trigger.label}
                        </Badge>
                      </div>
                    </div>
                    <Switch
                      checked={automation.is_active}
                      onCheckedChange={() => handleToggle(automation)}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  {automation.description && (
                    <p className="text-sm text-slate-500 mb-4">{automation.description}</p>
                  )}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <div className="text-xs text-slate-500">
                      <span className="font-medium">{automation.executions_count || 0}</span> executions
                    </div>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => handleEdit(automation)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(automation.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
          )}
        </TabsContent>

        {/* VOICE CAMPAIGNS TAB */}
        <TabsContent value="voice" className="space-y-4">
          {!hasFeature(company?.plan, FEATURES.VOICE_CAMPAIGNS) ? (
            <UpgradeCTA 
              feature={FEATURES.VOICE_CAMPAIGNS}
              message="Campanhas de voz estão disponíveis no plano Premium"
              currentPlan={company?.plan}
            />
          ) : (
            <>
              <div className="flex justify-end">
                <Button onClick={() => {
                  setEditingVoiceCampaign(null);
                  setShowVoiceDialog(true);
                }} className="bg-indigo-600 hover:bg-indigo-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Voice Campaign
                </Button>
              </div>

              <VoiceCampaignsList
            campaigns={voiceCampaigns}
            teamMembers={teamMembers}
            onEdit={handleVoiceCampaignEdit}
            onDelete={handleVoiceCampaignDelete}
            onToggle={handleVoiceCampaignToggle}
            onDuplicate={handleVoiceCampaignDuplicate}
            onAddNew={() => {
              setEditingVoiceCampaign(null);
              setShowVoiceDialog(true);
            }}
          />
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Voice Campaign Dialog */}
      <Dialog open={showVoiceDialog} onOpenChange={setShowVoiceDialog}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingVoiceCampaign ? 'Editar Campanha de Voz' : 'Criar Campanha de Voz'}</DialogTitle>
            <DialogDescription>
              Automatize ligações inteligentes para recuperar leads e gerar mais avaliações.
            </DialogDescription>
          </DialogHeader>

          <VoiceCampaignForm
            campaign={editingVoiceCampaign}
            onSave={handleVoiceCampaignSave}
            onCancel={() => {
              setShowVoiceDialog(false);
              setEditingVoiceCampaign(null);
            }}
            teamMembers={teamMembers}
            company={company}
          />
        </DialogContent>
      </Dialog>

      {/* Add/Edit Automation Rule Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingAutomation ? 'Edit Automation' : 'Create Automation'}</DialogTitle>
            <DialogDescription>
              Set up automated actions based on triggers
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Notify on hot lead"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What does this automation do?"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Trigger</Label>
              <Select
                value={formData.trigger_type}
                onValueChange={(value) => setFormData({ ...formData, trigger_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new_lead">New Lead Arrives</SelectItem>
                  <SelectItem value="score_change">Lead Score Changes</SelectItem>
                  <SelectItem value="no_response">No Response Timeout</SelectItem>
                  <SelectItem value="stage_change">Stage Changes</SelectItem>
                  <SelectItem value="keyword">Keyword Detected</SelectItem>
                  <SelectItem value="time_based">Time Based</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50">
              <div>
                <p className="font-medium text-slate-900">Active</p>
                <p className="text-sm text-slate-500">Enable this automation</p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddDialog(false);
              setEditingAutomation(null);
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!formData.name || saving}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingAutomation ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Automations;