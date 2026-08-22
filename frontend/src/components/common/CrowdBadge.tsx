import React from 'react';
import { CrowdLevel } from '../../types';

interface CrowdBadgeProps {
  level?: CrowdLevel;
  size?: 'sm' | 'md' | 'lg';
  showSubtext?: boolean;
  className?: string;
}

export const CrowdBadge: React.FC<CrowdBadgeProps> = ({
  level = 'UNKNOWN',
  size = 'md',
  showSubtext = false,
  className = '',
}) => {
  const getConfig = () => {
    switch (level) {
      case 'EMPTY':
        return {
          label: 'EMPTY',
          subtext: 'Practically empty',
          bg: 'text-emerald-700',
          dot: 'bg-emerald-500',
        };
      case 'LOW':
        return {
          label: 'LOW',
          subtext: 'Plenty of space',
          bg: 'text-emerald-700',
          dot: 'bg-emerald-600',
        };
      case 'MEDIUM':
        return {
          label: 'MEDIUM',
          subtext: 'Moderate crowd',
          bg: 'text-amber-700',
          dot: 'bg-amber-500',
        };
      case 'HIGH':
        return {
          label: 'HIGH',
          subtext: 'Busy / Low seating',
          bg: 'text-red-700',
          dot: 'bg-orange-600',
        };
      case 'VERY_HIGH':
        return {
          label: 'VERY HIGH',
          subtext: 'Peak rush / Long queues',
          bg: 'text-red-800',
          dot: 'bg-rose-600 animate-pulse',
        };
      case 'UNKNOWN':
      default:
        return {
          label: 'Crowd unavailable',
          subtext: 'Not enough recent data',
          bg: 'text-slate-500',
          dot: 'bg-slate-400',
        };
    }
  };

  const config = getConfig();

  const sizeClasses = {
    sm: 'text-xs font-medium gap-1.5',
    md: 'text-xs font-medium gap-1.5',
    lg: 'text-sm font-medium gap-2',
  };

  return (
    <div className={`inline-flex flex-col items-start ${className}`}>
      <span
        className={`inline-flex items-center ${sizeClasses[size]} ${config.bg}`}
      >
        <span className={`w-2 h-2 rounded-full ${config.dot}`} />
        <span>{config.label}</span>
      </span>
      {showSubtext && config.subtext && (
        <span className="text-[11px] text-slate-500 mt-1 pl-1">
          {config.subtext}
        </span>
      )}
    </div>
  );
};
