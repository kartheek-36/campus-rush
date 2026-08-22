import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User,
  CampusOrigin,
  PageRoute,
  Location,
  LocationCategory,
  CrowdLevel,
  LocationSource,
  CurrentLocation,
} from '../types';
import { authService } from '../services/authService';
import { locationService } from '../services/locationService';
import { crowdService } from '../services/crowdService';

export interface Toast {
  id: string;
  title: string;
  message?: string;
  type?: 'success' | 'info' | 'warning' | 'error';
}

interface AppContextType {
  user: User;
  isAuthenticated: boolean;
  authLoading: boolean;
  origin: CampusOrigin;
  setOrigin: (origin: CampusOrigin) => void;
  currentLocation: Location | null;
  currentCoordinates: CurrentLocation | null;
  currentLocationId: string | null;
  locationSource: LocationSource;
  setCurrentLocation: (locationId: string, source: LocationSource, coordinates?: CurrentLocation) => void;
  activePage: PageRoute;
  navigateTo: (page: PageRoute, locationId?: string) => void;
  selectedLocationId: string | null;
  setSelectedLocationId: (id: string | null) => void;
  selectedCategory: LocationCategory | 'ALL';
  setSelectedCategory: (cat: LocationCategory | 'ALL') => void;
  destinationLocationId: string | null;
  setDestinationLocationId: (id: string | null) => void;
  locations: Location[];
  locationsLoading: boolean;
  locationsError: boolean;
  locationsLoaded: boolean;
  refreshData: () => void;
  submitCrowdReport: (locationId: string, level: CrowdLevel, note?: string, tag?: string) => void;
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  isReportModalOpen: boolean;
  openReportModal: (locationId?: string) => void;
  closeReportModal: () => void;
  loginAsStudent: () => void;
  loginAsAdmin: () => void;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(authService.getCurrentUser());
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());
  const [authLoading, setAuthLoading] = useState(true);
  const [origin, setOrigin] = useState<CampusOrigin>(user.favoriteOrigin || 'CSE Block');
  const [currentLocationId, setCurrentLocationId] = useState<string | null>(null);
  const [currentCoordinates, setCurrentCoordinates] = useState<CurrentLocation | null>(null);
  const [locationSource, setLocationSource] = useState<LocationSource>('UNKNOWN');
  const [activePage, setActivePage] = useState<PageRoute>('dashboard');
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>('loc-food-1');
  const [selectedCategory, setSelectedCategory] = useState<LocationCategory | 'ALL'>('ALL');
  const [destinationLocationId, setDestinationLocationId] = useState<string | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [locationsError, setLocationsError] = useState(false);
  const [locationsLoaded, setLocationsLoaded] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = authService.subscribe((updatedUser) => {
      if (updatedUser) {
        setUser(updatedUser);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    void authService.restoreSession().finally(() => setAuthLoading(false));
  }, []);

  useEffect(() => {
    const loadLocations = async () => {
      setLocationsLoading(true);
      setLocationsError(false);
      try {
        const loadedLocations = await locationService.getLocations();
        setLocations(loadedLocations);
        setLocationsLoaded(true);
      } catch {
        setLocationsError(true);
        setLocationsLoaded(true);
      } finally {
        setLocationsLoading(false);
      }
    };
    void loadLocations();
  }, []);

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newToast = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const navigateTo = (page: PageRoute, locationId?: string) => {
    if (locationId) {
      setSelectedLocationId(locationId);
    }
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const refreshData = () => {
    void locationService.getLocations()
      .then((loadedLocations) => {
        setLocations(loadedLocations);
        setLocationsError(false);
      })
      .catch(() => setLocationsError(true));
  };

  const currentLocation = currentLocationId
    ? locations.find((location) => location.id === currentLocationId) || null
    : null;

  const setCurrentLocation = (locationId: string, source: LocationSource, coordinates?: CurrentLocation) => {
    const location = locations.find((candidate) => candidate.id === locationId);
    if (!location) return;
    setCurrentLocationId(locationId);
    setLocationSource(source);
    setCurrentCoordinates(coordinates || (
      typeof location.latitude === 'number' && typeof location.longitude === 'number'
        ? { latitude: location.latitude, longitude: location.longitude }
        : null
    ));
    setOrigin(location.name as CampusOrigin);
  };

  const openReportModal = (locationId?: string) => {
    if (locationId) {
      setSelectedLocationId(locationId);
    }
    setIsReportModalOpen(true);
  };

  const closeReportModal = () => {
    setIsReportModalOpen(false);
  };

  const submitCrowdReport = (
    locationId: string,
    level: CrowdLevel,
    note?: string,
    tag?: string
  ) => {
    const loc = locationService.getLocationById(locationId);
    crowdService.submitReport(locationId, level, user.name, note, tag);
    authService.incrementUserReportCount();
    setUser(authService.getCurrentUser());
    refreshData();

    addToast({
      title: 'Report Submitted! 🚀',
      message: `Thanks for updating crowd status for ${loc?.name || 'this location'}. +20 Campus Karma points!`,
      type: 'success',
    });
  };

  const loginAsStudent = () => {
    const u = authService.loginAsStudent();
    setUser(u);
    setOrigin(u.favoriteOrigin);
    addToast({
      title: 'Signed in as Student',
      message: `Welcome back, ${u.name}!`,
      type: 'info',
    });
    setActivePage('dashboard');
  };

  const loginAsAdmin = () => {
    const u = authService.loginAsAdmin();
    setUser(u);
    setOrigin(u.favoriteOrigin);
    addToast({
      title: 'Admin Access Granted',
      message: `Welcome, ${u.name}!`,
      type: 'info',
    });
    setActivePage('admin');
  };

  const logout = () => {
    authService.logout();
    setActivePage('login');
  };

  return (
    <AppContext.Provider
      value={{
        user,
        isAuthenticated,
        authLoading,
        origin,
        setOrigin,
        currentLocation,
        currentCoordinates,
        currentLocationId,
        locationSource,
        setCurrentLocation,
        activePage,
        navigateTo,
        selectedLocationId,
        setSelectedLocationId,
        selectedCategory,
        setSelectedCategory,
        destinationLocationId,
        setDestinationLocationId,
        locations,
        locationsLoading,
        locationsError,
        locationsLoaded,
        refreshData,
        submitCrowdReport,
        toasts,
        addToast,
        removeToast,
        isReportModalOpen,
        openReportModal,
        closeReportModal,
        loginAsStudent,
        loginAsAdmin,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
