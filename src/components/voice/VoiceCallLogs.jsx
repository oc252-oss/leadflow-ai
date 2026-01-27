import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Phone } from 'lucide-react';
import { format } from 'date-fns';

export default function VoiceCallLogs({ campaigns }) {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCalls();
  }, [campaigns]);

  const loadCalls = async () => {
    try {
      setLoading(true);
      const campaignIds = campaigns.map(c => c.id);
      
      if (campaignIds.length === 0) {
        setCalls([]);
        return;
      }

      // Load calls for all campaigns
      const allCalls = [];
      for (const campaignId of campaignIds) {
        const campaignCalls = await base44.entities.VoiceCall.filter({
          campaign_id: campaignId
        }, '-created_date', 100);
        allCalls.push(...campaignCalls);
      }

      // Sort by date
      allCalls.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      setCalls(allCalls.slice(0, 100));
    } catch (error) {
      console.error('Error loading calls:', error);
    } finally {
      setLoading(false);
    }
  };

  const getResultBadge = (result) => {
    const config = {
      yes: { label: 'Positiva', color: 'bg-green-100 text-green-800' },
      no: { label: 'Negativa', color: 'bg-red-100 text-red-800' },
      maybe: { label: 'Indefinida', color: 'bg-yellow-100 text-yellow-800' },
      unknown: { label: 'Desconhecida', color: 'bg-slate-100 text-slate-800' }
    };
    const cfg = config[result] || config.unknown;
    return <Badge className={cfg.color}>{cfg.label}</Badge>;
  };

  const getStatusBadge = (status) => {
    const config = {
      completed: { label: 'Completa', color: 'bg-green-100 text-green-800' },
      failed: { label: 'Falha', color: 'bg-red-100 text-red-800' },
      no_answer: { label: 'Sem Resposta', color: 'bg-slate-100 text-slate-800' },
      calling: { label: 'Chamando...', color: 'bg-blue-100 text-blue-800' },
      pending: { label: 'Pendente', color: 'bg-gray-100 text-gray-800' }
    };
    const cfg = config[status] || config.pending;
    return <Badge className={cfg.color}>{cfg.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (calls.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <Phone className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhuma chamada</h3>
            <p className="text-sm text-slate-500">
              Nenhuma campanha de voz foi executada ainda
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Log de Chamadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-slate-700">Telefone</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-700">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-700">Resultado</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-700">Transcrição</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-700">Duração</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-700">Data</th>
                </tr>
              </thead>
              <tbody>
                {calls.map((call) => (
                  <tr key={call.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono text-slate-900">{call.phone_number}</td>
                    <td className="py-3 px-4">{getStatusBadge(call.status)}</td>
                    <td className="py-3 px-4">{getResultBadge(call.result)}</td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{call.transcript || '-'}</td>
                    <td className="py-3 px-4">{call.duration_seconds ? `${call.duration_seconds}s` : '-'}</td>
                    <td className="py-3 px-4 text-slate-500">
                      {call.created_date ? format(new Date(call.created_date), 'dd/MM HH:mm') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}