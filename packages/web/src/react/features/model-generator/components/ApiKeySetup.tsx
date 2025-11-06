import { useState } from 'react';
import { useGeneration } from '../context/GenerationContext';
import { Panel } from '../../../shared/components/Panel';
import { Button } from '../../../shared/components/Button';

export function ApiKeySetup() {
  const { apiKey, setApiKey, hasApiKey } = useGeneration();
  const [inputValue, setInputValue] = useState(apiKey || '');
  const [isEditing, setIsEditing] = useState(!hasApiKey);
  const [showKey, setShowKey] = useState(false);

  const handleSave = () => {
    if (inputValue.trim()) {
      setApiKey(inputValue.trim());
      setIsEditing(false);
    }
  };

  const handleClear = () => {
    setApiKey('');
    setInputValue('');
    setIsEditing(true);
  };

  return (
    <div className="space-y-4">
      <div className="glass-panel p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-white">MeshyAI API Key</h3>
            <p className="text-xs text-white/50 mt-1">
              Get your API key from{' '}
              <a
                href="https://www.meshy.ai/api"
                target="_blank"
                rel="noopener noreferrer"
                className="text-future-accent hover:text-future-accent/80 underline"
              >
                meshy.ai/api
              </a>
            </p>
          </div>
          {hasApiKey && !isEditing && (
            <Button
              onClick={() => setIsEditing(true)}
              className="text-xs px-2 py-1"
            >
              Edit
            </Button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-3">
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="msy_..."
                className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-future-accent/50"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 text-xs"
              >
                {showKey ? 'Hide' : 'Show'}
              </button>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={!inputValue.trim()}
                className="flex-1"
              >
                Save Key
              </Button>
              {hasApiKey && (
                <Button onClick={() => setIsEditing(false)} className="px-4">
                  Cancel
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-black/30 border border-white/10 rounded px-3 py-2">
                <span className="text-sm text-white/60">
                  {showKey ? apiKey : '••••••••••••••••'}
                </span>
              </div>
              <button
                onClick={() => setShowKey(!showKey)}
                className="text-white/40 hover:text-white/60 text-xs px-3"
              >
                {showKey ? 'Hide' : 'Show'}
              </button>
            </div>
            <Button onClick={handleClear} className="w-full text-xs bg-red-500/20 hover:bg-red-500/30">
              Clear Key
            </Button>
          </div>
        )}
      </div>

      {!hasApiKey && (
        <div className="glass-panel p-4 border-l-2 border-future-warning">
          <p className="text-xs text-white/70">
            ⚠️ You need a MeshyAI API key to generate 3D models. Sign up for free at{' '}
            <a
              href="https://www.meshy.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-future-accent hover:text-future-accent/80 underline"
            >
              meshy.ai
            </a>
          </p>
        </div>
      )}

      <div className="glass-panel p-4 bg-white/5">
        <h4 className="text-xs font-semibold text-white mb-2">Test Mode</h4>
        <p className="text-xs text-white/60 mb-2">
          For testing, you can use this dummy key:
        </p>
        <code className="block bg-black/40 px-2 py-1 rounded text-xs text-white/80 font-mono break-all">
          msy_dummy_api_key_for_test_mode_12345678
        </code>
        <button
          onClick={() => {
            setInputValue('msy_dummy_api_key_for_test_mode_12345678');
            setIsEditing(true);
          }}
          className="mt-2 text-xs text-future-accent hover:text-future-accent/80"
        >
          Use Test Key
        </button>
      </div>
    </div>
  );
}
