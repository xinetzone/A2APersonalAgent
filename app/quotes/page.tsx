'use client';

import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { BookOpen, Filter } from 'lucide-react';

interface Quote {
  id: string;
  title?: string;
  text: string;
  themes: string[];
}

const THEMES = ['无为', '知足', '柔弱', '上善若水', '道法自然', '清净', '不争'];

const QuoteCard = memo(function QuoteCard({ quote }: { quote: Quote }) {
  return (
    <div className="dao-card hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-dao-gold/10 flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-dao-gold" />
        </div>
        <div className="flex-1">
          {quote.title && (
            <h3 className="text-lg font-semibold text-dao-gold mb-2">
              「{quote.title}」
            </h3>
          )}
          <p className="text-lg text-dao-dark leading-relaxed mb-3">
            {quote.text}
          </p>
          <div className="flex flex-wrap gap-1">
            {quote.themes.map((theme) => (
              <span
                key={theme}
                className="px-2 py-0.5 bg-dao-secondary/10 text-dao-secondary text-xs rounded"
              >
                {theme}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="dao-card animate-pulse">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-200" />
            <div className="flex-1">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-3" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState('');

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ tool: 'dao_quotes_list', limit: '50' });
      if (selectedTheme) params.set('theme', selectedTheme);

      const res = await fetch(`/api/mcp?${params.toString()}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setQuotes(data);
      }
    } catch (error) {
      console.error('Failed to fetch quotes:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedTheme]);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  const themeButtons = useMemo(() => THEMES.map((theme) => ({
    theme,
    isSelected: selectedTheme === theme,
    onClick: () => setSelectedTheme(theme === selectedTheme ? '' : theme),
  })), [selectedTheme]);

  return (
    <div className="space-y-8">
      <section className="text-center py-8">
        <h1 className="text-4xl font-bold text-dao-primary mb-4">道德经摘句</h1>
        <p className="text-lg text-dao-secondary/80 max-w-2xl mx-auto">
          探索帛书版道德经的经典智慧
        </p>
      </section>

      <section className="dao-card">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-dao-primary" />
          <span className="font-medium">按主题筛选：</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedTheme('')}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              !selectedTheme
                ? 'bg-dao-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            全部
          </button>
          {themeButtons.map(({ theme, isSelected, onClick }) => (
            <button
              key={theme}
              onClick={onClick}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                isSelected
                  ? 'bg-dao-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {theme}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-4">
        {loading ? (
          <LoadingSkeleton />
        ) : quotes.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>暂无数据</p>
          </div>
        ) : (
          quotes.map((quote) => (
            <QuoteCard key={quote.id} quote={quote} />
          ))
        )}
      </section>
    </div>
  );
}