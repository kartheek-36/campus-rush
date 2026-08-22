import { CampusOrigin, ConfidenceLevel, CrowdLevel, LocationCategory, Recommendation } from '../types';
import { locationService } from './locationService';
import { api } from './api';

export type RecommendationPreference = 'BALANCED' | 'LEAST_CROWD' | 'SHORTEST_WALK' | 'HIGHEST_CONFIDENCE';

interface RecommendationApiItem {
  locationId: string;
  locationName: string;
  crowdLevel: string;
  expectedCrowd: string;
  confidence: string;
  distanceMeters: number | null;
  walkingMinutes: number | null;
  trend: 'INCREASING' | 'DECREASING' | 'STABLE' | 'UNKNOWN';
  lastReportedAt: string | null;
  source: 'RECENT_REPORTS' | 'CAMPUS_SCHEDULE' | 'HISTORICAL_DATA';
  reason: string;
  betterTime?: {
    locationId: string;
    currentCrowd?: string;
    reportedAt?: string | null;
    recommendedTime: string | null;
    expectedCrowd: string;
    source: string;
    confidence?: string;
    reason: string;
  };
}

class RecommendationService {
  public async getRecommendations(
    origin: CampusOrigin,
    category?: LocationCategory | 'ALL',
    _preference: RecommendationPreference = 'BALANCED',
    currentLocationId?: string | null,
    coordinates?: { latitude: number; longitude: number } | null
  ): Promise<Recommendation[]> {
    void origin;
    if (!category || category === 'ALL') return [];
    const params = new URLSearchParams({ category });
    if (currentLocationId) params.set('currentLocationId', currentLocationId);
    else if (coordinates) {
      params.set('latitude', String(coordinates.latitude));
      params.set('longitude', String(coordinates.longitude));
    }
    const response = await api.get<{ recommendations: RecommendationApiItem[] }>(`/recommendations?${params.toString()}`);
    return response.data.recommendations.flatMap((item) => {
      const location = locationService.getLocationById(item.locationId);
      if (!location) return [];
      return [{
        location: {
          ...location,
          crowdEstimate: {
            locationId: location.id,
            currentCrowd: item.crowdLevel as NonNullable<typeof location.crowdEstimate>['currentCrowd'],
            confidence: item.confidence === 'MEDIUM' ? 'MEDIUM' : item.confidence === 'HIGH' ? 'HIGH' : item.confidence === 'LOW' ? 'LOW' : 'NONE',
            lastUpdated: item.lastReportedAt,
            reportCount: 0,
            expectedWaitMinutes: null,
          },
        },
        distanceMeters: item.distanceMeters,
        walkingTimeMinutes: item.walkingMinutes,
        expectedWaitMinutes: null,
        score: null,
        reason: item.reason,
        expectedCrowd: item.expectedCrowd as Recommendation['expectedCrowd'],
        trend: item.trend,
        lastReportedAt: item.lastReportedAt,
        source: item.source,
        betterTime: item.betterTime ? {
          ...item.betterTime,
          currentCrowd: item.betterTime.currentCrowd as CrowdLevel | undefined,
          expectedCrowd: item.betterTime.expectedCrowd as CrowdLevel,
          source: item.betterTime.source as 'CAMPUS_SCHEDULE' | 'RECENT_REPORTS' | 'CURRENT_REPORTS' | 'HISTORICAL_DATA' | 'RECENT_REPORTS_AND_SCHEDULE' | 'RECENT_REPORTS_AND_HISTORICAL_DATA' | 'INSUFFICIENT_DATA',
          confidence: item.betterTime.confidence as ConfidenceLevel | undefined,
        } : undefined,
      }];
    });
  }

  public async getBestTime(locationId: string): Promise<{ recommendedTime: string | null; expectedCrowd: string; reason: string; source: string }> {
    const response = await api.get<import('../types').BestTimeResponse>(`/recommendations/best-time/${encodeURIComponent(locationId)}`);
    return response.data;
  }

  public getBestRecommendation(origin: CampusOrigin, category?: LocationCategory): Promise<Recommendation | null> {
    return this.getRecommendations(origin, category).then((recommendations) => recommendations[0] || null);
  }
}

export const recommendationService = new RecommendationService();
