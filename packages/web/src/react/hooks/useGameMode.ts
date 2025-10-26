import { useGameMethod } from './useGameMethod';
import { useGameEventCallback } from './useGameEvent';
import { useState, useEffect } from 'react';
import type { ModeChangedData } from '../../cesium/bridge/types';

export type GameMode = 'play' | 'builder';

export function useGameMode() {
  const [mode, setMode] = useState<GameMode>('play');
  const methods = useGameMethod();

  useGameEventCallback('modeChanged', (data: ModeChangedData) => {
    setMode(data.mode);
  });

  useEffect(() => {
    const currentMode = methods.getMode();
    if (currentMode) {
      setMode(currentMode);
    }
  }, [methods]);

  return {
    mode,
    isBuilder: mode === 'builder',
    isPlay: mode === 'play',
    toggleBuilder: methods.toggleBuilderMode,
    setMode: methods.setMode,
  };
}
