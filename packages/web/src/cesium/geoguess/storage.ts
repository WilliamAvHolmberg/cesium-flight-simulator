import type { Challenge, ChallengeScore } from './types';

const CHALLENGES_KEY = 'geoguess_challenges';
const SCORES_KEY = 'geoguess_scores';

export class ChallengeStorage {
  static saveChallenges(challenges: Challenge[]): void {
    try {
      localStorage.setItem(CHALLENGES_KEY, JSON.stringify(challenges));
    } catch (error) {
      console.error('Failed to save challenges:', error);
    }
  }

  static loadChallenges(): Challenge[] {
    try {
      const data = localStorage.getItem(CHALLENGES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load challenges:', error);
      return [];
    }
  }

  static saveChallenge(challenge: Challenge): void {
    const challenges = this.loadChallenges();
    const existingIndex = challenges.findIndex(c => c.id === challenge.id);
    
    if (existingIndex >= 0) {
      challenges[existingIndex] = challenge;
    } else {
      challenges.push(challenge);
    }
    
    this.saveChallenges(challenges);
  }

  static deleteChallenge(challengeId: string): void {
    const challenges = this.loadChallenges();
    const filtered = challenges.filter(c => c.id !== challengeId);
    this.saveChallenges(filtered);
  }

  static getChallenge(challengeId: string): Challenge | null {
    const challenges = this.loadChallenges();
    return challenges.find(c => c.id === challengeId) || null;
  }

  static saveScore(score: ChallengeScore): void {
    try {
      const scores = this.loadScores();
      const existingScores = scores.filter(s => s.challengeId === score.challengeId);
      
      const bestScore = existingScores.length > 0 
        ? Math.max(...existingScores.map(s => s.score))
        : 0;
      
      if (score.score >= bestScore) {
        const otherScores = scores.filter(s => s.challengeId !== score.challengeId);
        otherScores.push(score);
        localStorage.setItem(SCORES_KEY, JSON.stringify(otherScores));
      }
    } catch (error) {
      console.error('Failed to save score:', error);
    }
  }

  static loadScores(): ChallengeScore[] {
    try {
      const data = localStorage.getItem(SCORES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load scores:', error);
      return [];
    }
  }

  static getBestScore(challengeId: string): ChallengeScore | null {
    const scores = this.loadScores();
    const challengeScores = scores.filter(s => s.challengeId === challengeId);
    
    if (challengeScores.length === 0) return null;
    
    return challengeScores.reduce((best, current) => 
      current.score > best.score ? current : best
    );
  }
}
