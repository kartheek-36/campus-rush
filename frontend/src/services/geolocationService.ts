import { CampusOrigin } from '../types';

export interface GeolocationResult {
  origin: CampusOrigin;
  coordinates?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  isSimulated: boolean;
  message: string;
}

class GeolocationService {
  /**
   * Stub service for location detection.
   * Ready for real HTML5 Geolocation API / Mapbox integration when backend GPS is connected.
   */
  public async requestUserLocation(): Promise<GeolocationResult> {
    return {
      origin: 'CSE Block',
      isSimulated: false,
      message: 'Location access will be available soon.',
    };
  }

  public isGeolocationSupported(): boolean {
    return typeof window !== 'undefined' && 'geolocation' in navigator;
  }
}

export const geolocationService = new GeolocationService();
