import { useGeneration } from '../context/GenerationContext';
import type { GenerationStage } from '../services/types';

const STAGE_LABELS: Record<GenerationStage, string> = {
  preview: 'Generating preview',
  refining: 'Refining textures',
  downloading: 'Downloading model',
  completed: 'Completed',
};

export function GenerationQueue() {
  const { activeTasks, removeTask } = useGeneration();

  if (activeTasks.length === 0) {
    return (
      <div className="glass-panel p-8 text-center">
        <h3 className="text-sm font-semibold text-white mb-1">No Active Tasks</h3>
        <p className="text-xs text-white/50">
          Generated models will appear here while processing
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">
          Generation Queue ({activeTasks.length})
        </h3>
        <span className="text-xs text-white/50">Real-time progress</span>
      </div>

      {activeTasks.map((task) => (
        <div key={task.id} className="glass-panel p-4 space-y-3">
          {/* Task Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-sm font-medium text-white truncate">
                  {task.prompt}
                </h4>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/50">
                <span className="capitalize">{task.mode === 'text-to-3d' ? task.artStyle : 'Image-to-3D'}</span>
                <span>•</span>
                <span>{new Date(task.createdAt).toLocaleTimeString()}</span>
              </div>
            </div>

            {task.status === 'completed' && (
              <button
                onClick={() => removeTask(task.id)}
                className="text-white/40 hover:text-white/60 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-white/70">
                {STAGE_LABELS[task.status]}...
              </span>
              <span className="text-xs text-white/50">{task.progress}%</span>
            </div>
            <div className="h-2 bg-black/30 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  task.error
                    ? 'bg-red-500'
                    : task.status === 'completed'
                    ? 'bg-green-500'
                    : 'bg-future-accent'
                }`}
                style={{ width: `${task.progress}%` }}
              />
            </div>
          </div>

          {/* Error Message */}
          {task.error && (
            <div className="p-2 bg-red-500/20 border border-red-500/30 rounded">
              <p className="text-xs text-red-200">{task.error}</p>
              <button
                onClick={() => removeTask(task.id)}
                className="mt-2 text-xs text-red-300 hover:text-red-200 underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Stage Indicators */}
          <div className="flex items-center gap-2">
            {(['preview', 'refining', 'downloading', 'completed'] as const).map(
              (stage, index) => {
                const stageOrder = ['preview', 'refining', 'downloading', 'completed'];
                const currentIndex = stageOrder.indexOf(task.status);
                const isCompleted = index < currentIndex;
                const isCurrent = index === currentIndex;
                const isUpcoming = index > currentIndex;

                return (
                  <div
                    key={stage}
                    className={`flex-1 h-1 rounded-full transition-all ${
                      isCompleted
                        ? 'bg-green-500'
                        : isCurrent
                        ? 'bg-future-accent animate-pulse'
                        : 'bg-white/10'
                    }`}
                  />
                );
              }
            )}
          </div>

          {/* Image Preview (for image-to-3D mode) */}
          {task.mode === 'image-to-3d' && task.imagePreview && (
            <div className="flex items-center gap-2">
              <img
                src={task.imagePreview}
                alt="Input image"
                className="w-16 h-16 rounded bg-black/30 object-cover"
              />
              <span className="text-xs text-white/50">Source image</span>
            </div>
          )}

          {/* Thumbnail Preview (if available) */}
          {task.thumbnailUrl && (
            <div className="flex items-center gap-2">
              <img
                src={task.thumbnailUrl}
                alt="Preview"
                className="w-16 h-16 rounded bg-black/30 object-cover"
              />
              <span className="text-xs text-white/50">Preview generated</span>
            </div>
          )}
        </div>
      ))}

      {/* Summary */}
      <div className="glass-panel p-3 bg-white/5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/60">
            {activeTasks.filter((t) => t.status !== 'completed' && !t.error).length}{' '}
            in progress
          </span>
          <span className="text-white/60">
            {activeTasks.filter((t) => t.status === 'completed').length} completed
          </span>
          <span className="text-white/60">
            {activeTasks.filter((t) => t.error).length} failed
          </span>
        </div>
      </div>
    </div>
  );
}
