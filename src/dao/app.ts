import { API_ENDPOINTS } from '../config';
import { createGuidance } from './guidance';
import { loadDaoQuotes } from './load';
import { DaoGuidance, DaoQuote } from './types';

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function getDailyGuidance(params: { date?: string; topic?: string; mood?: string }): Promise<DaoGuidance> {
  const date = params.date || todayISO();
  const { quotes } = await loadDaoQuotes();
  return createGuidance({
    quotes,
    seed: `daily:${date}:${params.topic || ''}:${params.mood || ''}`,
    date,
    topic: params.topic,
    mood: params.mood,
  });
}

export async function getTopicGuidance(params: { topic: string; context?: string; mood?: string }): Promise<DaoGuidance> {
  const { quotes } = await loadDaoQuotes();
  const seed = `topic:${params.topic}:${params.context || ''}:${params.mood || ''}`;
  return createGuidance({
    quotes,
    seed,
    topic: params.topic,
    mood: params.mood,
  });
}

export async function listQuotes(params: { theme?: string; limit?: number }): Promise<DaoQuote[]> {
  const { quotes } = await loadDaoQuotes();
  const limit = params.limit ?? 20;
  if (!params.theme) return quotes.slice(0, limit);
  const th = params.theme.toLowerCase();
  return quotes.filter((q) => q.themes.some((t) => t.toLowerCase().includes(th))).slice(0, limit);
}

export async function saveGuidanceAsMemory(params: {
  token: string;
  date?: string;
  topic?: string;
  mood?: string;
  visibility: number;
  fetchWithToken: (token: string, endpoint: string, options?: RequestInit) => Promise<unknown>;
}): Promise<unknown> {
  const guidance = await getDailyGuidance({ date: params.date, topic: params.topic, mood: params.mood });

  const content = [
    `【今日箴言】${guidance.quote.title ? guidance.quote.title + '：' : ''}${guidance.quote.text}`,
    guidance.topic ? `主题：${guidance.topic}` : undefined,
    guidance.mood ? `情绪：${guidance.mood}` : undefined,
    `解读：${guidance.interpretation}`,
    `反思：${guidance.reflectionQuestions.map((q, i) => `${i + 1}. ${q}`).join(' ')}`,
    `行动：${guidance.practices.map((p, i) => `${i + 1}. ${p}`).join(' ')}`,
  ]
    .filter(Boolean)
    .join('\n');

  return await params.fetchWithToken(params.token, API_ENDPOINTS.memoriesKey, {
    method: 'POST',
    body: JSON.stringify({ mode: 'direct', content, visibility: params.visibility }),
  });
}

