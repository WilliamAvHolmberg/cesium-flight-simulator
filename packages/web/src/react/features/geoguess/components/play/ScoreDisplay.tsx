import { useState, useEffect } from 'react';
import { useChallengePlayer } from '../../hooks/useChallengePlayer';

export function ScoreDisplay() {
  const { getCurrentSession } = useChallengePlayer();
  const [session, setSession] = useState(getCurrentSession());

  useEffect(() => {
    const interval = setInterval(() => {
      setSession(getCurrentSession());
    }, 500);

    return () => clearInterval(interval);
  }, []);

  if (!session) return null;

  return (
    <div className="bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-700 shadow-lg p-4 min-w-[200px]">
      <div className="text-xs text-slate-400 mb-1">Total Score</div>
      <div className="text-3xl font-bold text-green-400">{session.totalScore}</div>
      
      <div className="mt-3 pt-3 border-t border-slate-700">
        <div className="text-xs text-slate-400">
          Round {session.currentPlaceIndex + 1}
        </div>
      </div>
    </div>
  );
}
