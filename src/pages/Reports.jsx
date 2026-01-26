import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { 
  Download,
  Calendar,
  TrendingUp,
  Users,
  Target,
  BarChart3,
  PieChart as PieChartIcon,
  Activity
} from 'lucide-react';
import { format, subDays, eachDayOfInterval } from 'date-fns';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#10b981', '#06b6d4'];

export default function Reports() {
  const [leads, setLeads] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      const members = await base44.entities.TeamMember.filter({ user_email: user.email });
      
      if (members.length > 0) {
        const companyId = members[0].company_id;

        const [leadsData, campaignsData, allMembers] = await Promise.all([
          base44.entities.Lead.filter({ company_id: companyId }, '-created_date'),
          base44.entities.Campaign.filter({ company_id: companyId }),
          base44.entities.TeamMember.filter({ company_id: companyId })
        ]);

        setLeads(leadsData);
        setCampaigns(campaignsData);
        setTeamMembers(allMembers);
      }
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate metrics
  const getDateFilteredLeads = () => {
    const days = parseInt(dateRange);
    const startDate = subDays(new Date(), days);
    return leads.filter(l => new Date(l.created_date) >= startDate);
  };

  const filteredLeads = getDateFilteredLeads();

  const metrics = {
    totalLeads: filteredLeads.length,
    hotLeads: filteredLeads.filter(l => l.temperature === 'hot').length,
    conversions: filteredLeads.filter(l => l.funnel_stage === 'closed_won').length,
    conversionRate: filteredLeads.length > 0 
      ? ((filteredLeads.filter(l => l.funnel_stage === 'closed_won').length / filteredLeads.length) * 100).toFixed(1)
      : 0
  };

  // Chart data
  const getDailyLeadsData = () => {
    const days = parseInt(dateRange);
    const interval = eachDayOfInterval({
      start: subDays(new Date(), days - 1),
      end: new Date()
    });

    return interval.map(date => {
      const dayLeads = leads.filter(l => 
        format(new Date(l.created_date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      );
      return {
        date: format(date, 'MMM dd'),
        leads: dayLeads.length,
        conversions: dayLeads.filter(l => l.funnel_stage === 'closed_won').length
      };
    });
  };

  const getLeadsBySource = () => {
    const sources = {};
    filteredLeads.forEach(lead => {
      const source = lead.source || 'unknown';
      sources[source] = (sources[source] || 0) + 1;
    });
    return Object.entries(sources).map(([name, value]) => ({
      name: name.replace('_', ' '),
      value
    }));
  };

  const getLeadsByStage = () => {
    const stages = {};
    filteredLeads.forEach(lead => {
      const stage = lead.funnel_stage || 'new';
      stages[stage] = (stages[stage] || 0) + 1;
    });
    return Object.entries(stages).map(([name, value]) => ({
      name: name.replace('_', ' '),
      value
    }));
  };

  const getCampaignPerformance = () => {
    return campaigns.slice(0, 10).map(campaign => {
      const campaignLeads = filteredLeads.filter(l => l.campaign_id === campaign.id);
      return {
        name: campaign.campaign_name?.substring(0, 20) || 'Unknown',
        leads: campaignLeads.length,
        conversions: campaignLeads.filter(l => l.funnel_stage === 'closed_won').length
      };
    }).filter(c => c.leads > 0);
  };

  const getAgentPerformance = () => {
    const agents = {};
    filteredLeads.forEach(lead => {
      if (lead.assigned_agent_id) {
        agents[lead.assigned_agent_id] = agents[lead.assigned_agent_id] || { leads: 0, conversions: 0 };
        agents[lead.assigned_agent_id].leads++;
        if (lead.funnel_stage === 'closed_won') {
          agents[lead.assigned_agent_id].conversions++;
        }
      }
    });

    return Object.entries(agents).map(([agentId, data]) => {
      const member = teamMembers.find(m => m.id === agentId);
      return {
        name: member?.user_email?.split('@')[0] || 'Unknown',
        ...data,
        rate: data.leads > 0 ? ((data.conversions / data.leads) * 100).toFixed(1) : 0
      };
    });
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
          <h2 className="text-2xl font-bold text-slate-900">Reports & Analytics</h2>
          <p className="text-slate-500 mt-1">Track your lead generation and sales performance</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Leads</p>
                <p className="text-3xl font-bold text-slate-900">{metrics.totalLeads}</p>
              </div>
              <div className="p-3 rounded-xl bg-indigo-100">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Hot Leads</p>
                <p className="text-3xl font-bold text-slate-900">{metrics.hotLeads}</p>
              </div>
              <div className="p-3 rounded-xl bg-orange-100">
                <Target className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Conversions</p>
                <p className="text-3xl font-bold text-slate-900">{metrics.conversions}</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-100">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Conversion Rate</p>
                <p className="text-3xl font-bold text-slate-900">{metrics.conversionRate}%</p>
              </div>
              <div className="p-3 rounded-xl bg-violet-100">
                <Activity className="w-6 h-6 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-white border">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="sources" className="gap-2">
            <PieChartIcon className="w-4 h-4" />
            Sources
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="gap-2">
            <Target className="w-4 h-4" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="agents" className="gap-2">
            <Users className="w-4 h-4" />
            Agents
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Daily Leads & Conversions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={getDailyLeadsData()}>
                      <defs>
                        <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorConv" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Area type="monotone" dataKey="leads" stroke="#6366f1" fillOpacity={1} fill="url(#colorLeads)" name="Leads" />
                      <Area type="monotone" dataKey="conversions" stroke="#10b981" fillOpacity={1} fill="url(#colorConv)" name="Conversions" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Funnel Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getLeadsByStage()} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis type="number" tick={{ fontSize: 12 }} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={100} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sources">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Lead Sources Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getLeadsBySource()}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {getLeadsBySource().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Source Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getLeadsBySource().map((source, index) => (
                    <div key={source.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="font-medium capitalize">{source.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-slate-500">{source.value} leads</span>
                        <Badge variant="secondary">
                          {filteredLeads.length > 0 
                            ? ((source.value / filteredLeads.length) * 100).toFixed(1) 
                            : 0}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="campaigns">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Campaign Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getCampaignPerformance()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="leads" fill="#6366f1" name="Leads" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="conversions" fill="#10b981" name="Conversions" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Agent Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {getAgentPerformance().length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>No agent performance data available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {getAgentPerformance().map((agent, index) => (
                    <div key={agent.name} className="flex items-center justify-between p-4 rounded-lg bg-slate-50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium">
                          {agent.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{agent.name}</p>
                          <p className="text-sm text-slate-500">{agent.leads} leads assigned</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-slate-900">{agent.conversions}</p>
                          <p className="text-xs text-slate-500">Conversions</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-emerald-600">{agent.rate}%</p>
                          <p className="text-xs text-slate-500">Conv. Rate</p>
                        </div>
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
  );
}