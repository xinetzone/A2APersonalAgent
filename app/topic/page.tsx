'use client';

import { useState } from 'react';
import { Search, MessageCircle, Lightbulb } from 'lucide-react';

interface Guidance {
  quote: {
    title?: string;
    text: string;
  };
  topic?: string;
  mood?: string;
  interpretation: string;
  reflectionQuestions: string[];
  practices: string[];
}

export default function TopicPage() {
  const [topic, setTopic] = useState('');
  const [context, setContext] = useState('');
  const [mood, setMood] = useState('');
  const [guidance, setGuidance] = useState<Guidance | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('secondme_token');
      const params = new URLSearchParams({ tool: 'dao_topic_guidance', topic, context, mood });
      const res = await fetch(`/api/mcp?${params.toString()}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.result?.content) {
        const text = data.result.content[0]?.text || '{}';
        setGuidance(JSON.parse(text));
      } else if (data.error) {
        console.error('API error:', data.error);
      }
    } catch (error) {
      console.error('Failed to fetch guidance:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="text-center py-8">
        <h1 className="text-4xl font-bold text-dao-primary mb-4">主题指导</h1>
        <p className="text-lg text-dao-secondary/80 max-w-2xl mx-auto">
          倾诉你的困惑，从帛书版道德经中寻找答案
        </p>
      </section>

      <section className="dao-card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              你正在经历什么？（必填）
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="例如：职业迷茫、人际关系、工作压力..."
              className="dao-input"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              详细描述（可选）
            </label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="可以详细描述你的情况和感受..."
              className="dao-input min-h-[100px] resize-y"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              当前情绪（可选）
            </label>
            <div className="flex flex-wrap gap-2">
              {['低落', '焦虑', '烦躁', '迷茫', '平静'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMood(mood === m ? '' : m)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    mood === m
                      ? 'bg-dao-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !topic.trim()}
            className="dao-button w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="animate-spin">⟳</span>
            ) : (
              <Search className="w-5 h-5" />
            )}
            寻求指导
          </button>
        </form>
      </section>

      {guidance && (
        <section className="dao-card space-y-6">
          <div className="border-b-2 border-dao-gold/30 pb-4">
            <div className="flex items-center gap-2 text-dao-gold mb-2">
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm">关于「{guidance.topic}」的启示</span>
            </div>
            <blockquote className="text-2xl font-medium text-dao-primary italic mt-4">
              {guidance.quote.title && (
                <span className="text-dao-gold">「{guidance.quote.title}」</span>
              )}
              {guidance.quote.text}
            </blockquote>
          </div>

          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold text-dao-dark mb-3">
              <Lightbulb className="w-5 h-5 text-dao-gold" />
              经典解读
            </h3>
            <p className="text-gray-700 leading-relaxed pl-7">
              {guidance.interpretation}
            </p>
          </div>

          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold text-dao-dark mb-3">
              💭 反思问题
            </h3>
            <ul className="space-y-2 pl-7">
              {guidance.reflectionQuestions.map((q, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-dao-gold font-bold">{i + 1}.</span>
                  <span className="text-gray-700">{q}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold text-dao-dark mb-3">
              🚀 可尝试的行动
            </h3>
            <ul className="space-y-2 pl-7">
              {guidance.practices.map((p, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-dao-secondary font-bold">{i + 1}.</span>
                  <span className="text-gray-700">{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}