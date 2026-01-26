import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Phone, 
  Mail, 
  MessageSquare, 
  Clock,
  Facebook,
  Globe,
  User,
  Flame,
  Snowflake,
  Sun
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from "@/lib/utils";

const sourceIcons = {
  facebook_lead_ad: Facebook,
  messenger: MessageSquare,
  webchat: Globe,
  manual: User,
  import: User
};

const temperatureConfig = {
  hot: { icon: Flame, color: 'bg-red-100 text-red-600 border-red-200', label: 'Hot' },
  warm: { icon: Sun, color: 'bg-amber-100 text-amber-600 border-amber-200', label: 'Warm' },
  cold: { icon: Snowflake, color: 'bg-blue-100 text-blue-600 border-blue-200', label: 'Cold' }
};

const stageColors = {
  new: 'bg-slate-100 text-slate-600',
  contacted: 'bg-blue-100 text-blue-700',
  qualified: 'bg-purple-100 text-purple-700',
  scheduled: 'bg-amber-100 text-amber-700',
  proposal: 'bg-indigo-100 text-indigo-700',
  closed_won: 'bg-emerald-100 text-emerald-700',
  closed_lost: 'bg-red-100 text-red-700'
};

export default function LeadCard({ lead, compact = false }) {
  const SourceIcon = sourceIcons[lead.source] || User;
  const tempConfig = temperatureConfig[lead.temperature] || temperatureConfig.cold;
  const TempIcon = tempConfig.icon;

  if (compact) {
    return (
      <Link to={createPageUrl('LeadDetail') + `?id=${lead.id}`}>
        <Card className="p-4 hover:shadow-md transition-shadow border-0 shadow-sm cursor-pointer">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-white font-medium",
                lead.temperature === 'hot' ? "bg-gradient-to-br from-orange-400 to-red-500" :
                lead.temperature === 'warm' ? "bg-gradient-to-br from-amber-400 to-orange-500" :
                "bg-gradient-to-br from-slate-400 to-slate-500"
              )}>
                {lead.name?.charAt(0) || '?'}
              </div>
              <div>
                <p className="font-medium text-slate-900">{lead.name}</p>
                <p className="text-sm text-slate-500">{lead.email || lead.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={stageColors[lead.funnel_stage]}>
                {lead.funnel_stage?.replace('_', ' ')}
              </Badge>
              <Badge variant="outline" className={tempConfig.color}>
                <TempIcon className="w-3 h-3 mr-1" />
                {lead.score}
              </Badge>
            </div>
          </div>
        </Card>
      </Link>
    );
  }

  return (
    <Link to={createPageUrl('LeadDetail') + `?id=${lead.id}`}>
      <Card className="p-5 hover:shadow-lg transition-all duration-200 border-0 shadow-sm cursor-pointer group">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center text-white font-semibold text-lg",
              lead.temperature === 'hot' ? "bg-gradient-to-br from-orange-400 to-red-500" :
              lead.temperature === 'warm' ? "bg-gradient-to-br from-amber-400 to-orange-500" :
              "bg-gradient-to-br from-slate-400 to-slate-500"
            )}>
              {lead.name?.charAt(0) || '?'}
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                {lead.name}
              </h3>
              <div className="flex items-center gap-1 text-sm text-slate-500">
                <SourceIcon className="w-3.5 h-3.5" />
                <span className="capitalize">{lead.source?.replace('_', ' ')}</span>
              </div>
            </div>
          </div>
          <Badge variant="outline" className={cn("border", tempConfig.color)}>
            <TempIcon className="w-3 h-3 mr-1" />
            {tempConfig.label} • {lead.score}
          </Badge>
        </div>

        <div className="space-y-2 mb-4">
          {lead.email && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Mail className="w-4 h-4 text-slate-400" />
              {lead.email}
            </div>
          )}
          {lead.phone && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Phone className="w-4 h-4 text-slate-400" />
              {lead.phone}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <Badge className={stageColors[lead.funnel_stage]}>
            {lead.funnel_stage?.replace('_', ' ')}
          </Badge>
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Clock className="w-3 h-3" />
            {formatDistanceToNow(new Date(lead.created_date), { addSuffix: true })}
          </div>
        </div>
      </Card>
    </Link>
  );
}