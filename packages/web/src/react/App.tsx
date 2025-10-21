import { HUD } from './features/hud/components/HUD';
import { ControlsPanel } from './features/controls/components/ControlsPanel';
import { CameraControls } from './features/camera/components/CameraControls';
import { DebugPanel } from './features/debug/components/DebugPanel';
import { LocationSelector } from './features/location/components/LocationSelector';
import { CrashScreen } from './features/crash/components/CrashScreen';
import { IntroScreen } from './shared/components/IntroScreen';
import { MiniMap } from './features/minimap/components/MiniMap';

export function App() {
  return (
    <>
      <IntroScreen />
      <ControlsPanel />
      <div className="fixed top-8 right-8 z-50 flex gap-2 pointer-events-auto">
        <LocationSelector />
        <CameraControls />
      </div>
      <HUD />
      <DebugPanel />
      <MiniMap />
      <CrashScreen />
    </>
  );
}


