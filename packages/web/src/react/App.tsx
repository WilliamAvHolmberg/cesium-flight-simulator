import { IntroScreen } from './shared/components/IntroScreen';
import { DebugPanel } from './features/debug/components/DebugPanel';
import { PlayModeUI } from './layouts/PlayModeUI';
import { BuilderModeUI } from './layouts/BuilderModeUI';
import { ModeToggle } from './features/builder/components/ModeToggle';
import { useGameMode } from './hooks/useGameMode';
import { MiniMap } from './features/minimap/components/MiniMap';
import { ThrottleSlider } from './features/controls/components/mobile/ThrottleSlider';
import { isMobileDevice } from './shared/utils/mobileDetect';
import { useGameMethod } from './hooks/useGameMethod';
import { HUD } from './features/hud/components/HUD';
import { ControlsPanel } from './features/controls/components/ControlsPanel';
import { CameraControls } from './features/camera/components/CameraControls';
import { LocationSelector } from './features/location/components/LocationSelector';
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
      {mode === 'play' && <PlayModeUI />}
      {mode === 'builder' && <BuilderModeUI />}
      {!isMobile && <ControlsPanel />}
      {!isMobile && (
        <div className="fixed top-8 right-8 z-50 flex gap-2 pointer-events-auto">
          <LocationSelector />
          <CameraControls />
        </div>
      )}
      <HUD   />
      {!isMobile && <DebugPanel />}
      {!isMobile && <MiniMap />}
      {isMobile && <ThrottleSlider onChange={handleThrottleChange} />}
      <CrashScreen />
    </>
  );
}


