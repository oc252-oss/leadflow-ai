import React from 'react';
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatsCard({ 
  title, 
  value, 
  change, 
  changeType = 'neutral',
  icon: Icon,
  iconColor = 'bg-indigo-100 text-indigo-600',
  subtitle
}) {
  return (
    <Card className="p-6 bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-3xl font-bold text-slate-900">{value}</p>
          {(change !== undefined || subtitle) && (
            <div className="flex items-center gap-2">
              {change !== undefined && (
                <span className={cn(
                  "flex items-center text-sm font-medium",
                  changeType === 'positive' && "text-emerald-600",
                  changeType === 'negative' && "text-red-600",
                  changeType === 'neutral' && "text-slate-500"
                )}>
                  {changeType === 'positive' && <TrendingUp className="w-4 h-4 mr-1" />}
                  {changeType === 'negative' && <TrendingDown className="w-4 h-4 mr-1" />}
                  {change}
                </span>
              )}
              {subtitle && <span className="text-sm text-slate-500">{subtitle}</span>}
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn("p-3 rounded-xl", iconColor.split(' ')[0])}>
            <Icon className={cn("w-6 h-6", iconColor.split(' ')[1])} />
          </div>
        )}
      </div>
    </Card>
  );
}