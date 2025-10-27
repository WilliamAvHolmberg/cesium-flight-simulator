import { useState } from 'react';
import { useChallengeBuilder } from '../../hooks/useChallengeBuilder';
import { ChallengeStorage } from '../../../../../cesium/geoguess/storage';
import { useGameMode } from '../../../../hooks/useGameMode';

export function BuilderControls() {
  const { getCurrentChallenge } = useChallengeBuilder();
  const { setMode } = useGameMode();
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    const challenge = getCurrentChallenge();
    if (!challenge) return;

    if (challenge.places.length === 0) {
      alert('Add at least one location before saving!');
      return;
    }

    if (!challenge.name || challenge.name === 'New Challenge') {
      alert('Please give your challenge a name!');
      return;
    }

    setSaving(true);
    
    try {
      ChallengeStorage.saveChallenge(challenge);
      alert('Challenge saved successfully!');
      
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Failed to save challenge:', error);
      alert('Failed to save challenge. Please try again.');
      setSaving(false);
    }
  };

  const handlePreview = () => {
    const challenge = getCurrentChallenge();
    if (!challenge || challenge.places.length === 0) {
      alert('Add at least one location before previewing!');
      return;
    }

    setMode('geoguess_play');
  };

  const handleExit = () => {
    if (confirm('Exit without saving? Any unsaved changes will be lost.')) {
      window.location.reload();
    }
  };

  return (
    <div className="bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-700 shadow-lg p-3 flex gap-2">
      <button
        onClick={handlePreview}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white text-sm font-semibold transition-colors"
      >
        👁️ Preview
      </button>
      
      <button
        onClick={handleSave}
        disabled={saving}
        className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg text-white text-sm font-semibold transition-colors"
      >
        {saving ? '💾 Saving...' : '💾 Save'}
      </button>
      
      <button
        onClick={handleExit}
        className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white text-sm font-semibold transition-colors"
      >
        ✕ Exit
      </button>
    </div>
  );
}
