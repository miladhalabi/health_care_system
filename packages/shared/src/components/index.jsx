import React from 'react';
import { cn } from '../utils/index.js';

export const Button = ({ className, variant = 'primary', loading, children, ...props }) => {
  const variants = {
    primary: 'btn-nhr-primary',
    ghost: 'btn-nhr bg-transparent hover:bg-surface-bg text-content-muted',
    outline: 'btn-nhr bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-content-inverse',
    danger: 'btn-nhr bg-error text-content-inverse hover:opacity-90',
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
      {label && <label className="text-xs font-black text-content-muted uppercase tracking-widest mr-2">{label}</label>}
      <input 
        className={cn('input-nhr w-full', error && 'border-error ring-4 ring-error/10', className)} 
        {...props}
      />
      {error && <p className="text-[10px] font-bold text-error mr-2">{error}</p>}
    </div>
  );
};

export const Badge = ({ children, variant = 'stone', className }) => {
  const variants = {
    stone: 'bg-surface-bg text-content-muted border border-border-main',
    primary: 'bg-primary/10 text-primary border border-primary/20',
    success: 'bg-success/10 text-success border border-success/20',
    warning: 'bg-warning/10 text-warning border border-warning/20',
    error: 'bg-error/10 text-error border border-error/20',
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
export * from './ThemeToggle.jsx';



