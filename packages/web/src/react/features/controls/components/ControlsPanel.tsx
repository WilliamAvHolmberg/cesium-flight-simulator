import { useState, useEffect } from 'react';
import { Panel } from '../../../shared/components/Panel';
import { ControlButton } from './ControlButton';
import { VEHICLE_CONTROLS, CAMERA_CONTROLS, MODE_CONTROLS, BUILDER_CONTROLS } from '../constants';
import { useGameMode } from '../../../hooks/useGameMode';

export function ControlsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { mode } = useGameMode();

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
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
        className="fixed bottom-8 left-8 z-50 w-12 h-12 flex items-center justify-center
                   glass-panel hover:bg-white/10 transition-all duration-300
                   text-white/60 hover:text-white text-lg group"
        title="Show Controls (?)"
      >
        <span className="group-hover:scale-110 transition-transform">?</span>
      </button>

      {isOpen && (
        <div className="fixed bottom-24 left-8 z-50 animate-fade-in">
          <Panel title={mode === 'builder' ? 'Builder Controls' : 'Controls'} className="min-w-[280px] max-h-[70vh] overflow-y-auto">
            <div className="space-y-4">
              {mode === 'builder' ? (
                <>
                  <div className="space-y-2.5">
                    <div className="text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-2">
                      Builder Camera
                    </div>
                    {BUILDER_CONTROLS.map((control, idx) => (
                      <ControlButton key={idx} keys={control.keys} description={control.description} />
                    ))}
                  </div>

                  <div className="border-t border-white/5 pt-4 space-y-2.5">
                    <div className="text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-2">
                      Modes
                    </div>
                    {MODE_CONTROLS.map((control, idx) => (
                      <ControlButton key={idx} keys={control.keys} description={control.description} />
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2.5">
                    <div className="text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-2">
                      Vehicle
                    </div>
                    {VEHICLE_CONTROLS.map((control, idx) => (
                      <ControlButton key={idx} keys={control.keys} description={control.description} />
                    ))}
                  </div>

                  <div className="border-t border-white/5 pt-4 space-y-2.5">
                    <div className="text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-2">
                      Camera
                    </div>
                    {CAMERA_CONTROLS.map((control, idx) => (
                      <ControlButton key={idx} keys={control.keys} description={control.description} />
                    ))}
                  </div>

                  <div className="border-t border-white/5 pt-4 space-y-2.5">
                    <div className="text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-2">
                      Modes
                    </div>
                    {MODE_CONTROLS.map((control, idx) => (
                      <ControlButton key={idx} keys={control.keys} description={control.description} />
                    ))}
                  </div>
                </>
              )}

              <div className="border-t border-white/5 pt-3">
                <div className="text-[10px] text-white/30">
                  Press <kbd className="px-1 py-0.5 bg-white/5 rounded text-white/50">?</kbd> to close
                </div>
              </div>
            </div>
          </Panel>
        </div>
      )}
    </>
  );
}


