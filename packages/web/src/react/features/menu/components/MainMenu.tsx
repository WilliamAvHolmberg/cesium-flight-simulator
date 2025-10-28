import { useState } from 'react';
import { Button } from '../../../shared/components/Button';

interface MainMenuProps {
  onSelectMode: (mode: 'flightsim' | 'geoguess') => void;
}

export function MainMenu({ onSelectMode }: MainMenuProps) {
  const [selectedMode, setSelectedMode] = useState<'flightsim' | 'geoguess' | null>(null);

  const handleSelect = (mode: 'flightsim' | 'geoguess') => {
    setSelectedMode(mode);
    setTimeout(() => {
      onSelectMode(mode);
    }, 300);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-auto">
      <div className="bg-slate-900/90 backdrop-blur-md p-8 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 border border-slate-700">
        <h1 className="text-4xl font-bold text-white mb-4 text-center">
          Welcome to Flight World
        </h1>
        <p className="text-slate-300 text-center mb-8">
          Choose your adventure
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => handleSelect('flightsim')}
            className={`
              group relative p-6 rounded-xl border-2 transition-all duration-300
              ${selectedMode === 'flightsim' 
                ? 'border-blue-500 bg-blue-500/20 scale-95' 
                : 'border-slate-600 hover:border-blue-400 hover:bg-slate-800/50'}
            `}
          >
            <div className="text-5xl mb-4">✈️</div>
            <h2 className="text-2xl font-bold text-white mb-2">Flight Simulator</h2>
            <p className="text-slate-300 text-sm">
              Fly freely around the world with realistic physics and controls
            </p>
            <div className="absolute inset-0 bg-blue-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </button>

          <button
            onClick={() => handleSelect('geoguess')}
            className={`
              group relative p-6 rounded-xl border-2 transition-all duration-300
              ${selectedMode === 'geoguess' 
                ? 'border-green-500 bg-green-500/20 scale-95' 
                : 'border-slate-600 hover:border-green-400 hover:bg-slate-800/50'}
            `}
          >
            <div className="text-5xl mb-4">🗺️</div>
            <h2 className="text-2xl font-bold text-white mb-2">GeoGuess</h2>
            <p className="text-slate-300 text-sm">
              Create and play location guessing challenges around the world
            </p>
            <div className="absolute inset-0 bg-green-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </button>
        </div>
      </div>
    </div>
  );
}
