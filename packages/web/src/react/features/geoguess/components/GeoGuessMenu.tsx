import { useState } from 'react';
import { Button } from '../../../shared/components/Button';
import { ChallengeList } from './ChallengeList';

interface GeoGuessMenuProps {
  onStartBuilder: () => void;
  onPlayChallenge: (challengeId: string) => void;
  onBackToMain: () => void;
}

export function GeoGuessMenu({ onStartBuilder, onPlayChallenge, onBackToMain }: GeoGuessMenuProps) {
  const [view, setView] = useState<'main' | 'play'>('main');

  if (view === 'play') {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-auto">
        <div className="bg-slate-900/90 backdrop-blur-md p-8 rounded-2xl shadow-2xl max-w-4xl w-full mx-4 border border-slate-700 max-h-[80vh] flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-white">Select Challenge</h2>
            <button
              onClick={() => setView('main')}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
            >
              ← Back
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <ChallengeList onSelectChallenge={onPlayChallenge} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-auto">
      <div className="bg-slate-900/90 backdrop-blur-md p-8 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 border border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-4xl font-bold text-white">GeoGuess</h1>
          <button
            onClick={onBackToMain}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
          >
            ← Main Menu
          </button>
        </div>
        <p className="text-slate-300 text-center mb-8">
          Create your own location challenges or play existing ones
        </p>
        
        <div className="grid grid-cols-1 gap-4">
          <button
            onClick={onStartBuilder}
            className="group relative p-6 rounded-xl border-2 border-slate-600 hover:border-green-400 hover:bg-slate-800/50 transition-all duration-300"
          >
            <div className="text-4xl mb-3">🏗️</div>
            <h2 className="text-xl font-bold text-white mb-2">Create Challenge</h2>
            <p className="text-slate-300 text-sm">
              Build your own GeoGuess challenge with custom locations
            </p>
            <div className="absolute inset-0 bg-green-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </button>

          <button
            onClick={() => setView('play')}
            className="group relative p-6 rounded-xl border-2 border-slate-600 hover:border-blue-400 hover:bg-slate-800/50 transition-all duration-300"
          >
            <div className="text-4xl mb-3">🎮</div>
            <h2 className="text-xl font-bold text-white mb-2">Play Challenge</h2>
            <p className="text-slate-300 text-sm">
              Test your geography knowledge with existing challenges
            </p>
            <div className="absolute inset-0 bg-blue-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </button>
        </div>
      </div>
    </div>
  );
}
