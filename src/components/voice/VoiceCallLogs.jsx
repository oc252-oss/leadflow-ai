import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, CheckCircle, XCircle, Clock, HelpCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from "@/lib/utils";

const intentConfig = {
  yes: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', label: 'Sim - Interessado' },
  maybe: { icon: HelpCircle, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Talvez' },
  no: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Não - Sem Interesse' },
  unknown: { icon: Clock, color: 'text-slate-400', bg: 'bg-slate-50', label: 'Não Identificado' }
};

const statusConfig = {
  initiated: { label: 'Iniciada', color: 'bg-blue-100 text-blue-700' },
  answered: { label: 'Atendida', color: 'bg-indigo-100 text-indigo-700' },
  completed: { label: 'Concluída', color: 'bg-green-100 text-green-700' },
  no_answer: { label: 'Não Atendeu', color: 'bg-slate-100 text-slate-700' },
  failed: { label: 'Falhou', color: 'bg-red-100 text-red-700' }
};

export default function VoiceCallLogs({ calls, leads }) {
  if (!calls || calls.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="py-12 text-center">
          <Phone className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500">Nenhuma ligação realizada ainda</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {calls.map((call) => {
        const lead = leads.find(l => l.id === call.lead_id);
        const intent = intentConfig[call.intent] || intentConfig.unknown;
        const status = statusConfig[call.status] || statusConfig.initiated;
        const IntentIcon = intent.icon;

        return (
          <Card key={call.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={cn("p-2 rounded-lg", intent.bg)}>
                      <IntentIcon className={cn("w-4 h-4", intent.color)} />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{lead?.name || 'Lead desconhecido'}</p>
                      <p className="text-sm text-slate-500">{call.phone}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Badge className={status.color}>{status.label}</Badge>
                    <Badge variant="outline">{intent.label}</Badge>
                    {call.confidence_score > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {call.confidence_score}% confiança
                      </Badge>
                    )}
                    {call.duration > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {call.duration}s
                      </Badge>
                    )}
                  </div>

                  {call.transcript && (
                    <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-500 mb-1">Transcrição:</p>
                      <p className="text-sm text-slate-700 italic">"{call.transcript}"</p>
                    </div>
                  )}
                </div>

                <div className="text-right ml-4">
                  <p className="text-xs text-slate-500">
                    {call.created_at ? format(new Date(call.created_at), 'dd/MM/yyyy') : '-'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {call.created_at ? format(new Date(call.created_at), 'HH:mm') : '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}