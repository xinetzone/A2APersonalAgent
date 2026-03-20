import crypto from 'crypto';
import { DaoGuidance, DaoQuote } from './types';

function stableHash(input: string): number {
  const buf = crypto.createHash('sha256').update(input).digest();
  return buf.readUInt32BE(0);
}

function pickBySeed<T>(items: T[], seed: string): T {
  const h = stableHash(seed);
  return items[h % items.length];
}

function scoreQuote(quote: DaoQuote, topic?: string): number {
  if (!topic) return 0;
  const t = topic.toLowerCase();
  let score = 0;
  for (const theme of quote.themes) {
    const th = theme.toLowerCase();
    if (t.includes(th)) score += 3;
  }
  if (t.includes('焦虑') || t.includes('不安') || t.includes('压力')) {
    if (quote.themes.includes('无为') || quote.themes.includes('简约') || quote.themes.includes('知止')) score += 2;
  }
  if (t.includes('关系') || t.includes('沟通') || t.includes('冲突')) {
    if (quote.themes.includes('不争') || quote.themes.includes('柔弱') || quote.themes.includes('利他')) score += 2;
  }
  if (t.includes('工作') || t.includes('决策') || t.includes('选择')) {
    if (quote.themes.includes('取舍') || quote.themes.includes('专注') || quote.themes.includes('知止')) score += 2;
  }
  return score;
}

function selectQuote(quotes: DaoQuote[], seed: string, topic?: string): DaoQuote {
  const scored = quotes
    .map((q) => ({ q, s: scoreQuote(q, topic) }))
    .sort((a, b) => b.s - a.s);

  const top = scored.slice(0, Math.min(8, scored.length));
  const candidates = top.length > 0 && top[0].s > 0 ? top.map((x) => x.q) : quotes;
  return pickBySeed(candidates, seed);
}

function buildInterpretation(quote: DaoQuote, topic?: string, mood?: string): string {
  const themeHint = quote.themes.slice(0, 3).join(' / ') || '顺其自然';
  const parts: string[] = [];
  parts.push(`以“${themeHint}”为主线，把注意力从“立刻解决”转到“先让系统变得更顺”。`);
  if (topic) parts.push(`针对主题“${topic}”，先减少对抗与用力，留出一段观察与缓冲。`);
  if (mood) parts.push(`当下情绪为“${mood}”，优先做能立刻降低摩擦的微动作，而不是追求一次性定局。`);
  return parts.join('');
}

function buildQuestions(topic?: string): string[] {
  const base = [
    '我现在最想“控制”的是什么？它真的必须被控制吗？',
    '如果少做一步，我会失去什么？会得到什么？',
    '今天我可以在哪个小处“不争”而仍然把事做好？',
    '我把“重要”与“紧急”混在一起了吗？',
  ];
  if (!topic) return base.slice(0, 3);
  return [
    `就“${topic}”而言：我在用力解决的是表象还是根因？`,
    '有哪些动作会让局面更僵？我能先停止哪个？',
    '如果目标是“更少摩擦”，我今天该做哪一件小事？',
  ];
}

function buildPractices(): string[] {
  return [
    '列出3个必须做的事，其余先暂缓24小时。',
    '把一个难题拆成“下一步最小动作”，只做这一小步。',
    '在沟通前先复述对方诉求一次，减少对抗。',
  ];
}

export function createGuidance(params: {
  quotes: DaoQuote[];
  seed: string;
  date?: string;
  topic?: string;
  mood?: string;
}): DaoGuidance {
  const quote = selectQuote(params.quotes, params.seed, params.topic);
  return {
    id: `dao-${stableHash(params.seed)}`,
    date: params.date,
    topic: params.topic,
    mood: params.mood,
    quote,
    interpretation: buildInterpretation(quote, params.topic, params.mood),
    reflectionQuestions: buildQuestions(params.topic),
    practices: buildPractices(),
  };
}

