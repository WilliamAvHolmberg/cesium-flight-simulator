import { useState, useEffect } from 'react';
import { Panel } from '../../../shared/components/Panel';
import { Button } from '../../../shared/components/Button';
import { useGameMethod } from '../../../hooks/useGameMethod';
import { useDebugInfo } from '../hooks/useDebugInfo';
import { useQualitySettings } from '../hooks/useQualitySettings';
import { QualityPresets } from './QualityPresets';
import { QualityControls } from './QualityControls';

export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { toggleCollisionDetection, toggleRoverMode, toggleVehicleType, switchCamera } = useGameMethod();
  const { collisionEnabled, heightLockEnabled, fps } = useDebugInfo();
  const { config, updateSetting, applyPreset } = useQualitySettings();

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === '`' || e.key === '~') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-8 left-8 z-50 w-10 h-10 flex items-center justify-center
                   glass-panel hover:bg-white/10 transition-all duration-300
                   text-white/60 hover:text-white text-sm font-mono group"
        title="Toggle Debug Panel (`)"
      >
        <span className="group-hover:scale-110 transition-transform">~</span>
      </button>

      {isOpen && (
        <div className="fixed top-20 left-8 z-50 animate-slide-in max-h-[calc(100vh-120px)] overflow-y-auto">
          <Panel title="Debug & Quality Settings" className="min-w-[280px] max-w-[320px]">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/80 font-medium">FPS</span>
                <span className={`font-mono font-semibold text-lg ${
                  fps >= 50 ? 'text-green-400' : fps >= 30 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {fps}
                </span>
              </div>

              <div className="border-t border-white/5 pt-4">
                <QualityPresets onApplyPreset={applyPreset} />
              </div>

              <div className="border-t border-white/5 pt-4">
                <QualityControls config={config} onUpdateSetting={updateSetting} />
              </div>

              <div className="border-t border-white/10 pt-4 space-y-2">
                <div className="text-[11px] text-white/70 uppercase tracking-wider mb-2 font-medium">Game Controls</div>
                <Button
                  onClick={switchCamera}
                  variant="secondary"
                  size="sm"
                  className="w-full"
                >
                  📷 Switch Camera (C)
                </Button>

                <Button
                  onClick={toggleCollisionDetection}
                  variant={collisionEnabled ? 'primary' : 'secondary'}
                  size="sm"
                  className="w-full"
                >
                  🛡️ Collision {collisionEnabled ? 'On' : 'Off'}
                </Button>

                <Button
                  onClick={toggleRoverMode}
                  variant={heightLockEnabled ? 'primary' : 'secondary'}
                  size="sm"
                  className="w-full"
                >
                  🔒 Height Lock {heightLockEnabled ? 'On' : 'Off'}
                </Button>

                <Button
                  onClick={toggleVehicleType}
                  variant="secondary"
                  size="sm"
                  className="w-full"
                >
                  🔄 Switch Vehicle (M)
                </Button>
              </div>

              <div className="border-t border-white/10 pt-3">
                <div className="text-[10px] text-white/50">
                  Press <kbd className="px-1 py-0.5 bg-white/10 rounded text-white/70">~</kbd> to close
                </div>
              </div>
            </div>
          </Panel>
        </div>
      )}
    </>
  );
}


