import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, MessageSquare, CheckCircle, Calendar, Target } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function AssistantPerformanceCard({ metric, assistant }) {
  if (!metric) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-slate-500">
          Nenhuma métrica disponível
        </CardContent>
      </Card>
    );
  }

  const conversionRate = metric.conversations_total > 0 
    ? Math.round((metric.converted_count / metric.conversations_total) * 100)
    : 0;

  const completionRate = metric.conversations_total > 0
    ? Math.round((metric.conversations_completed / metric.conversations_total) * 100)
    : 0;

  const abandonmentRate = metric.conversations_total > 0
    ? Math.round((metric.conversations_abandoned / metric.conversations_total) * 100)
    : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Conversations */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageSquare className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Conversas Totais</p>
                <p className="text-2xl font-bold">{metric.conversations_total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Completed */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Completadas</p>
                <p className="text-2xl font-bold">{metric.conversations_completed}</p>
                <p className="text-xs text-slate-400 mt-1">{completionRate}% de conclusão</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scheduled */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Agendamentos</p>
                <p className="text-2xl font-bold">{metric.scheduled_count}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Converted */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Target className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Conversões</p>
                <p className="text-2xl font-bold">{metric.converted_count}</p>
                <p className="text-xs text-slate-400 mt-1">{conversionRate}% de taxa</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resumo de Performance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center pb-3 border-b">
            <span className="text-sm text-slate-600">Taxa de Conclusão</span>
            <Badge className="bg-blue-100 text-blue-700">{completionRate}%</Badge>
          </div>
          <div className="flex justify-between items-center pb-3 border-b">
            <span className="text-sm text-slate-600">Taxa de Conversão</span>
            <Badge className="bg-green-100 text-green-700">{conversionRate}%</Badge>
          </div>
          <div className="flex justify-between items-center pb-3 border-b">
            <span className="text-sm text-slate-600">Taxa de Abandono</span>
            <Badge className={cn(
              "text-white",
              abandonmentRate > 20 ? "bg-red-600" : "bg-yellow-600"
            )}>
              {abandonmentRate}%
            </Badge>
          </div>
          {metric.satisfaction_score && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Satisfação</span>
              <Badge className="bg-purple-100 text-purple-700">{metric.satisfaction_score}%</Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}