import { useState } from 'react';
import { useGeneration } from '../context/GenerationContext';
import { formatFileSize, formatRelativeTime } from '../utils/modelUtils';
import { Button } from '../../../shared/components/Button';
import { useGameMethod } from '../../../hooks/useGameMethod';

export function ModelInventory() {
  const { models, removeModel, toggleFavorite } = useGeneration();
  const { replaceVehicleModel } = useGameMethod();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');
  const [replacingId, setReplacingId] = useState<string | null>(null);

  // Track rotation and scale per model (modelId -> {rotation, scale})
  const [modelSettings, setModelSettings] = useState<Record<string, { rotation: number; scale: number }>>({});

  // Get settings for a model (with defaults)
  const getModelSettings = (modelId: string) => {
    return modelSettings[modelId] || { rotation: 0, scale: 1.0 };
  };

  // Update rotation for a model
  const rotateModel = (modelId: string, degrees: number) => {
    setModelSettings((prev) => {
      const current = prev[modelId] || { rotation: 0, scale: 1.0 };
      const newRotation = (current.rotation + degrees) % 360;
      return {
        ...prev,
        [modelId]: { ...current, rotation: newRotation < 0 ? newRotation + 360 : newRotation }
      };
    });
  };

  // Update scale for a model
  const updateScale = (modelId: string, scale: number) => {
    setModelSettings((prev) => {
      const current = prev[modelId] || { rotation: 0, scale: 1.0 };
      return {
        ...prev,
        [modelId]: { ...current, scale }
      };
    });
  };

  // Filter models
  const filteredModels = models.filter((model) => {
    const matchesSearch =
      model.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesFilter = filter === 'all' || (filter === 'favorites' && model.isFavorite);

    return matchesSearch && matchesFilter;
  });

  const handleDownload = (model: any) => {
    const link = document.createElement('a');
    link.href = model.modelUrl;
    link.download = `${model.prompt.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.glb`;
    link.click();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this model?')) {
      await removeModel(id);
    }
  };

  const handleReplaceAirplane = async (model: any) => {
    setReplacingId(model.id);
    try {
      const settings = getModelSettings(model.id);
      await replaceVehicleModel(model.modelUrl, settings.scale, settings.rotation);
      alert(`Replaced airplane with: ${model.prompt}\nScale: ${settings.scale}x, Rotation: ${settings.rotation}°`);
    } catch (error) {
      console.error('Failed to replace airplane:', error);
      alert(`Failed to replace airplane: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setReplacingId(null);
    }
  };

  if (models.length === 0) {
    return (
      <div className="glass-panel p-8 text-center">
        <h3 className="text-sm font-semibold text-white mb-1">No Models Yet</h3>
        <p className="text-xs text-white/50 mb-4">
          Generated models will appear here
        </p>
        <p className="text-xs text-white/40">
          Start by generating your first 3D model!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">
            Model Inventory ({filteredModels.length})
          </h3>
          <p className="text-xs text-white/50">
            Total: {(models.reduce((sum, m) => sum + m.metadata.fileSize, 0) / (1024 * 1024)).toFixed(2)} MB
          </p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="glass-panel p-3 space-y-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search models or tags..."
          className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-future-accent/50"
        />

        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 px-3 py-1.5 rounded text-xs font-medium transition-all ${
              filter === 'all'
                ? 'bg-future-accent text-white'
                : 'bg-white/5 text-white/70 hover:bg-white/10'
            }`}
          >
            All Models
          </button>
          <button
            onClick={() => setFilter('favorites')}
            className={`flex-1 px-3 py-1.5 rounded text-xs font-medium transition-all ${
              filter === 'favorites'
                ? 'bg-future-accent text-white'
                : 'bg-white/5 text-white/70 hover:bg-white/10'
            }`}
          >
            Favorites
          </button>
        </div>
      </div>

      {/* Models Grid */}
      {filteredModels.length === 0 ? (
        <div className="glass-panel p-6 text-center">
          <p className="text-sm text-white/50">No models match your search</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredModels.map((model) => (
            <div key={model.id} className="glass-panel p-4 space-y-3">
              {/* Thumbnail */}
              <div className="relative aspect-video bg-black/30 rounded overflow-hidden group">
                {model.thumbnailUrl ? (
                  <img
                    src={model.thumbnailUrl}
                    alt={model.prompt}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/30 text-sm">
                    <span>No preview</span>
                  </div>
                )}

                {/* Mode Badge */}
                {model.mode === 'image-to-3d' && (
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 rounded text-xs text-white/80">
                    Image-to-3D
                  </div>
                )}

                {/* Favorite Button */}
                <button
                  onClick={() => toggleFavorite(model.id)}
                  className="absolute top-2 right-2 px-2 py-1 flex items-center justify-center bg-black/50 hover:bg-black/70 rounded transition-all text-xs text-white/70"
                >
                  {model.isFavorite ? '★' : '☆'}
                </button>
              </div>

              {/* Source Image for Image-to-3D */}
              {model.mode === 'image-to-3d' && model.imagePreview && (
                <div className="flex items-center gap-2 -mt-2">
                  <img
                    src={model.imagePreview}
                    alt="Source"
                    className="w-12 h-12 rounded bg-black/30 object-cover"
                  />
                  <span className="text-xs text-white/50">Source image</span>
                </div>
              )}

              {/* Model Info */}
              <div>
                <h4 className="text-sm font-medium text-white line-clamp-2 mb-1">
                  {model.prompt}
                </h4>
                <div className="flex flex-wrap gap-1 mb-2">
                  {model.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-white/5 rounded text-xs text-white/60"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-xs text-white/50">
                  <span className="capitalize">{model.mode === 'text-to-3d' ? model.artStyle : 'Image-to-3D'}</span>
                  <span>•</span>
                  <span>{formatFileSize(model.metadata.fileSize)}</span>
                  <span>•</span>
                  <span>{formatRelativeTime(model.metadata.createdAt)}</span>
                </div>
              </div>

              {/* Rotation and Scale Controls */}
              <div className="glass-panel p-3 bg-white/5 space-y-3">
                {/* Rotation */}
                <div>
                  <label className="text-xs text-white/70 mb-2 block">Rotation</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => rotateModel(model.id, -90)}
                      className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded text-xs text-white transition-all"
                      title="Rotate -90°"
                    >
                      ↶ -90°
                    </button>
                    <div className="flex-1 text-center">
                      <span className="text-sm text-white font-medium">
                        {getModelSettings(model.id).rotation}°
                      </span>
                    </div>
                    <button
                      onClick={() => rotateModel(model.id, 90)}
                      className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded text-xs text-white transition-all"
                      title="Rotate +90°"
                    >
                      ↷ +90°
                    </button>
                  </div>
                </div>

                {/* Scale */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-white/70">Scale</label>
                    <span className="text-xs text-white/50">{getModelSettings(model.id).scale.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="5.0"
                    step="0.1"
                    value={getModelSettings(model.id).scale}
                    onChange={(e) => updateScale(model.id, parseFloat(e.target.value))}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-future-accent"
                  />
                  <div className="flex justify-between text-xs text-white/30 mt-1">
                    <span>0.1x</span>
                    <span>5.0x</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleDownload(model)}
                  className="flex-1 px-3 py-2 bg-future-accent/20 hover:bg-future-accent/30 rounded text-xs font-medium text-white transition-all"
                  title="Download GLB"
                >
                  Download
                </button>
                <button
                  onClick={() => handleReplaceAirplane(model)}
                  disabled={replacingId === model.id}
                  className="flex-1 px-3 py-2 bg-green-500/20 hover:bg-green-500/30 rounded text-xs font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Replace airplane with this model"
                >
                  {replacingId === model.id ? 'Replacing...' : 'Replace'}
                </button>
                <button
                  onClick={() => handleDelete(model.id)}
                  className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 rounded text-xs font-medium text-white transition-all"
                  title="Delete model"
                >
                  Delete
                </button>
              </div>

              {/* Model Details (Expandable) */}
              <details className="text-xs">
                <summary className="cursor-pointer text-white/50 hover:text-white/70">
                  Technical Details
                </summary>
                <div className="mt-2 p-2 bg-black/30 rounded space-y-1 text-white/60">
                  <div>Preview Task: {model.metadata.previewTaskId.slice(0, 16)}...</div>
                  <div>Refine Task: {model.metadata.refineTaskId.slice(0, 16)}...</div>
                  <div>Credits: {model.metadata.credits}</div>
                  <div>Created: {model.metadata.createdAt.toLocaleString()}</div>
                </div>
              </details>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
