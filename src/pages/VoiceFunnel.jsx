import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, TrendingUp, Users, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';

export default function VoiceFunnel() {
  const [calls, setCalls] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_calls: 0,
    answered: 0,
    completed: 0,
    positive_intent: 0,
    maybe_intent: 0,
    negative_intent: 0,
    no_answer: 0,
    failed: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const user = await base44.auth.me();
      const teamMembers = await base44.entities.TeamMember.filter({ user_email: user.email });
      
      if (teamMembers.length > 0) {
        const [callsData, campaignsData] = await Promise.all([
          base44.entities.VoiceCall.filter({ 
            company_id: teamMembers[0].company_id 
          }, '-created_date', 100),
          base44.entities.VoiceCampaign.filter({ 
            company_id: teamMembers[0].company_id 
          })
        ]);
        
        setCalls(callsData);
        setCampaigns(campaignsData);
        
        // Calculate stats
        const newStats = {
          total_calls: callsData.length,
          answered: callsData.filter(c => c.status === 'answered').length,
          completed: callsData.filter(c => c.status === 'completed').length,
          positive_intent: callsData.filter(c => c.intent === 'yes').length,
          maybe_intent: callsData.filter(c => c.intent === 'maybe').length,
          negative_intent: callsData.filter(c => c.intent === 'no').length,
          no_answer: callsData.filter(c => c.status === 'no_answer').length,
          failed: callsData.filter(c => c.status === 'failed').length
        };
        setStats(newStats);
      }
    } catch (error) {
      console.error('Error loading data:', error);
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

  const conversionRate = stats.total_calls > 0 
    ? ((stats.positive_intent / stats.total_calls) * 100).toFixed(1) 
    : 0;

  const answerRate = stats.total_calls > 0 
    ? (((stats.answered + stats.completed) / stats.total_calls) * 100).toFixed(1) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Funil de Voz</h1>
        <p className="text-slate-500 mt-1">Acompanhe o desempenho das chamadas de voz</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Total de Chamadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{stats.total_calls}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Taxa de Atendimento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{answerRate}%</div>
            <p className="text-xs text-slate-500 mt-1">{stats.answered + stats.completed} atendidas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Taxa de Conversão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-600">{conversionRate}%</div>
            <p className="text-xs text-slate-500 mt-1">{stats.positive_intent} respostas positivas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Campanhas Ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {campaigns.filter(c => c.is_active).length}
            </div>
            <p className="text-xs text-slate-500 mt-1">de {campaigns.length} total</p>
          </CardContent>
        </Card>
      </div>

      {/* Funnel Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Funil de Conversão</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Initiated */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-600" />
                  <span className="text-sm font-medium">Chamadas Iniciadas</span>
                </div>
                <Badge variant="outline">{stats.total_calls}</Badge>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3">
                <div 
                  className="bg-slate-600 h-3 rounded-full transition-all"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {/* Answered */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">Atendidas</span>
                </div>
                <Badge variant="outline">{stats.answered + stats.completed}</Badge>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3">
                <div 
                  className="bg-green-600 h-3 rounded-full transition-all"
                  style={{ width: `${answerRate}%` }}
                />
              </div>
            </div>

            {/* Positive Intent */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm font-medium">Interesse Positivo</span>
                </div>
                <Badge variant="outline">{stats.positive_intent}</Badge>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3">
                <div 
                  className="bg-indigo-600 h-3 rounded-full transition-all"
                  style={{ width: `${conversionRate}%` }}
                />
              </div>
            </div>

            {/* Maybe */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium">Talvez</span>
                </div>
                <Badge variant="outline">{stats.maybe_intent}</Badge>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3">
                <div 
                  className="bg-yellow-600 h-3 rounded-full transition-all"
                  style={{ 
                    width: stats.total_calls > 0 
                      ? `${(stats.maybe_intent / stats.total_calls * 100).toFixed(0)}%` 
                      : '0%' 
                  }}
                />
              </div>
            </div>

            {/* Negative */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium">Sem Interesse</span>
                </div>
                <Badge variant="outline">{stats.negative_intent}</Badge>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3">
                <div 
                  className="bg-red-600 h-3 rounded-full transition-all"
                  style={{ 
                    width: stats.total_calls > 0 
                      ? `${(stats.negative_intent / stats.total_calls * 100).toFixed(0)}%` 
                      : '0%' 
                  }}
                />
              </div>
            </div>

            {/* No Answer */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium">Não Atendidas</span>
                </div>
                <Badge variant="outline">{stats.no_answer}</Badge>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3">
                <div 
                  className="bg-slate-400 h-3 rounded-full transition-all"
                  style={{ 
                    width: stats.total_calls > 0 
                      ? `${(stats.no_answer / stats.total_calls * 100).toFixed(0)}%` 
                      : '0%' 
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance by Campaign */}
      <Card>
        <CardHeader>
          <CardTitle>Desempenho por Campanha</CardTitle>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <p className="text-center text-slate-500 py-8">Nenhuma campanha criada</p>
          ) : (
            <div className="space-y-4">
              {campaigns.map(campaign => {
                const campaignCalls = calls.filter(c => c.campaign_id === campaign.id);
                const campaignPositive = campaignCalls.filter(c => c.intent === 'yes').length;
                const campaignRate = campaignCalls.length > 0 
                  ? ((campaignPositive / campaignCalls.length) * 100).toFixed(1) 
                  : 0;

                return (
                  <div key={campaign.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-slate-900">{campaign.name}</h3>
                        <p className="text-sm text-slate-500">{campaignCalls.length} chamadas</p>
                      </div>
                      <Badge variant={campaign.is_active ? 'default' : 'secondary'}>
                        {campaign.is_active ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-green-600">{campaignPositive}</p>
                        <p className="text-xs text-slate-500">Positivas</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-yellow-600">
                          {campaignCalls.filter(c => c.intent === 'maybe').length}
                        </p>
                        <p className="text-xs text-slate-500">Talvez</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-red-600">
                          {campaignCalls.filter(c => c.intent === 'no').length}
                        </p>
                        <p className="text-xs text-slate-500">Negativas</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-indigo-600">{campaignRate}%</p>
                        <p className="text-xs text-slate-500">Taxa</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}