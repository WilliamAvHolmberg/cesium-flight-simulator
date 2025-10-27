import { useState, useEffect } from 'react';
import { useChallengePlayer } from '../../hooks/useChallengePlayer';
import { formatDistance } from '../../../../../cesium/geoguess/scoring';
import { ChallengeStorage } from '../../../../../cesium/geoguess/storage';
import type { Position, Guess } from '../../../../../cesium/geoguess/types';

export function GuessingMap() {
  const { getCurrentSession, getCurrentPlace, submitGuess, nextPlace } = useChallengePlayer();
  const [expanded, setExpanded] = useState(false);
  const [guessPosition, setGuessPosition] = useState<Position | null>(null);
  const [lastGuess, setLastGuess] = useState<Guess | null>(null);
  const [showingResult, setShowingResult] = useState(false);
  const [challengeComplete, setChallengeComplete] = useState(false);

  useEffect(() => {
    setGuessPosition(null);
    setLastGuess(null);
    setShowingResult(false);
  }, [getCurrentPlace()?.id]);

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!expanded || showingResult) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const longitude = (x / rect.width) * 360 - 180;
    const latitude = 90 - (y / rect.height) * 180;
    
    setGuessPosition({ latitude, longitude, height: 0 });
  };

  const handleConfirm = () => {
    if (!guessPosition) return;

    const guess = submitGuess(guessPosition);
    setLastGuess(guess);
    setShowingResult(true);
  };

  const handleNext = () => {
    const hasNext = nextPlace();
    
    if (!hasNext) {
      const session = getCurrentSession();
      if (session) {
        ChallengeStorage.saveScore({
          challengeId: session.challengeId,
          score: session.totalScore,
          completedAt: Date.now(),
          guesses: session.guesses,
        });
      }
      setChallengeComplete(true);
    } else {
      setShowingResult(false);
      setGuessPosition(null);
      setLastGuess(null);
    }
  };

  const handleBackToMenu = () => {
    window.location.reload();
  };

  if (challengeComplete) {
    const session = getCurrentSession();
    
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-auto">
        <div className="bg-slate-900/90 backdrop-blur-md p-8 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 border border-slate-700 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-4xl font-bold text-white mb-4">Challenge Complete!</h2>
          
          <div className="my-8">
            <div className="text-sm text-slate-400 mb-2">Final Score</div>
            <div className="text-6xl font-bold text-green-400">{session?.totalScore || 0}</div>
          </div>

          <div className="space-y-2 mb-8">
            {session?.guesses.map((guess, i) => (
              <div key={i} className="p-3 bg-slate-800/50 rounded-lg border border-slate-600 text-left">
                <div className="flex justify-between items-center">
                  <div className="text-white font-semibold">Round {i + 1}</div>
                  <div className="text-green-400 font-bold">{guess.points} pts</div>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Distance: {formatDistance(guess.distance)}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleBackToMenu}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-semibold transition-colors"
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  if (showingResult && lastGuess) {
    return (
      <div className="bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-700 shadow-lg p-6 w-96">
        <h3 className="text-2xl font-bold text-white mb-4 text-center">Result</h3>
        
        <div className="space-y-4 mb-6">
          <div className="text-center">
            <div className="text-sm text-slate-400 mb-1">Distance</div>
            <div className="text-3xl font-bold text-blue-400">{formatDistance(lastGuess.distance)}</div>
          </div>
          
          <div className="text-center">
            <div className="text-sm text-slate-400 mb-1">Points Earned</div>
            <div className="text-4xl font-bold text-green-400">+{lastGuess.points}</div>
          </div>
        </div>

        <button
          onClick={handleNext}
          className="w-full px-6 py-3 bg-green-600 hover:bg-green-500 rounded-lg text-white font-semibold transition-colors"
        >
          Next Location →
        </button>
      </div>
    );
  }

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="px-6 py-3 bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-700 shadow-lg hover:bg-slate-800/90 transition-colors"
      >
        <span className="text-white font-semibold">🗺️ Open Map to Guess</span>
      </button>
    );
  }

  return (
    <div className="w-[500px] h-[400px] bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-700 shadow-lg overflow-hidden flex flex-col">
      <div className="p-3 border-b border-slate-700 flex items-center justify-between">
        <h3 className="text-white font-semibold">Make Your Guess</h3>
        <button
          onClick={() => setExpanded(false)}
          className="text-slate-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      <div
        className="flex-1 relative bg-slate-800 cursor-crosshair"
        onClick={handleMapClick}
        style={{
          backgroundImage: 'url(https://upload.wikimedia.org/wikipedia/commons/8/83/Equirectangular_projection_SW.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {guessPosition && (
          <div
            className="absolute w-4 h-4 bg-blue-500 rounded-full border-2 border-white transform -translate-x-1/2 -translate-y-1/2 animate-pulse"
            style={{
              left: `${((guessPosition.longitude + 180) / 360) * 100}%`,
              top: `${((90 - guessPosition.latitude) / 180) * 100}%`,
            }}
          />
        )}
      </div>

      <div className="p-3 border-t border-slate-700">
        {guessPosition ? (
          <button
            onClick={handleConfirm}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-white font-semibold transition-colors"
          >
            ✓ Confirm Guess
          </button>
        ) : (
          <div className="text-center text-sm text-slate-400">
            Click on the map to place your guess
          </div>
        )}
      </div>
    </div>
  );
}
