import { useState, useEffect } from 'react';
import { useGameBridge } from './useGameBridge';

export function useVoiceControl() {
  const bridge = useGameBridge();
  const [isActive, setIsActive] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if (bridge) {
      setIsSupported(bridge.isVoiceControlSupported());
      setIsActive(bridge.isVoiceControlActive());
    }
  }, [bridge]);

  const toggle = () => {
    if (bridge) {
      const newState = bridge.toggleVoiceControl();
      setIsActive(newState);
      return newState;
    }
    return false;
  };

  return {
    isActive,
    isSupported,
    toggle,
  };
}
