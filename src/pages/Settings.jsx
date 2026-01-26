import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { 
  Building2, 
  Users, 
  Bot, 
  Facebook,
  Save,
  Plus,
  Trash2,
  Edit2,
  Loader2,
  CheckCircle,
  XCircle,
  Link as LinkIcon,
  Zap,
  GitBranch,
  MessageSquare
} from 'lucide-react';
import { cn } from "@/lib/utils";
import AIFlowsTab from '@/components/settings/AIFlowsTab';
import SalesFunnelTab from '@/components/settings/SalesFunnelTab';
import WhatsAppTab from '@/components/settings/WhatsAppTab';

export default function Settings() {
  const [company, setCompany] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [aiFlows, setAiFlows] = useState([]);
  const [facebookIntegration, setFacebookIntegration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Dialogs
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showAiFlowDialog, setShowAiFlowDialog] = useState(false);
  const [editingFlow, setEditingFlow] = useState(null);
  
  // Form states
  const [companyForm, setCompanyForm] = useState({
    name: '',
    industry: 'services',
    timezone: 'America/Sao_Paulo',
    business_hours_start: '09:00',
    business_hours_end: '18:00',
    ai_enabled: true
  });

  const [aiConfigForm, setAiConfigForm] = useState({
    ai_enabled: true,
    default_flow_id: '',
    response_delay: 2,
    max_questions_per_flow: 5,
    auto_handoff_enabled: true
  });
  
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'sales_agent' });
  
  const [aiFlowForm, setAiFlowForm] = useState({
    name: '',
    description: '',
    greeting_message: '',
    outside_hours_message: '',
    handoff_message: '',
    hot_lead_threshold: 80,
    warm_lead_threshold: 50,
    is_default: false,
    is_active: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      const members = await base44.entities.TeamMember.filter({ user_email: user.email });
      
      if (members.length > 0) {
        const companyId = members[0].company_id;

        const [companyData, teamData, aiFlowsData, fbIntegration] = await Promise.all([
          base44.entities.Company.filter({ id: companyId }),
          base44.entities.TeamMember.filter({ company_id: companyId }),
          base44.entities.AIConversationFlow.filter({ company_id: companyId }),
          base44.entities.FacebookIntegration.filter({ company_id: companyId })
        ]);

        if (companyData.length > 0) {
          setCompany(companyData[0]);
          setCompanyForm({
            name: companyData[0].name || '',
            industry: companyData[0].industry || 'services',
            timezone: companyData[0].timezone || 'America/Sao_Paulo',
            business_hours_start: companyData[0].business_hours_start || '09:00',
            business_hours_end: companyData[0].business_hours_end || '18:00',
            ai_enabled: companyData[0].ai_enabled !== false
          });
          setAiConfigForm({
            ai_enabled: companyData[0].ai_enabled !== false,
            default_flow_id: companyData[0].default_flow_id || '',
            response_delay: companyData[0].response_delay || 2,
            max_questions_per_flow: companyData[0].max_questions_per_flow || 5,
            auto_handoff_enabled: companyData[0].auto_handoff_enabled !== false
          });
        }

        setTeamMembers(teamData);
        setAiFlows(aiFlowsData);
        if (fbIntegration.length > 0) {
          setFacebookIntegration(fbIntegration[0]);
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCompany = async () => {
    if (!company) return;
    
    setSaving(true);
    try {
      await base44.entities.Company.update(company.id, companyForm);
      setCompany({ ...company, ...companyForm });
    } catch (error) {
      console.error('Error saving company:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAiConfig = async () => {
    if (!company) return;
    
    setSaving(true);
    try {
      await base44.entities.Company.update(company.id, aiConfigForm);
      setCompany({ ...company, ...aiConfigForm });
    } catch (error) {
      console.error('Error saving AI config:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleInviteMember = async () => {
    if (!inviteForm.email || !company) return;
    
    setSaving(true);
    try {
      const newMember = await base44.entities.TeamMember.create({
        company_id: company.id,
        user_email: inviteForm.email,
        role: inviteForm.role,
        status: 'active'
      });
      setTeamMembers([...teamMembers, newMember]);
      setShowInviteDialog(false);
      setInviteForm({ email: '', role: 'sales_agent' });
    } catch (error) {
      console.error('Error inviting member:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      await base44.entities.TeamMember.delete(memberId);
      setTeamMembers(teamMembers.filter(m => m.id !== memberId));
    } catch (error) {
      console.error('Error removing member:', error);
    }
  };

  const handleSaveAiFlow = async () => {
    if (!aiFlowForm.name || !company) return;
    
    setSaving(true);
    try {
      if (editingFlow) {
        await base44.entities.AIConversationFlow.update(editingFlow.id, aiFlowForm);
        setAiFlows(aiFlows.map(f => f.id === editingFlow.id ? { ...f, ...aiFlowForm } : f));
      } else {
        const newFlow = await base44.entities.AIConversationFlow.create({
          ...aiFlowForm,
          company_id: company.id
        });
        setAiFlows([...aiFlows, newFlow]);
      }
      setShowAiFlowDialog(false);
      setEditingFlow(null);
      setAiFlowForm({
        name: '',
        description: '',
        greeting_message: '',
        outside_hours_message: '',
        handoff_message: '',
        hot_lead_threshold: 80,
        warm_lead_threshold: 50,
        is_default: false,
        is_active: true
      });
    } catch (error) {
      console.error('Error saving AI flow:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleEditFlow = (flow) => {
    setEditingFlow(flow);
    setAiFlowForm({
      name: flow.name,
      description: flow.description || '',
      greeting_message: flow.greeting_message || '',
      outside_hours_message: flow.outside_hours_message || '',
      handoff_message: flow.handoff_message || '',
      hot_lead_threshold: flow.hot_lead_threshold || 80,
      warm_lead_threshold: flow.warm_lead_threshold || 50,
      is_default: flow.is_default || false,
      is_active: flow.is_active !== false
    });
    setShowAiFlowDialog(true);
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
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Settings</h2>
        <p className="text-slate-500 mt-1">Manage your company settings and integrations</p>
      </div>

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="bg-white border">
          <TabsTrigger value="company" className="gap-2">
            <Building2 className="w-4 h-4" />
            Company
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-2">
            <Users className="w-4 h-4" />
            Team
          </TabsTrigger>
          <TabsTrigger value="ai-assistant" className="gap-2">
            <Bot className="w-4 h-4" />
            AI Assistant
          </TabsTrigger>
          <TabsTrigger value="ai-flows" className="gap-2">
            <Zap className="w-4 h-4" />
            AI Flows
          </TabsTrigger>
          <TabsTrigger value="sales-funnel" className="gap-2">
            <GitBranch className="w-4 h-4" />
            Sales Funnel
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            WhatsApp
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2">
            <LinkIcon className="w-4 h-4" />
            Integrations
          </TabsTrigger>
        </TabsList>

        {/* Company Settings */}
        <TabsContent value="company">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>Update your company details and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input
                    value={companyForm.name}
                    onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                    placeholder="Your Company Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Industry</Label>
                  <Select
                    value={companyForm.industry}
                    onValueChange={(value) => setCompanyForm({ ...companyForm, industry: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="franchise">Franchise</SelectItem>
                      <SelectItem value="real_estate">Real Estate</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="services">Services</SelectItem>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select
                    value={companyForm.timezone}
                    onValueChange={(value) => setCompanyForm({ ...companyForm, timezone: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Sao_Paulo">São Paulo (BRT)</SelectItem>
                      <SelectItem value="America/New_York">New York (EST)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Los Angeles (PST)</SelectItem>
                      <SelectItem value="Europe/London">London (GMT)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Business Hours Start</Label>
                  <Input
                    type="time"
                    value={companyForm.business_hours_start}
                    onChange={(e) => setCompanyForm({ ...companyForm, business_hours_start: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Business Hours End</Label>
                  <Input
                    type="time"
                    value={companyForm.business_hours_end}
                    onChange={(e) => setCompanyForm({ ...companyForm, business_hours_end: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50">
                <div>
                  <p className="font-medium text-slate-900">AI Assistant</p>
                  <p className="text-sm text-slate-500">Enable AI to automatically respond to leads</p>
                </div>
                <Switch
                  checked={companyForm.ai_enabled}
                  onCheckedChange={(checked) => setCompanyForm({ ...companyForm, ai_enabled: checked })}
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveCompany} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Settings */}
        <TabsContent value="team">
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>Manage your team and their roles</CardDescription>
              </div>
              <Button onClick={() => setShowInviteDialog(true)} className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4 mr-2" />
                Invite Member
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.user_email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {member.role?.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(
                          member.status === 'active' ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"
                        )}>
                          {member.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Assistant */}
        <TabsContent value="ai-assistant">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>AI Assistant Configuration</CardTitle>
              <CardDescription>Control AI behavior and select default conversation flow</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* AI Enable/Disable */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50">
                <div>
                  <p className="font-medium text-slate-900">Enable AI Assistant</p>
                  <p className="text-sm text-slate-500">Automatically respond to leads with AI</p>
                </div>
                <Switch
                  checked={aiConfigForm.ai_enabled}
                  onCheckedChange={(checked) => setAiConfigForm({ ...aiConfigForm, ai_enabled: checked })}
                />
              </div>

              {/* Default Flow Selection */}
              <div className="space-y-2">
                <Label>Default Conversation Flow</Label>
                <Select
                  value={aiConfigForm.default_flow_id}
                  onValueChange={(value) => setAiConfigForm({ ...aiConfigForm, default_flow_id: value })}
                  disabled={!aiConfigForm.ai_enabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select default flow" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>None</SelectItem>
                    {aiFlows.filter(f => f.is_active).map(flow => (
                      <SelectItem key={flow.id} value={flow.id}>
                        {flow.name}
                        {flow.is_default && ' (Default)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">Flow used when no specific trigger matches</p>
              </div>

              {/* AI Behavior Settings */}
              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-medium text-slate-900">AI Behavior</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Response Delay (seconds)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={30}
                      value={aiConfigForm.response_delay}
                      onChange={(e) => setAiConfigForm({ ...aiConfigForm, response_delay: parseInt(e.target.value) || 0 })}
                      disabled={!aiConfigForm.ai_enabled}
                    />
                    <p className="text-xs text-slate-500">Delay before AI responds to appear more human</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Max Questions Per Flow</Label>
                    <Input
                      type="number"
                      min={1}
                      max={20}
                      value={aiConfigForm.max_questions_per_flow}
                      onChange={(e) => setAiConfigForm({ ...aiConfigForm, max_questions_per_flow: parseInt(e.target.value) || 5 })}
                      disabled={!aiConfigForm.ai_enabled}
                    />
                    <p className="text-xs text-slate-500">Limit questions before handoff</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <p className="font-medium text-slate-900">Auto Handoff</p>
                    <p className="text-sm text-slate-500">Automatically transfer to agent when flow completes</p>
                  </div>
                  <Switch
                    checked={aiConfigForm.auto_handoff_enabled}
                    onCheckedChange={(checked) => setAiConfigForm({ ...aiConfigForm, auto_handoff_enabled: checked })}
                    disabled={!aiConfigForm.ai_enabled}
                  />
                </div>
              </div>

              {/* Current Flow Info */}
              {aiConfigForm.default_flow_id && (
                <div className="space-y-3 pt-4 border-t">
                  <h4 className="font-medium text-slate-900">Active Flow Information</h4>
                  {(() => {
                    const activeFlow = aiFlows.find(f => f.id === aiConfigForm.default_flow_id);
                    if (!activeFlow) return null;
                    return (
                      <div className="grid grid-cols-3 gap-4">
                        <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                          <p className="text-xs text-blue-600 font-medium">Flow Name</p>
                          <p className="text-sm font-semibold text-blue-900 mt-1">{activeFlow.name}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-red-50 border border-red-100">
                          <p className="text-xs text-red-600 font-medium">Hot Lead</p>
                          <p className="text-sm font-semibold text-red-900 mt-1">{activeFlow.hot_lead_threshold || 80}+ points</p>
                        </div>
                        <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                          <p className="text-xs text-amber-600 font-medium">Warm Lead</p>
                          <p className="text-sm font-semibold text-amber-900 mt-1">{activeFlow.warm_lead_threshold || 50}+ points</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Save Button */}
              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveAiConfig} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <Save className="w-4 h-4 mr-2" />
                  Save AI Configuration
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Flows */}
        <TabsContent value="ai-flows">
          <AIFlowsTab company={company} />
        </TabsContent>

        {/* Sales Funnel */}
        <TabsContent value="sales-funnel">
          <SalesFunnelTab company={company} />
        </TabsContent>

        {/* WhatsApp */}
        <TabsContent value="whatsapp">
          <WhatsAppTab company={company} />
        </TabsContent>

        {/* Integrations */}
        <TabsContent value="integrations">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Facebook Integration</CardTitle>
              <CardDescription>Connect your Facebook account to receive leads</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-6 rounded-lg border border-slate-200">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Facebook className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Facebook Lead Ads & Messenger</p>
                    <p className="text-sm text-slate-500">
                      {facebookIntegration?.status === 'connected' 
                        ? `Connected to ${facebookIntegration.page_name || 'your page'}`
                        : 'Not connected'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {facebookIntegration?.status === 'connected' ? (
                    <>
                      <Badge className="bg-emerald-100 text-emerald-700 gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Connected
                      </Badge>
                      <Button variant="outline">Disconnect</Button>
                    </>
                  ) : (
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Facebook className="w-4 h-4 mr-2" />
                      Connect Facebook
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invite Member Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>Send an invitation to join your team</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input
                type="email"
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                placeholder="colleague@company.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={inviteForm.role}
                onValueChange={(value) => setInviteForm({ ...inviteForm, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="company_admin">Company Admin</SelectItem>
                  <SelectItem value="sales_manager">Sales Manager</SelectItem>
                  <SelectItem value="sales_agent">Sales Agent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleInviteMember}
              disabled={!inviteForm.email || saving}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Send Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Flow Dialog */}
      <Dialog open={showAiFlowDialog} onOpenChange={setShowAiFlowDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingFlow ? 'Edit AI Flow' : 'Create AI Flow'}</DialogTitle>
            <DialogDescription>Configure how AI responds to leads</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Flow Name *</Label>
                <Input
                  value={aiFlowForm.name}
                  onChange={(e) => setAiFlowForm({ ...aiFlowForm, name: e.target.value })}
                  placeholder="e.g., Default Greeting"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={aiFlowForm.description}
                  onChange={(e) => setAiFlowForm({ ...aiFlowForm, description: e.target.value })}
                  placeholder="Brief description"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Greeting Message</Label>
              <Textarea
                value={aiFlowForm.greeting_message}
                onChange={(e) => setAiFlowForm({ ...aiFlowForm, greeting_message: e.target.value })}
                placeholder="Hello! Thanks for reaching out. How can I help you today?"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Outside Hours Message</Label>
              <Textarea
                value={aiFlowForm.outside_hours_message}
                onChange={(e) => setAiFlowForm({ ...aiFlowForm, outside_hours_message: e.target.value })}
                placeholder="Thanks for your message! We're currently closed but will get back to you first thing tomorrow."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Handoff Message</Label>
              <Textarea
                value={aiFlowForm.handoff_message}
                onChange={(e) => setAiFlowForm({ ...aiFlowForm, handoff_message: e.target.value })}
                placeholder="Great news! I'm connecting you with one of our specialists who can help you further."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hot Lead Threshold</Label>
                <Input
                  type="number"
                  value={aiFlowForm.hot_lead_threshold}
                  onChange={(e) => setAiFlowForm({ ...aiFlowForm, hot_lead_threshold: parseInt(e.target.value) })}
                  min={0}
                  max={100}
                />
                <p className="text-xs text-slate-500">Score above this = hot lead</p>
              </div>
              <div className="space-y-2">
                <Label>Warm Lead Threshold</Label>
                <Input
                  type="number"
                  value={aiFlowForm.warm_lead_threshold}
                  onChange={(e) => setAiFlowForm({ ...aiFlowForm, warm_lead_threshold: parseInt(e.target.value) })}
                  min={0}
                  max={100}
                />
                <p className="text-xs text-slate-500">Score above this = warm lead</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
              <div>
                <p className="font-medium text-slate-900">Set as Default</p>
                <p className="text-sm text-slate-500">Use this flow for all new leads</p>
              </div>
              <Switch
                checked={aiFlowForm.is_default}
                onCheckedChange={(checked) => setAiFlowForm({ ...aiFlowForm, is_default: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
              <div>
                <p className="font-medium text-slate-900">Active</p>
                <p className="text-sm text-slate-500">Enable this conversation flow</p>
              </div>
              <Switch
                checked={aiFlowForm.is_active}
                onCheckedChange={(checked) => setAiFlowForm({ ...aiFlowForm, is_active: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAiFlowDialog(false);
              setEditingFlow(null);
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveAiFlow}
              disabled={!aiFlowForm.name || saving}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingFlow ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}