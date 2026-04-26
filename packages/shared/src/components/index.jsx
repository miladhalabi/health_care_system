import React from 'react';
import { cn } from '../utils/index.js';

export const Button = ({ className, variant = 'primary', loading, children, ...props }) => {
  const variants = {
    primary: 'btn-nhr-primary',
    ghost: 'btn-nhr bg-transparent hover:bg-stone-100 text-stone-500',
    outline: 'btn-nhr bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-white',
    danger: 'btn-nhr bg-rose-500 text-white hover:bg-rose-600',
  };

  return (
    <button 
      className={cn(variants[variant], loading && 'opacity-70 pointer-events-none', className)} 
      disabled={loading}
      {...props}
    >
      {loading ? <span className="loading loading-spinner loading-sm"></span> : children}
    </button>
  );
};

export const Card = ({ className, children, ...props }) => {
  return (
    <div className={cn('card-nhr p-8', className)} {...props}>
      {children}
    </div>
  );
};

export const Input = ({ label, error, className, ...props }) => {
  return (
    <div className="space-y-2 w-full">
      {label && <label className="text-xs font-black text-stone-500 uppercase tracking-widest mr-2">{label}</label>}
      <input 
        className={cn('input-nhr w-full', error && 'border-rose-500 ring-4 ring-rose-500/10', className)} 
        {...props}
      />
      {error && <p className="text-[10px] font-bold text-rose-500 mr-2">{error}</p>}
    </div>
  );
};

export const Badge = ({ children, variant = 'stone', className }) => {
  const variants = {
    stone: 'bg-stone-100 text-stone-500',
    primary: 'bg-primary/10 text-primary',
    success: 'bg-emerald-50 text-emerald-600',
    warning: 'bg-amber-50 text-amber-600',
    error: 'bg-rose-50 text-rose-600',
  };

  return (
    <span className={cn('badge-nhr', variants[variant], className)}>
      {children}
    </span>
  );
};

export const ReliabilityBadge = ({ score, className }) => {
  const getReliabilityData = (s) => {
    if (s >= 90) return { label: 'مثالي', variant: 'success' };
    if (s >= 75) return { label: 'ملتزم', variant: 'primary' };
    if (s >= 50) return { label: 'متوسط', variant: 'warning' };
    return { label: 'ضعيف', variant: 'error' };
  };

  const { label, variant } = getReliabilityData(score);

  return (
    <Badge variant={variant} className={cn('gap-1.5', className)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
      {label}
    </Badge>
  );
};

export { default as ErrorBoundary } from './ErrorBoundary.jsx';
export { default as TimeSlotPicker } from './TimeSlotPicker.jsx';
export { default as Skeleton } from './Skeleton.jsx';
export * from './PortalLayout.jsx';



