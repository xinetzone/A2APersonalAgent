'use client';

import { useState, useEffect, useCallback } from 'react';
import { User, Save, RefreshCw, Check, LogIn, LogOut, AlertCircle, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface DailyGuidance {
  date: string;
  quote: {
    id: string;
    title?: string;
    text: string;
    themes: string[];
  };
  topic?: string;
  mood?: string;
  interpretation: string;
  reflectionQuestions: string[];
  practices: string[];
}

export default function ProfilePage() {
  const { user, isLoading: authLoading, isAuthenticated, login, logout, refreshUser, configError } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [topic, setTopic] = useState('');
  const [mood, setMood] = useState('');
  const [dailyGuidance, setDailyGuidance] = useState<DailyGuidance | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchDailyGuidance = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('secondme_token');
      const res = await fetch(`/api/mcp?tool=dao_daily_guidance`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.result?.content) {
        const text = data.result.content[0]?.text || '{}';
        setDailyGuidance(JSON.parse(text));
      }
    } catch (err) {
      console.error('Failed to fetch daily guidance:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchDailyGuidance();
  }, [fetchDailyGuidance]);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccessMessage(null);
    setSaved(false);
  }, []);

  const saveAsMemory = useCallback(async () => {
    clearMessages();

    if (!isAuthenticated) {
      setError('请先登录 SecondMe');
      return;
    }

    if (!dailyGuidance) {
      setError('今日箴言尚未加载，请稍后重试');
      return;
    }

    if (saving) return;

    setSaving(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const token = localStorage.getItem('secondme_token');
      if (!token) {
        setError('登录状态已失效，请重新登录');
        return;
      }

      const params = new URLSearchParams({ tool: 'dao_save_daily_guidance_memory' });
      if (topic) params.set('topic', topic);
      if (mood) params.set('mood', mood);

      const res = await fetch(`/api/mcp?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error('服务器响应格式错误，请稍后重试');
      }

      if (!res.ok) {
        const errorMessage = data.error?.message || data.error || `请求失败 (${res.status})`;
        throw new Error(errorMessage);
      }

      if (data.error) {
        throw new Error(data.error.message || data.error || '保存失败');
      }

      if (data.result) {
        setSaved(true);
        setSuccessMessage('记忆保存成功！已存入你的 SecondMe Key Memory');
        setTimeout(() => {
          setSaved(false);
          setSuccessMessage(null);
        }, 5000);
      } else {
        throw new Error('服务器返回数据格式错误');
      }
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('Failed to save memory:', err);
      
      if (err instanceof Error && err.name === 'AbortError') {
        setError('请求超时，请检查网络连接后重试');
      } else if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('网络连接失败，请检查网络后重试');
      } else {
        setError(err instanceof Error ? err.message : '保存失败，请重试');
      }
      setSaved(false);
    } finally {
      setSaving(false);
    }
  }, [isAuthenticated, dailyGuidance, topic, mood, saving, clearMessages]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <span className="animate-spin text-4xl text-dao-primary">⟳</span>
          <p className="mt-4 text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="space-y-8">
        <section className="text-center py-8">
          <h1 className="text-4xl font-bold text-dao-primary mb-4">个人中心</h1>
          <p className="text-lg text-dao-secondary/80 max-w-2xl mx-auto">
            管理你的信息和记忆
          </p>
        </section>

        {configError === 'server_not_configured' && (
          <section className="dao-card bg-red-50 border border-red-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-500 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-red-700 mb-2">服务配置错误</h3>
                <p className="text-red-600 mb-4">
                  SecondMe 客户端凭证未正确配置。无法进行登录操作。
                </p>
                <p className="text-sm text-red-500">
                  请联系网站管理员检查服务器环境变量配置（SECONDME_CLIENT_ID 和 SECONDME_CLIENT_SECRET）。
                </p>
              </div>
            </div>
          </section>
        )}

        <section className="dao-card text-center py-12">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-dao-gold/20 flex items-center justify-center">
            <User className="w-10 h-10 text-dao-gold" />
          </div>
          <h2 className="text-2xl font-semibold text-dao-dark mb-4">需要登录</h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            为了提供个性化服务和保存你的记忆，请先使用 SecondMe 账号授权登录。
          </p>
          <button
            onClick={login}
            className="dao-button inline-flex items-center gap-2"
          >
            <LogIn className="w-5 h-5" />
            登录 SecondMe
          </button>
        </section>

        <section className="dao-card">
          <h3 className="text-lg font-semibold text-dao-dark mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-dao-primary" />
            使用说明
          </h3>
          <ul className="space-y-2 text-gray-600">
            <li>• 此页面需要 SecondMe 授权才能获取 Profile 信息</li>
            <li>• 保存记忆功能会将今日箴言存入你的 SecondMe Key Memory</li>
            <li>• 记忆将用于个性化推荐和同频用户匹配</li>
          </ul>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="text-center py-8">
        <h1 className="text-4xl font-bold text-dao-primary mb-4">个人中心</h1>
        <p className="text-lg text-dao-secondary/80 max-w-2xl mx-auto">
          管理你的信息和记忆
        </p>
      </section>

      <section className="dao-card">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-dao-gold/20 flex items-center justify-center overflow-hidden">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name || ''} className="w-full h-full object-cover" />
            ) : (
              <User className="w-8 h-8 text-dao-gold" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-dao-dark">
              {user?.name || user?.email || '用户'}
            </h2>
            {user?.email && (
              <p className="text-gray-600 text-sm">{user.email}</p>
            )}
            {user?.route && (
              <p className="text-gray-500 text-xs">{user.route}</p>
            )}
          </div>
          <button
            onClick={refreshUser}
            className="ml-auto p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="刷新"
          >
            <RefreshCw className="w-5 h-5 text-gray-500" />
          </button>
          <button
            onClick={logout}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-red-500"
            title="退出登录"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </section>

      <section className="dao-card">
        <h3 className="text-lg font-semibold text-dao-dark mb-4 flex items-center gap-2">
          <Save className="w-5 h-5 text-dao-primary" />
          保存今日箴言为记忆
        </h3>

        {loading && (
          <div className="bg-blue-50 text-blue-600 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
            <span className="animate-spin">⟳</span>
            <span className="text-sm">正在加载今日箴言...</span>
          </div>
        )}

        {dailyGuidance && (
          <div className="bg-dao-secondary/5 rounded-lg p-4 mb-4">
            <p className="text-dao-dark font-medium">
              {dailyGuidance.quote.title ? `「${dailyGuidance.quote.title}」` : ''}
              {dailyGuidance.quote.text.substring(0, 50)}...
            </p>
          </div>
        )}

        {!loading && !dailyGuidance && (
          <div className="bg-yellow-50 text-yellow-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">今日箴言尚未加载，请刷新页面重试</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 flex items-center gap-2 animate-in fade-in duration-300">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm flex-1">{error}</span>
            <button
              onClick={clearMessages}
              className="text-red-400 hover:text-red-600 text-xs underline"
            >
              关闭
            </button>
          </div>
        )}

        {(saved || successMessage) && !error && (
          <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg mb-4 flex items-center gap-2 animate-in fade-in duration-300">
            <Check className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm flex-1">{successMessage || '记忆保存成功！'}</span>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              主题（可选）
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => {
                setTopic(e.target.value);
                if (error) clearMessages();
              }}
              placeholder="例如：职业发展、人际关系"
              className="dao-input"
              disabled={saving}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              情绪（可选）
            </label>
            <input
              type="text"
              value={mood}
              onChange={(e) => {
                setMood(e.target.value);
                if (error) clearMessages();
              }}
              placeholder="例如：平静、焦虑"
              className="dao-input"
              disabled={saving}
            />
          </div>

          <button
            onClick={saveAsMemory}
            disabled={saving || !isAuthenticated || !dailyGuidance}
            className={`dao-button w-full flex items-center justify-center gap-2 transition-all ${
              saved ? 'bg-green-600 hover:bg-green-600' : ''
            } ${(saving || !dailyGuidance) ? 'opacity-75 cursor-not-allowed' : ''}`}
          >
            {saving ? (
              <>
                <span className="animate-spin">⟳</span>
                保存中...
              </>
            ) : saved ? (
              <>
                <Check className="w-5 h-5" />
                已保存
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                保存记忆
              </>
            )}
          </button>
          
          {!dailyGuidance && !loading && (
            <p className="text-xs text-gray-500 text-center">
              请等待今日箴言加载完成后再保存
            </p>
          )}
        </div>
      </section>

      <section className="dao-card">
        <h3 className="text-lg font-semibold text-dao-dark mb-4">使用说明</h3>
        <ul className="space-y-2 text-gray-600">
          <li>• 此页面需要 SecondMe 授权才能获取 Profile 信息</li>
          <li>• 保存记忆功能会将今日箴言存入你的 SecondMe Key Memory</li>
          <li>• 记忆将用于个性化推荐和同频用户匹配</li>
        </ul>
      </section>
    </div>
  );
}