import crypto from 'crypto';
import { MoralCreditProfile, MoralDimension } from './types';

function stableHash(input: string): number {
  const buf = crypto.createHash('sha256').update(input).digest();
  return buf.readUInt32BE(0);
}

const DIMENSION_CONFIG: Record<MoralDimension, {
  description: string;
  behaviorExamples: { positive: string[]; negative: string[] };
  evidenceTypes: string[];
}> = {
  '闻道': {
    description: '对道德经典的研习程度',
    behaviorExamples: {
      positive: ['每日诵读经典', '参与道德圆桌', '记录学习心得'],
      negative: ['长期不读经典', '对学习敷衍'],
    },
    evidenceTypes: ['完成章节研读', '每日箴言互动', '分享学习心得'],
  },
  '行善': {
    description: '日常善行实践',
    behaviorExamples: {
      positive: ['帮助他人', '参与公益', '主动分享'],
      negative: ['自私自利', '冷漠旁观'],
    },
    evidenceTypes: ['记录善行', '帮助解决困境', '捐赠功德'],
  },
  '清静': {
    description: '以静制动、清心寡欲的修为',
    behaviorExamples: {
      positive: ['静心自观', '躁中取静', '不以物动'],
      negative: ['心浮气躁', '患得患失', '急功近利'],
    },
    evidenceTypes: ['每日静坐', '减少妄念', '心静练习'],
  },
  '知足': {
    description: '欲望管理能力',
    behaviorExamples: {
      positive: ['适度消费', '不攀比', '珍惜当下'],
      negative: ['过度追求', '攀比炫耀'],
    },
    evidenceTypes: ['欲望记录', '知足日记', '减少欲望'],
  },
  '玄德': {
    description: '付出不求回报的行为',
    behaviorExamples: {
      positive: ['匿名善行', '不求名利', '默默付出'],
      negative: ['付出必求回报', '炫耀善行'],
    },
    evidenceTypes: ['隐性善行', '不求名利', '长期坚持'],
  },
  '应时': {
    description: '与时俱进的适应能力',
    behaviorExamples: {
      positive: ['学习新技能', '适应变化', '创新实践'],
      negative: ['固步自封', '拒绝改变'],
    },
    evidenceTypes: ['参与A2A协作', '适应新情况', '创新方法'],
  },
};

const RANK_THRESHOLDS: { rank: MoralCreditProfile['rank']; minScore: number; description: string }[] = [
  { rank: '闻道', minScore: 0, description: '初入修行之门' },
  { rank: '悟道', minScore: 40, description: '渐悟道德真谛' },
  { rank: '行道', minScore: 60, description: '知行合一，开始影响他人' },
  { rank: '得道', minScore: 80, description: '道德已成为生命一部分' },
  { rank: '同道', minScore: 95, description: '成为他人修行的标杆' },
];

const MAX_SCORE = 100;
const NATURAL_DECAY_RATE = 0.02;
const TIME_THRESHOLD_DAYS = 30;

function calculateDimensionScore(
  dimension: MoralDimension,
  evidence: string[],
  trend: 'up' | 'stable' | 'down'
): number {
  const baseScore = DIMENSION_CONFIG[dimension].evidenceTypes.reduce((score, type) => {
    const count = evidence.filter((e) => e.includes(type)).length;
    return score + Math.min(count * 10, 30);
  }, 0);

  let trendModifier = 1;
  if (trend === 'up') trendModifier = 1.1;
  else if (trend === 'down') trendModifier = 0.9;

  return Math.min(Math.round(baseScore * trendModifier), MAX_SCORE);
}

function calculateOverallScore(sixDimensions: MoralCreditProfile['sixDimensions']): number {
  const weights: Record<MoralDimension, number> = {
    '闻道': 0.2,
    '行善': 0.2,
    '清静': 0.15,
    '知足': 0.15,
    '玄德': 0.15,
    '应时': 0.15,
  };

  let totalScore = 0;
  for (const dim of Object.keys(weights) as MoralDimension[]) {
    totalScore += sixDimensions[dim].score * weights[dim];
  }

  return Math.round(totalScore);
}

