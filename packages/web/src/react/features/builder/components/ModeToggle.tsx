import { useGameMode } from '../../../hooks/useGameMode';

export function ModeToggle() {
  const { mode, toggleBuilder } = useGameMode();
  
  return (
    <button
      onClick={toggleBuilder}
      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium shadow-lg transition-colors"
    >
      {mode === 'play' ? '🏗️ Enter Builder' : '🎮 Exit Builder'}
    </button>
  );
}
