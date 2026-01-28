import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X, Filter } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

export default function LeadFilters({ filters, setFilters, campaigns = [] }) {
  const hasActiveFilters = filters.search || filters.temperature !== 'all' || 
    filters.stage !== 'all' || filters.source !== 'all' || filters.campaign !== 'all';

  const clearFilters = () => {
    setFilters({
      search: '',
      temperature: 'all',
      stage: 'all',
      source: 'all',
      campaign: 'all'
    });
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por nome, email ou telefone..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="pl-10 bg-slate-50 border-slate-200"
          />
        </div>

        {/* Temperature filter */}
        <Select
          value={filters.temperature}
          onValueChange={(value) => setFilters({ ...filters, temperature: value })}
        >
          <SelectTrigger className="w-full lg:w-40 bg-slate-50">
            <SelectValue placeholder="Temperatura" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="hot">🔥 Quente</SelectItem>
            <SelectItem value="warm">☀️ Morno</SelectItem>
            <SelectItem value="cold">❄️ Frio</SelectItem>
          </SelectContent>
        </Select>

        {/* Stage filter */}
        <Select
          value={filters.stage}
          onValueChange={(value) => setFilters({ ...filters, stage: value })}
        >
          <SelectTrigger className="w-full lg:w-40 bg-slate-50">
            <SelectValue placeholder="Etapa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Etapas</SelectItem>
            <SelectItem value="new">Novo</SelectItem>
            <SelectItem value="contacted">Contatado</SelectItem>
            <SelectItem value="qualified">Qualificado</SelectItem>
            <SelectItem value="scheduled">Agendado</SelectItem>
            <SelectItem value="proposal">Proposta</SelectItem>
            <SelectItem value="closed_won">Venda Ganha</SelectItem>
            <SelectItem value="closed_lost">Venda Perdida</SelectItem>
          </SelectContent>
        </Select>

        {/* Source filter */}
        <Select
          value={filters.source}
          onValueChange={(value) => setFilters({ ...filters, source: value })}
        >
          <SelectTrigger className="w-full lg:w-40 bg-slate-50">
            <SelectValue placeholder="Origem" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Origens</SelectItem>
            <SelectItem value="facebook_lead_ad">Facebook Ads</SelectItem>
            <SelectItem value="messenger">Messenger</SelectItem>
            <SelectItem value="webchat">Webchat</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
          </SelectContent>
        </Select>

        {/* Campaign filter */}
        {campaigns.length > 0 && (
          <Select
            value={filters.campaign}
            onValueChange={(value) => setFilters({ ...filters, campaign: value })}
          >
            <SelectTrigger className="w-full lg:w-48 bg-slate-50">
              <SelectValue placeholder="Campanha" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Campanhas</SelectItem>
              {campaigns.map((campaign) => (
                <SelectItem key={campaign.id} value={campaign.id}>
                  {campaign.campaign_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Active filters */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-500">Filtros ativos:</span>
          
          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              Busca: {filters.search}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => setFilters({ ...filters, search: '' })}
              />
            </Badge>
          )}
          
          {filters.temperature !== 'all' && (
            <Badge variant="secondary" className="gap-1 capitalize">
              {filters.temperature}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => setFilters({ ...filters, temperature: 'all' })}
              />
            </Badge>
          )}
          
          {filters.stage !== 'all' && (
            <Badge variant="secondary" className="gap-1 capitalize">
              {filters.stage.replace('_', ' ')}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => setFilters({ ...filters, stage: 'all' })}
              />
            </Badge>
          )}
          
          {filters.source !== 'all' && (
            <Badge variant="secondary" className="gap-1 capitalize">
              {filters.source.replace('_', ' ')}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => setFilters({ ...filters, source: 'all' })}
              />
            </Badge>
          )}

          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-slate-500 h-7">
            Limpar tudo
          </Button>
        </div>
      )}
    </div>
  );
}