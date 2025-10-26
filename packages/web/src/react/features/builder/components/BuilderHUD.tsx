export function BuilderHUD() {
  return (
    <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-fade-in">
      <div className="glass-panel px-5 py-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-future-warning animate-pulse-subtle" />
            <span className="text-xs font-medium text-white/80 tracking-wide">
              Builder Mode - Placing: Waypoints
            </span>
            <div className="text-[10px] text-white/40 ml-1">
              Press <kbd className="px-1 py-0.5 bg-white/5 rounded text-white/50">B</kbd> to exit
            </div>
          </div>
          <div className="text-[10px] text-white/30 border-t border-white/5 pt-2">
            WASD to move cursor • ↑↓ for altitude • <kbd className="px-1 py-0.5 bg-white/5 rounded text-white/50">Space</kbd> to spawn • Mouse to look around
          </div>
        </div>
      </div>
    </div>
  );
}
