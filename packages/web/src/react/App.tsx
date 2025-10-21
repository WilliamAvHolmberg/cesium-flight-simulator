import { IntroScreen } from './shared/components/IntroScreen';
import { DebugPanel } from './features/debug/components/DebugPanel';
import { PlayModeUI } from './layouts/PlayModeUI';
import { BuilderModeUI } from './layouts/BuilderModeUI';
import { ModeToggle } from './features/builder/components/ModeToggle';
import { useGameMode } from './hooks/useGameMode';

export function App() {
  const { mode } = useGameMode();

  return (
    <>
      {/* Global UI - always visible */}
      <IntroScreen />
      <DebugPanel />
      
      {/* Mode toggle button (temporary for testing) */}
      <div className="fixed bottom-4 right-4 z-50 pointer-events-auto">
        <ModeToggle />
      </div>
      
      {/* Mode-specific UI */}
      {mode === 'play' && <PlayModeUI />}
      {mode === 'builder' && <BuilderModeUI />}
    </>
  );
}


