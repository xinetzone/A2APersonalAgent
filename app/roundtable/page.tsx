'use client';

import { useState, useEffect } from 'react';
import { Users, MessageCircle, Lightbulb, Quote, Send, CheckCircle, AlertCircle, Copy, Check, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface DiscussionItem {
  agent: string;
  agentName: string;
  response: string;
  keyQuote: string;
}

interface RoundTableResult {
  id: string;
  date: string;
  dilemma: string;
  agents: string[];
  discussion: DiscussionItem[];
  conclusion: string;
}

const AGENT_INFO = {
  daoist: { name: '道德大师兄', color: 'bg-amber-100 border-amber-400', icon: '🎓', accent: 'text-amber-600' },
  confucian: { name: '儒家智者', color: 'bg-blue-100 border-blue-400', icon: '📜', accent: 'text-blue-600' },
  philosopher: { name: '现代哲学家', color: 'bg-purple-100 border-purple-400', icon: '🧠', accent: 'text-purple-600' },
  scenario: { name: '情境模拟师', color: 'bg-green-100 border-green-400', icon: '🎭', accent: 'text-green-600' },
  merchant: { name: '道德商人', color: 'bg-yellow-100 border-yellow-400', icon: '💰', accent: 'text-yellow-600' },
};

function renderSimpleMarkdown(text: string): React.ReactNode[] {
  return text.split('\n').map((line, lineIndex) => {
    const parts: React.ReactNode[] = [];
    let remaining = line;
    let keyIndex = 0;

    while (remaining.length > 0) {
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      if (boldMatch && boldMatch.index !== undefined) {
        if (boldMatch.index > 0) {
          parts.push(<span key={`text-${lineIndex}-${keyIndex++}`}>{remaining.slice(0, boldMatch.index)}</span>);
        }
        parts.push(<strong key={`bold-${lineIndex}-${keyIndex++}`} className="font-semibold text-dao-primary">{boldMatch[1]}</strong>);
        remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
      } else {
        parts.push(<span key={`text-${lineIndex}-${keyIndex++}`}>{remaining}</span>);
        break;
      }
    }

    return (
      <p key={lineIndex} className="text-gray-700 leading-relaxed mb-2">
        {parts}
      </p>
    );
  });
}

function ConclusionSection({ conclusion }: { conclusion: string }) {
  const lines = conclusion.split('\n').filter(l => l.trim());
  const hasListItems = lines.some(l => l.match(/^\d+\./));

  return (
    <div className="dao-card bg-gradient-to-r from-dao-light to-amber-50 border-l-4 border-dao-gold shadow-lg">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-dao-gold/20">
        <Lightbulb className="w-6 h-6 text-dao-gold" />
        <span className="font-semibold text-lg text-dao-primary">综合建议</span>
        <Sparkles className="w-4 h-4 text-dao-gold/60 ml-auto" />
      </div>
      <div className="pl-0 space-y-3">
        {hasListItems ? (
          <ol className="space-y-3 list-decimal list-inside">
            {lines.filter(l => l.match(/^\d+\./)).map((line, i) => {
              const content = line.replace(/^\d+\.\s*\*\*(.+?)\*\*：/, (_, title) => (
                `<span class="font-semibold text-dao-primary">${title}：</span>`
              ));
              const parts = content.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
              return (
                <li key={i} className="text-gray-700 leading-relaxed">
                  {parts.map((part, j) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                      return <strong key={j} className="font-semibold text-dao-primary">{part.slice(2, -2)}</strong>;
                    }
                    return <span key={j} dangerouslySetInnerHTML={{ __html: part }} />;
                  })}
                </li>
              );
            })}
          </ol>
        ) : (
          renderSimpleMarkdown(conclusion)
        )}
      </div>
    </div>
  );
}

