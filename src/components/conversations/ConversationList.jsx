import React from 'react';
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  Bot, 
  User,
  Clock
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from "@/lib/utils";

const statusConfig = {
  bot_active: { label: 'AI Active', color: 'bg-violet-100 text-violet-700', icon: Bot },
  human_active: { label: 'Agent', color: 'bg-indigo-100 text-indigo-700', icon: User },
  waiting_response: { label: 'Waiting', color: 'bg-amber-100 text-amber-700', icon: Clock },
  closed: { label: 'Closed', color: 'bg-slate-100 text-slate-700', icon: MessageSquare }
};

export default function ConversationList({ conversations, leads, selectedId, onSelect }) {
  const getLeadForConversation = (conv) => {
    return leads.find(l => l.id === conv.lead_id);
  };

  return (
    <div className="divide-y divide-slate-100">
      {conversations.length === 0 ? (
        <div className="p-8 text-center text-slate-500">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p>No conversations yet</p>
        </div>
      ) : (
        conversations.map((conv) => {
          const lead = getLeadForConversation(conv);
          const config = statusConfig[conv.status] || statusConfig.closed;
          const StatusIcon = config.icon;

          return (
            <button
              key={conv.id}
              onClick={() => onSelect(conv)}
              className={cn(
                "w-full p-4 text-left hover:bg-slate-50 transition-colors",
                selectedId === conv.id && "bg-indigo-50 border-l-2 border-l-indigo-600"
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-white font-medium flex-shrink-0",
                  lead?.temperature === 'hot' ? "bg-gradient-to-br from-orange-400 to-red-500" :
                  lead?.temperature === 'warm' ? "bg-gradient-to-br from-amber-400 to-orange-500" :
                  "bg-gradient-to-br from-slate-400 to-slate-500"
                )}>
                  {lead?.name?.charAt(0) || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-slate-900 truncate">
                      {lead?.name || 'Unknown Lead'}
                    </p>
                    {conv.unread_count > 0 && (
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 truncate mb-2">
                    {conv.last_message_preview || 'No messages'}
                  </p>
                  <div className="flex items-center justify-between">
                    <Badge className={cn("text-xs", config.color)}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {config.label}
                    </Badge>
                    {conv.last_message_at && (
                      <span className="text-xs text-slate-400">
                        {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })
      )}
    </div>
  );
}