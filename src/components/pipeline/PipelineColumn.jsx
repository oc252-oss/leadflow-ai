import React from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Badge } from "@/components/ui/badge";
import { 
  Phone, 
  Mail, 
  Flame, 
  Sun, 
  Snowflake,
  Clock 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from "@/lib/utils";

const temperatureIcons = {
  hot: Flame,
  warm: Sun,
  cold: Snowflake
};

const stageConfig = {
  new: { color: 'border-t-slate-400', bg: 'bg-slate-50' },
  contacted: { color: 'border-t-blue-500', bg: 'bg-blue-50' },
  qualified: { color: 'border-t-purple-500', bg: 'bg-purple-50' },
  scheduled: { color: 'border-t-amber-500', bg: 'bg-amber-50' },
  proposal: { color: 'border-t-indigo-500', bg: 'bg-indigo-50' },
  closed_won: { color: 'border-t-emerald-500', bg: 'bg-emerald-50' },
  closed_lost: { color: 'border-t-red-500', bg: 'bg-red-50' }
};

export default function PipelineColumn({ stage, leads }) {
  const config = stageConfig[stage] || stageConfig.new;
  const totalValue = leads.reduce((sum, l) => sum + (parseFloat(l.budget_range) || 0), 0);

  return (
    <div className="flex-shrink-0 w-80">
      <div className={cn("rounded-t-lg px-4 py-3 border-t-4", config.color, config.bg)}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 capitalize">
            {stage.replace('_', ' ')}
          </h3>
          <Badge variant="secondary" className="bg-white">
            {leads.length}
          </Badge>
        </div>
        {totalValue > 0 && (
          <p className="text-xs text-slate-500 mt-1">
            ${totalValue.toLocaleString()} potential
          </p>
        )}
      </div>

      <Droppable droppableId={stage}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "min-h-[60vh] p-2 space-y-2 bg-slate-100/50 rounded-b-lg transition-colors",
              snapshot.isDraggingOver && "bg-indigo-50"
            )}
          >
            {leads.map((lead, index) => {
              const TempIcon = temperatureIcons[lead.temperature] || Snowflake;
              
              return (
                <Draggable key={lead.id} draggableId={lead.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={cn(
                        "bg-white rounded-lg p-4 shadow-sm border border-slate-200 cursor-grab active:cursor-grabbing transition-shadow",
                        snapshot.isDragging && "shadow-lg ring-2 ring-indigo-500"
                      )}
                    >
                      <Link 
                        to={createPageUrl('LeadDetail') + `?id=${lead.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="block"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium",
                              lead.temperature === 'hot' ? "bg-gradient-to-br from-orange-400 to-red-500" :
                              lead.temperature === 'warm' ? "bg-gradient-to-br from-amber-400 to-orange-500" :
                              "bg-gradient-to-br from-slate-400 to-slate-500"
                            )}>
                              {lead.name?.charAt(0) || '?'}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900 text-sm hover:text-indigo-600 transition-colors">
                                {lead.name}
                              </p>
                            </div>
                          </div>
                          <div className={cn(
                            "p-1 rounded",
                            lead.temperature === 'hot' ? "bg-red-100 text-red-600" :
                            lead.temperature === 'warm' ? "bg-amber-100 text-amber-600" :
                            "bg-blue-100 text-blue-600"
                          )}>
                            <TempIcon className="w-3.5 h-3.5" />
                          </div>
                        </div>

                        <div className="space-y-1.5 text-xs text-slate-500">
                          {lead.email && (
                            <div className="flex items-center gap-1.5">
                              <Mail className="w-3 h-3" />
                              <span className="truncate">{lead.email}</span>
                            </div>
                          )}
                          {lead.phone && (
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3 h-3" />
                              <span>{lead.phone}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(lead.created_date), { addSuffix: true })}
                          </span>
                          <Badge variant="outline" className="text-xs h-5">
                            {lead.score}
                          </Badge>
                        </div>
                      </Link>
                    </div>
                  )}
                </Draggable>
              );
            })}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}