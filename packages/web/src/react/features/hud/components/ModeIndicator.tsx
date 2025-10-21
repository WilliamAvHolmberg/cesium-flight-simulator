import { useGameEvent } from '../../../hooks/useGameEvent';
import { useGameMethod } from '../../../hooks/useGameMethod';
import { useState, useEffect } from 'react';

export function ModeIndicator() {
  const { getRoverMode } = useGameMethod();
  const [isRoverMode, setIsRoverMode] = useState(getRoverMode());

  const roverModeData = useGameEvent('roverModeChanged');

  useEffect(() => {
    if (roverModeData) {
      setIsRoverMode(roverModeData.enabled);
    }
  }, [roverModeData]);

  return (
    <div className="flex items-center gap-3 px-5 py-2.5 glass-panel">
      <div className={`w-1.5 h-1.5 rounded-full ${isRoverMode ? 'bg-future-secondary' : 'bg-future-primary'} animate-pulse-subtle`} />
      <span className="text-xs font-medium text-white/80 tracking-wide">
        {isRoverMode ? 'Ground Mode' : 'Flight Mode'}
      </span>
    </div>
  );
}


