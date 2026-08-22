import React from 'react';
import { CampusOrigin } from '../../types';
import { useApp } from '../../context/AppContext';
import { MapPin } from 'lucide-react';

interface LocationSelectorProps {
  className?: string;
  onOriginChange?: (origin: CampusOrigin) => void;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  className = '',
  onOriginChange,
}) => {
  const { currentLocationId, setCurrentLocation, locations, locationsLoading, locationsError } = useApp();

  const handleSelect = (locationId: string) => {
    const location = locations.find((candidate) => candidate.id === locationId);
    if (location) {
      setCurrentLocation(location.id, 'MANUAL');
      onOriginChange?.(location.name as CampusOrigin);
    }
  };

  return (
    <div className={`flex items-center justify-between gap-3 w-full ${className}`}>
      <div className="flex items-center gap-2 min-w-0">
        <MapPin className="w-4 h-4 text-[#5B5CE2] shrink-0" />
        <select value={currentLocationId || ''} onChange={(event) => handleSelect(event.target.value)} disabled={locationsLoading || locationsError} className="bg-transparent text-sm font-medium text-slate-900 focus:outline-none truncate">
          <option value="">{locationsLoading ? 'Loading locations...' : locationsError ? 'Location unavailable' : 'Choose a location'}</option>
          {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
        </select>
      </div>

    </div>
  );
};
