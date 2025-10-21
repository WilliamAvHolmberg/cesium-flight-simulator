import { useState, useRef, useEffect } from 'react';
import { useGameMethod } from '../../../hooks/useGameMethod';

export interface Location {
  id: string;
  name: string;
  country: string;
  longitude: number;
  latitude: number;
  altitude: number;
  heading?: number;
  emoji: string;
}

const LOCATIONS: Location[] = [
  { id: 'paris', name: 'Eiffel Tower', country: 'France', longitude: 2.2945, latitude: 48.8584, altitude: 500, heading: 90, emoji: '🗼' },
  { id: 'nyc', name: 'Times Square', country: 'USA', longitude: -73.9855, latitude: 40.7580, altitude: 500, heading: 0, emoji: '🗽' },
  { id: 'tokyo', name: 'Tokyo Tower', country: 'Japan', longitude: 139.7454, latitude: 35.6586, altitude: 300, heading: 180, emoji: '🗼' },
  { id: 'dubai', name: 'Burj Khalifa', country: 'UAE', longitude: 55.2744, latitude: 25.1972, altitude: 500, heading: 270, emoji: '🏙️' },
  { id: 'london', name: 'Big Ben', country: 'UK', longitude: -0.1246, latitude: 51.5007, altitude: 200, heading: 45, emoji: '🏛️' },
  { id: 'sydney', name: 'Opera House', country: 'Australia', longitude: 151.2153, latitude: -33.8568, altitude: 200, heading: 135, emoji: '🎭' },
  { id: 'rio', name: 'Christ the Redeemer', country: 'Brazil', longitude: -43.2105, latitude: -22.9519, altitude: 800, heading: 90, emoji: '🗿' },
  { id: 'sf', name: 'Golden Gate Bridge', country: 'USA', longitude: -122.4783, latitude: 37.8199, altitude: 250, heading: 270, emoji: '🌉' },
  { id: 'giza', name: 'Great Pyramid', country: 'Egypt', longitude: 31.1342, latitude: 29.9792, altitude: 300, heading: 0, emoji: '🔺' },
  { id: 'reykjavik', name: 'Reykjavik', country: 'Iceland', longitude: -21.8174, latitude: 64.1265, altitude: 300, heading: 180, emoji: '🌋' },
  { id: 'singapore', name: 'Marina Bay', country: 'Singapore', longitude: 103.8591, latitude: 1.2868, altitude: 300, heading: 90, emoji: '🏙️' },
  { id: 'barcelona', name: 'Sagrada Familia', country: 'Spain', longitude: 2.1744, latitude: 41.4036, altitude: 300, heading: 0, emoji: '⛪' },
  { id: 'goth', name: 'Gothenburg', country: 'Sweden', longitude: 11.9746, latitude: 57.7089, altitude: 200, heading: 180, emoji: '🇸🇪' },
];

export function LocationSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { teleportTo } = useGameMethod();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredLocations = LOCATIONS.filter(
    loc =>
      loc.name.toLowerCase().includes(search.toLowerCase()) ||
      loc.country.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (location: Location) => {
    teleportTo(location.longitude, location.latitude, location.altitude, location.heading);
    setIsOpen(false);
    setSearch('');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="glass-panel px-4 py-2.5 hover:bg-white/10 transition-all duration-300 group flex items-center gap-2"
        title="Teleport to Location"
      >
        <svg className="w-4 h-4 text-white/60 group-hover:text-white/90 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="text-xs font-medium text-white/80 group-hover:text-white transition-colors">
          Teleport
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-14 right-0 w-80 glass-panel animate-fade-in z-[60]">
          <div className="p-3 border-b border-white/5">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search locations..."
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-future-primary transition-colors"
              autoFocus
            />
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {filteredLocations.length > 0 ? (
              filteredLocations.map((location) => (
                <button
                  key={location.id}
                  onClick={() => handleSelect(location)}
                  className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 group"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{location.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white group-hover:text-future-primary transition-colors">
                        {location.name}
                      </div>
                      <div className="text-xs text-white/50 mt-0.5">
                        {location.country}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-sm text-white/40">
                No locations found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}



