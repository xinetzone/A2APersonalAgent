'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const CLIENT_ID = process.env.NEXT_PUBLIC_AGENTPIT_CLIENT_ID;

if (!CLIENT_ID) {
  throw new Error('NEXT_PUBLIC_AGENTPIT_CLIENT_ID must be configured');
}
const OAUTH_URL = 'https://go.second.me/oauth/';

export default function AgentPitLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buttonLabel = process.env.NEXT_PUBLIC_AGENTPIT_LOGIN_BUTTON || '使用 AgentPit 登录';
  const errorParam = searchParams.get('error');

  useEffect(() => {
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, [errorParam]);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      const redirectUri = `${window.location.origin}/api/auth/agentpit/callback`;
      const state = crypto.randomUUID();

      sessionStorage.setItem('agentpit_oauth_state', state);

      const params = new URLSearchParams({
        client_id: CLIENT_ID,
        redirect_uri: redirectUri,
        response_type: 'code',
        state,
      });

      window.location.href = `${OAUTH_URL}?${params.toString()}`;
    } catch {
      setError('启动登录失败，请重试');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">AgentPit 单点登录</h1>
          <p className="text-gray-500 mt-2">通过 AgentPit 账户快速登录</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-6 text-sm">
            <strong>登录失败：</strong> {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              跳转中...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              {buttonLabel}
            </>
          )}
        </button>

        <div className="mt-6 pt-6 border-t border-gray-100">
          <p className="text-center text-gray-400 text-xs">
            点击上方按钮即表示你同意 AgentPit 服务条款
          </p>
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={() => router.push('/login')}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← 返回其他登录方式
          </button>
        </div>
      </div>
    </div>
  );
}
