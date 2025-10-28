import { useVoiceControl } from '../../../hooks/useVoiceControl';

export function VoiceControlButton() {
  const { isActive, isSupported, toggle } = useVoiceControl();

  if (!isSupported) {
    return null;
  }

  return (
    <button
      onClick={toggle}
      className={`
        glass-panel px-4 py-2 transition-all duration-300
        ${isActive
          ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
          : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'}
        flex items-center gap-2 rounded-lg
      `}
      title={isActive ? 'Voice control active - Click to stop' : 'Click to activate voice control'}
    >
      <svg
        className={`w-5 h-5 ${isActive ? 'animate-pulse' : ''}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
        />
      </svg>
      <span className="text-sm font-medium">
        {isActive ? 'Voice Active' : 'Voice Control'}
      </span>
      {isActive && (
        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
      )}
    </button>
  );
}
