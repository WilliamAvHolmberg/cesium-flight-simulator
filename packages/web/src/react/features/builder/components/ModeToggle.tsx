import { useGameMode } from '../../../hooks/useGameMode';

export function ModeToggle() {
  const { mode, toggleBuilder } = useGameMode();
  
  return (
    <button
      onClick={toggleBuilder}
      className="glass-panel px-4 py-2.5 hover:bg-white/10 transition-all duration-300
                 text-white/80 hover:text-white text-xs font-medium tracking-wide
                 flex items-center gap-2 group"
      title={mode === 'play' ? 'Enter Builder Mode (B)' : 'Exit Builder Mode (B)'}
    >
      <div className={`w-1.5 h-1.5 rounded-full ${mode === 'builder' ? 'bg-future-warning' : 'bg-future-primary'} animate-pulse-subtle`} />
      <span>{mode === 'play' ? 'Builder' : 'Play'}</span>
    </button>
  );
}
