import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { locationService } from '../services/locationService';
import { LocationSelector } from '../components/dashboard/LocationSelector';
import { DestinationSearch } from '../components/dashboard/DestinationSearch';
import { LocationCard } from '../components/common/LocationCard';
import { CrowdBadge } from '../components/common/CrowdBadge';
import { ConfidenceBadge } from '../components/common/ConfidenceBadge';
import { recommendationService } from '../services/recommendationService';
import { Check, Copy, MoreHorizontal, RefreshCw, ThumbsDown } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { 
    user, 
    origin, 
    currentLocationId,
    currentCoordinates,
    locations, 
    selectedCategory, 
    setSelectedCategory, 
    navigateTo,
    destinationLocationId,
    setDestinationLocationId,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [submittedQuery, setSubmittedQuery] = useState<string>('');
  const [destinationLocations, setDestinationLocations] = useState<typeof locations>([]);
  const [destinationLoading, setDestinationLoading] = useState(false);
  const [destinationError, setDestinationError] = useState(false);
  const [recommendations, setRecommendations] = useState<Awaited<ReturnType<typeof recommendationService.getRecommendations>>>([]);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [recommendationError, setRecommendationError] = useState(false);

  useEffect(() => {
    if (selectedCategory === 'ALL') {
      setDestinationLocations([]);
      return;
    }
    let cancelled = false;
    setDestinationLoading(true);
    setDestinationError(false);
    void locationService.getLocationsByCategory(selectedCategory)
      .then((loadedLocations) => { if (!cancelled) setDestinationLocations(loadedLocations); })
      .catch(() => { if (!cancelled) setDestinationError(true); })
      .finally(() => { if (!cancelled) setDestinationLoading(false); });
    return () => { cancelled = true; };
  }, [selectedCategory]);

  useEffect(() => {
    const recommendationCategory = ['FOOD', 'STUDY', 'LAB', 'PHOTOCOPY'].includes(selectedCategory) ? selectedCategory : null;
    if (!recommendationCategory || (!currentLocationId && !currentCoordinates)) {
      setRecommendations([]);
      setRecommendationError(false);
      return;
    }
    let cancelled = false;
    setRecommendationLoading(true);
    setRecommendationError(false);
    void recommendationService.getRecommendations(origin, recommendationCategory, 'BALANCED', currentLocationId, currentCoordinates)
      .then((items) => { if (!cancelled) setRecommendations(items); })
      .catch(() => { if (!cancelled) setRecommendationError(true); })
      .finally(() => { if (!cancelled) setRecommendationLoading(false); });
    return () => { cancelled = true; };
  }, [origin, currentLocationId, currentCoordinates, selectedCategory, locations]);

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'visible' && selectedCategory !== 'ALL' && (currentLocationId || currentCoordinates)) {
        void recommendationService.getRecommendations(origin, selectedCategory, 'BALANCED', currentLocationId, currentCoordinates).then(setRecommendations).catch(() => setRecommendationError(true));
      }
    };
    const timer = window.setInterval(refresh, 30000);
    document.addEventListener('visibilitychange', refresh);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', refresh); };
  }, [origin, currentLocationId, currentCoordinates, selectedCategory]);

  // Dynamic greeting based on current hour
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const submitSearch = () => {
    const query = searchQuery.trim();
    if (!query) return;
    setSubmittedQuery(searchQuery.trim());
    setHasSearched(true);
  };

  const searchResults = hasSearched
    ? locationService.filterLocations(selectedCategory, submittedQuery)
    : [];

  return (
    <div className="min-h-[calc(100vh-9rem)] flex items-center justify-center animate-fade-in">
      <div className="w-full max-w-[760px] space-y-10">
      {/* Top Header */}
      <div className="text-center">
        <div>
          <h1 className="text-3xl sm:text-4xl font-semibold text-slate-900">
            {getGreeting()}, {user.name.split(' ')[0]} 👋
          </h1>
          <p className="text-base text-slate-500 mt-2">
            Find the best place to go right now.
          </p>
        </div>

      </div>

      {hasSearched ? (
        <section className="space-y-3">
          <div className="flex justify-end">
            <div className="max-w-[80%] rounded-2xl rounded-br-md bg-[#EEF0FF] px-4 py-3 text-sm text-[#17181A]">
              {submittedQuery}
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#5B5CE2] text-white flex items-center justify-center shrink-0 text-xs font-semibold">CR</div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-semibold text-slate-900">Here&apos;s what I found</h2>
              <p className="text-sm text-slate-500 mt-2">{searchResults.length ? `${searchResults.length} campus location${searchResults.length === 1 ? '' : 's'} found.` : 'No matching campus locations found.'}</p>
              <div className="flex items-center gap-1 mt-3 text-slate-400">
                <button title="Helpful" className="p-2 hover:text-[#5B5CE2] transition"><Check className="w-4 h-4" /></button>
                <button title="Not helpful" className="p-2 hover:text-[#5B5CE2] transition"><ThumbsDown className="w-4 h-4" /></button>
                <button title="Copy response" className="p-2 hover:text-[#5B5CE2] transition"><Copy className="w-4 h-4" /></button>
                <button title="Regenerate response" onClick={submitSearch} className="p-2 hover:text-[#5B5CE2] transition"><RefreshCw className="w-4 h-4" /></button>
                <button title="More actions" className="p-2 hover:text-[#5B5CE2] transition"><MoreHorizontal className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {hasSearched && searchResults.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">Search results</h2>
            <button type="button" onClick={() => navigateTo('bookings')} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">Book a facility</button>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 px-4">
            {searchResults.map((location) => (
              <LocationCard
                key={location.id}
                location={location}
                currentOrigin={origin}
                className={destinationLocationId === location.id ? 'ring-2 ring-[#5B5CE2] rounded-xl' : ''}
                onViewDetails={() => { setDestinationLocationId(location.id); navigateTo('details', location.id); }}
              />
            ))}
          </div>
        </section>
      )}

      <section className="space-y-5">
        <div className="text-center">
          <h2 className="ask-campus-heading text-xl sm:text-2xl text-slate-900">Ask Campus Rush</h2>
        </div>
        <div>
          <DestinationSearch
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSubmit={submitSearch}
            collapsible
          />
        </div>
        <div className="px-1">
          <LocationSelector />
        </div>
        {['FOOD', 'STUDY', 'LAB', 'PHOTOCOPY'].includes(selectedCategory) && (recommendationLoading || recommendationError || recommendations.length > 0) && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-800">Campus Rush recommends</h2>
              <button type="button" onClick={() => navigateTo('explore')} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">View all</button>
            </div>
            {recommendationLoading && <p className="text-sm text-slate-500">Loading crowd-based options...</p>}
            {recommendationError && <p className="text-sm text-red-600">Unable to load recommendations.</p>}
            {!recommendationLoading && !recommendationError && recommendations[0] && <p className="text-xs font-semibold text-slate-600">Distance to best option: {recommendations[0].distanceMeters !== null ? `${recommendations[0].distanceMeters} m` : 'unavailable'}{recommendations[0].walkingTimeMinutes !== null ? ` · ${recommendations[0].walkingTimeMinutes} min walk` : ''}</p>}
            {!recommendationLoading && !recommendationError && recommendations.length > 0 && <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">{recommendations.slice(0, 3).map((recommendation, index) => <div key={recommendation.location.id} className="p-4 flex items-center gap-3"><div className="min-w-0 flex-1"><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{index === 0 ? 'Best option' : 'Alternative'}</p><p className="text-sm font-semibold text-slate-900 mt-1">{recommendation.location.name}</p><div className="flex flex-wrap items-center gap-2 mt-2"><CrowdBadge level={recommendation.location.crowdEstimate?.currentCrowd} size="sm" /><ConfidenceBadge confidence={recommendation.location.crowdEstimate?.confidence || 'NONE'} />{recommendation.distanceMeters !== null && <span className="text-[11px] text-slate-500">{recommendation.distanceMeters} m</span>}{recommendation.walkingTimeMinutes !== null && <span className="text-[11px] text-slate-500">{recommendation.walkingTimeMinutes} min walk</span>}{recommendation.lastReportedAt ? <span className="text-[11px] text-slate-400">Reported {Math.max(0, Math.floor((Date.now() - new Date(recommendation.lastReportedAt).getTime()) / 60000))} min ago</span> : <span className="text-[11px] text-slate-400">Expected from campus schedule</span>}</div>{recommendation.betterTime?.recommendedTime && <p className="text-xs text-emerald-700 mt-2">Better time: {recommendation.betterTime.recommendedTime} · {recommendation.betterTime.expectedCrowd} expected</p>}<p className="text-xs text-slate-500 mt-2">{recommendation.reason}</p></div><button type="button" onClick={() => navigateTo('details', recommendation.location.id)} className="shrink-0 text-xs font-semibold text-indigo-600 hover:text-indigo-800">View</button></div>)}</div>}
          </section>
        )}
        {selectedCategory !== 'ALL' && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-800">Choose a destination</p>
            {destinationLoading && <p className="text-sm text-slate-500">Loading locations...</p>}
            {destinationError && <p className="text-sm text-red-600">Unable to connect to Campus Rush services.</p>}
            {!destinationLoading && !destinationError && destinationLocations.length === 0 && <p className="text-sm text-slate-500">No locations found for this requirement.</p>}
            {!destinationLoading && !destinationError && destinationLocations.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 px-4">
                {destinationLocations.map((location) => (
                  <LocationCard key={location.id} location={location} currentOrigin={origin} className={destinationLocationId === location.id ? 'ring-2 ring-[#5B5CE2] rounded-xl' : ''} onViewDetails={() => { setDestinationLocationId(location.id); navigateTo('details', location.id); }} />
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      </div>
    </div>
  );
};
