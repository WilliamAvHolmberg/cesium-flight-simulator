import { useState, useEffect } from 'react';
import { useChallengeBuilder } from '../../hooks/useChallengeBuilder';

export function ChallengeMetadata() {
  const { getCurrentChallenge, updateChallengeMetadata } = useChallengeBuilder();
  const [challenge, setChallenge] = useState(getCurrentChallenge());
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [timeLimit, setTimeLimit] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      const current = getCurrentChallenge();
      setChallenge(current);
      if (current) {
        setName(current.name || '');
        setDescription(current.description || '');
        setCategory(current.category || '');
        setTimeLimit(current.timeLimit?.toString() || '');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleSave = () => {
    updateChallengeMetadata({
      name: name || 'Unnamed Challenge',
      description: description || undefined,
      category: category || undefined,
      timeLimit: timeLimit ? parseInt(timeLimit) : undefined,
    });
  };

  if (!challenge) return null;

  return (
    <div className="bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-700 shadow-lg p-4">
      <h2 className="text-lg font-bold text-white mb-3">Challenge Info</h2>
      
      <div className="space-y-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleSave}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-400 transition-colors"
            placeholder="My Challenge"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleSave}
            rows={2}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-400 transition-colors resize-none"
            placeholder="Describe your challenge..."
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Category (optional)</label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            onBlur={handleSave}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-400 transition-colors"
            placeholder="e.g. Cities, Landmarks..."
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Time Limit per Location (seconds, optional)</label>
          <input
            type="number"
            value={timeLimit}
            onChange={(e) => setTimeLimit(e.target.value)}
            onBlur={handleSave}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-400 transition-colors"
            placeholder="60"
          />
        </div>
      </div>
    </div>
  );
}
