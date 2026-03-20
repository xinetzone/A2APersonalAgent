import crypto from 'crypto';
import {
  CompanionSession,
  CompanionType,
  CompanionJournal,
  CompanionMilestone,
  DaoGuidance,
  DaoQuote,
} from './types';

function stableHash(input: string): number {
  const buf = crypto.createHash('sha256').update(input).digest();
  return buf.readUInt32BE(0);
}

const COMPANION_DEFINITIONS: Record<CompanionType, {
  name: string;
  description: string;
  personality: {
    communicationStyle: 'guiding' | 'questioning' | 'contemplative' | 'direct';
    emphasis: string;
    interactionFrequency: 'daily' | 'weekly' | 'monthly';
  };
  greeting: string[];
  dailyGuidanceTemplates: string[];
}> = {
  'daoist-brother': {
    name: '道德大师兄',
    description: '沉稳内敛、厚德载物的修行者，帛书原典解读专家',
    personality: {
      communicationStyle: 'guiding',
      emphasis: '帛书原典',
      interactionFrequency: 'daily',
    },
    greeting: [
      '修行者，今日可好？',
      '道德之路漫长，但每一步都算数。',
      '晨光正好，正是修行时。',
    ],
    dailyGuidanceTemplates: [
      '今日箴言与"{}"相关。帛书云："{}"。你可在{}{}中体悟此理。',
      '{}{}的智慧，在于"{}"。今日不妨在{}{}中体会。',
    ],
  },
  'confucian-sage': {
    name: '儒家智者',
    description: '温婉细腻、上善治水的关怀者，情感疏导专家',
    personality: {
      communicationStyle: 'questioning',
      emphasis: '仁义礼智',
      interactionFrequency: 'daily',
    },
    greeting: [
      '朋友，今天心情如何？',
      '儒家云：德不孤，必有邻。我在这里陪你。',
      '新的一天，愿你心境平和。',
    ],
    dailyGuidanceTemplates: [
      '孔子曰："{}"。你最近是否在{}{}方面有所体会？',
      '仁者爱人。在{}{}中，你可曾体会这层深意？',
    ],
  },
  'modern-philosopher': {
    name: '现代哲学家',
    description: '博学深思、与时俱进的当代思想者',
    personality: {
      communicationStyle: 'contemplative',
      emphasis: '当代视角',
      interactionFrequency: 'weekly',
    },
    greeting: [
      '思想者，今天想探讨什么？',
      '哲学是对智慧的热爱。让我们一起思考。',
      '每一个困境都是思考的起点。',
    ],
    dailyGuidanceTemplates: [
      '从存在主义角度看，"{}"。你认为这与你的{}{}有何关联？',
      '康德说"{}"。你在生活中可曾实践过这一原则？',
    ],
  },
};

const WEEKLY_REPORT_TEMPLATE = `【修身周报】{}

本周你与道德大师兄进行了{}次互动。

📖 修行进展：
- 研读进度：第{}章
- 产生感悟：{}条
- 解决困境：{}个

💡 本周收获：
{}

🌿 下周建议：
{}

记住："上士闻道，勤而行之。"持续修行，必有进步。`;

const MONTHLY_DEEP_DIVE_TOPICS = [
  '如何在工作中实践"为而不争"',
  '从"玄德"看付出与收获的平衡',
  '"知足"是否意味着不求上进',
  '当诚信与关系冲突时如何抉择',
];

function generateDailyMessage(companionType: CompanionType, guidance: DaoGuidance, userName?: string): string {
  const companion = COMPANION_DEFINITIONS[companionType];
  const quote = guidance.quote;

  const templates = companion.dailyGuidanceTemplates;
  const template = templates[stableHash(`template:${companionType}`) % templates.length];

  const placeholders = template.match(/\{(\d+)\}/g) || [];
  if (placeholders.length >= 4) {
    return `修行者，今日箴言：

"${quote.text}"
——帛书版《道德经》

${quote.title ? `此句出自"${quote.title}"章。` : ''}

${guidance.interpretation}

今日行动：
${guidance.practices.map((p, i) => `${i + 1}. ${p}`).join('\n')}

反思问题：
${guidance.reflectionQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`;
  }

  return `修行者，今日与你分享：

"${quote.text}"

解读：${guidance.interpretation}

行动建议：
${guidance.practices.map((p, i) => `${i + 1}. ${p}`).join('\n')}`;
}

function generateWeeklyReport(session: CompanionSession): string {
  const progress = session.progress;
  const recentJournal = session.journal.slice(-7);

  const weekHighlights = recentJournal.length > 0
    ? recentJournal.map((j) => `- ${j.date}：${j.content.slice(0, 50)}...`).join('\n')
    : '本周暂无记录，继续保持！';

  const nextTopic = MONTHLY_DEEP_DIVE_TOPICS[session.milestones.length % MONTHLY_DEEP_DIVE_TOPICS.length];

  return WEEKLY_REPORT_TEMPLATE
    .replace('{}', new Date().toISOString().slice(0, 10))
    .replace('{}', String(recentJournal.length))
    .replace('{}', String(progress.currentChapter))
    .replace('{}', String(progress.insightsCount))
    .replace('{}', String(progress.dilemmasResolved))
    .replace('{}', weekHighlights)
    .replace('{}', `深入思考"${nextTopic}"`);
}

function generateGreeting(companionType: CompanionType): string {
  const companion = COMPANION_DEFINITIONS[companionType];
  const greetings = companion.greeting;
  return greetings[stableHash(`greeting:${companionType}:${Date.now()}`) % greetings.length];
}

export function createCompanionSession(params: {
  userId: string;
  companionId: CompanionType;
}): CompanionSession {
  const companion = COMPANION_DEFINITIONS[params.companionId];

  return {
    companionId: params.companionId,
    userId: params.userId,
    startDate: new Date().toISOString().slice(0, 10),
    personality: companion.personality,
    progress: {
      currentChapter: 1,
      insightsCount: 0,
      dilemmasResolved: 0,
    },
    relationship: {
      trustLevel: 'low',
      interactionStyle: 'balanced',
      sharedValues: ['修行', '自我提升'],
    },
    milestones: [],
    journal: [],
  };
}

export function addJournalEntry(session: CompanionSession, entry: { content: string; reflection?: string }): CompanionSession {
  const journalEntry: CompanionJournal = {
    date: new Date().toISOString().slice(0, 10),
    content: entry.content,
    reflection: entry.reflection,
  };

  return {
    ...session,
    journal: [...session.journal, journalEntry],
    progress: {
      ...session.progress,
      insightsCount: session.progress.insightsCount + (entry.reflection ? 1 : 0),
    },
  };
}

export function addMilestone(session: CompanionSession, milestone: { event: string; insight: string }): CompanionSession {
  const milestoneEntry: CompanionMilestone = {
    date: new Date().toISOString().slice(0, 10),
    event: milestone.event,
    insight: milestone.insight,
  };

  return {
    ...session,
    milestones: [...session.milestones, milestoneEntry],
    progress: {
      ...session.progress,
      dilemmasResolved: session.progress.dilemmasResolved + 1,
    },
  };
}

export function updateTrustLevel(session: CompanionSession, newTrust: CompanionSession['relationship']['trustLevel']): CompanionSession {
  return {
    ...session,
    relationship: {
      ...session.relationship,
      trustLevel: newTrust,
    },
  };
}

export function getCompanionDefinitions() {
  return COMPANION_DEFINITIONS;
}

export {
  COMPANION_DEFINITIONS,
  generateDailyMessage,
  generateWeeklyReport,
  generateGreeting,
};
