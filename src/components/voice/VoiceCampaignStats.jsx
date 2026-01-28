import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, CheckCircle, XCircle, HelpCircle, TrendingUp } from 'lucide-react';

export default function VoiceCampaignStats({ campaign }) {
  const totalResponses = (campaign.total_yes_responses || 0) + 
                        (campaign.total_maybe_responses || 0) + 
                        (campaign.total_no_responses || 0);

  const conversionRate = campaign.total_calls_made > 0 
    ? ((campaign.total_yes_responses || 0) / campaign.total_calls_made * 100).toFixed(1)
    : 0;

  const stats = [
    {
      label: 'Total de Ligações',
      value: campaign.total_calls_made || 0,
      icon: Phone,
      color: 'text-indigo-600',
      bg: 'bg-indigo-100'
    },
    {
      label: 'Demonstraram Interesse',
      value: campaign.total_yes_responses || 0,
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-100'
    },
    {
      label: 'Talvez / Depois',
      value: campaign.total_maybe_responses || 0,
      icon: HelpCircle,
      color: 'text-amber-600',
      bg: 'bg-amber-100'
    },
    {
      label: 'Sem Interesse',
      value: campaign.total_no_responses || 0,
      icon: XCircle,
      color: 'text-red-600',
      bg: 'bg-red-100'
    }
  ];

  return (
    <div className="space-y-4">
      {/* Conversion Rate Highlight */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-indigo-50 to-violet-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Taxa de Conversão</p>
              <p className="text-4xl font-bold text-indigo-600">{conversionRate}%</p>
              <p className="text-xs text-slate-500 mt-1">
                {campaign.total_yes_responses || 0} interessados de {campaign.total_calls_made || 0} ligações
              </p>
            </div>
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-indigo-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2.5 rounded-lg", stat.bg)}>
                    <Icon className={cn("w-5 h-5", stat.color)} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                    <p className="text-xs text-slate-500">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Last Run Info */}
      {campaign.last_run_at && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Última execução:</span>
              <span className="font-medium text-slate-900">
                {new Date(campaign.last_run_at).toLocaleString('pt-BR')}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}