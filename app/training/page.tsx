'use client';

import { useState, useEffect } from 'react';
import { Sword, List, ChevronRight, CheckCircle, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Scenario {
  id: string;
  type: string;
  difficulty: string;
  theme: string;
  title: string;
  description: string;
  situation: string;
  choices: { id: string; text: string }[];
  moralPrinciples: string[];
}

interface TrainingResult {
  scenarioId: string;
  userChoice: string;
  agentFeedback: string;
  moralInsight: string;
  relatedQuotes: string[];
}

const DIFFICULTY_COLORS: Record<string, string> = {
  '初级': 'bg-green-100 text-green-800',
  '中级': 'bg-yellow-100 text-yellow-800',
  '进阶': 'bg-orange-100 text-orange-800',
  '高阶': 'bg-red-100 text-red-800',
};

export default function TrainingPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [result, setResult] = useState<TrainingResult | null>(null);
  const [filterType, setFilterType] = useState<string>('');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchScenarios();
    }
  }, [isAuthenticated]);

  const fetchScenarios = async (type?: string, difficulty?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ tool: 'moral_training_camp', action: 'list_scenarios' });
      if (type) params.set('scenarioType', type);
      if (difficulty) params.set('difficulty', difficulty);

      const token = localStorage.getItem('secondme_token');
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/mcp?${params.toString()}`, { headers });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || `加载失败 (${res.status})`);
      }

      if (data.result?.content) {
        const text = data.result.content[0]?.text || '[]';
        setScenarios(JSON.parse(text));
      } else if (data.error) {
        throw new Error(data.error.message || '加载场景失败');
      }
    } catch (err) {
      console.error('Failed to fetch scenarios:', err);
      setError(err instanceof Error ? err.message : '加载场景失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleScenarioClick = (scenario: Scenario) => {
    setSelectedScenario(scenario);
    setSelectedChoice(null);
    setResult(null);
    setError(null);
  };

  const handleChoiceSelect = async (choiceId: string) => {
    if (!selectedScenario || submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        tool: 'moral_training_camp',
        action: 'submit_choice',
        scenarioId: selectedScenario.id,
        choiceId,
      });

      const token = localStorage.getItem('secondme_token');
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/mcp?${params.toString()}`, { headers });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || `提交失败 (${res.status})`);
      }

      if (data.result?.content) {
        const text = data.result.content[0]?.text || '{}';
        setResult(JSON.parse(text));
      } else if (data.error) {
        throw new Error(data.error.message || '提交选择失败');
      }
    } catch (err) {
      console.error('Failed to submit choice:', err);
      setError(err instanceof Error ? err.message : '提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredScenarios = scenarios.filter(s => {
    if (filterType && s.type !== filterType) return false;
    if (filterDifficulty && s.difficulty !== filterDifficulty) return false;
    return true;
  });

  return (
    <div className="space-y-8">
      <section className="text-center py-8">
        <h1 className="text-4xl font-bold text-dao-primary mb-4 flex items-center justify-center gap-3">
          <Sword className="w-10 h-10" />
          道德修炼场
        </h1>
        <p className="text-lg text-dao-secondary/80 max-w-2xl mx-auto">
          在安全环境中修炼道德抉择能力，通过情境模拟体悟人生智慧
        </p>
      </section>

      {authLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-dao-primary" />
          <span className="ml-3 text-gray-500">加载中...</span>
        </div>
      ) : !isAuthenticated ? (
        <div className="dao-card text-center py-12">
          <AlertCircle className="w-12 h-12 mx-auto text-dao-gold mb-4" />
          <h2 className="text-xl font-semibold text-dao-primary mb-2">需要登录</h2>
          <p className="text-gray-600">请先登录 SecondMe 账号以访问道德修炼场</p>
        </div>
      ) : error ? (
        <div className="dao-card bg-red-50 border-red-200">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      ) : !selectedScenario ? (
        <>
          <section className="dao-card">
            <div className="flex flex-wrap gap-4 mb-4">
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  fetchScenarios(e.target.value || undefined, filterDifficulty || undefined);
                }}
                className="dao-input w-auto"
              >
                <option value="">全部类型</option>
                <option value="两难抉择">两难抉择</option>
                <option value="欲望考验">欲望考验</option>
                <option value="人际冲突">人际冲突</option>
                <option value="权力使用">权力使用</option>
                <option value="长期规划">长期规划</option>
              </select>
              <select
                value={filterDifficulty}
                onChange={(e) => {
                  setFilterDifficulty(e.target.value);
                  fetchScenarios(filterType || undefined, e.target.value || undefined);
                }}
                className="dao-input w-auto"
              >
                <option value="">全部难度</option>
                <option value="初级">初级</option>
                <option value="中级">中级</option>
                <option value="进阶">进阶</option>
                <option value="高阶">高阶</option>
              </select>
            </div>
          </section>

          <section className="grid md:grid-cols-2 gap-4">
            {filteredScenarios.map((scenario) => (
              <div
                key={scenario.id}
                onClick={() => handleScenarioClick(scenario)}
                className="dao-card hover:shadow-lg cursor-pointer transition-all hover:border-dao-gold"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded text-xs ${DIFFICULTY_COLORS[scenario.difficulty] || 'bg-gray-100'}`}>
                    {scenario.difficulty}
                  </span>
                  <span className="text-xs text-dao-secondary">{scenario.type}</span>
                </div>
                <h3 className="text-lg font-semibold text-dao-primary mb-2">{scenario.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{scenario.description}</p>
                <div className="flex items-center text-dao-gold text-sm">
                  <span>开始修炼</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            ))}
          </section>
        </>
      ) : (
        <section className="space-y-6">
          <button
            onClick={() => setSelectedScenario(null)}
            className="text-dao-secondary hover:text-dao-primary flex items-center gap-1 mb-4"
          >
            ← 返回场景列表
          </button>

          <div className="dao-card">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-center gap-2 text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}
            <div className="flex items-center gap-2 mb-4">
              <span className={`px-2 py-0.5 rounded text-xs ${DIFFICULTY_COLORS[selectedScenario.difficulty]}`}>
                {selectedScenario.difficulty}
              </span>
              <span className="text-xs text-dao-secondary">{selectedScenario.type}</span>
            </div>
            <h2 className="text-2xl font-bold text-dao-primary mb-4">{selectedScenario.title}</h2>
            <div className="bg-dao-light rounded-lg p-6 mb-6">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedScenario.situation}</p>
            </div>
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-3">你会怎么做？</p>
              <div className="space-y-3">
                {selectedScenario.choices.map((choice) => (
                  <button
                    key={choice.id}
                    onClick={() => handleChoiceSelect(choice.id)}
                    disabled={submitting}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      selectedChoice === choice.id
                        ? 'border-dao-gold bg-dao-gold/10'
                        : 'border-gray-200 hover:border-dao-secondary'
                    } ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {submitting && selectedChoice === choice.id ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        处理中...
                      </span>
                    ) : (
                      <>
                        <span className="font-bold text-dao-primary mr-2">{choice.id}.</span>
                        {choice.text}
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {result && (
            <div className="dao-card bg-gradient-to-br from-dao-light to-white border-l-4 border-dao-gold">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-6 h-6 text-dao-gold" />
                <span className="font-semibold text-dao-primary">修炼反馈</span>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">你的选择：</p>
                  <p className="text-dao-primary">{result.userChoice}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">智者点评：</p>
                  <p className="text-gray-700 leading-relaxed">{result.agentFeedback}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">道德洞见：</p>
                  <p className="text-gray-700 leading-relaxed italic">{result.moralInsight}</p>
                </div>
                {result.relatedQuotes.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">相关经典：</p>
                    <div className="flex flex-wrap gap-2">
                      {result.relatedQuotes.map((quote, i) => (
                        <span key={i} className="px-3 py-1 bg-dao-gold/20 text-dao-gold rounded-full text-sm">
                          「{quote}」
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  setSelectedChoice(null);
                  setResult(null);
                }}
                className="mt-6 dao-button flex items-center gap-2"
              >
                <ArrowRight className="w-4 h-4" />
                再试一次
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
