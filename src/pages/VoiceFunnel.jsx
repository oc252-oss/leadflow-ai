import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, TrendingUp, TrendingDown, CheckCircle2, XCircle, Clock, Users } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function VoiceFunnel() {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const [voiceCalls, setVoiceCalls] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [leads, setLeads] = useState([]);
  const [teamMember, setTeamMember] = useState(null);

  const [funnelData, setFunnelData] = useState([
    { stage: 'Ligações Iniciadas', count: 0, color: 'bg-blue-500' },
    { stage: 'Atendidas', count: 0, color: 'bg-indigo-500' },
    { stage: 'Interesse Positivo', count: 0, color: 'bg-green-500' },
    { stage: 'Talvez / Follow-up', count: 0, color: 'bg-amber-500' },
    { stage: 'Sem Interesse', count: 0, color: 'bg-red-500' }
  ]);

  useEffect(() => {
    loadData();
  }, [dateRange]);

  const loadData = async () => {
    try {
      setLoading(true);
      const user = await base44.auth.me();
      const teamMembers = await base44.entities.TeamMember.filter({ user_email: user.email });
      
      if (teamMembers.length > 0) {
        setTeamMember(teamMembers[0]);
        
        const daysAgo = parseInt(dateRange);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysAgo);

        const [callsData, campaignsData, leadsData] = await Promise.all([
          base44.entities.VoiceCall.filter({ company_id: teamMembers[0].company_id }),
          base44.entities.VoiceCampaign.filter({ organization_id: teamMembers[0].organization_id }),
          base44.entities.Lead.filter({ unit_id: teamMembers[0].unit_id })
        ]);

        const filteredCalls = callsData.filter(call => 
          new Date(call.created_date) >= startDate
        );

        setVoiceCalls(filteredCalls);
        setCampaigns(campaignsData);
        setLeads(leadsData);

        // Calculate funnel stages
        const initiated = filteredCalls.length;
        const answered = filteredCalls.filter(c => c.status === 'answered' || c.status === 'completed').length;
        const positive = filteredCalls.filter(c => c.intent === 'yes').length;
        const maybe = filteredCalls.filter(c => c.intent === 'maybe').length;
        const negative = filteredCalls.filter(c => c.intent === 'no').length;

        setFunnelData([
          { stage: 'Ligações Iniciadas', count: initiated, color: 'bg-blue-500' },
          { stage: 'Atendidas', count: answered, color: 'bg-indigo-500' },
          { stage: 'Interesse Positivo', count: positive, color: 'bg-green-500' },
          { stage: 'Talvez / Follow-up', count: maybe, color: 'bg-amber-500' },
          { stage: 'Sem Interesse', count: negative, color: 'bg-red-500' }
        ]);
      }
    } catch (error) {
      console.error('Error loading voice funnel data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalCalls = funnelData[0].count;
  const conversionRate = totalCalls > 0 
    ? Math.round((funnelData[2].count / totalCalls) * 100) 
    : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Funil de Voz</h1>
          <p className="text-sm text-slate-600 mt-1">
            Acompanhe o desempenho das campanhas de voz
          </p>
        </div>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total de Ligações</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{totalCalls}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Phone className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Taxa de Atendimento</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {totalCalls > 0 ? Math.round((funnelData[1].count / totalCalls) * 100) : 0}%
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Taxa de Conversão</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{conversionRate}%</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Campanhas Ativas</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {campaigns.filter(c => c.is_active).length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Funnel Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Funil de Conversão - Voz</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {funnelData.map((stage, idx) => {
              const percentage = totalCalls > 0 
                ? Math.round((stage.count / totalCalls) * 100) 
                : 0;
              
              const dropFromPrevious = idx > 0 
                ? funnelData[idx - 1].count - stage.count 
                : 0;

              return (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-slate-900 min-w-[200px]">
                        {stage.stage}
                      </span>
                      <span className="text-xs text-slate-500">
                        {stage.count} ({percentage}%)
                      </span>
                    </div>
                    {dropFromPrevious > 0 && (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
                        <TrendingDown className="w-3 h-3 mr-1" />
                        -{dropFromPrevious}
                      </Badge>
                    )}
                  </div>
                  <div className="relative w-full h-12 bg-slate-100 rounded-lg overflow-hidden">
                    <div 
                      className={cn("absolute left-0 top-0 h-full rounded-lg transition-all", stage.color)}
                      style={{ width: `${percentage}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-sm font-medium text-slate-900">
                      {stage.count} ligações
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Breakdown by Intent */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              Interesse Positivo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Total</span>
                <span className="text-lg font-bold text-green-700">{funnelData[2].count}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">% do Total</span>
                <span className="text-sm font-medium text-slate-900">
                  {totalCalls > 0 ? Math.round((funnelData[2].count / totalCalls) * 100) : 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              Follow-up Necessário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Total</span>
                <span className="text-lg font-bold text-amber-700">{funnelData[3].count}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">% do Total</span>
                <span className="text-sm font-medium text-slate-900">
                  {totalCalls > 0 ? Math.round((funnelData[3].count / totalCalls) * 100) : 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-600" />
              Sem Interesse
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Total</span>
                <span className="text-lg font-bold text-red-700">{funnelData[4].count}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">% do Total</span>
                <span className="text-sm font-medium text-slate-900">
                  {totalCalls > 0 ? Math.round((funnelData[4].count / totalCalls) * 100) : 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}