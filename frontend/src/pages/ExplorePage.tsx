import React, { useEffect, useMemo, useState } from 'react';
import { Compass, Map as MapIcon, Search } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BestTimeResponse, CrowdMapItem, NearbyLocation } from '../types';
import { locationService } from '../services/locationService';
import { DestinationSearch } from '../components/dashboard/DestinationSearch';
import { LocationSelector } from '../components/dashboard/LocationSelector';
import { LocationCard } from '../components/common/LocationCard';
import { MapPlaceholder } from '../components/common/MapPlaceholder';
import { crowdService } from '../services/crowdService';

export const ExplorePage: React.FC = () => {
  const { origin, currentCoordinates, selectedCategory, setSelectedCategory, navigateTo, openReportModal, locations, locationsLoading, locationsError } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [selectedMapLocationId, setSelectedMapLocationId] = useState<string | null>(null);
  const [crowdMap, setCrowdMap] = useState<CrowdMapItem[]>([]);
  const [crowdMapError, setCrowdMapError] = useState(false);
  const [sharingLocation, setSharingLocation] = useState(false);
  const [selectedBestTime, setSelectedBestTime] = useState<BestTimeResponse | null>(null);
  const [nearbyLocations, setNearbyLocations] = useState<NearbyLocation[] | null>(null);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyError, setNearbyError] = useState(false);

  useEffect(() => {
    if (!currentCoordinates) {
      setNearbyLocations(null);
      return;
    }
    let cancelled = false;
    setNearbyLoading(true);
    setNearbyError(false);
    const category = selectedCategory === 'ALL' ? undefined : selectedCategory;
    void locationService.getNearbyLocations(currentCoordinates.latitude, currentCoordinates.longitude, category)
      .then((loadedLocations) => { if (!cancelled) setNearbyLocations(loadedLocations); })
      .catch(() => { if (!cancelled) setNearbyError(true); })
      .finally(() => { if (!cancelled) setNearbyLoading(false); });
    return () => { cancelled = true; };
  }, [currentCoordinates, selectedCategory]);

  const loadCrowdMap = () => {
    setCrowdMapError(false);
    void crowdService.getCrowdMap().then(setCrowdMap).catch(() => setCrowdMapError(true));
  };

  useEffect(() => {
    if (!showMap) return;
    loadCrowdMap();
    const refresh = () => { if (document.visibilityState === 'visible') loadCrowdMap(); };
    const timer = window.setInterval(refresh, 30000);
    document.addEventListener('visibilitychange', refresh);
    const reportRefresh = () => loadCrowdMap();
    window.addEventListener('crowd-report-submitted', reportRefresh);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', refresh); window.removeEventListener('crowd-report-submitted', reportRefresh); };
  }, [showMap]);

  useEffect(() => {
    if (!selectedMapLocationId) {
      setSelectedBestTime(null);
      return;
    }
    let cancelled = false;
    void crowdService.getBestTime(selectedMapLocationId).then((result) => { if (!cancelled) setSelectedBestTime(result); }).catch(() => { if (!cancelled) setSelectedBestTime(null); });
    return () => { cancelled = true; };
  }, [selectedMapLocationId, crowdMap]);

  const filteredLocations = useMemo(
    () => {
      if (!nearbyLocations) return locationService.filterLocations(selectedCategory, searchQuery);
      const matchingIds = new Set(locationService.filterLocations(selectedCategory, searchQuery).map((location) => location.id));
      return nearbyLocations
        .filter((nearby) => matchingIds.has(nearby.locationId))
        .map((nearby) => locations.find((location) => location.id === nearby.locationId))
        .filter((location): location is (typeof locations)[number] => Boolean(location));
    },
    [selectedCategory, searchQuery, locations, nearbyLocations]
  );

  const nearbyById = useMemo(
    () => new Map((nearbyLocations || []).map((location) => [location.locationId, location])),
    [nearbyLocations]
  );

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      <header>
          <div className="flex items-center gap-2 text-[#5B5CE2] mb-3">
          <Compass className="w-5 h-5" />
          <span className="text-xs font-semibold uppercase tracking-[0.16em]">Campus directory</span>
        </div>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-semibold text-slate-900">Explore campus</h1>
            <p className="text-base text-slate-500 mt-2">Find places to eat, study, build, and print.</p>
          </div>
          <button onClick={() => { setShowMap((visible) => !visible); setSelectedMapLocationId(null); }} className="hidden sm:inline-flex items-center gap-2 text-sm text-slate-500 hover:text-[#5B5CE2] transition">
            <MapIcon className="w-4 h-4" />
            <span>{showMap ? 'Hide map' : 'View on map'}</span>
          </button>
        </div>
      </header>

      <section className="space-y-4">
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search places..." className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-slate-200 text-base focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-[#5B5CE2] transition" />
        </div>
        <DestinationSearch selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />
        <LocationSelector />
      </section>

      {showMap && <section className="space-y-3"><div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2 text-xs text-slate-500"><span className="text-emerald-600">● Low</span><span className="text-amber-600">● Medium</span><span className="text-red-600">● High</span><span className="text-purple-700">● Very high</span><span className="text-slate-400">● Insufficient data</span></div><button type="button" onClick={() => { if (sharingLocation) setSharingLocation(false); else void locationService.getCurrentBrowserLocation().then(() => setSharingLocation(true)).catch(() => setSharingLocation(false)); }} className="text-xs font-semibold text-indigo-600">{sharingLocation ? 'Location sharing on' : 'Share my location'}</button></div>{crowdMapError && <p className="text-sm text-red-600">Unable to load campus crowd. <button type="button" onClick={loadCrowdMap} className="font-semibold underline">Try again</button></p>}<MapPlaceholder locations={locations} crowdMap={crowdMap} bestTime={selectedBestTime} currentOrigin={origin} currentCoordinates={currentCoordinates} selectedLocationId={selectedMapLocationId} onSelectLocation={setSelectedMapLocationId} onViewDetails={(id) => navigateTo('details', id)} onReportCrowd={(id) => openReportModal(id)} onBook={(id) => navigateTo('bookings', id)} height="h-96" /></section>}

      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold text-slate-900">All places</h2>
          {!locationsLoading && !locationsError && <span className="text-sm text-slate-400">{filteredLocations.length} results</span>}
        </div>
        {locationsLoading || nearbyLoading ? (
          <p className="text-sm text-slate-500 py-6">Loading campus locations...</p>
        ) : locationsError || nearbyError ? (
          <p className="text-sm text-red-600 py-6">Unable to connect to Campus Rush services.</p>
        ) : filteredLocations.length === 0 ? (
          <p className="text-sm text-slate-500 py-6">No campus locations available.</p>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 px-4">
            {filteredLocations.map((location) => {
              const nearby = nearbyById.get(location.id);
              return <LocationCard key={location.id} location={location} currentOrigin={origin} distanceInfo={nearby ? { distanceMeters: nearby.distanceMeters, walkingMinutes: nearby.walkingMinutes } : undefined} onViewDetails={(id) => navigateTo('details', id)} onViewMap={(id) => { setShowMap(true); setSelectedMapLocationId(id); }} />;
            })}
          </div>
        )}
      </section>
    </div>
  );
};
