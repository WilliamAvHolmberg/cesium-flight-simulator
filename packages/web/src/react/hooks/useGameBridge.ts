import { useContext, createContext } from 'react';
import type { GameBridge } from '../../cesium/bridge/GameBridge';

const GameBridgeContext = createContext<GameBridge | null>(null);

export const GameBridgeProvider = GameBridgeContext.Provider;

export function useGameBridge(): GameBridge {
  const bridge = useContext(GameBridgeContext);
  if (!bridge) {
    throw new Error('useGameBridge must be used within a GameBridgeProvider');
  }
  return bridge;
}




