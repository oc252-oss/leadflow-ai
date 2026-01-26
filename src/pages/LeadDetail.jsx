import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Phone,
  Mail,
  MessageSquare,
  Clock,
  Facebook,
  Target,
  Star,
  Flame,
  Sun,
  Snowflake,
  Edit2,
  Save,
  User,
  FileText,
  History,
  Loader2
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const stageColors = {
  new: 'bg-slate-100 text-slate-600',
  contacted: 'bg-blue-100 text-blue-700',
  qualified: 'bg-purple-100 text-purple-700',
  scheduled: 'bg-amber-100 text-amber-700',
  proposal: 'bg-indigo-100 text-indigo-700',
  closed_won: 'bg-emerald-100 text-emerald-700',
  closed_lost: 'bg-red-100 text-red-700'
};

const temperatureConfig = {
  hot: { icon: Flame, color: 'text-red-600', bg: 'bg-red-100' },
  warm: { icon: Sun, color: 'text-amber-600', bg: 'bg-amber-100' },
  cold: { icon: Snowflake, color: 'text-blue-600', bg: 'bg-blue-100' }
};

export default function LeadDetail() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const leadId = urlParams.get('id');

  const [lead, setLead] = useState(null);
  const [campaign, setCampaign] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState({});
  const [openingChat, setOpeningChat] = useState(false);

  useEffect(() => {
    if (leadId) {
      loadLeadData();
    }
  }, [leadId]);

  const loadLeadData = async () => {
    try {
      const leads = await base44.entities.Lead.filter({ id: leadId });
      if (leads.length > 0) {
        const leadData = leads[0];
        setLead(leadData);
        setEditData(leadData);

        // Load related data
        const [conversations, activityLogs] = await Promise.all([
          base44.entities.Conversation.filter({ lead_id: leadId }),
          base44.entities.ActivityLog.filter({ lead_id: leadId }, '-created_date', 20)
        ]);

        if (conversations.length > 0) {
          setConversation(conversations[0]);
          const msgs = await base44.entities.Message.filter(
            { conversation_id: conversations[0].id },
            'created_date'
          );
          setMessages(msgs);
        }

        setActivities(activityLogs);

        if (leadData.campaign_id) {
          const campaigns = await base44.entities.Campaign.filter({ id: leadData.campaign_id });
          if (campaigns.length > 0) {
            setCampaign(campaigns[0]);
          }
        }
      }
    } catch (error) {
      console.error('Error loading lead:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const user = await base44.auth.me();
      const updates = {
        name: editData.name,
        email: editData.email,
        phone: editData.phone,
        funnel_stage: editData.funnel_stage,
        interest_type: editData.interest_type,
        urgency_level: editData.urgency_level,
        budget_range: editData.budget_range,
        location: editData.location,
        notes: editData.notes
      };

      await base44.entities.Lead.update(leadId, updates);
      
      if (lead.funnel_stage !== editData.funnel_stage) {
        await base44.entities.ActivityLog.create({
          company_id: lead.company_id,
          lead_id: leadId,
          user_email: user.email,
          action: 'stage_changed',
          old_value: lead.funnel_stage,
          new_value: editData.funnel_stage,
          details: { lead_name: lead.name }
        });
      }

      setLead({ ...lead, ...updates });
      setEditing(false);
    } catch (error) {
      console.error('Error saving lead:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenChat = async () => {
    try {
      setOpeningChat(true);
      console.log('🔵 [Open Chat] Button clicked for lead:', leadId);

      // Check if conversation already exists
      const existingConversations = await base44.entities.Conversation.filter({
        lead_id: leadId,
        status: { $ne: 'closed' }
      });

      let conversationId;

      if (existingConversations.length > 0) {
        // Use existing conversation
        conversationId = existingConversations[0].id;
        console.log('♻️ [Open Chat] Using existing conversation:', conversationId);
      } else {
        // Create new conversation
        console.log('➕ [Open Chat] Creating new conversation');
        
        const newConversation = await base44.entities.Conversation.create({
          company_id: lead.company_id,
          unit_id: lead.unit_id || '',
          lead_id: leadId,
          channel: 'whatsapp',
          status: 'human_active',
          unread_count: 0,
          last_message_at: new Date().toISOString()
        });

        conversationId = newConversation.id;
        console.log('✨ [Open Chat] New conversation created:', conversationId);
      }

      if (conversationId) {
        const redirectUrl = createPageUrl('Conversations') + `?conversation_id=${conversationId}`;
        console.log('🔗 [Open Chat] Navigating to:', redirectUrl);
        toast.success('Chat opened!');
        navigate(redirectUrl);
      }
    } catch (error) {
      console.error('❌ [Open Chat] Error:', error.message);
      toast.error(`Failed to open chat: ${error?.message || 'Unknown error'}`);
    } finally {
      setOpeningChat(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center py-16">
        <h3 className="text-lg font-medium text-slate-900">Lead not found</h3>
        <Button onClick={() => navigate(createPageUrl('Leads'))} className="mt-4">
          Back to Leads
        </Button>
      </div>
    );
  }

  const tempConfig = temperatureConfig[lead.temperature] || temperatureConfig.cold;
  const TempIcon = tempConfig.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(createPageUrl('Leads'))}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl",
              lead.temperature === 'hot' ? "bg-gradient-to-br from-orange-400 to-red-500" :
              lead.temperature === 'warm' ? "bg-gradient-to-br from-amber-400 to-orange-500" :
              "bg-gradient-to-br from-slate-400 to-slate-500"
            )}>
              {lead.name?.charAt(0) || '?'}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{lead.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                <Badge className={stageColors[lead.funnel_stage]}>
                  {lead.funnel_stage?.replace('_', ' ')}
                </Badge>
                <span className="flex items-center gap-1 text-sm text-slate-500">
                  <TempIcon className={cn("w-4 h-4", tempConfig.color)} />
                  Score: {lead.score}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setEditing(true)}>
              <Edit2 className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="bg-white border">
              <TabsTrigger value="overview" className="gap-2">
                <User className="w-4 h-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="conversation" className="gap-2">
                <MessageSquare className="w-4 h-4" />
                Conversation
              </TabsTrigger>
              <TabsTrigger value="activity" className="gap-2">
                <History className="w-4 h-4" />
                Activity
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle>Lead Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      {editing ? (
                        <Input
                          value={editData.name || ''}
                          onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        />
                      ) : (
                        <p className="text-slate-900">{lead.name}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      {editing ? (
                        <Input
                          value={editData.email || ''}
                          onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                        />
                      ) : (
                        <p className="text-slate-900">{lead.email || '-'}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      {editing ? (
                        <Input
                          value={editData.phone || ''}
                          onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                        />
                      ) : (
                        <p className="text-slate-900">{lead.phone || '-'}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Funnel Stage</Label>
                      {editing ? (
                        <Select
                          value={editData.funnel_stage}
                          onValueChange={(value) => setEditData({ ...editData, funnel_stage: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="contacted">Contacted</SelectItem>
                            <SelectItem value="qualified">Qualified</SelectItem>
                            <SelectItem value="scheduled">Scheduled</SelectItem>
                            <SelectItem value="proposal">Proposal</SelectItem>
                            <SelectItem value="closed_won">Closed Won</SelectItem>
                            <SelectItem value="closed_lost">Closed Lost</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge className={stageColors[lead.funnel_stage]}>
                          {lead.funnel_stage?.replace('_', ' ')}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="border-t pt-6 space-y-6">
                    <h4 className="font-medium text-slate-900">Qualification Data</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Interest Type</Label>
                        {editing ? (
                          <Input
                            value={editData.interest_type || ''}
                            onChange={(e) => setEditData({ ...editData, interest_type: e.target.value })}
                          />
                        ) : (
                          <p className="text-slate-900">{lead.interest_type || '-'}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Urgency Level</Label>
                        {editing ? (
                          <Select
                            value={editData.urgency_level || 'exploring'}
                            onValueChange={(value) => setEditData({ ...editData, urgency_level: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="immediate">Immediate</SelectItem>
                              <SelectItem value="this_week">This Week</SelectItem>
                              <SelectItem value="this_month">This Month</SelectItem>
                              <SelectItem value="exploring">Just Exploring</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="text-slate-900 capitalize">{lead.urgency_level?.replace('_', ' ') || '-'}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Budget Range</Label>
                        {editing ? (
                          <Input
                            value={editData.budget_range || ''}
                            onChange={(e) => setEditData({ ...editData, budget_range: e.target.value })}
                          />
                        ) : (
                          <p className="text-slate-900">{lead.budget_range || '-'}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Location</Label>
                        {editing ? (
                          <Input
                            value={editData.location || ''}
                            onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                          />
                        ) : (
                          <p className="text-slate-900">{lead.location || '-'}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6 space-y-2">
                    <Label>Notes</Label>
                    {editing ? (
                      <Textarea
                        value={editData.notes || ''}
                        onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                        rows={4}
                      />
                    ) : (
                      <p className="text-slate-600">{lead.notes || 'No notes yet'}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="conversation" className="mt-4">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle>Conversation History</CardTitle>
                </CardHeader>
                <CardContent>
                  {messages.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <MessageSquare className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                      <p>No conversation yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={cn(
                            "flex",
                            msg.sender_type === 'lead' ? "justify-start" : "justify-end"
                          )}
                        >
                          <div className={cn(
                            "max-w-[70%] px-4 py-3 rounded-2xl",
                            msg.sender_type === 'lead' 
                              ? "bg-slate-100 text-slate-900" 
                              : msg.sender_type === 'bot'
                                ? "bg-violet-100 text-violet-900"
                                : "bg-indigo-600 text-white"
                          )}>
                            <p className="text-sm">{msg.content}</p>
                            <p className={cn(
                              "text-xs mt-1",
                              msg.sender_type === 'lead' ? "text-slate-500" : 
                              msg.sender_type === 'bot' ? "text-violet-500" : "text-indigo-200"
                            )}>
                              {msg.sender_type === 'bot' ? '🤖 AI' : msg.sender_type === 'agent' ? '👤 Agent' : ''} • {format(new Date(msg.created_date), 'HH:mm')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="mt-4">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle>Activity Log</CardTitle>
                </CardHeader>
                <CardContent>
                  {activities.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <History className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                      <p>No activity recorded</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activities.map((activity) => (
                        <div key={activity.id} className="flex items-start gap-3 pb-4 border-b border-slate-100 last:border-0">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                            <History className="w-4 h-4 text-slate-500" />
                          </div>
                          <div>
                            <p className="text-sm text-slate-900">
                              {activity.action.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </p>
                            {activity.old_value && activity.new_value && (
                              <p className="text-sm text-slate-500">
                                {activity.old_value} → {activity.new_value}
                              </p>
                            )}
                            <p className="text-xs text-slate-400 mt-1">
                              {formatDistanceToNow(new Date(activity.created_date), { addSuffix: true })}
                              {activity.user_email && ` • ${activity.user_email}`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Source & Attribution */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Source & Attribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Facebook className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 capitalize">
                    {lead.source?.replace('_', ' ') || 'Unknown'}
                  </p>
                  <p className="text-xs text-slate-500">Lead Source</p>
                </div>
              </div>

              {campaign && (
                <div className="p-3 rounded-lg bg-slate-50 space-y-2">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-medium text-slate-500">CAMPAIGN</span>
                  </div>
                  <p className="text-sm font-medium text-slate-900">{campaign.campaign_name}</p>
                  {campaign.adset_name && (
                    <p className="text-xs text-slate-500">Ad Set: {campaign.adset_name}</p>
                  )}
                  {campaign.ad_name && (
                    <p className="text-xs text-slate-500">Ad: {campaign.ad_name}</p>
                  )}
                </div>
              )}

              {(lead.utm_source || lead.utm_campaign) && (
                <div className="p-3 rounded-lg bg-slate-50 space-y-1">
                  <p className="text-xs font-medium text-slate-500">UTM PARAMETERS</p>
                  {lead.utm_source && <p className="text-xs text-slate-600">Source: {lead.utm_source}</p>}
                  {lead.utm_campaign && <p className="text-xs text-slate-600">Campaign: {lead.utm_campaign}</p>}
                  {lead.utm_medium && <p className="text-xs text-slate-600">Medium: {lead.utm_medium}</p>}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {lead.phone && (
                <Button variant="outline" className="w-full justify-start">
                  <Phone className="w-4 h-4 mr-2" />
                  Call {lead.phone}
                </Button>
              )}
              {lead.email && (
                <Button variant="outline" className="w-full justify-start">
                  <Mail className="w-4 h-4 mr-2" />
                  Send Email
                </Button>
              )}
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={handleOpenChat}
                disabled={openingChat}
              >
                {openingChat ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <MessageSquare className="w-4 h-4 mr-2" />
                )}
                Open Chat
              </Button>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600">
                  Created {formatDistanceToNow(new Date(lead.created_date), { addSuffix: true })}
                </span>
              </div>
              {lead.last_interaction_at && (
                <div className="flex items-center gap-3 text-sm">
                  <MessageSquare className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">
                    Last interaction {formatDistanceToNow(new Date(lead.last_interaction_at), { addSuffix: true })}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}