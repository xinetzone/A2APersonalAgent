import { Vector } from './similarity';

export interface WeightedMatchParams {
  interestWeight: number;
  personalityWeight: number;
  behaviorWeight: number;
}

export interface MatchScore {
  userId: string;
  score: number;
  reasons: string[];
}

export function weightedMatch(
  userA: { interests: string[]; personality: string[]; behavior: string[] },
  userB: { interests: string[]; personality: string[]; behavior: string[] },
  params: WeightedMatchParams
): MatchScore {
  const reasons: string[] = [];
  let totalScore = 0;
  let weightSum = 0;

  const interestScore = calculateJaccardSimilarity(userA.interests, userB.interests);
  totalScore += interestScore * params.interestWeight;
  weightSum += params.interestWeight;
  if (interestScore > 0.5) {
    const commonInterests = userA.interests.filter(i => userB.interests.includes(i));
    reasons.push(`共同兴趣: ${commonInterests.join(', ')}`);
  }

  const personalityScore = calculateJaccardSimilarity(userA.personality, userB.personality);
  totalScore += personalityScore * params.personalityWeight;
  weightSum += params.personalityWeight;
  if (personalityScore > 0.5) {
    const commonTraits = userA.personality.filter(p => userB.personality.includes(p));
    reasons.push(`相似性格: ${commonTraits.join(', ')}`);
  }

  const behaviorScore = calculateJaccardSimilarity(userA.behavior, userB.behavior);
  totalScore += behaviorScore * params.behaviorWeight;
  weightSum += params.behaviorWeight;
  if (behaviorScore > 0.5) {
    const commonBehaviors = userA.behavior.filter(b => userB.behavior.includes(b));
    reasons.push(`相似行为: ${commonBehaviors.join(', ')}`);
  }

  return {
    userId: '',
    score: totalScore / weightSum,
    reasons,
  };
}

export function calculateJaccardSimilarity(setA: string[], setB: string[]): number {
  if (setA.length === 0 && setB.length === 0) return 0;
  const intersection = setA.filter(item => setB.includes(item)).length;
  const union = new Set([...setA, ...setB]).size;
  return union > 0 ? intersection / union : 0;
}
