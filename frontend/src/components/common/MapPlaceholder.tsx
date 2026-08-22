import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CrowdMapItem, CurrentLocation, Location, CampusOrigin } from '../../types';
import { CrowdBadge } from './CrowdBadge';
import { BestTimeResponse } from '../../types';

interface MapPlaceholderProps {
  locations?: Location[];
  currentOrigin?: CampusOrigin;
  selectedLocationId?: string | null;
  onSelectLocation?: (locationId: string) => void;
  onViewDetails?: (locationId: string) => void;
  className?: string;
  height?: string;
  crowdMap?: CrowdMapItem[];
  onReportCrowd?: (locationId: string) => void;
  onBook?: (locationId: string) => void;
  bestTime?: BestTimeResponse | null;
  currentCoordinates?: CurrentLocation | null;
}

const crowdColor = (level: CrowdMapItem['crowdLevel']) => ({
  EMPTY: '#16a34a', LOW: '#16a34a', MEDIUM: '#f59e0b', HIGH: '#dc2626', VERY_HIGH: '#7f1d1d', UNKNOWN: '#94a3b8',
}[level]);

const markerIcon = (level: CrowdMapItem['crowdLevel']) => L.divIcon({
  className: 'campus-crowd-marker',
  html: `<span style="background:${crowdColor(level)}"></span>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

export const MapPlaceholder: React.FC<MapPlaceholderProps> = ({
  locations = [], currentOrigin = 'CSE Block', selectedLocationId, onSelectLocation,
  onViewDetails, className = '', height = 'h-80', crowdMap = [], onReportCrowd, onBook, bestTime, currentCoordinates,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef(new Map<string, L.Marker>());
  const currentMarkerRef = useRef<L.CircleMarker | null>(null);
  const [mapError, setMapError] = useState(false);
  const crowdById = useMemo(() => new Map(crowdMap.map((item) => [item.locationId, item])), [crowdMap]);
  const selectedLoc = locations.find((location) => location.id === selectedLocationId);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    try {
      const map = L.map(containerRef.current, { zoomControl: true, attributionControl: true });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors', maxZoom: 19 }).addTo(map);
      mapRef.current = map;
    } catch {
      setMapError(true);
    }
    return () => { mapRef.current?.remove(); mapRef.current = null; markersRef.current.clear(); currentMarkerRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const points = locations.filter((location): location is Location & { latitude: number; longitude: number } => typeof location.latitude === 'number' && typeof location.longitude === 'number');
    if (!map || !points.length) return;
    const bounds = L.latLngBounds(points.map((location) => [location.latitude, location.longitude] as [number, number]));
    map.fitBounds(bounds.pad(0.15), { animate: false });
    markersRef.current.forEach((marker, id) => { if (!points.some((location) => location.id === id)) marker.remove(); });
    points.forEach((location) => {
      const level = crowdById.get(location.id)?.crowdLevel || 'UNKNOWN';
      const existing = markersRef.current.get(location.id);
      const marker = existing || L.marker([location.latitude, location.longitude], { icon: markerIcon(level), title: location.name }).addTo(map);
      marker.setIcon(markerIcon(level));
      marker.off('click').on('click', () => onSelectLocation?.(location.id));
      markersRef.current.set(location.id, marker);
    });
    currentMarkerRef.current?.remove();
    if (currentCoordinates && Number.isFinite(currentCoordinates.latitude) && Number.isFinite(currentCoordinates.longitude)) {
      currentMarkerRef.current = L.circleMarker([currentCoordinates.latitude, currentCoordinates.longitude], { radius: 7, color: '#1d4ed8', fillColor: '#2563eb', fillOpacity: 1, weight: 3 }).addTo(map);
      currentMarkerRef.current.bindTooltip('You are here', { direction: 'top', offset: [0, -8] });
    } else {
      currentMarkerRef.current = null;
    }
  }, [locations, crowdById, onSelectLocation, currentCoordinates]);

  useEffect(() => {
    const marker = selectedLocationId ? markersRef.current.get(selectedLocationId) : null;
    const location = locations.find((item) => item.id === selectedLocationId);
    if (marker && typeof location?.latitude === 'number' && typeof location.longitude === 'number') {
      mapRef.current?.setView([location.latitude, location.longitude], Math.max(mapRef.current.getZoom(), 17));
      marker.openPopup();
    }
  }, [selectedLocationId, locations]);

  return <div className={`relative w-full ${height} rounded-2xl border border-slate-200 overflow-hidden shadow-card ${className}`}>
    <div ref={containerRef} className="w-full h-full" />
    {mapError && <div className="absolute inset-0 bg-white/90 flex items-center justify-center text-sm text-red-600">Unable to load map. <button type="button" onClick={() => window.location.reload()} className="ml-1 font-semibold underline">Try again</button></div>}
    {selectedLoc && <div className="absolute left-3 right-3 bottom-3 sm:left-auto sm:right-3 sm:w-64 bg-white rounded-xl border border-slate-200 shadow-lg p-3 z-[1000]">
      <p className="font-bold text-sm text-slate-900">{selectedLoc.name}</p>
      <CrowdBadge level={crowdById.get(selectedLoc.id)?.crowdLevel || 'UNKNOWN'} size="sm" />
      <p className="text-[11px] text-slate-500 mt-1">Updated {crowdById.get(selectedLoc.id)?.lastUpdated ? new Date(crowdById.get(selectedLoc.id)!.lastUpdated!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'No recent data'}</p>
      <p className="text-[11px] text-slate-600 mt-2">Best time: {bestTime?.recommendedTime || 'Unavailable'}{bestTime?.expectedCrowd ? ` · ${bestTime.expectedCrowd} expected` : ''}</p>
      <div className="flex flex-wrap gap-2 mt-2">
        <button type="button" onClick={() => (onViewDetails || onSelectLocation)?.(selectedLoc.id)} className="text-xs font-semibold text-indigo-600">View details</button>
        {onReportCrowd && <button type="button" onClick={() => onReportCrowd(selectedLoc.id)} className="text-xs font-semibold text-indigo-600">Report crowd</button>}
        {onBook && ['library', 'cafeteria', 'volleyball-court', 'gym'].includes(selectedLoc.id) && <button type="button" onClick={() => onBook(selectedLoc.id)} className="text-xs font-semibold text-indigo-600">Book slot</button>}
      </div>
    </div>}
    <div className="absolute top-3 right-3 z-[1000] bg-white/95 rounded-lg border border-slate-200 px-2 py-1 text-[10px] text-slate-500">Near {currentOrigin}</div>
    <style>{`.campus-crowd-marker span { display:block; width:18px; height:18px; border:2px solid white; border-radius:50%; box-shadow:0 1px 4px rgba(15,23,42,.35); }`}</style>
  </div>;
};
