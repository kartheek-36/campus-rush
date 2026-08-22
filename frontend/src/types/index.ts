export type CrowdLevel = 'EMPTY' | 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' | 'UNKNOWN';

export interface CrowdMapItem {
  locationId: string;
  locationName: string;
  latitude: number;
  longitude: number;
  crowdLevel: CrowdLevel;
  lastUpdated: string | null;
}

export type ConfidenceLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'NONE';

export interface CurrentLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: string;
}

export type LocationSource = 'MANUAL' | 'GPS' | 'UNKNOWN';

export interface CampusLocationMatch {
  matched: boolean;
  locationId: string | null;
  locationName?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  distanceMeters?: number | null;
  message: string;
}

export interface NearbyLocation {
  locationId: string;
  name: string;
  category: LocationCategory;
  distanceMeters: number;
  walkingMinutes: number;
}

export type LocationCategory = 'FOOD' | 'STUDY' | 'LAB' | 'PHOTOCOPY' | 'ENTRANCE' | 'EVENTS' | 'SPORTS' | 'FITNESS' | 'SHOPPING' | 'RECREATION';

export type CampusOrigin = 
  | 'Main Gate' 
  | 'CSE Block' 
  | 'ECE Block' 
  | 'Library' 
  | 'Hostel' 
  | 'Canteen';

export interface LocationCoordinates {
  lat: number;
  lng: number;
}

export interface CrowdReport {
  id: string;
  locationId: string;
  crowdLevel: CrowdLevel;
  timestamp: string; // ISO 8601 string
  reportedBy: string;
  note?: string;
  tag?: string; // e.g. "Long queue", "Few tables left", "Fast service"
}

export interface CrowdReportRequest {
  locationId: string;
  crowdLevel: Exclude<CrowdLevel, 'UNKNOWN'>;
}

export type EstimateConfidence = 'LOW' | 'MODERATE' | 'HIGH' | 'UNKNOWN';

export interface CrowdEstimateResponse {
  locationId: string;
  crowdLevel: CrowdLevel;
  confidence: EstimateConfidence;
  lastUpdated: string | null;
  reportCount?: number;
  lastReportAt?: string | null;
  expected?: {
    expectedCrowd: CrowdLevel;
    reason: string;
    source: 'CAMPUS_SCHEDULE';
  };
}

export interface BestTimeResponse {
  locationId: string;
  currentCrowd?: CrowdLevel;
  reportedAt?: string | null;
  recommendedTime: string | null;
  expectedCrowd: CrowdLevel;
  reason: string;
  source: 'CAMPUS_SCHEDULE' | 'RECENT_REPORTS' | 'CURRENT_REPORTS' | 'HISTORICAL_DATA' | 'RECENT_REPORTS_AND_SCHEDULE' | 'RECENT_REPORTS_AND_HISTORICAL_DATA' | 'INSUFFICIENT_DATA';
  confidence?: ConfidenceLevel;
  trend?: 'INCREASING' | 'DECREASING' | 'STABLE' | 'UNKNOWN';
}

export interface RawCrowdReport {
  id: string;
  userId?: string | null;
  locationId: string;
  crowdLevel: Exclude<CrowdLevel, 'UNKNOWN'>;
  createdAt: string;
}

export interface CrowdEstimate {
  locationId: string;
  currentCrowd: CrowdLevel;
  confidence: ConfidenceLevel;
  lastUpdated: string | null;
  reportCount: number;
  expectedWaitMinutes: number | null;
}

export interface Location {
  id: string;
  name: string;
  category: LocationCategory;
  latitude?: number;
  longitude?: number;
  building?: string;
  floor?: string;
  coordinates?: LocationCoordinates;
  description: string;
  openingHours?: string;
  amenities?: string[];
  capacity?: number;
  tags?: string[];
  crowdEstimate?: CrowdEstimate;
}

export interface Recommendation {
  location: Location;
  distanceMeters: number | null;
  walkingTimeMinutes: number | null;
  expectedWaitMinutes: number | null;
  score: number | null;
  reason: string;
  expectedCrowd?: CrowdLevel;
  trend?: 'INCREASING' | 'DECREASING' | 'STABLE' | 'UNKNOWN';
  lastReportedAt?: string | null;
  source?: 'RECENT_REPORTS' | 'CAMPUS_SCHEDULE' | 'HISTORICAL_DATA';
  betterTime?: BestTimeResponse;
}

export interface Prediction {
  locationId: string;
  isAvailable: false;
  message: string;
  nextBestWindow?: string;
}

export interface User {
  id: string;
  name: string;
  studentId: string;
  email: string;
  department: string;
  role: 'student' | 'admin';
  accessRole?: 'STUDENT' | 'LIBRARY_ADMIN' | 'CAFETERIA_ADMIN' | 'VOLLEYBALL_ADMIN' | 'GYM_ADMIN' | 'SUPER_ADMIN' | 'ADMIN';
  adminFacilityId?: string | null;
  favoriteOrigin: CampusOrigin;
  reportsSubmitted: number;
  reputationPoints: number;
  joinedDate: string;
}

export type PageRoute = 
  | 'dashboard' 
  | 'explore' 
  | 'details' 
  | 'report' 
  | 'bookings' 
  | 'profile' 
  | 'admin'
  | 'login'
  | 'signup';
  
