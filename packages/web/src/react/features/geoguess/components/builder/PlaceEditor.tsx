import { useState, useEffect } from 'react';
import { useChallengeBuilder } from '../../hooks/useChallengeBuilder';

export function PlaceEditor() {
  const { getSelectedPlace, updatePlace } = useChallengeBuilder();
  const [selectedPlace, setSelectedPlace] = useState(getSelectedPlace());
  const [label, setLabel] = useState('');
  const [hint, setHint] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      const place = getSelectedPlace();
      setSelectedPlace(place);
      if (place) {
        setLabel(place.label || '');
        setHint(place.hint || '');
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const handleSave = () => {
    if (!selectedPlace) return;
    
    updatePlace(selectedPlace.id, {
      label: label || 'Unnamed Location',
      hint: hint || undefined,
    });
  };

  if (!selectedPlace) {
    return null;
  }

  return (
    <div className="bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-700 shadow-lg p-4">
      <h3 className="text-sm font-bold text-white mb-3">Edit Location</h3>
      
      <div className="space-y-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Label</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={handleSave}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-400 transition-colors"
            placeholder="Location name..."
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Hint (optional)</label>
          <input
            type="text"
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            onBlur={handleSave}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-400 transition-colors"
            placeholder="Give players a hint..."
          />
        </div>

        <div className="pt-2 border-t border-slate-700">
          <div className="text-xs text-slate-500">
            <div>Lat: {selectedPlace.position.latitude.toFixed(6)}</div>
            <div>Lon: {selectedPlace.position.longitude.toFixed(6)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