export default function RoundtablePage() {
  const { user, isLoading: authLoading } = useAuth();
  const [dilemma, setDilemma] = useState('');
  const [focus, setFocus] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RoundTableResult | null>(null);
  const [selectedAgents, setSelectedAgents] = useState<string[]>(['daoist', 'confucian', 'philosopher']);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleCopyResults = async () => {
    if (!result) return;
    const text = `${result.dilemma}\n\n${result.discussion.map(d => `${d.agentName}：${d.response}`).join('\n\n')}\n\n综合建议：\n${result.conclusion}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAgentToggle = (agent: string) => {
    setSelectedAgents(prev =>
      prev.includes(agent)
        ? prev.length > 1 ? prev.filter(a => a !== agent) : prev
        : [...prev, agent]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dilemma.trim()) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const params = new URLSearchParams({
        tool: 'moral_roundtable',
        dilemma,
        agents: selectedAgents.join(','),
        focus: focus || '道德修行',
      });

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      const token = localStorage.getItem('secondme_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/mcp?${params.toString()}`, { headers });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `请求失败 (${res.status})`);
      }

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error.message || data.error || '未知错误');
      }

      if (data.result?.content) {
        const text = data.result.content[0]?.text || '{}';
        setResult(JSON.parse(text));
        setSuccess(true);
      } else {
        throw new Error('服务器返回数据格式错误');
      }
    } catch (err) {
      console.error('Failed to fetch roundtable:', err);
      setError(err instanceof Error ? err.message : '网络请求失败，请检查连接后重试');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const isSubmitDisabled = loading || !dilemma.trim() || authLoading;

  return (
    <div className="space-y-8">
      <section className="text-center py-8">
        <h1 className="text-4xl font-bold text-dao-primary mb-4 flex items-center justify-center gap-3">
          <Users className="w-10 h-10" />
          道德圆桌
        </h1>
        <p className="text-lg text-dao-secondary/80 max-w-2xl mx-auto">
          多位智者围坐论道，为你的人生困境提供多元视角的解答
        </p>
      </section>

      <section className="dao-card">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              描述你的道德困境（必填）
            </label>
            <textarea
              value={dilemma}
              onChange={(e) => setDilemma(e.target.value)}
              placeholder="例如：我在工作中发现同事的错误，但指出它可能影响关系，我该如何抉择？"
              className="dao-input min-h-[120px] resize-y"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              讨论焦点（可选）
            </label>
            <input
              type="text"
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              placeholder="例如：职场诚信与关系平衡"
              className="dao-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              参与智者
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(AGENT_INFO).map(([key, info]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleAgentToggle(key)}
                  className={`px-3 py-2 rounded-lg border-2 transition-all flex items-center gap-2 ${
                    selectedAgents.includes(key)
                      ? `${info.color} border-current opacity-100`
                      : 'bg-gray-50 border-gray-200 opacity-60 hover:opacity-100'
                  }`}
                >
                  <span>{info.icon}</span>
                  <span className="text-sm">{info.name}</span>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">圆桌讨论已生成！</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitDisabled}
            className="dao-button w-full flex items-center justify-center gap-2 py-3"
          >
            {loading ? (
              <span className="animate-spin">⟳</span>
            ) : authLoading ? (
              <span>加载中...</span>
            ) : (
              <Send className="w-5 h-5" />
            )}
            {loading ? '正在启动...' : '启动圆桌讨论'}
          </button>
        </form>
      </section>

      {result && (
        <section className="space-y-6 animate-in fade-in duration-500">
          <div className="flex items-center justify-between border-b-2 border-dao-gold/30 pb-4">
            <div className="flex items-center gap-2 text-dao-gold">
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm">议题：{result.dilemma}</span>
            </div>
            <button
              onClick={handleCopyResults}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-dao-primary transition-colors rounded-md hover:bg-gray-100"
              title="复制结果"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? '已复制' : '复制'}</span>
            </button>
          </div>

          <div className="relative">
            <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-dao-gold via-amber-300 to-dao-gold/30 rounded-full" />
            <div className="space-y-4 pl-4">
              {result.discussion.map((item, index) => {
                const agentInfo = AGENT_INFO[item.agent as keyof typeof AGENT_INFO] || AGENT_INFO.daoist;
                return (
                  <div
                    key={index}
                    className={`dao-card ${agentInfo.color} border-l-4 transition-all duration-300 hover:shadow-md`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl">{agentInfo.icon}</span>
                      <div className="flex flex-col">
                        <span className="font-semibold text-dao-primary">{agentInfo.name}</span>
                        {item.keyQuote && (
                          <span className={`text-sm ${agentInfo.accent} italic`}>
                            「{item.keyQuote}」
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="pl-11">
                      <p className="text-gray-700 leading-relaxed">
                        {item.response}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <ConclusionSection conclusion={result.conclusion} />

          <div className="text-center text-sm text-gray-500">
            圆桌讨论 #{result.id.slice(-8)} · {result.date}
          </div>
        </section>
      )}
    </div>
  );
}
