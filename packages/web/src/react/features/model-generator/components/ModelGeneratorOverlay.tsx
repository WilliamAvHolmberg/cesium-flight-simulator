import { useGeneration } from '../context/GenerationContext';
import { ModelGeneratorPanel } from './ModelGeneratorPanel';
import { GenerationQueue } from './GenerationQueue';
import { ModelInventory } from './ModelInventory';
import { Button } from '../../../shared/components/Button';

export function ModelGeneratorOverlay() {
  const { isOverlayOpen, setIsOverlayOpen, activeTab, setActiveTab, activeTasks } =
    useGeneration();

  if (!isOverlayOpen) {
    return (
      <div className="fixed bottom-24 right-4 z-50 pointer-events-auto">
        <button
          onClick={() => setIsOverlayOpen(true)}
          className="glass-panel px-4 py-3 hover:bg-white/10 transition-all group"
          title="Open AI Model Generator"
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎨</span>
            <div className="text-left">
              <div className="text-xs font-semibold text-white">AI Models</div>
              {activeTasks.length > 0 && (
                <div className="text-xs text-future-accent">
                  {activeTasks.length} generating...
                </div>
              )}
            </div>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
        onClick={() => setIsOverlayOpen(false)}
      />

      {/* Main Panel */}
      <div className="absolute right-4 top-4 bottom-4 w-full max-w-2xl pointer-events-auto flex flex-col">
        <div className="glass-panel flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎨</span>
              <div>
                <h2 className="text-lg font-bold text-white">AI Model Generator</h2>
                <p className="text-xs text-white/50">
                  Create 3D models with MeshyAI
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOverlayOpen(false)}
              className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded transition-all"
              title="Close"
            >
              <span className="text-white/70 text-xl">✕</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/10 px-4">
            <button
              onClick={() => setActiveTab('generator')}
              className={`px-4 py-3 text-sm font-medium transition-all relative ${
                activeTab === 'generator'
                  ? 'text-white'
                  : 'text-white/50 hover:text-white/70'
              }`}
            >
              Generator
              {activeTab === 'generator' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-future-accent" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('queue')}
              className={`px-4 py-3 text-sm font-medium transition-all relative ${
                activeTab === 'queue' ? 'text-white' : 'text-white/50 hover:text-white/70'
              }`}
            >
              Queue
              {activeTasks.length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 bg-future-accent rounded-full text-xs">
                  {activeTasks.length}
                </span>
              )}
              {activeTab === 'queue' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-future-accent" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-4 py-3 text-sm font-medium transition-all relative ${
                activeTab === 'inventory'
                  ? 'text-white'
                  : 'text-white/50 hover:text-white/70'
              }`}
            >
              Inventory
              {activeTab === 'inventory' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-future-accent" />
              )}
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'generator' && <ModelGeneratorPanel />}
            {activeTab === 'queue' && <GenerationQueue />}
            {activeTab === 'inventory' && <ModelInventory />}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-white/10 bg-black/20">
            <div className="flex items-center justify-between text-xs">
              <div className="text-white/50">
                Powered by{' '}
                <a
                  href="https://www.meshy.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-future-accent hover:text-future-accent/80 underline"
                >
                  MeshyAI
                </a>
              </div>
              <div className="flex items-center gap-4 text-white/50">
                <a
                  href="https://docs.meshy.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white/70"
                >
                  Docs
                </a>
                <a
                  href="https://www.meshy.ai/pricing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white/70"
                >
                  Pricing
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
