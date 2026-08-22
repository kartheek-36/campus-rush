import React from 'react';
import { ConfidenceLevel } from '../../types';
import { ShieldCheck, ShieldAlert, ShieldQuestion } from 'lucide-react';

interface ConfidenceBadgeProps {
  confidence?: ConfidenceLevel;
  reportCount?: number;
  showIcon?: boolean;
  className?: string;
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({
  confidence = 'NONE',
  reportCount = 0,
  showIcon = true,
  className = '',
}) => {
  const getConfig = () => {
    switch (confidence) {
      case 'HIGH':
        return {
          label: 'High confidence',
          color: 'text-indigo-700 bg-indigo-50 border-indigo-200',
          icon: ShieldCheck,
          detail: reportCount ? `${reportCount} recent reports` : 'Verified recent data',
        };
      case 'MEDIUM':
        return {
          label: 'Medium confidence',
          color: 'text-sky-700 bg-sky-50 border-sky-200',
          icon: ShieldCheck,
          detail: reportCount ? `${reportCount} recent reports` : 'Moderate data',
        };
      case 'LOW':
        return {
          label: 'Low confidence',
          color: 'text-amber-700 bg-amber-50 border-amber-200',
          icon: ShieldAlert,
          detail: '1 recent report',
        };
      case 'NONE':
      default:
        return {
          label: 'No recent reports',
          color: 'text-slate-600 bg-slate-100 border-slate-200',
          icon: ShieldQuestion,
          detail: 'Needs report',
        };
    }
  };

  const config = getConfig();
  const IconComponent = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border ${config.color} ${className}`}
      title={config.detail}
    >
      {showIcon && <IconComponent className="w-3.5 h-3.5" />}
      <span>{config.label}</span>
      {reportCount > 0 && (
        <span className="opacity-70 text-[10px]">({reportCount})</span>
      )}
    </span>
  );
};
