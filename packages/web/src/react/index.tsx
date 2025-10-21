import { createRoot } from 'react-dom/client';
import { App } from './App';
import { GameBridgeProvider } from './hooks/useGameBridge';
import type { GameBridge } from '../cesium/bridge/GameBridge';
import './index.css';

export function mountReactUI(gameBridge: GameBridge) {
  const rootElement = document.getElementById('react-root');
  if (!rootElement) {
    throw new Error('React root element not found');
  }

  const root = createRoot(rootElement);
  root.render(
    <GameBridgeProvider value={gameBridge}>
      <App />
    </GameBridgeProvider>
  );

  return root;
}




