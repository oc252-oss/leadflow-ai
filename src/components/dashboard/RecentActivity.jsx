import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  UserPlus, 
  MessageSquare, 
  CheckCircle, 
  ArrowRight,
  Zap,
  Star
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from "@/lib/utils";

const activityIcons = {
  lead_created: { icon: UserPlus, color: 'bg-blue-100 text-blue-600' },
  message_sent: { icon: MessageSquare, color: 'bg-violet-100 text-violet-600' },
  stage_changed: { icon: ArrowRight, color: 'bg-amber-100 text-amber-600' },
  qualification_complete: { icon: CheckCircle, color: 'bg-emerald-100 text-emerald-600' },
  score_updated: { icon: Star, color: 'bg-orange-100 text-orange-600' },
  assigned: { icon: Zap, color: 'bg-indigo-100 text-indigo-600' },
};

export default function RecentActivity({ activities = [] }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-slate-900">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Zap className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p>No recent activity</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.slice(0, 8).map((activity) => {
              const config = activityIcons[activity.action] || activityIcons.lead_created;
              const Icon = config.icon;
              
              return (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className={cn("p-2 rounded-lg", config.color.split(' ')[0])}>
                    <Icon className={cn("w-4 h-4", config.color.split(' ')[1])} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-900">
                      {activity.action.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                    {activity.details?.lead_name && (
                      <p className="text-sm text-slate-500 truncate">{activity.details.lead_name}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatDistanceToNow(new Date(activity.created_date), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}