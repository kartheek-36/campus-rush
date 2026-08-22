import React from 'react';

export const LocationCardSkeleton: React.FC = () => {
  return (
    <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-card animate-pulse space-y-4">
      <div className="flex justify-between items-start">
        <div className="space-y-2 flex-1">
          <div className="h-5 bg-slate-200 rounded-md w-3/4" />
          <div className="h-3.5 bg-slate-100 rounded-md w-1/2" />
        </div>
        <div className="h-6 bg-slate-200 rounded-full w-24" />
      </div>
      <div className="grid grid-cols-2 gap-2 pt-2">
        <div className="h-4 bg-slate-100 rounded-md" />
        <div className="h-4 bg-slate-100 rounded-md" />
      </div>
      <div className="flex justify-between items-center pt-2 border-t border-slate-100">
        <div className="h-3 bg-slate-100 rounded w-20" />
        <div className="h-8 bg-slate-200 rounded-xl w-24" />
      </div>
    </div>
  );
};

export const DetailSkeleton: React.FC = () => {
  return (
    <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-card animate-pulse space-y-6">
      <div className="h-8 bg-slate-200 rounded-lg w-2/3" />
      <div className="h-4 bg-slate-100 rounded-md w-1/3" />
      <div className="grid grid-cols-3 gap-4">
        <div className="h-20 bg-slate-100 rounded-xl" />
        <div className="h-20 bg-slate-100 rounded-xl" />
        <div className="h-20 bg-slate-100 rounded-xl" />
      </div>
      <div className="h-32 bg-slate-100 rounded-xl" />
    </div>
  );
};
