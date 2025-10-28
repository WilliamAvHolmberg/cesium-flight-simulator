import { useState, useEffect } from 'react';
import { useChallengeBuilder } from '../../hooks/useChallengeBuilder';

export function PlaceList() {
  const { getCurrentChallenge, addPlace, selectPlace, deletePlace } = useChallengeBuilder();
  const [challenge, setChallenge] = useState(getCurrentChallenge());
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setChallenge(getCurrentChallenge());
      setRefreshKey(k => k + 1);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const handleAddPlace = () => {
    const place = addPlace(`Location ${(challenge?.places.length || 0) + 1}`);
    if (place) {
      // Don't select or teleport, just add at current position
      console.log('✅ Location added at current camera position! Click it in the list to select and reposition.');
    }
  };

  const handleSelectPlace = (placeId: string) => {
    selectPlace(placeId);
    setRefreshKey(k => k + 1);
    console.log('📍 Location selected. You can now click on the map to reposition the flag.');
  };

  const handleDeletePlace = (placeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this location?')) {
      deletePlace(placeId);
    }
  };

  return (
    <div className="h-full bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-700 shadow-lg flex flex-col">
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-white">Locations</h2>
          <button
            onClick={handleAddPlace}
            className="px-3 py-1.5 bg-green-600 hover:bg-green-500 rounded-lg text-white text-sm font-semibold transition-colors"
          >
            + Add
          </button>
        </div>
        <p className="text-xs text-slate-400">
          {challenge?.places.length || 0} locations
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {(!challenge?.places || challenge.places.length === 0) ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">📍</div>
            <p className="text-slate-400 text-sm">No locations yet</p>
            <p className="text-slate-500 text-xs mt-1">Click Add to get started</p>
          </div>
        ) : (
          <div className="space-y-2">
            {challenge.places.map((place, index) => (
              <button
                key={place.id}
                onClick={() => handleSelectPlace(place.id)}
                className="w-full p-3 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg border border-slate-600 hover:border-blue-400 transition-all duration-200 text-left group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-slate-400 text-xs font-semibold">#{index + 1}</span>
                      <h3 className="text-white font-semibold truncate">{place.label}</h3>
                    </div>
                    {place.hint && (
                      <p className="text-slate-500 text-xs truncate">💡 {place.hint}</p>
                    )}
                  </div>
                  <button
                    onClick={(e) => handleDeletePlace(place.id, e)}
                    className="ml-2 px-2 py-1 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded transition-colors"
                  >
                    ×
                  </button>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