function determineRank(creditScore: number): MoralCreditProfile['rank'] {
  let rank: MoralCreditProfile['rank'] = '闻道';
  for (const threshold of RANK_THRESHOLDS) {
    if (creditScore >= threshold.minScore) {
      rank = threshold.rank;
    }
  }
  return rank;
}

export function createMoralCreditProfile(userId: string): MoralCreditProfile {
  const dimensions: MoralCreditProfile['sixDimensions'] = {
    '闻道': { score: 0, evidence: [], trend: 'stable' },
    '行善': { score: 0, evidence: [], trend: 'stable' },
    '清静': { score: 0, evidence: [], trend: 'stable' },
    '知足': { score: 0, evidence: [], trend: 'stable' },
    '玄德': { score: 0, evidence: [], trend: 'stable' },
    '应时': { score: 0, evidence: [], trend: 'stable' },
  };

  const creditScore = calculateOverallScore(dimensions);
  const rank = determineRank(creditScore);

  return {
    userId,
    sixDimensions: dimensions,
    creditScore,
    rank,
  };
}

export function addDimensionEvidence(
  profile: MoralCreditProfile,
  dimension: MoralDimension,
  evidence: string
): MoralCreditProfile {
  const currentDim = profile.sixDimensions[dimension];
  const newEvidence = [...currentDim.evidence, evidence];
  const newScore = calculateDimensionScore(dimension, newEvidence, currentDim.trend);

  const updatedDimensions = {
    ...profile.sixDimensions,
    [dimension]: {
      ...currentDim,
      evidence: newEvidence.slice(-20),
      score: newScore,
    },
  };

  const creditScore = calculateOverallScore(updatedDimensions);
  const rank = determineRank(creditScore);

  return {
    ...profile,
    sixDimensions: updatedDimensions,
    creditScore,
    rank,
  };
}

export function updateDimensionTrend(
  profile: MoralCreditProfile,
  dimension: MoralDimension,
  trend: 'up' | 'stable' | 'down'
): MoralCreditProfile {
  const currentDim = profile.sixDimensions[dimension];
  const newScore = calculateDimensionScore(dimension, currentDim.evidence, trend);

  const updatedDimensions = {
    ...profile.sixDimensions,
    [dimension]: {
      ...currentDim,
      score: newScore,
      trend,
    },
  };

  const creditScore = calculateOverallScore(updatedDimensions);
  const rank = determineRank(creditScore);

  return {
    ...profile,
    sixDimensions: updatedDimensions,
    creditScore,
    rank,
  };
}

export function applyNaturalDecay(profile: MoralCreditProfile, inactiveDays: number): MoralCreditProfile {
  if (inactiveDays < TIME_THRESHOLD_DAYS) {
    return profile;
  }

  const decayFactor = Math.pow(1 - NATURAL_DECAY_RATE, Math.floor((inactiveDays - TIME_THRESHOLD_DAYS) / 7));

  const updatedDimensions = {} as MoralCreditProfile['sixDimensions'];
  for (const dim of Object.keys(profile.sixDimensions) as MoralDimension[]) {
    const currentDim = profile.sixDimensions[dim];
    updatedDimensions[dim] = {
      ...currentDim,
      score: Math.round(currentDim.score * decayFactor),
      trend: 'down' as const,
    };
  }

  const creditScore = calculateOverallScore(updatedDimensions);
  const rank = determineRank(creditScore);

  return {
    ...profile,
    sixDimensions: updatedDimensions,
    creditScore,
    rank,
  };
}

export function getRankDescription(rank: MoralCreditProfile['rank']): string {
  const threshold = RANK_THRESHOLDS.find((t) => t.rank === rank);
  return threshold?.description || '';
}

export function getDimensionConfig(dimension: MoralDimension) {
  return DIMENSION_CONFIG[dimension];
}

export { DIMENSION_CONFIG, RANK_THRESHOLDS };
