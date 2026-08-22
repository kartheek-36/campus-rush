import { Location, CampusOrigin, LocationCategory, CurrentLocation, CampusLocationMatch, NearbyLocation } from '../types';
import { CAMPUS_ORIGINS } from '../data/mockCampusData';
import { api } from './api';

class LocationService {
  private locations: Location[] = [];

  public async getLocations(category?: LocationCategory): Promise<Location[]> {
    const query = category ? `?category=${encodeURIComponent(category)}` : '';
    const response = await api.get<Location[]>(`/locations${query}`);
    if (!category) {
      this.locations = response.data;
    }
    return response.data;
  }

  public setLocations(locations: Location[]): void {
    this.locations = locations;
  }

  public async getCurrentLocation(): Promise<CurrentLocation | null> {
    return null;
  }

  public async getCurrentBrowserLocation(): Promise<CurrentLocation> {
    if (!navigator.geolocation) throw new Error('Unable to access your location.');
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString(),
        }),
        (error) => reject(new Error(error.code === error.PERMISSION_DENIED ? 'Location permission was denied.' : 'Unable to access your location.')),
        { enableHighAccuracy: false, maximumAge: 0, timeout: 10000 }
      );
    });
  }

  public async resolveCampusLocation(latitude: number, longitude: number, accuracy?: number, timestamp?: string): Promise<CampusLocationMatch> {
    const response = await api.post<CampusLocationMatch>('/location/current', {
      latitude,
      longitude,
      accuracy,
      timestamp,
    });
    return response.data;
  }

  public async getLocationsByCategory(category: LocationCategory): Promise<Location[]> {
    return this.getLocations(category);
  }

  public async getNearbyLocations(latitude: number, longitude: number, category?: LocationCategory): Promise<NearbyLocation[]> {
    const params = new URLSearchParams({ latitude: String(latitude), longitude: String(longitude) });
    if (category) params.set('category', category);
    const response = await api.get<NearbyLocation[]>(`/locations/nearby?${params.toString()}`);
    return response.data;
  }

  public filterLocations(category?: LocationCategory | 'ALL', searchQuery?: string): Location[] {
    let filtered = [...this.locations];

    if (category && category !== 'ALL') {
      filtered = filtered.filter((loc) => loc.category === category);
    }

    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const tokens = q.split(/\s+/).filter(Boolean);
      const categoryTerms = Object.entries({
        FOOD: this.getCategoryTerms('FOOD'),
        STUDY: this.getCategoryTerms('STUDY'),
        LAB: this.getCategoryTerms('LAB'),
        PHOTOCOPY: this.getCategoryTerms('PHOTOCOPY'),
      });
      const requestedCategories = categoryTerms
        .filter(([, terms]) => terms.some((term) => tokens.includes(term)))
        .map(([category]) => category as LocationCategory);
      const ignoredWords = new Set(['a', 'an', 'the', 'near', 'at', 'to', 'for', 'find', 'place', 'shop']);
      const requestedCategoryTerms = new Set(
        requestedCategories.flatMap((category) => this.getCategoryTerms(category))
      );
      const locationTerms = tokens.filter(
        (token) => !ignoredWords.has(token) && !requestedCategoryTerms.has(token)
      );
      filtered = filtered.filter(
        (loc) => {
          if (requestedCategories.length > 0 && !requestedCategories.includes(loc.category)) {
            return false;
          }
          if (locationTerms.length === 0) {
            return true;
          }
          const searchableText = [
            loc.name,
            loc.building,
            loc.description,
            ...(loc.tags || []),
            ...(loc.amenities || []),
          ].join(' ').toLowerCase();
          return locationTerms.every((term) => searchableText.includes(term));
        }
      );
    }

    return filtered;
  }

  private getCategoryTerms(category: LocationCategory): string[] {
    const terms: Partial<Record<LocationCategory, string[]>> = {
      FOOD: ['food', 'canteen', 'cafe', 'coffee', 'dining'],
      STUDY: ['study', 'library', 'reading', 'quiet', 'xerox'],
      LAB: ['lab', 'computer', 'computing'],
      PHOTOCOPY: ['photocopy', 'print', 'printing'],
    };
    return terms[category] || [];
  }

  public getLocationById(id: string): Location | undefined {
    return this.locations.find((loc) => loc.id === id);
  }

  public getDistanceAndWalkingTime(
    origin: CampusOrigin,
    locationId: string
  ): { distanceMeters: number | null; walkingMinutes: number | null } {
    const destination = this.locations.find((location) => location.id === locationId);
    const originLocation = this.locations.find((location) => location.name.toLowerCase() === origin.toLowerCase());
    if (!destination?.latitude || !destination?.longitude || !originLocation?.latitude || !originLocation?.longitude) {
      return { distanceMeters: null, walkingMinutes: null };
    }
    const earthRadiusMeters = 6371000;
    const latitudeDelta = (destination.latitude - originLocation.latitude) * Math.PI / 180;
    const longitudeDelta = (destination.longitude - originLocation.longitude) * Math.PI / 180;
    const originLatitude = originLocation.latitude * Math.PI / 180;
    const destinationLatitude = destination.latitude * Math.PI / 180;
    const haversine = Math.sin(latitudeDelta / 2) ** 2
      + Math.cos(originLatitude) * Math.cos(destinationLatitude) * Math.sin(longitudeDelta / 2) ** 2;
    const distanceMeters = Math.round(earthRadiusMeters * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine)));
    return { distanceMeters, walkingMinutes: Math.max(1, Math.ceil(distanceMeters / (1.4 * 60))) };
  }

  public getOrigins(): CampusOrigin[] {
    return CAMPUS_ORIGINS;
  }

  public updateLocationCrowdEstimate(locationId: string, updatedEstimate: Location['crowdEstimate']): void {
    const index = this.locations.findIndex((l) => l.id === locationId);
    if (index !== -1 && updatedEstimate) {
      this.locations[index] = {
        ...this.locations[index],
        crowdEstimate: updatedEstimate,
      };
    }
  }

  public updateLocationDetails(locationId: string, updates: Partial<Location>): Location | null {
    const index = this.locations.findIndex((l) => l.id === locationId);
    if (index !== -1) {
      this.locations[index] = {
        ...this.locations[index],
        ...updates,
      };
      return this.locations[index];
    }
    return null;
  }
}

export const locationService = new LocationService();
