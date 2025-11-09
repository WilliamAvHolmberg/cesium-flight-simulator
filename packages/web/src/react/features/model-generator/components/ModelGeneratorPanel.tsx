import { useState } from 'react';
import { useGeneration } from '../context/GenerationContext';
import { useModelGenerator } from '../hooks/useModelGenerator';
import { Button } from '../../../shared/components/Button';
import { validatePrompt, estimateGenerationTime } from '../utils/modelUtils';
import type { ArtStyle } from '../services/types';
import { ApiKeySetup } from './ApiKeySetup';

const ART_STYLES: { value: ArtStyle; label: string }[] = [
  { value: 'realistic', label: 'Realistic' },
  { value: 'sculpture', label: 'Sculpture' },
];

export function ModelGeneratorPanel() {
  const { hasApiKey, setActiveTab } = useGeneration();
  const { generateModel, isGenerating, error } = useModelGenerator();

  // Mode selection
  const [mode, setMode] = useState<'text-to-3d' | 'image-to-3d'>('text-to-3d');

  // Text-to-3D state
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [artStyle, setArtStyle] = useState<ArtStyle>('realistic');
  const [shouldRemesh, setShouldRemesh] = useState(true);

  // Image-to-3D state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [aiModel, setAiModel] = useState<'latest' | 'meshy-4'>('latest');
  const [shouldTexture, setShouldTexture] = useState(true);

  // Common state
  const [enablePbr, setEnablePbr] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showApiKeyManage, setShowApiKeyManage] = useState(false);

  const validation = mode === 'text-to-3d' ? validatePrompt(prompt) : { valid: !!imageFile, error: '' };
  const estimatedTime = mode === 'text-to-3d' ? estimateGenerationTime(artStyle) : '3-5 minutes';

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const handleClearImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview(null);
  };

  const handleGenerate = async () => {
    if (!validation.valid || isGenerating) return;

    // Switch to queue tab immediately to show progress
    setActiveTab('queue');

    try {
      if (mode === 'text-to-3d') {
        const model = await generateModel({
          mode: 'text-to-3d',
          prompt,
          artStyle,
          negativePrompt: negativePrompt || undefined,
          enablePbr,
          shouldRemesh,
        });

        if (model) {
          setActiveTab('inventory');
          setPrompt('');
          setNegativePrompt('');
        }
      } else {
        // Image-to-3D
        const model = await generateModel({
          mode: 'image-to-3d',
          imageFile: imageFile!,
          aiModel,
          shouldTexture,
          enablePbr,
        });

        if (model) {
          setActiveTab('inventory');
          handleClearImage();
        }
      }
    } catch (err) {
      console.error('Generation failed:', err);
    }
  };

  // If showing API key management, show only that
  if (showApiKeyManage) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setShowApiKeyManage(false)}
          className="text-xs text-white/60 hover:text-white flex items-center gap-1"
        >
          ← Back to Generator
        </button>
        <ApiKeySetup />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* API Key Setup */}
      {!hasApiKey ? (
        <ApiKeySetup />
      ) : (
        <div className="glass-panel p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse-subtle" />
              <span className="text-xs text-white/70">API Key Connected</span>
            </div>
            <button
              onClick={() => setShowApiKeyManage(true)}
              className="text-xs text-white/50 hover:text-white/70 pointer-events-auto cursor-pointer"
            >
              Manage
            </button>
          </div>
        </div>
      )}

      {/* Main Generator */}
      <div className="glass-panel p-4 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-white mb-1">
            AI 3D Model Generator
          </h3>
          <p className="text-xs text-white/50">
            {mode === 'text-to-3d' ? 'Describe your model and let AI bring it to life' : 'Upload an image to create a 3D model'}
          </p>
        </div>

        {/* Mode Selector */}
        <div>
          <label className="block text-xs font-medium text-white/70 mb-2">
            Generation Mode
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setMode('text-to-3d')}
              disabled={isGenerating}
              className={`px-4 py-2 rounded text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                mode === 'text-to-3d'
                  ? 'bg-future-accent text-white'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              Text to 3D
            </button>
            <button
              onClick={() => setMode('image-to-3d')}
              disabled={isGenerating}
              className={`px-4 py-2 rounded text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                mode === 'image-to-3d'
                  ? 'bg-future-accent text-white'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              Image to 3D
            </button>
          </div>
        </div>

        {/* Text-to-3D Input */}
        {mode === 'text-to-3d' && (
          <>
            {/* Prompt Input */}
            <div>
          <label className="block text-xs font-medium text-white/70 mb-2">
            Describe your model
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="helicopter with dinosaur, realistic, detailed..."
            disabled={!hasApiKey || isGenerating}
            className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-future-accent/50 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            rows={3}
          />
          <div className="flex items-center justify-between mt-1">
            <span
              className={`text-xs ${
                prompt.length > 600 ? 'text-red-400' : 'text-white/40'
              }`}
            >
              {prompt.length}/600 characters
            </span>
            {!validation.valid && prompt.length > 0 && (
              <span className="text-xs text-red-400">{validation.error}</span>
            )}
          </div>
        </div>

        {/* Art Style Selector */}
        <div>
          <label className="block text-xs font-medium text-white/70 mb-2">
            Art Style
          </label>
          <div className="grid grid-cols-5 gap-2">
            {ART_STYLES.map((style) => (
              <button
                key={style.value}
                onClick={() => setArtStyle(style.value)}
                disabled={!hasApiKey || isGenerating}
                className={`px-3 py-2 rounded text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  artStyle === style.value
                    ? 'bg-future-accent text-white'
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                {style.label}
              </button>
            ))}
          </div>
        </div>

        {/* Advanced Options */}
        <div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-xs text-white/60 hover:text-white/80"
          >
            <span>{showAdvanced ? '▼' : '▶'}</span>
            Advanced Options
          </button>

          {showAdvanced && (
            <div className="mt-3 space-y-3 pl-4 border-l border-white/10">
              {/* Negative Prompt */}
              <div>
                <label className="block text-xs font-medium text-white/70 mb-2">
                  Negative Prompt (optional)
                </label>
                <input
                  type="text"
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  placeholder="things to avoid..."
                  disabled={!hasApiKey || isGenerating}
                  className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-future-accent/50 disabled:opacity-50"
                />
              </div>

              {/* Toggles */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs text-white/70 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enablePbr}
                    onChange={(e) => setEnablePbr(e.target.checked)}
                    disabled={!hasApiKey || isGenerating || artStyle === 'sculpture'}
                    className="rounded"
                  />
                  <span>Enable PBR Maps (metallic, roughness, normal)</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-white/70 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shouldRemesh}
                    onChange={(e) => setShouldRemesh(e.target.checked)}
                    disabled={!hasApiKey || isGenerating}
                    className="rounded"
                  />
                  <span>Optimize mesh topology (remeshing)</span>
                </label>
              </div>
            </div>
          )}
        </div>
          </>
        )}

        {/* Image-to-3D Input */}
        {mode === 'image-to-3d' && (
          <>
            {/* Image Upload */}
            <div>
              <label className="block text-xs font-medium text-white/70 mb-2">
                Upload Image
              </label>

              {!imagePreview ? (
                <label className="block cursor-pointer">
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleImageSelect}
                    disabled={!hasApiKey || isGenerating}
                    className="hidden"
                  />
                  <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-future-accent/50 transition-all">
                    <div className="text-white/40 mb-2">
                      <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <p className="text-xs text-white/60 mb-1">Click to upload image</p>
                    <p className="text-xs text-white/40">JPG, JPEG, PNG (max 10MB)</p>
                  </div>
                </label>
              ) : (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Upload preview"
                    className="w-full h-48 object-contain bg-black/30 rounded-lg"
                  />
                  <button
                    onClick={handleClearImage}
                    disabled={isGenerating}
                    className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-500 text-white rounded-full p-2 text-xs disabled:opacity-50"
                  >
                    Clear
                  </button>
                  {imageFile && (
                    <p className="mt-2 text-xs text-white/60">
                      {imageFile.name} ({(imageFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* AI Model Selector */}
            <div>
              <label className="block text-xs font-medium text-white/70 mb-2">
                AI Model
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setAiModel('latest')}
                  disabled={!hasApiKey || isGenerating}
                  className={`px-3 py-2 rounded text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    aiModel === 'latest'
                      ? 'bg-future-accent text-white'
                      : 'bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  Latest (Meshy-6)
                </button>
                <button
                  onClick={() => setAiModel('meshy-4')}
                  disabled={!hasApiKey || isGenerating}
                  className={`px-3 py-2 rounded text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    aiModel === 'meshy-4'
                      ? 'bg-future-accent text-white'
                      : 'bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  Meshy-4
                </button>
              </div>
            </div>

            {/* Image-to-3D Options */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs text-white/70 cursor-pointer">
                <input
                  type="checkbox"
                  checked={shouldTexture}
                  onChange={(e) => setShouldTexture(e.target.checked)}
                  disabled={!hasApiKey || isGenerating}
                  className="rounded"
                />
                <span>Generate textures</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-white/70 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enablePbr}
                  onChange={(e) => setEnablePbr(e.target.checked)}
                  disabled={!hasApiKey || isGenerating}
                  className="rounded"
                />
                <span>Enable PBR Maps (metallic, roughness, normal)</span>
              </label>
            </div>
          </>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-500/20 border border-red-500/30 rounded">
            <p className="text-xs text-red-200">{error}</p>
          </div>
        )}

        {/* Generate Button */}
        <div className="space-y-2">
          <Button
            onClick={handleGenerate}
            disabled={!validation.valid || !hasApiKey || isGenerating}
            className="w-full justify-center"
          >
            {isGenerating ? 'Generating...' : 'Generate Model'}
          </Button>

          {validation.valid && hasApiKey && (
            <p className="text-xs text-white/40 text-center">
              Estimated time: {estimatedTime}
            </p>
          )}
        </div>
      </div>

      {/* Example Prompts */}
      {!isGenerating && hasApiKey && (
        <div className="glass-panel p-4">
          <h4 className="text-xs font-semibold text-white mb-2">
            Example Prompts
          </h4>
          <div className="space-y-1">
            {[
              'helicopter with dinosaur',
              'futuristic sports car',
              'medieval castle tower',
              'cute robot companion',
              'tropical island hut',
            ].map((example) => (
              <button
                key={example}
                onClick={() => setPrompt(example)}
                className="block w-full text-left px-2 py-1 rounded text-xs text-white/60 hover:text-white hover:bg-white/5"
              >
                → {example}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
