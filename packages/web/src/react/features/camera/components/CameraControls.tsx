import { useGameMethod } from '../../../hooks/useGameMethod';
import { useCameraState } from '../hooks/useCameraState';

const CAMERA_LABELS: Record<string, string> = {
  follow: 'Follow',
  followClose: 'Close',
};

export function CameraControls() {
  const { switchCamera } = useGameMethod();
  const { cameraType } = useCameraState();

  return (
    <button 
      onClick={switchCamera}
      className="glass-panel px-4 py-2.5 hover:bg-white/10 transition-all duration-300 group"
      title="Switch Camera (C)"
    >
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 text-white/60 group-hover:text-white/90 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <span className="text-xs font-medium text-white/80 group-hover:text-white transition-colors">
          {CAMERA_LABELS[cameraType]}
        </span>
      </div>
    </button>
  );
}


