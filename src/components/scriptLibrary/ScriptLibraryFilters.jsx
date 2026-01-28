import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter } from 'lucide-react';

export default function ScriptLibraryFilters({ filters, onFilterChange }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por nome..."
              value={filters.search || ''}
              onChange={(e) => onFilterChange('search', e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Canal */}
          <Select value={filters.channel || ''} onValueChange={(value) => onFilterChange('channel', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Canal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>Todos os canais</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="webchat">WebChat</SelectItem>
              <SelectItem value="messenger">Messenger</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="voice">Voz</SelectItem>
            </SelectContent>
          </Select>

          {/* Tipo */}
          <Select value={filters.usageType || ''} onValueChange={(value) => onFilterChange('usageType', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>Todos os tipos</SelectItem>
              <SelectItem value="qualificacao">Qualificação</SelectItem>
              <SelectItem value="reengajamento_7d">Reengajamento 7d</SelectItem>
              <SelectItem value="reengajamento_30d">Reengajamento 30d</SelectItem>
              <SelectItem value="reengajamento_90d">Reengajamento 90d</SelectItem>
              <SelectItem value="prospeccao_ativa">Prospecção Ativa</SelectItem>
              <SelectItem value="voz_reativacao">Voz - Reativação</SelectItem>
              <SelectItem value="voz_qualificacao">Voz - Qualificação</SelectItem>
            </SelectContent>
          </Select>

          {/* Status */}
          <Select value={filters.status || ''} onValueChange={(value) => onFilterChange('status', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>Todos os status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="testing">Testando</SelectItem>
              <SelectItem value="approved">Aprovado</SelectItem>
              <SelectItem value="deprecated">Descontinuado</SelectItem>
            </SelectContent>
          </Select>

          {/* Aprovação */}
          <Select value={filters.approved === undefined ? '' : filters.approved.toString()} onValueChange={(value) => onFilterChange('approved', value === '' ? undefined : value === 'true')}>
            <SelectTrigger>
              <SelectValue placeholder="Aprovação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>Todos</SelectItem>
              <SelectItem value="true">Aprovados</SelectItem>
              <SelectItem value="false">Não aprovados</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}