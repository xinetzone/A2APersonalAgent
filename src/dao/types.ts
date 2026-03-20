export type DaoQuote = {
  id: string;
  title?: string;
  text: string;
  source: 'mawangdui' | 'sample';
  themes: string[];
};

export type DaoGuidance = {
  id: string;
  date?: string;
  topic?: string;
  mood?: string;
  quote: DaoQuote;
  interpretation: string;
  reflectionQuestions: string[];
  practices: string[];
};

