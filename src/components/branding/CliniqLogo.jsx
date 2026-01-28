import React from 'react';
import { cn } from '@/lib/utils';
import { Activity } from 'lucide-react';

export default function CliniqLogo({ variant = 'full', size = 'md', className }) {
  const sizes = {
    xs: { container: 'h-4', text: 'text-xs', icon: 'w-3 h-3' },
    sm: { container: 'h-5', text: 'text-sm', icon: 'w-4 h-4' },
    md: { container: 'h-6', text: 'text-base', icon: 'w-5 h-5' },
    lg: { container: 'h-8', text: 'text-lg', icon: 'w-6 h-6' }
  };

  const sizeConfig = sizes[size];

  // Icon only variant
  if (variant === 'icon') {
    return (
      <div className={cn(
        'flex items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600',
        sizeConfig.container,
        'aspect-square',
        className
      )}>
        <Activity className={cn(sizeConfig.icon, 'text-white')} />
      </div>
    );
  }

  // Monochrome variant
  if (variant === 'monochrome') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className={cn(
          'flex items-center justify-center rounded-lg bg-slate-800',
          sizeConfig.container,
          'aspect-square'
        )}>
          <Activity className={cn(sizeConfig.icon, 'text-white')} />
        </div>
        <span className={cn('font-bold text-slate-800 tracking-tight', sizeConfig.text)}>
          CLINIQ.AI
        </span>
      </div>
    );
  }

  // Full color variant (default)
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn(
        'flex items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600',
        sizeConfig.container,
        'aspect-square'
      )}>
        <Activity className={cn(sizeConfig.icon, 'text-white')} />
      </div>
      <span className={cn('font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent tracking-tight', sizeConfig.text)}>
        CLINIQ.AI
      </span>
    </div>
  );
}