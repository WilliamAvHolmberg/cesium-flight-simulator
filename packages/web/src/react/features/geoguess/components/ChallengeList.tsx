import { ChallengeStorage } from '../../../../cesium/geoguess/storage';
import type { Challenge } from '../../../../cesium/geoguess/types';

interface ChallengeListProps {
  onSelectChallenge: (challengeId: string) => void;
}

export function ChallengeList({ onSelectChallenge }: ChallengeListProps) {
  const challenges = ChallengeStorage.loadChallenges();

  if (challenges.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🗺️</div>
        <p className="text-slate-400 text-lg">No challenges yet!</p>
        <p className="text-slate-500 text-sm mt-2">Create your first challenge to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {challenges.map((challenge) => {
        const bestScore = ChallengeStorage.getBestScore(challenge.id);
        
        return (
          <button
            key={challenge.id}
            onClick={() => onSelectChallenge(challenge.id)}
            className="w-full p-4 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl border border-slate-600 hover:border-blue-400 transition-all duration-200 text-left group"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                  {challenge.name}
                </h3>
                {challenge.description && (
                  <p className="text-slate-400 text-sm mt-1">{challenge.description}</p>
                )}
                <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                  <span>📍 {challenge.places.length} locations</span>
                  {challenge.category && <span>🏷️ {challenge.category}</span>}
                  {challenge.timeLimit && <span>⏱️ {challenge.timeLimit}s per location</span>}
                </div>
              </div>
              
              {bestScore && (
                <div className="ml-4 text-right">
                  <div className="text-xs text-slate-500">Best Score</div>
                  <div className="text-xl font-bold text-green-400">
                    {bestScore.score}
                  </div>
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
