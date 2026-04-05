import fs from 'fs/promises';
import path from 'path';
import { DaoQuote } from './types';
import { SAMPLE_QUOTES } from './quotes.sample';

type LoadedQuotes = {
  source: 'mawangdui' | 'sample';
  quotes: DaoQuote[];
};

function toAbsolute(p: string): string {
  if (path.isAbsolute(p)) return p;
  return path.join(process.cwd(), p);
}

export async function loadDaoQuotes(): Promise<LoadedQuotes> {
  const fileFromEnv = process.env.DAO_TEXT_FILE;
  const candidate = fileFromEnv || 'data/mawangdui.json';
  const abs = toAbsolute(candidate);

  try {
    const content = await fs.readFile(abs, 'utf-8');
    const parsed = JSON.parse(content) as unknown;
    if (!Array.isArray(parsed)) {
      throw new Error('quotes json must be an array');
    }
    const quotes: DaoQuote[] = parsed
      .filter((q): q is Record<string, unknown> => typeof q === 'object' && q !== null)
      .map((q) => {
        const id = String(q.id || '');
        const text = String(q.text || '');
        const title = q.title ? String(q.title) : undefined;
        const themes = Array.isArray(q.themes) ? q.themes.map(String) : [];
        if (!id || !text) {
          throw new Error('each quote must include id and text');
        }
        return { id, title, text, themes, source: 'mawangdui' };
      });

    if (quotes.length === 0) {
      throw new Error('quotes json is empty');
    }
    return { source: 'mawangdui', quotes };
  } catch {
    return { source: 'sample', quotes: SAMPLE_QUOTES };
  }
}

