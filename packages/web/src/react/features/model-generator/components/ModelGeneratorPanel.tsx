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
  { value: 'cartoon', label: 'Cartoon' },
  { value: 'low-poly', label: 'Low Poly' },
  { value: 'pbr', label: 'PBR' },
];

export function ModelGeneratorPanel() {
  const { hasApiKey, setActiveTab } = useGeneration();
  const { generateModel, isGenerating, error } = useModelGenerator();

  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [artStyle, setArtStyle] = useState<ArtStyle>('realistic');
  const [enablePbr, setEnablePbr] = useState(true);
  const [shouldRemesh, setShouldRemesh] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showApiKeyManage, setShowApiKeyManage] = useState(false);

  const validation = validatePrompt(prompt);
  const estimatedTime = estimateGenerationTime(artStyle);

  const handleGenerate = async () => {
    if (!validation.valid || isGenerating) return;

    try {
      const model = await generateModel({
        prompt,
        artStyle,
        negativePrompt: negativePrompt || undefined,
        enablePbr,
        shouldRemesh,
      });

      if (model) {
        // Switch to inventory tab to show the new model
        setActiveTab('inventory');
        // Clear the form
        setPrompt('');
        setNegativePrompt('');
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
            Describe your model and let AI bring it to life
          </p>
        </div>

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

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-500/20 border border-red-500/30 rounded">
            <p className="text-xs text-red-200">⚠️ {error}</p>
          </div>
        )}

        {/* Generate Button */}
        <div className="space-y-2">
          <Button
            onClick={handleGenerate}
            disabled={!validation.valid || !hasApiKey || isGenerating}
            className="w-full justify-center"
          >
            {isGenerating ? 'Generating...' : 'Generate Model 🚀'}
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
