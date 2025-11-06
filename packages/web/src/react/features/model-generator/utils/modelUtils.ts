/**
 * Generate a unique ID for models
 */
export function generateId(): string {
  return `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Extract tags from a prompt
 */
export function extractTags(prompt: string): string[] {
  // Convert to lowercase and remove special characters
  const cleaned = prompt.toLowerCase().replace(/[^\w\s]/g, ' ');

  // Split into words
  const words = cleaned.split(/\s+/).filter((word) => word.length > 2);

  // Remove common stop words
  const stopWords = new Set([
    'the',
    'a',
    'an',
    'and',
    'or',
    'but',
    'in',
    'on',
    'at',
    'to',
    'for',
    'of',
    'with',
    'by',
    'from',
    'as',
    'is',
    'was',
    'are',
    'were',
    'been',
    'be',
    'have',
    'has',
    'had',
    'do',
    'does',
    'did',
    'will',
    'would',
    'should',
    'could',
    'may',
    'might',
    'must',
    'can',
    'this',
    'that',
    'these',
    'those',
    'i',
    'you',
    'he',
    'she',
    'it',
    'we',
    'they',
    'what',
    'which',
    'who',
    'when',
    'where',
    'why',
    'how',
  ]);

  const tags = words.filter((word) => !stopWords.has(word));

  // Remove duplicates and limit to 10 tags
  return [...new Set(tags)].slice(0, 10);
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Format date relative to now
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins === 1) return '1 minute ago';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString();
}

/**
 * Validate prompt (max 600 characters as per MeshyAI API)
 */
export function validatePrompt(prompt: string): { valid: boolean; error?: string } {
  if (!prompt || prompt.trim().length === 0) {
    return { valid: false, error: 'Prompt cannot be empty' };
  }

  if (prompt.length > 600) {
    return { valid: false, error: 'Prompt must be 600 characters or less' };
  }

  return { valid: true };
}

/**
 * Estimate generation time based on art style
 */
export function estimateGenerationTime(artStyle: string): string {
  switch (artStyle) {
    case 'sculpture':
      return '2-3 minutes';
    case 'low-poly':
      return '1-2 minutes';
    case 'pbr':
      return '3-5 minutes';
    case 'realistic':
      return '5-8 minutes';
    case 'cartoon':
      return '3-5 minutes';
    default:
      return '3-5 minutes';
  }
}
