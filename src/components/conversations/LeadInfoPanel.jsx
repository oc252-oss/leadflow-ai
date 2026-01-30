import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, Calendar, MessageSquare, User, Target, TrendingUp } from 'lucide-react';
import moment from 'moment';

export default function LeadInfoPanel({ lead, conversation }) {
  if (!lead) {
    return (
      <div className="p-4 text-sm text-slate-500">
        Selecione uma conversa para ver informações do lead
      </div>
    );
  }

  const getStatusColor = (status) => {
    const colors = {
      new: 'bg-gray-100 text-gray-800',
      contacted: 'bg-blue-100 text-blue-800',
      qualified: 'bg-purple-100 text-purple-800',
      won: 'bg-green-100 text-green-800',
      lost: 'bg-red-100 text-red-800',
      ativo: 'bg-green-100 text-green-800',
      inativo: 'bg-slate-100 text-slate-800'
    };
    return colors[status] || 'bg-slate-100 text-slate-800';
  };

  return (
    <div className="space-y-4">
      {/* Informações Básicas */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-600" />
            Informações do Lead
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-xs text-slate-500 mb-1">Nome</p>
            <p className="text-sm font-medium text-slate-900">{lead.name}</p>
          </div>
          
          <div>
            <p className="text-xs text-slate-500 mb-1">Telefone</p>
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <Phone className="w-3 h-3" />
              {lead.phone}
            </div>
          </div>

          {lead.email && (
            <div>
              <p className="text-xs text-slate-500 mb-1">Email</p>
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <Mail className="w-3 h-3" />
                {lead.email}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs text-slate-500 mb-1">Status</p>
            <Badge className={getStatusColor(lead.status)}>
              {lead.status}
            </Badge>
          </div>

          <div>
            <p className="text-xs text-slate-500 mb-1">Origem</p>
            <Badge variant="outline" className="capitalize">
              {lead.source_channel || lead.source}
            </Badge>
          </div>

          {lead.score > 0 && (
            <div>
              <p className="text-xs text-slate-500 mb-1">Score</p>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-semibold text-slate-900">{lead.score}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico de Interações */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            Histórico
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {lead.last_interaction_at && (
            <div>
              <p className="text-xs text-slate-500 mb-1">Última Interação</p>
              <p className="text-sm text-slate-700">
                {moment(lead.last_interaction_at).format('DD/MM/YYYY HH:mm')}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                ({moment(lead.last_interaction_at).fromNow()})
              </p>
            </div>
          )}

          {lead.last_interaction_type && lead.last_interaction_type !== 'nenhum' && (
            <div>
              <p className="text-xs text-slate-500 mb-1">Tipo de Interação</p>
              <Badge variant="secondary" className="capitalize text-xs">
                {lead.last_interaction_type.replace('_', ' ')}
              </Badge>
            </div>
          )}

          {lead.created_date && (
            <div>
              <p className="text-xs text-slate-500 mb-1">Criado em</p>
              <p className="text-sm text-slate-700">
                {moment(lead.created_date).format('DD/MM/YYYY HH:mm')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Interesse e Notas */}
      {(lead.interest || lead.notes) && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-600" />
              Detalhes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {lead.interest && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Interesse</p>
                <p className="text-sm text-slate-700">{lead.interest}</p>
              </div>
            )}

            {lead.notes && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Observações</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{lead.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tags */}
      {lead.tags && lead.tags.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {lead.tags.map((tag, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}