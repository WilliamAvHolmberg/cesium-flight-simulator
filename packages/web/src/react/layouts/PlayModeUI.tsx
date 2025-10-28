import { HUD } from '../features/hud/components/HUD';
import { ControlsPanel } from '../features/controls/components/ControlsPanel';
import { CameraControls } from '../features/camera/components/CameraControls';
import { CrashScreen } from '../features/crash/components/CrashScreen';
import { MiniMap } from '../features/minimap/components/MiniMap';
import { VoiceControlButton } from '../features/voice/components/VoiceControlButton';

export function PlayModeUI() {
  return (
    <>
      <ControlsPanel />
      <div className="fixed top-8 right-8 z-50 flex gap-2 pointer-events-auto">
        <VoiceControlButton />
        <CameraControls />
      </div>
      <HUD />
      <MiniMap />
      <CrashScreen />
    </>
  );
}
