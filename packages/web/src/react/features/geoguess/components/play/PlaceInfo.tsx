import { useState, useEffect } from 'react';
import { useChallengePlayer } from '../../hooks/useChallengePlayer';

export function PlaceInfo() {
  const { getCurrentPlace } = useChallengePlayer();
  const [place, setPlace] = useState(getCurrentPlace());
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const current = getCurrentPlace();
      setPlace(current);
      if (current?.id !== place?.id) {
        setShowHint(false);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [place?.id]);

  if (!place) return null;

  return (
    <div className="bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-700 shadow-lg p-4 max-w-sm">
      <div className="text-xs text-slate-400 mb-1">Find this location</div>
      <div className="text-xl font-bold text-white mb-3">{place.label}</div>
      
      {place.hint && (
        <div>
          {!showHint ? (
            <button
              onClick={() => setShowHint(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-white text-sm font-semibold transition-colors"
            >
              💡 Show Hint
            </button>
          ) : (
            <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-600">
              <div className="text-xs text-slate-400 mb-1">Hint:</div>
              <div className="text-sm text-white">{place.hint}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
