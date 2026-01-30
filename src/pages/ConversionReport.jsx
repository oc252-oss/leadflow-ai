import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function ConversionReport() {
  const [pipeline, setPipeline] = useState(null);
  const [stages, setStages] = useState([]);
  const [conversionData, setConversionData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      const teamMembers = await base44.entities.TeamMember.filter({ user_email: user.email });
      
      if (teamMembers.length === 0) return;

      const companyId = teamMembers[0].company_id;

      // Buscar pipeline padrão
      const pipelines = await base44.entities.Pipeline.filter({
        company_id: companyId,
        is_default: true
      });

      if (pipelines.length === 0) return;

      const defaultPipeline = pipelines[0];
      setPipeline(defaultPipeline);

      // Buscar estágios
      const stagesData = await base44.entities.PipelineStage.filter(
        { pipeline_id: defaultPipeline.id },
        'order'
      );
      setStages(stagesData);

      // Buscar todos os leads do pipeline
      const allLeads = await base44.entities.Lead.filter({ 
        pipeline_id: defaultPipeline.id 
      });

      // Calcular conversões por estágio
      const conversions = [];
      for (let i = 0; i < stagesData.length - 1; i++) {
        const currentStage = stagesData[i];
        const nextStage = stagesData[i + 1];

        const leadsInCurrent = allLeads.filter(l => l.pipeline_stage_id === currentStage.id).length;
        const leadsInNext = allLeads.filter(l => l.pipeline_stage_id === nextStage.id).length;

        const conversionRate = leadsInCurrent > 0 ? ((leadsInNext / leadsInCurrent) * 100).toFixed(1) : 0;

        conversions.push({
          from: currentStage.name,
          to: nextStage.name,
          leadsInCurrent,
          leadsInNext,
          conversionRate: parseFloat(conversionRate)
        });
      }

      setConversionData(conversions);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const getConversionIcon = (rate) => {
    if (rate >= 50) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (rate >= 30) return <Minus className="w-4 h-4 text-amber-600" />;
    return <TrendingDown className="w-4 h-4 text-red-600" />;
  };

  const getConversionColor = (rate) => {
    if (rate >= 50) return 'text-green-700 bg-green-50';
    if (rate >= 30) return 'text-amber-700 bg-amber-50';
    return 'text-red-700 bg-red-50';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!pipeline) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Pipeline não configurado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Relatório de Conversão</h1>
          <p className="text-slate-600">Taxa de conversão entre estágios do funil</p>
        </div>
        <Button variant="outline" onClick={loadData} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </Button>
      </div>

      <div className="grid gap-4">
        {conversionData.map((conversion, idx) => (
          <Card key={idx} className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">{conversion.from} → {conversion.to}</CardTitle>
                  <CardDescription className="mt-1">
                    {conversion.leadsInCurrent} leads → {conversion.leadsInNext} convertidos
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  {getConversionIcon(conversion.conversionRate)}
                  <Badge className={`text-lg font-semibold px-3 py-1 ${getConversionColor(conversion.conversionRate)}`}>
                    {conversion.conversionRate}%
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className={`absolute top-0 left-0 h-full rounded-full transition-all ${
                    conversion.conversionRate >= 50 ? 'bg-green-600' :
                    conversion.conversionRate >= 30 ? 'bg-amber-600' : 'bg-red-600'
                  }`}
                  style={{ width: `${Math.min(conversion.conversionRate, 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {conversionData.length === 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12 text-center text-slate-500">
            Nenhum dado de conversão disponível ainda
          </CardContent>
        </Card>
      )}
    </div>
  );
}