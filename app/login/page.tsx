'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, User, Lock, AlertCircle, Loader2, CheckCircle, ArrowLeft, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type LoginStep = 'input' | 'redirecting' | 'success' | 'error';

interface FormErrors {
  general?: string;
}

export default function LoginPage() {
  const { isAuthenticated, isLoading: authLoading, login, configError } = useAuth();
  const [loginStep, setLoginStep] = useState<LoginStep>('input');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isButtonPressed, setIsButtonPressed] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      setLoginStep('success');
      const timer = setTimeout(() => {
        window.location.href = '/';
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated]);

  const handleLogin = async () => {
    setErrors({});

    if (configError === 'server_not_configured') {
      setErrors({ general: '服务配置错误，请联系管理员检查环境变量' });
      setLoginStep('error');
      return;
    }

    setLoginStep('redirecting');
    setIsButtonPressed(true);

    try {
      await login();
    } catch (error) {
      setErrors({ general: '登录失败，请重试' });
      setLoginStep('error');
      setIsButtonPressed(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dao-dark via-dao-secondary/20 to-dao-gold/10 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-dao-gold/20 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-dao-gold animate-spin" />
          </div>
          <p className="text-dao-secondary">加载中...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated || loginStep === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dao-dark via-dao-secondary/20 to-dao-gold/10 flex items-center justify-center p-4">
        <div className="dao-card text-center max-w-md w-full">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-dao-primary mb-2">登录成功</h2>
          <p className="text-gray-600 mb-4">正在跳转至首页...</p>
          <div className="w-full bg-gray-200 rounded-full h-1 overflow-hidden">
            <div className="bg-dao-gold h-1 rounded-full animate-pulse" style={{ width: '100%' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dao-dark via-dao-secondary/20 to-dao-gold/10 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-dao-gold/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-dao-secondary/10 rounded-full blur-3xl" />
      </div>

      <div className="dao-card max-w-md w-full relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-dao-primary mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回首页
        </Link>

        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-dao-gold/20 to-dao-gold/5 flex items-center justify-center">
            <BookOpen className="w-10 h-10 text-dao-gold" />
          </div>
          <h1 className="text-3xl font-bold text-dao-primary mb-2">欢迎来到道德人生</h1>
          <p className="text-gray-600">基于帛书版《道德经》的智能修行平台</p>
        </div>

        {loginStep === 'error' && errors.general && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-red-700 font-medium">登录失败</p>
              <p className="text-red-600 text-sm mt-1">{errors.general}</p>
            </div>
          </div>
        )}

        {configError === 'server_not_configured' && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-amber-700 font-medium">服务配置提示</p>
              <p className="text-amber-600 text-sm mt-1">
                SecondMe 客户端凭证未配置。登录功能在正式环境中将不可用。
              </p>
            </div>
          </div>
        )}

        <div className="space-y-4 mb-6">
          <div className="p-4 bg-dao-light/50 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <User className="w-5 h-5 text-dao-gold" />
              <span className="font-medium text-dao-primary">授权登录</span>
            </div>
            <p className="text-sm text-gray-600">
              点击下方按钮将跳转至 SecondMe 授权页面完成身份验证
            </p>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">登录后你可以：</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                获取个性化今日箴言
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                保存修行记忆到 Key Memory
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                参与道德圆桌讨论
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                与其他修行者互动
              </li>
            </ul>
          </div>
        </div>

        <button
          onClick={handleLogin}
          disabled={loginStep === 'redirecting' || isButtonPressed}
          className={`dao-button w-full py-4 text-lg flex items-center justify-center gap-3 transition-all ${
            isButtonPressed ? 'active:scale-95' : ''
          } ${loginStep === 'redirecting' ? 'opacity-75 cursor-not-allowed' : ''}`}
        >
          {loginStep === 'redirecting' ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>正在跳转...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-6 h-6" />
              <span>使用 SecondMe 登录</span>
            </>
          )}
        </button>

        <div className="mt-6 pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-500 text-center">
            登录即表示你同意我们的{' '}
            <Link href="/terms" className="text-dao-gold hover:underline">服务条款</Link>
            {' '}和{' '}
            <Link href="/privacy" className="text-dao-gold hover:underline">隐私政策</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
