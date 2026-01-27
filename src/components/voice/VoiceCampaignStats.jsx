import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function VoiceCampaignStats({ campaigns }) {
  // Aggregate stats across campaigns
  const totalCalls = campaigns.reduce((sum, c) => sum + (c.total_calls_made || 0), 0);
  const totalPositive = campaigns.reduce((sum, c) => sum + (c.total_positive_responses || 0), 0);
  const totalNegative = campaigns.reduce((sum, c) => sum + (c.total_negative_responses || 0), 0);
  const totalMaybe = campaigns.reduce((sum, c) => sum + (c.total_maybe_responses || 0), 0);

  const conversionRate = totalCalls > 0 ? ((totalPositive / totalCalls) * 100).toFixed(1) : 0;

  const statsData = [
    { name: 'Total de Chamadas', value: totalCalls },
    { name: 'Positivas', value: totalPositive },
    { name: 'Negativas', value: totalNegative },
    { name: 'Indefinidas', value: totalMaybe }
  ];

  const pieData = [
    { name: 'Positivas', value: totalPositive, color: '#22c55e' },
    { name: 'Negativas', value: totalNegative, color: '#ef4444' },
    { name: 'Indefinidas', value: totalMaybe, color: '#eab308' }
  ];

  const campaignData = campaigns.map(c => ({
    name: c.name,
    total: c.total_calls_made || 0,
    positivas: c.total_positive_responses || 0,
    negativas: c.total_negative_responses || 0
  }));

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500 mb-1">Total de Chamadas</p>
            <p className="text-3xl font-bold text-slate-900">{totalCalls}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-green-700 mb-1">Positivas</p>
            <p className="text-3xl font-bold text-green-600">{totalPositive}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-red-700 mb-1">Negativas</p>
            <p className="text-3xl font-bold text-red-600">{totalNegative}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-indigo-700 mb-1">Taxa Conversão</p>
            <p className="text-3xl font-bold text-indigo-600">{conversionRate}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resultados por Campanha</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={campaignData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="positivas" fill="#22c55e" name="Positivas" />
                <Bar dataKey="negativas" fill="#ef4444" name="Negativas" />
                <Bar dataKey="total" fill="#8b5cf6" name="Total" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        {totalCalls > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Distribuição de Respostas</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resumo Geral</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-700">Total de Campanhas</span>
              <span className="font-semibold text-slate-900">{campaigns.length}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-700">Total de Chamadas</span>
              <span className="font-semibold text-slate-900">{totalCalls}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-700">Taxa de Resposta</span>
              <span className="font-semibold text-slate-900">
                {totalCalls > 0 ? (((totalPositive + totalNegative + totalMaybe) / totalCalls) * 100).toFixed(1) : 0}%
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-700">Taxa de Conversão (Positivo)</span>
              <span className="font-semibold text-green-600">{conversionRate}%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}