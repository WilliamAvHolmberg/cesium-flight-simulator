import { useState } from 'react';
import { Button } from './Button';

export function IntroScreen() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[180] bg-black/60 backdrop-blur-lg flex items-center justify-center animate-fade-in">
      <div className="max-w-2xl w-full mx-4">
        <div className="glass-panel p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-future-primary to-future-secondary bg-clip-text text-transparent">
              Welcome to Glenn
            </h1>
            <p className="text-white/60 text-sm">
              Master the skies with these simple controls
            </p>
          </div>

          {/* Controls Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Flight Controls */}
            <div className="space-y-3">
              <h3 className="text-xs uppercase tracking-wider text-white/40 font-semibold">Flight</h3>
              <div className="space-y-2">
                <ControlRow keys={['W']} action="Throttle" />
                <ControlRow keys={['S']} action="Brake" />
                <ControlRow keys={['A', 'D', '←', '→']} action="Roll" />
              </div>
            </div>

            {/* System Controls */}
            <div className="space-y-3">
              <h3 className="text-xs uppercase tracking-wider text-white/40 font-semibold">System</h3>
              <div className="space-y-2">
                <ControlRow keys={['C']} action="Switch Camera" />
                <ControlRow keys={['M']} action="Toggle Mode" />
                <ControlRow keys={['?']} action="Show Controls" />
                <ControlRow keys={['~']} action="Debug Panel" />
              </div>
            </div>
          </div>

          {/* Quick Tips */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <h3 className="text-xs uppercase tracking-wider text-future-primary font-semibold mb-2">Quick Tips</h3>
            <ul className="space-y-1.5 text-xs text-white/60">
              <li className="flex items-start gap-2">
                <span className="text-future-primary mt-0.5">•</span>
                <span>Use the <strong className="text-white/80">Teleport button</strong> to instantly travel to iconic locations</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-future-primary mt-0.5">•</span>
                <span>Maintain altitude to avoid crashing into terrain</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-future-primary mt-0.5">•</span>
                <span>Press <strong className="text-white/80">M</strong> to switch between flight and ground mode</span>
              </li>
            </ul>
          </div>

          {/* Start Button */}
          <div className="flex justify-center pt-2">
            <Button
              onClick={() => setIsVisible(false)}
              variant="primary"
              size="lg"
              className="px-12"
            >
              Start Flying
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ControlRowProps {
  keys: string[];
  action: string;
}

function ControlRow({ keys, action }: ControlRowProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex gap-1.5">
        {keys.map((key) => (
          <kbd
            key={key}
            className="px-2 py-1 text-[10px] font-medium text-white bg-white/5 border border-white/10 rounded-lg min-w-[24px] text-center"
          >
            {key}
          </kbd>
        ))}
      </div>
      <span className="text-xs text-white/70 flex-1">{action}</span>
    </div>
  );
}


