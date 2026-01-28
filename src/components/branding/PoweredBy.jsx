import React from 'react';
import { cn } from '@/lib/utils';
import CliniqLogo from './CliniqLogo';

export default function PoweredBy({ className, variant = 'default', showLogo = false }) {
  const variants = {
    default: 'text-xs text-slate-400',
    dashboard: 'text-[11px] text-slate-400',
    message: 'text-[10px] text-slate-500 italic'
  };

  if (showLogo) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <span className={variants[variant]}>powered by</span>
        <CliniqLogo variant="icon" size="xs" />
        <span className={cn('font-semibold text-slate-600', variants[variant])}>CLINIQ.AI</span>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-1', variants[variant], className)}>
      <span>powered by</span>
      <span className="font-semibold text-slate-600">CLINIQ.AI</span>
    </div>
  );
}