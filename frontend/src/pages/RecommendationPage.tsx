import React, { useEffect, useState } from 'react';
import { Info, Navigation, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { recommendationService, RecommendationPreference } from '../services/recommendationService';
import { LocationSelector } from '../components/dashboard/LocationSelector';
import { DestinationSearch } from '../components/dashboard/DestinationSearch';
import { CrowdBadge } from '../components/common/CrowdBadge';
import { ConfidenceBadge } from '../components/common/ConfidenceBadge';
import { EmptyState } from '../components/common/EmptyState';

export const RecommendationPage: React.FC = () => {
  const { origin, currentLocationId, currentCoordinates, selectedCategory, setSelectedCategory, navigateTo, addToast } = useApp();
  const [preference, setPreference] = useState<RecommendationPreference>('BALANCED');
  const [rankedRecommendations, setRankedRecommendations] = useState<Awaited<ReturnType<typeof recommendationService.getRecommendations>>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const category = selectedCategory === 'ALL' ? undefined : selectedCategory;
    setIsLoading(true);
    setHasError(false);
    void recommendationService.getRecommendations(origin, category, preference, currentLocationId, currentCoordinates)
      .then((recommendations) => { if (!cancelled) setRankedRecommendations(recommendations); })
      .catch(() => { if (!cancelled) setHasError(true); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [origin, currentLocationId, currentCoordinates, selectedCategory, preference]);

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'visible') {
        const category = selectedCategory === 'ALL' ? undefined : selectedCategory;
        void recommendationService.getRecommendations(origin, category, preference, currentLocationId, currentCoordinates).then(setRankedRecommendations).catch(() => setHasError(true));
      }
    };
    const timer = window.setInterval(refresh, 30000);
    document.addEventListener('visibilitychange', refresh);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', refresh); };
  }, [origin, currentLocationId, currentCoordinates, selectedCategory, preference]);

  const preferences: Array<{ id: RecommendationPreference; label: string }> = [
    { id: 'BALANCED', label: 'Balanced' },
    { id: 'LEAST_CROWD', label: 'Lowest crowd' },
    { id: 'SHORTEST_WALK', label: 'Shortest walk' },
    { id: 'HIGHEST_CONFIDENCE', label: 'Verified data' },
  ];

  const handleGoThere = (recommendation: (typeof rankedRecommendations)[number]) => {
    addToast({ title: `Routing to ${recommendation.location.name}`, message: 'Route details are unavailable until connected.', type: 'info' });
    navigateTo('details', recommendation.location.id);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      <header>
        <div className="flex items-center gap-2 text-[#5B5CE2] mb-3">
          <Sparkles className="w-5 h-5" />
          <span className="text-xs font-semibold uppercase tracking-[0.16em]">Smart routing</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-semibold text-slate-900">Recommendations</h1>
        <p className="text-base text-slate-500 mt-2">Find the best places based on your location and requirements.</p>
      </header>

      <section className="space-y-4">
        <LocationSelector />
        <DestinationSearch selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs text-slate-400 shrink-0">Prioritize</span>
          <div className="flex rounded-full bg-[#F3F4F6] p-1">
            {preferences.map((item) => (
              <button key={item.id} type="button" onClick={() => setPreference(item.id)} className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition ${preference === item.id ? 'bg-white text-[#5B5CE2] shadow-sm font-medium' : 'text-slate-500 hover:text-slate-900'}`}>
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="flex items-start gap-2 text-xs text-slate-500 border-y border-slate-200 py-4">
        <Info className="w-4 h-4 text-[#5B5CE2] shrink-0" />
        <p>Recommendations consider crowd, distance, estimated wait time and data confidence.</p>
      </div>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold text-slate-900">Top places</h2>
          <span className="text-sm text-slate-400">{rankedRecommendations.length} results</span>
        </div>
        {isLoading ? <p className="text-sm text-slate-500 py-6">Loading recommendations...</p> : hasError ? <p className="text-sm text-red-600 py-6">Unable to connect to Campus Rush services.</p> : rankedRecommendations.length === 0 ? (
          <EmptyState title="No recommendations available yet." description="More campus data is needed to generate reliable recommendations." actionText="Show all categories" onAction={() => setSelectedCategory('ALL')} />
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 px-4">
            {rankedRecommendations.map((recommendation, index) => {
              const crowd = recommendation.location.crowdEstimate?.currentCrowd || 'UNKNOWN';
              const confidence = recommendation.location.crowdEstimate?.confidence || 'NONE';
              return (
                <div key={recommendation.location.id} className="flex items-center gap-3 py-4 border-b border-slate-200 last:border-0">
                  <span className="w-7 text-sm text-slate-400">#{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-medium text-slate-900 truncate">{recommendation.location.name}</h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                      <span>{recommendation.location.category}</span>
                      <CrowdBadge level={crowd} size="sm" />
                      <ConfidenceBadge confidence={confidence} />
                      <span>{recommendation.distanceMeters !== null ? `${recommendation.distanceMeters} m` : 'Distance unavailable'}</span>
                      <span>{recommendation.walkingTimeMinutes !== null ? `${recommendation.walkingTimeMinutes} min walk` : 'Walk unavailable'}</span>
                    </div>
                    {recommendation.betterTime?.recommendedTime && <p className="text-xs text-emerald-700 mt-2">Better time: {recommendation.betterTime.recommendedTime} · {recommendation.betterTime.expectedCrowd} expected</p>}
                  </div>
                  <button onClick={() => handleGoThere(recommendation)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#5B5CE2] text-white text-xs font-medium hover:bg-[#4F50D5] transition">
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Go</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
