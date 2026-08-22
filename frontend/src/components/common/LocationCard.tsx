import React, { useEffect, useState } from 'react';
import { CrowdEstimateResponse, Location, CampusOrigin } from '../../types';
import { useApp } from '../../context/AppContext';
import { locationService } from '../../services/locationService';
import { crowdService } from '../../services/crowdService';
import { CrowdBadge } from './CrowdBadge';
import { ArrowRight, BookOpen, Cpu, Flag, MapPin, Printer, Utensils } from 'lucide-react';

interface LocationCardProps {
  location: Location;
  currentOrigin?: CampusOrigin;
  onViewDetails?: (locationId: string) => void;
  onQuickReport?: (locationId: string) => void;
  onViewMap?: (locationId: string) => void;
  distanceInfo?: { distanceMeters: number; walkingMinutes: number } | null;
  className?: string;
}

export const LocationCard: React.FC<LocationCardProps> = ({ location, currentOrigin, onViewDetails, onQuickReport, onViewMap, distanceInfo, className = '' }) => {
  const { origin: contextOrigin, navigateTo, openReportModal } = useApp();
  const origin = currentOrigin || contextOrigin;
  const localDistance = locationService.getDistanceAndWalkingTime(origin, location.id);
  const distanceMeters = distanceInfo === undefined ? localDistance.distanceMeters : distanceInfo?.distanceMeters ?? null;
  const walkingMinutes = distanceInfo === undefined ? localDistance.walkingMinutes : distanceInfo?.walkingMinutes ?? null;
  const [crowdEstimate, setCrowdEstimate] = useState<CrowdEstimateResponse | null>(null);
  const [crowdError, setCrowdError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setCrowdEstimate(null);
    setCrowdError(false);
    void crowdService.getCrowdEstimate(location.id)
      .then((estimate) => {
        if (!cancelled) setCrowdEstimate(estimate);
      })
      .catch(() => {
        if (!cancelled) setCrowdError(true);
      });
    return () => { cancelled = true; };
  }, [location.id]);

  const crowd = crowdEstimate?.crowdLevel || 'UNKNOWN';
  const reportAge = crowdEstimate?.lastUpdated ? Math.max(0, Math.floor((Date.now() - new Date(crowdEstimate.lastUpdated).getTime()) / 60000)) : null;
  const category: Partial<Record<Location['category'], { label: string; icon: typeof MapPin }>> = {
    FOOD: { label: 'Food', icon: Utensils },
    STUDY: { label: 'Library', icon: BookOpen },
    LAB: { label: 'Lab', icon: Cpu },
    PHOTOCOPY: { label: 'Photocopy', icon: Printer },
  };
  const categoryMeta = category[location.category] || { label: location.category, icon: MapPin };
  const CategoryIcon = categoryMeta.icon;
  const viewDetails = () => onViewDetails ? onViewDetails(location.id) : navigateTo('details', location.id);
  const report = (event: React.MouseEvent) => {
    event.stopPropagation();
    onQuickReport ? onQuickReport(location.id) : openReportModal(location.id);
  };
  const viewMap = (event: React.MouseEvent) => {
    event.stopPropagation();
    onViewMap?.(location.id);
  };

  return (
    <div onClick={viewDetails} className={`group border-b border-slate-200/80 py-4 cursor-pointer hover:bg-white transition-colors ${className}`}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[#EEF0FF] flex items-center justify-center shrink-0">
          <CategoryIcon className="w-4 h-4 text-[#5B5CE2]" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-medium text-slate-900 group-hover:text-[#5B5CE2] transition-colors truncate">{location.name}</h3>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <span>{categoryMeta.label}</span><span>·</span>
            <span className="truncate">{distanceMeters !== null ? `${distanceMeters} m` : 'Choose your location'}</span>
            <span>·</span>
            <span className="truncate">{walkingMinutes !== null ? `Estimated walk · ${walkingMinutes} min` : 'Distance starts after location selection'}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {crowdError ? <span className="text-xs text-red-600">Unable to load crowd information.</span> : <div><CrowdBadge level={crowd} size="sm" /><p className="text-[10px] text-slate-400 mt-1">{reportAge === null ? 'No recent data' : reportAge === 0 ? 'Reported just now' : `Reported ${reportAge} min ago`}</p></div>}
          <button onClick={report} title="Report crowd" className="hidden sm:block text-slate-300 hover:text-[#5B5CE2]"><Flag className="w-3.5 h-3.5" /></button>
          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#5B5CE2] transition-colors" />
        </div>
      </div>
      <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-2 pl-12">
        <MapPin className="w-3 h-3" /><span className="truncate">{location.building || 'Campus location'}</span>
      </div>
      {onViewMap && <button type="button" onClick={viewMap} className="ml-12 mt-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800">View on map</button>}
    </div>
  );
};
