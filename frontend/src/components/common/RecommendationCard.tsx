import React from 'react';
import { Recommendation, CampusOrigin } from '../../types';
import { useApp } from '../../context/AppContext';
import { CrowdBadge } from './CrowdBadge';
import { ConfidenceBadge } from './ConfidenceBadge';
import { 
  Sparkles, 
  Clock, 
  Hourglass, 
  MapPin, 
  ArrowUpRight, 
  CheckCircle2,
  Navigation
} from 'lucide-react';

interface RecommendationCardProps {
  recommendation: Recommendation | null;
  origin: CampusOrigin;
  onGoThere?: (locationId: string) => void;
  className?: string;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  origin,
  onGoThere,
  className = '',
}) => {
  const { navigateTo, addToast } = useApp();

  if (!recommendation) {
    return (
      <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center">
        <Sparkles className="w-8 h-8 text-[#5B5CE2] mx-auto mb-2" />
        <h3 className="text-base font-bold text-slate-800">No recommendations available yet.</h3>
        <p className="text-xs text-slate-500 mt-1">More campus data is needed to generate reliable recommendations.</p>
      </div>
    );
  }

  const { location, distanceMeters, walkingTimeMinutes, expectedWaitMinutes, score, reason } = recommendation;
  const currentCrowd = location.crowdEstimate?.currentCrowd || 'UNKNOWN';
  const confidence = location.crowdEstimate?.confidence || 'NONE';

  const handleGoThere = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onGoThere) {
      onGoThere(location.id);
    } else {
      addToast({
        title: `Heading to ${location.name} 📍`,
        message: `Fastest route: ~${walkingTimeMinutes} min walk from ${origin}.`,
        type: 'info',
      });
      navigateTo('details', location.id);
    }
  };

  return (
    <div
      className={`relative overflow-hidden bg-white rounded-2xl border border-slate-200 p-6 shadow-sm transition-all duration-200 ${className}`}
    >
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#EEF0FF] text-[#5B5CE2] rounded-full text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Best option for you</span>
        </div>

        <div className="inline-flex items-center gap-1 text-xs text-slate-500 bg-white/80 px-2.5 py-1 rounded-lg border border-slate-200">
          <span className="font-medium text-slate-700">Origin:</span>
          <span className="font-semibold text-indigo-700">{origin}</span>
        </div>
      </div>

      {/* Main Location Info */}
      <div className="mb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {location.name}
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{location.building}</span>
              {location.floor && <span>• {location.floor}</span>}
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-2xl font-black text-indigo-600">{score}</span>
            <span className="text-xs text-slate-400 font-semibold">/100</span>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Match Score</p>
          </div>
        </div>
      </div>

      {/* Rationale Sentence */}
      <p className="text-xs sm:text-sm text-slate-600 bg-white p-3 rounded-xl border border-slate-200/80 mb-4 leading-relaxed flex items-start gap-2">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <span>{reason}</span>
      </p>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
        {/* Crowd status */}
        <div className="p-3 bg-white rounded-xl border border-slate-200/90 shadow-card flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Crowd Status
          </span>
          <div className="mt-1.5">
            <CrowdBadge level={currentCrowd} size="md" />
          </div>
        </div>

        {/* Confidence */}
        <div className="p-3 bg-white rounded-xl border border-slate-200/90 shadow-card flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Data Confidence
          </span>
          <div className="mt-1.5">
            <ConfidenceBadge confidence={confidence} reportCount={location.crowdEstimate?.reportCount} />
          </div>
        </div>

        {/* Walking time & distance */}
        <div className="p-3 bg-white rounded-xl border border-slate-200/90 shadow-card flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" /> Walk Time
          </span>
          <div className="mt-1">
            {walkingTimeMinutes !== null && distanceMeters !== null ? <>
              <span className="text-base font-bold text-slate-900">{walkingTimeMinutes} min</span>
              <span className="text-xs text-slate-500 ml-1">({distanceMeters}m)</span>
            </> : <span className="text-sm font-semibold text-slate-500">Unavailable</span>}
          </div>
        </div>

        {/* Expected wait */}
        <div className="p-3 bg-white rounded-xl border border-slate-200/90 shadow-card flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Hourglass className="w-3.5 h-3.5 text-slate-400" /> Expected Wait
          </span>
          <div className="mt-1">
            <span className="text-base font-bold text-slate-900">
              {expectedWaitMinutes !== null ? `~${expectedWaitMinutes} mins` : 'Minimal / Unknown'}
            </span>
          </div>
        </div>
      </div>

      {/* Primary Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <button
          onClick={handleGoThere}
          className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold rounded-xl shadow-md transition-all active:scale-[0.99]"
        >
          <Navigation className="w-4 h-4 fill-white" />
          <span>Go there</span>
        </button>

        <button
          onClick={() => navigateTo('details', location.id)}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-3 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl border border-slate-200 shadow-sm transition"
        >
          <span>View details</span>
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
