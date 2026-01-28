import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  MessageSquare, 
  Phone, 
  Target,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Building2,
  Award,
  Zap,
  Clock,
  BarChart3
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { 
  getAccessibleScope, 
  isBrandLevel, 
  isOrgLevel, 
  ROLES 
} from '@/components/hierarchy/HierarchyUtils';
import { useNavigate } from 'react-router-dom';
import PoweredBy from '@/components/branding/PoweredBy';

export default function FranchiseDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [teamMember, setTeamMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  
  // Data
  const [kpis, setKpis] = useState({
    total_leads: 0,
    ai_answered_pct: 0,
    qualified_pct: 0,
    evaluations_scheduled: 0,
    conversion_rate: 0,
    ai_recovered: 0
  });
  const [units, setUnits] = useState([]);
  const [unitPerformance, setUnitPerformance] = useState([]);
  const [funnelData, setFunnelData] = useState([]);
  const [aiMetrics, setAiMetrics] = useState({
    avg_response_time: 0,
    off_hours_handled: 0,
    voice_campaigns: 0,
    voice_outcomes: { yes: 0, maybe: 0, no: 0 }
  });
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    loadData();
  }, [dateRange]);

  const loadData = async () => {
    try {
      setLoading(true);
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const teamMembers = await base44.entities.TeamMember.filter({ user_email: currentUser.email });
      if (teamMembers.length === 0) {
        navigate('/');
        return;
      }

      const tm = teamMembers[0];
      setTeamMember(tm);

      // Access control - only org admin and brand manager
      if (!isOrgLevel(tm) && !isBrandLevel(tm)) {
        navigate('/Dashboard');
        return;
      }

      const scope = getAccessibleScope(tm);
      
      // Load units
      const unitsFilter = { organization_id: scope.organization_id };
      if (scope.type === 'brand') {
        unitsFilter.brand_id = scope.brand_id;
      }
      const unitsData = await base44.entities.Unit.filter(unitsFilter);
      setUnits(unitsData);

      // Calculate date filter
      const daysAgo = parseInt(dateRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      // Load leads for all accessible units
      const unitIds = unitsData.map(u => u.id);
      const allLeads = [];
      for (const unitId of unitIds) {
        const leads = await base44.entities.Lead.filter({ unit_id: unitId });
        allLeads.push(...leads.filter(l => new Date(l.created_date) >= startDate));
      }

      // Calculate KPIs
      const totalLeads = allLeads.length;
      const qualifiedLeads = allLeads.filter(l => ['Qualificado', 'Avaliação Agendada', 'Avaliação Realizada', 'Venda Ganha'].includes(l.funnel_stage));
      const wonLeads = allLeads.filter(l => l.funnel_stage === 'Venda Ganha');
      const evaluationsScheduled = allLeads.filter(l => ['Avaliação Agendada', 'Avaliação Realizada', 'Venda Ganha'].includes(l.funnel_stage));

      setKpis({
        total_leads: totalLeads,
        ai_answered_pct: totalLeads > 0 ? Math.round((totalLeads * 0.85) * 100) / 100 : 0, // Simulated
        qualified_pct: totalLeads > 0 ? Math.round((qualifiedLeads.length / totalLeads) * 100) : 0,
        evaluations_scheduled: evaluationsScheduled.length,
        conversion_rate: totalLeads > 0 ? Math.round((wonLeads.length / totalLeads) * 100) : 0,
        ai_recovered: Math.round(totalLeads * 0.15) // Simulated
      });

      // Calculate unit performance
      const performance = unitsData.map(unit => {
        const unitLeads = allLeads.filter(l => l.unit_id === unit.id);
        const unitQualified = unitLeads.filter(l => ['Qualificado', 'Avaliação Agendada', 'Avaliação Realizada', 'Venda Ganha'].includes(l.funnel_stage));
        const unitEvaluations = unitLeads.filter(l => ['Avaliação Agendada', 'Avaliação Realizada', 'Venda Ganha'].includes(l.funnel_stage));
        const unitWon = unitLeads.filter(l => l.funnel_stage === 'Venda Ganha');
        
        const conversionRate = unitLeads.length > 0 ? Math.round((unitWon.length / unitLeads.length) * 100) : 0;
        
        let status = 'good';
        if (conversionRate < 15) status = 'critical';
        else if (conversionRate < 25) status = 'warning';

        return {
          unit,
          leads: unitLeads.length,
          qualified: unitQualified.length,
          evaluations: unitEvaluations.length,
          conversion_rate: conversionRate,
          status
        };
      });
      setUnitPerformance(performance);

      // Funnel data
      const funnelStages = [
        { name: 'Novo Lead', count: allLeads.filter(l => l.funnel_stage === 'Novo Lead').length, benchmark: 100 },
        { name: 'Atendimento Iniciado', count: allLeads.filter(l => l.funnel_stage === 'Atendimento Iniciado').length, benchmark: 80 },
        { name: 'Qualificado', count: qualifiedLeads.length, benchmark: 40 },
        { name: 'Avaliação Agendada', count: allLeads.filter(l => l.funnel_stage === 'Avaliação Agendada').length, benchmark: 25 },
        { name: 'Venda Ganha', count: wonLeads.length, benchmark: 18 }
      ];
      setFunnelData(funnelStages);

      // AI Metrics (simulated for now)
      setAiMetrics({
        avg_response_time: 45, // seconds
        off_hours_handled: Math.round(totalLeads * 0.3),
        voice_campaigns: 12,
        voice_outcomes: {
          yes: Math.round(totalLeads * 0.08),
          maybe: Math.round(totalLeads * 0.05),
          no: Math.round(totalLeads * 0.02)
        }
      });

      // Generate alerts
      const newAlerts = [];
      performance.forEach(p => {
        if (p.status === 'critical') {
          newAlerts.push({
            type: 'critical',
            message: `${p.unit.name}: Taxa de conversão crítica (${p.conversion_rate}%)`
          });
        } else if (p.status === 'warning') {
          newAlerts.push({
            type: 'warning',
            message: `${p.unit.name}: Taxa de conversão abaixo do ideal (${p.conversion_rate}%)`
          });
        }
      });

      if (newAlerts.length === 0) {
        newAlerts.push({
          type: 'success',
          message: 'Todas as unidades estão performando dentro do esperado'
        });
      }

      setAlerts(newAlerts);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
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

  const statusColors = {
    good: 'bg-green-100 text-green-700 border-green-300',
    warning: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    critical: 'bg-red-100 text-red-700 border-red-300'
  };

  const statusLabels = {
    good: 'Ótimo',
    warning: 'Atenção',
    critical: 'Crítico'
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">Dashboard Executivo</h1>
            <PoweredBy variant="dashboard" />
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Monitoramento de performance consolidado
          </p>
        </div>
        <div className="flex items-center gap-3">
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
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, idx) => (
            <div
              key={idx}
              className={cn(
                "p-3 rounded-lg border flex items-center gap-3 text-sm",
                alert.type === 'critical' && "bg-red-50 border-red-200 text-red-800",
                alert.type === 'warning' && "bg-amber-50 border-amber-200 text-amber-800",
                alert.type === 'success' && "bg-green-50 border-green-200 text-green-800"
              )}
            >
              <AlertTriangle className={cn("w-4 h-4", alert.type === 'success' && "hidden")} />
              <CheckCircle2 className={cn("w-4 h-4", alert.type !== 'success' && "hidden")} />
              <span className="font-medium">{alert.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Top KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total de Leads</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{kpis.total_leads}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">% Atendidos por IA</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{kpis.ai_answered_pct}%</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">% Qualificados</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{kpis.qualified_pct}%</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <Target className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Avaliações Agendadas</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{kpis.evaluations_scheduled}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Taxa de Conversão</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{kpis.conversion_rate}%</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                <Award className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Recuperados por IA</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{kpis.ai_recovered}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
                <Zap className="w-6 h-6 text-teal-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Unit Performance */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-slate-600" />
                Performance por Unidade
              </CardTitle>
              <CardDescription>Comparativo de resultados entre unidades</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 text-sm font-medium text-slate-600">Unidade</th>
                      <th className="text-center py-3 px-2 text-sm font-medium text-slate-600">Leads</th>
                      <th className="text-center py-3 px-2 text-sm font-medium text-slate-600">Qualificados</th>
                      <th className="text-center py-3 px-2 text-sm font-medium text-slate-600">Avaliações</th>
                      <th className="text-center py-3 px-2 text-sm font-medium text-slate-600">Taxa Conv.</th>
                      <th className="text-center py-3 px-2 text-sm font-medium text-slate-600">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unitPerformance.map((perf, idx) => (
                      <tr key={idx} className="border-b hover:bg-slate-50">
                        <td className="py-3 px-2">
                          <div>
                            <p className="font-medium text-slate-900">{perf.unit.name}</p>
                            <p className="text-xs text-slate-500">{perf.unit.code}</p>
                          </div>
                        </td>
                        <td className="text-center py-3 px-2 text-slate-900 font-medium">{perf.leads}</td>
                        <td className="text-center py-3 px-2 text-slate-900">{perf.qualified}</td>
                        <td className="text-center py-3 px-2 text-slate-900">{perf.evaluations}</td>
                        <td className="text-center py-3 px-2">
                          <span className={cn(
                            "inline-flex items-center gap-1 text-sm font-medium",
                            perf.conversion_rate >= 25 && "text-green-600",
                            perf.conversion_rate >= 15 && perf.conversion_rate < 25 && "text-amber-600",
                            perf.conversion_rate < 15 && "text-red-600"
                          )}>
                            {perf.conversion_rate}%
                            {perf.conversion_rate >= 25 && <TrendingUp className="w-3 h-3" />}
                            {perf.conversion_rate < 15 && <TrendingDown className="w-3 h-3" />}
                          </span>
                        </td>
                        <td className="text-center py-3 px-2">
                          <Badge className={statusColors[perf.status]}>
                            {statusLabels[perf.status]}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI & Voice Metrics */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-600" />
                Métricas de IA & Voz
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-600" />
                  <span className="text-sm text-slate-700">Tempo médio de resposta</span>
                </div>
                <span className="text-sm font-bold text-slate-900">{aiMetrics.avg_response_time}s</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-slate-600" />
                  <span className="text-sm text-slate-700">Fora do horário</span>
                </div>
                <span className="text-sm font-bold text-slate-900">{aiMetrics.off_hours_handled}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-600" />
                  <span className="text-sm text-slate-700">Campanhas de voz</span>
                </div>
                <span className="text-sm font-bold text-slate-900">{aiMetrics.voice_campaigns}</span>
              </div>

              <div className="pt-3 border-t">
                <p className="text-xs font-medium text-slate-600 mb-2">Resultados de Voz:</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">Sim (Interessados)</span>
                    <span className="font-medium text-green-700">{aiMetrics.voice_outcomes.yes}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">Talvez (Follow-up)</span>
                    <span className="font-medium text-amber-700">{aiMetrics.voice_outcomes.maybe}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">Não (Sem interesse)</span>
                    <span className="font-medium text-slate-500">{aiMetrics.voice_outcomes.no}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Funnel Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-slate-600" />
            Performance do Funil
          </CardTitle>
          <CardDescription>Volume consolidado x Benchmark ideal</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {funnelData.map((stage, idx) => {
              const percentage = kpis.total_leads > 0 ? Math.round((stage.count / kpis.total_leads) * 100) : 0;
              const isUnderperforming = percentage < stage.benchmark;
              
              return (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-slate-900 min-w-[180px]">{stage.name}</span>
                      <span className="text-xs text-slate-500">
                        {stage.count} leads ({percentage}%)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Benchmark: {stage.benchmark}%</span>
                      {isUnderperforming && (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 text-xs">
                          Abaixo
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="relative w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "absolute left-0 top-0 h-full rounded-full transition-all",
                        isUnderperforming ? "bg-amber-500" : "bg-green-500"
                      )}
                      style={{ width: `${percentage}%` }}
                    />
                    <div 
                      className="absolute top-0 h-full w-0.5 bg-slate-400"
                      style={{ left: `${stage.benchmark}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}