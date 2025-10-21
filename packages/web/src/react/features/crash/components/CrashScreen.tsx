import { useState, useEffect } from 'react';
import { useGameEvent } from '../../../hooks/useGameEvent';
import { useGameMethod } from '../../../hooks/useGameMethod';
import { Button } from '../../../shared/components/Button';

export function CrashScreen() {
  const [isCrashed, setIsCrashed] = useState(false);
  const crashData = useGameEvent('crashed');
  const { restart } = useGameMethod();

  useEffect(() => {
    if (crashData) {
      setIsCrashed(crashData.crashed);
    }
  }, [crashData]);

  useEffect(() => {
    if (!isCrashed) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        restart();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isCrashed, restart]);

  if (!isCrashed) return null;

  return (
    <div className="fixed inset-0 z-[150] bg-black/50 backdrop-blur-md flex items-center justify-center animate-fade-in">
      <div className="relative max-w-md w-full mx-4">
        <div className="glass-panel p-8 text-center space-y-6">
          <div className="text-5xl mb-2">💥</div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-future-primary to-future-secondary bg-clip-text text-transparent">
              Crashed
            </h2>
            <p className="text-white/50 text-sm">
              Don't worry, happens to the best pilots
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <Button
              onClick={restart}
              variant="primary"
              size="lg"
              className="w-full"
            >
              Restart Flight
            </Button>
            
            <div className="text-[10px] text-white/30">
              Press <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-white/50 font-mono text-[10px]">R</kbd> to restart
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

