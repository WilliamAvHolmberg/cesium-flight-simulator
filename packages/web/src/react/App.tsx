import { IntroScreen } from './shared/components/IntroScreen';
import { DebugPanel } from './features/debug/components/DebugPanel';
import { PlayModeUI } from './layouts/PlayModeUI';
import { BuilderModeUI } from './layouts/BuilderModeUI';
import { ModeToggle } from './features/builder/components/ModeToggle';
import { useGameMode } from './hooks/useGameMode';
import { ThrottleSlider } from './features/controls/components/mobile/ThrottleSlider';
import { isMobileDevice } from './shared/utils/mobileDetect';
import { useGameMethod } from './hooks/useGameMethod';
import { HUD } from './features/hud/components/HUD';
import { CrashScreen } from './features/crash/components/CrashScreen';

export function App() {
  const { mode } = useGameMode();

  const isMobile = isMobileDevice();
  const { setThrottle } = useGameMethod();

  const handleThrottleChange = (percent: number) => {
    setThrottle(percent / 100);
  };

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
      {mode === 'play' && !isMobile && <PlayModeUI />}
      {mode === 'builder' && <BuilderModeUI />}
      <HUD   />
      {isMobile && <ThrottleSlider onChange={handleThrottleChange} />}
      <CrashScreen />
    </>
  );
}


