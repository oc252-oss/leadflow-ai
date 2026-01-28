import React from 'react';
import { cn } from '@/lib/utils';

export default function PoweredBy({ className, variant = 'default' }) {
  const variants = {
    default: 'text-xs text-slate-400',
    dashboard: 'text-[11px] text-slate-400',
    message: 'text-[10px] text-slate-500 italic'
  };

  return (
    <div className={cn('flex items-center gap-1', variants[variant], className)}>
      <span>powered by</span>
      <span className="font-semibold text-slate-600">CLINIQ.AI</span>
    </div>
  );
}