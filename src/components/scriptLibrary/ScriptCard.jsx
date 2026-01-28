import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Zap, Link2, Clock, Copy, GitBranch, CheckCircle2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ScriptCard({ script, onView, onApprove, onAssign, onClone, onVersion, onSubmit, onReject }) {
  const statusColors = {
    draft: 'bg-slate-100 text-slate-800',
    testing: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    deprecated: 'bg-red-100 text-red-800'
  };

  const statusIcons = {
    draft: null,
    testing: <AlertCircle className="w-3 h-3" />,
    approved: <CheckCircle2 className="w-3 h-3" />,
    deprecated: null
  };

  const statusLabels = {
    draft: 'Rascunho',
    testing: 'Em Revisão',
    approved: 'Aprovado',
    deprecated: 'Descontinuado'
  };

  const channelColors = {
    whatsapp: 'bg-green-50 text-green-700 border-green-200',
    webchat: 'bg-blue-50 text-blue-700 border-blue-200',
    messenger: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    instagram: 'bg-pink-50 text-pink-700 border-pink-200',
    voice: 'bg-purple-50 text-purple-700 border-purple-200'
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base line-clamp-1">{script.name}</CardTitle>
            <p className="text-xs text-slate-600 mt-1">{script.usage_type}</p>
          </div>
          <Badge className={`whitespace-nowrap flex gap-1 items-center ${statusColors[script.status]}`}>
            {statusIcons[script.status]}
            {statusLabels[script.status]}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Badges */}
        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline" className={`capitalize ${channelColors[script.channel]}`}>
            {script.channel}
          </Badge>
          <Badge variant="outline" className="text-slate-600">
            {script.version}
          </Badge>
          {script.is_approved && (
            <Badge className="bg-green-500 text-white">Aprovado</Badge>
          )}
        </div>

        {/* Description */}
        {script.description && (
          <p className="text-sm text-slate-600 line-clamp-2">{script.description}</p>
        )}

        {/* Greeting Preview */}
        {script.greeting_message && (
          <div className="p-2 rounded bg-slate-50 border">
            <p className="text-xs text-slate-600 mb-1">Saudação:</p>
            <p className="text-sm text-slate-900 line-clamp-2 italic">"{script.greeting_message}"</p>
          </div>
        )}

        {/* Meta */}
        <div className="flex items-center gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {format(new Date(script.created_date), 'dd MMM yyyy', { locale: ptBR })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 flex-wrap text-xs">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onView(script)}
            className="gap-1 flex-1"
          >
            <Eye className="w-3 h-3" />
            Ver
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onClone?.(script)}
            className="gap-1 flex-1 text-slate-600 hover:bg-slate-100"
            title="Clonar como novo script"
          >
            <Copy className="w-3 h-3" />
            Clonar
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onVersion?.(script)}
            className="gap-1 flex-1 text-slate-600 hover:bg-slate-100"
            title="Criar nova versão"
          >
            <GitBranch className="w-3 h-3" />
            Versão
          </Button>
          {script.status === 'draft' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onSubmit?.(script)}
              className="gap-1 flex-1 text-yellow-600 hover:bg-yellow-50"
              title="Enviar para revisão"
            >
              Revisar
            </Button>
          )}
          {script.status === 'testing' && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onApprove?.(script)}
                className="gap-1 flex-1 text-green-600 hover:bg-green-50"
              >
                <CheckCircle2 className="w-3 h-3" />
                Aprovar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onReject?.(script)}
                className="gap-1 flex-1 text-red-600 hover:bg-red-50"
              >
                Rejeitar
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}