import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { locationService } from '../services/locationService';
import { crowdService } from '../services/crowdService';
import { CrowdEstimateResponse } from '../types';
import { predictionService } from '../services/predictionService';
import { CrowdBadge } from '../components/common/CrowdBadge';
import { RecentCrowdReports } from '../components/common/RecentCrowdReports';
import { ConfidenceBadge } from '../components/common/ConfidenceBadge';
import { MapPlaceholder } from '../components/common/MapPlaceholder';
import { 
  Clock, 
  Footprints, 
  Hourglass, 
  PlusCircle, 
  ArrowLeft, 
  TrendingUp, 
  CheckCircle, 
  Info,
  Building,
  Layers
} from 'lucide-react';

export const LocationDetailsPage: React.FC = () => {
  const { 
    selectedLocationId, 
    origin, 
    currentCoordinates,
    navigateTo, 
    openReportModal, 
    locations 
  } = useApp();
  const [crowdEstimate, setCrowdEstimate] = useState<CrowdEstimateResponse | null>(null);
  const [bestTime, setBestTime] = useState<Awaited<ReturnType<typeof crowdService.getBestTime>> | null>(null);
  const [crowdError, setCrowdError] = useState(false);

  const location = useMemo(() => {
    if (!selectedLocationId) return locations[0];
    return locationService.getLocationById(selectedLocationId) || locations[0];
  }, [selectedLocationId, locations]);

  const recentReports = useMemo(() => {
    return crowdService.getReports(location.id);
  }, [location.id, locations]);

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
  }, [location.id, locations]);

  useEffect(() => {
    let cancelled = false;
    void crowdService.getBestTime(location.id).then((result) => { if (!cancelled) setBestTime(result); }).catch(() => { if (!cancelled) setBestTime(null); });
    return () => { cancelled = true; };
  }, [location.id, locations]);

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'visible') {
        setCrowdError(false);
        void crowdService.getCrowdEstimate(location.id).then(setCrowdEstimate).catch(() => setCrowdError(true));
        void crowdService.getBestTime(location.id).then(setBestTime).catch(() => setBestTime(null));
      }
    };
    const timer = window.setInterval(refresh, 30000);
    document.addEventListener('visibilitychange', refresh);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', refresh); };
  }, [location.id]);

  const prediction = useMemo(() => {
    return predictionService.getPrediction(location.id);
  }, [location.id]);

  const { distanceMeters, walkingMinutes } = locationService.getDistanceAndWalkingTime(
    origin,
    location.id
  );

  const currentCrowd = crowdEstimate?.crowdLevel || 'UNKNOWN';
  const recentReportCount = crowdEstimate?.reportCount ?? recentReports.length;
  const confidence = crowdEstimate?.confidence === 'MODERATE' ? 'MEDIUM' : crowdEstimate?.confidence === 'UNKNOWN' ? 'NONE' : crowdEstimate?.confidence || 'NONE';
  const lastUpdated = crowdEstimate?.lastUpdated;
  const lastReportAt = crowdEstimate?.lastReportAt;
  const reportedAgo = lastUpdated ? `${Math.max(0, Math.floor((Date.now() - new Date(lastUpdated).getTime()) / 60000))} min ago` : 'No recent data';
  const expectedWait = null;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Back button & Category */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigateTo('explore')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Explore</span>
        </button>

        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full uppercase tracking-wider">
          {location.category} Facility
        </span>
      </div>

      {/* Main Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-card space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {location.name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium mt-2">
              <span className="flex items-center gap-1">
                <Building className="w-4 h-4 text-slate-400" />
                <span>{location.building}</span>
              </span>
              {location.floor && (
                <span className="flex items-center gap-1">
                  <Layers className="w-4 h-4 text-slate-400" />
                  <span>{location.floor}</span>
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>{location.openingHours}</span>
              </span>
            </div>
          </div>

          {/* Report CTA */}
          <button
            onClick={() => openReportModal(location.id)}
            className="inline-flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold rounded-xl shadow-md transition-all self-start md:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Report Crowd Here</span>
          </button>
        </div>

        {/* Live Status Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* Crowd Status */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Current Crowd
            </span>
            <div className="mt-2">
              {crowdError ? <p className="text-sm text-red-600">Unable to load crowd information.</p> : <CrowdBadge level={currentCrowd} size="lg" showSubtext />}
            </div>
          </div>

          {/* Confidence */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Data Confidence
            </span>
            <div className="mt-2">
              <ConfidenceBadge confidence={confidence} />
              <p className="text-[11px] text-slate-500 mt-1">
                {crowdError ? 'Confidence unavailable' : reportedAgo}
              </p>
            </div>
          </div>

          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex flex-col justify-between">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Expected Crowd</span>
            <div className="mt-2"><CrowdBadge level={crowdEstimate?.expected?.expectedCrowd || 'UNKNOWN'} size="lg" showSubtext /><p className="text-[11px] text-emerald-800 mt-1">{crowdEstimate?.expected?.reason || 'Insufficient schedule data.'}</p></div>
          </div>

          {/* Distance from current origin */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Footprints className="w-3.5 h-3.5 text-slate-400" /> Walk From {origin}
            </span>
            <div className="mt-1">
              <p className="text-xl font-black text-slate-900">{walkingMinutes} min</p>
              <p className="text-[11px] text-slate-500">~{distanceMeters} meters away</p>
            </div>
          </div>

          {/* Expected Wait Time */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Hourglass className="w-3.5 h-3.5 text-slate-400" /> Expected Wait
            </span>
            <div className="mt-1">
              <p className="text-xl font-black text-slate-900">
                {expectedWait !== null && expectedWait !== undefined ? `~${expectedWait} min` : 'Unknown / Zero'}
              </p>
              <p className="text-[11px] text-slate-500">Based on recent flow</p>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-slate-600 leading-relaxed pt-2">
          {location.description}
        </p>

        {/* Amenities / Facilities */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Available Amenities
          </h3>
          <div className="flex flex-wrap gap-2">
            {(location.amenities || []).map((amenity) => (
              <span
                key={amenity}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 rounded-xl text-xs font-medium border border-slate-200"
              >
                <CheckCircle className="w-3.5 h-3.5 text-indigo-600" />
                <span>{amenity}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Two Column Layout: Recent Trend vs schedule guidance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Section 1: Recent Trend Section */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">Recent Crowd Reports</h2>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
              {recentReportCount} {recentReportCount === 1 ? 'report' : 'reports'}
            </span>
          </div>

          <RecentCrowdReports locationId={location.id} lastReportAt={lastReportAt} onReport={() => openReportModal(location.id)} />
        </div>

        {/* Section 2: Best time guidance */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-card space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                <h2 className="text-base font-bold text-slate-900">Best time to visit</h2>
              </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {bestTime?.source === 'HISTORICAL_DATA' || bestTime?.source === 'RECENT_REPORTS_AND_HISTORICAL_DATA' ? 'Previous crowd reports' : bestTime?.source === 'RECENT_REPORTS_AND_SCHEDULE' ? 'Recent reports + campus schedule' : 'Campus schedule'}
              </span>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200/80 text-center space-y-3">
              <h4 className="text-sm font-bold text-slate-800">{bestTime?.recommendedTime || 'Best time unavailable'}</h4>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">Expected crowd: {bestTime?.expectedCrowd || 'UNKNOWN'}</p>
              {bestTime?.currentCrowd && bestTime.currentCrowd !== 'UNKNOWN' && <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">Current crowd: {bestTime.currentCrowd}{bestTime.reportedAt ? ` · reported ${Math.max(0, Math.floor((Date.now() - new Date(bestTime.reportedAt).getTime()) / 60000))} min ago` : ''}</p>}
              {bestTime?.confidence && <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">Confidence: {bestTime.confidence}</p>}
              {bestTime?.trend && bestTime.trend !== 'UNKNOWN' && <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">Trend: {bestTime.trend}</p>}
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">{bestTime?.reason || prediction.message}</p>
            </div>
          </div>

          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-[11px] text-amber-800 flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Decisions rely exclusively on verified student reports.</span>
          </div>
        </div>

      </div>

      {/* Map Node Visualization */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-card space-y-3">
        <h3 className="text-base font-bold text-slate-900">Campus Coordinate Position</h3>
        <MapPlaceholder
          locations={[location]}
          currentOrigin={origin}
          currentCoordinates={currentCoordinates}
          selectedLocationId={location.id}
          height="h-64"
        />
      </div>
    </div>
  );
};
