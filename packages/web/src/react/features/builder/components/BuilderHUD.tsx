export function BuilderHUD() {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      <div className="bg-blue-600/95 backdrop-blur-sm px-6 py-3 rounded-lg border-2 border-blue-400 shadow-xl">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏗️</span>
          <div>
            <div className="font-bold text-white text-lg">Builder Mode</div>
            <div className="text-xs text-blue-100">Press <kbd className="px-1.5 py-0.5 bg-blue-800 rounded">B</kbd> to exit</div>
          </div>
        </div>
      </div>
    </div>
  );
}
