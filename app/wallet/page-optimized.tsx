'use client';

import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import {
  Wallet, Coins, Gift, ArrowUpDown, Plus, History, Shield, CheckCircle,
  XCircle, AlertCircle, Settings, Lock, User, Eye, EyeOff, ChevronLeft,
  ChevronRight, CreditCard, TrendingUp, ArrowUpCircle, ArrowDownCircle,
  Loader2, Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

// 类型定义
interface WalletSummary {
  meritBalance: number;
  trustQuota: number;
  trustScore: number;
  level: string;
  totalEarned: number;
  totalSpent: number;
  recentTransactions: Transaction[];
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  source?: string;
  target?: string;
  date: string;
  note?: string;
}

// 常量配置
const CONFIG = {
  transactionsPerPage: 5,
  maxNameLength: 20,
  minPasswordLength: 8,
  securityCodeLength: 6,
  apiTimeout: 10000,
  retryAttempts: 3,
  retryDelay: 1000,
} as const;

const LEVEL_OPTIONS = [
  { value: '闻道', label: '闻道', description: '初入道德之门', dailyLimit: 30, trustQuota: 50 },
  { value: '悟道', label: '悟道', description: '理解道德真谛', dailyLimit: 50, trustQuota: 100 },
  { value: '行道', label: '行道', description: '践行道德准则', dailyLimit: 100, trustQuota: 200 },
  { value: '得道', label: '得道', description: '道德修养深厚', dailyLimit: 200, trustQuota: 500 },
  { value: '同道', label: '同道', description: '与道合真', dailyLimit: 500, trustQuota: 1000 },
] as const;

const ETHICAL_CRITERIA_OPTIONS = [
  { key: 'enableTransparency', label: '交易透明度', description: '允许查看所有交易记录', default: true },
  { key: 'enablePrivacy', label: '隐私保护', description: '隐藏敏感交易信息', default: true },
  { key: 'autoReportEnabled', label: '自动报告', description: '定期生成道德报告', default: false },
  { key: 'requireTwoFactor', label: '双因素认证', description: '重要操作需要验证', default: true },
] as const;

// 骨架屏组件 - 使用 memo 优化
const WalletSkeleton = memo(function WalletSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" role="status" aria-label="加载中">
      <div className="grid md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="dao-card bg-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-300 rounded-full" />
              <div className="space-y-2">
                <div className="w-20 h-8 bg-gray-300 rounded" />
                <div className="w-16 h-4 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="dao-card">
        <div className="w-32 h-6 bg-gray-200 rounded mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-full h-20 bg-gray-100 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
});

// 加载按钮组件
interface LoadingButtonProps {
  loading: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit';
}

const LoadingButton = memo(function LoadingButton({
  loading,
  children,
  onClick,
  disabled,
  className = '',
  type = 'button'
}: LoadingButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`dao-button flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {loading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>处理中...</span>
        </>
      ) : children}
    </button>
  );
});

// 密码强度指示器
interface PasswordStrengthIndicatorProps {
  password: string;
}

const PasswordStrengthIndicator = memo(function PasswordStrengthIndicator({
  password
}: PasswordStrengthIndicatorProps) {
  const strength = useMemo(() => {
    if (password.length < 8) return { level: 0, text: '太短', color: 'bg-red-500' };
    let score = 0;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    const levels = [
      { level: 1, text: '弱', color: 'bg-red-500' },
      { level: 2, text: '中', color: 'bg-yellow-500' },
      { level: 3, text: '良', color: 'bg-blue-500' },
      { level: 4, text: '强', color: 'bg-green-500' },
    ];
    return levels[score - 1] || levels[0];
  }, [password]);

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex gap-1 h-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`flex-1 rounded-full transition-colors ${
              i <= strength.level ? strength.color : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <p className={`text-xs mt-1 ${strength.color.replace('bg-', 'text-')}`}>
        密码强度: {strength.text}
      </p>
    </div>
  );
});

// 步骤指示器
interface StepIndicatorProps {
  currentStep: number;
  steps: string[];
}

const StepIndicator = memo(function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
              index < currentStep
                ? 'bg-green-500 text-white'
                : index === currentStep
                ? 'bg-dao-primary text-white'
                : 'bg-gray-200 text-gray-500'
            }`}
          >
            {index < currentStep ? <CheckCircle className="w-5 h-5" /> : index + 1}
          </div>
          <span
            className={`ml-2 text-sm hidden sm:block ${
              index <= currentStep ? 'text-dao-primary font-medium' : 'text-gray-400'
            }`}
          >
            {step}
          </span>
          {index < steps.length - 1 && (
            <div
              className={`w-8 h-0.5 mx-2 ${
                index < currentStep ? 'bg-green-500' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
});

// 主组件
export default function WalletPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  // 状态管理
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // 表单状态
  const [walletName, setWalletName] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<typeof LEVEL_OPTIONS[number]['value']>('闻道');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [securityCode, setSecurityCode] = useState('');
  const [ethicalCriteria, setEthicalCriteria] = useState({
    enableTransparency: true,
    enablePrivacy: true,
    autoReportEnabled: false,
    requireTwoFactor: true,
  });

  // 模态框状态
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSpendModal, setShowSpendModal] = useState(false);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [showTrustModal, setShowTrustModal] = useState(false);

  // 输入状态
  const [spendAmount, setSpendAmount] = useState('');
  const [donationAmount, setDonationAmount] = useState('');
  const [trustAmount, setTrustAmount] = useState('');

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);

  // 获取用户ID
  const getUserId = useCallback(() => {
    if (user?.id) return user.id;
    if (user?.email) return `user-${btoa(user.email).slice(0, 8)}`;
    return `user-${Date.now()}`;
  }, [user]);

  // 带重试的 fetch 函数
  const fetchWithRetry = useCallback(async (
    url: string,
    options: RequestInit = {}
  ): Promise<Response> => {
    let lastError: Error | undefined;
    
    for (let attempt = 0; attempt <= CONFIG.retryAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.apiTimeout);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        return response;
      } catch (error) {
        lastError = error as Error;
        if (attempt < CONFIG.retryAttempts) {
          await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelay));
        }
      }
    }
    
    throw lastError;
  }, []);

  // 获取钱包数据
  const fetchWallet = useCallback(async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    setNetworkError(false);

    try {
      const userId = getUserId();
      const params = new URLSearchParams({
        tool: 'moral_wallet',
        action: 'get_summary',
        userId,
      });

      const res = await fetchWithRetry(`/api/mcp?${params.toString()}`);

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();

      if (data.result?.content) {
        const text = data.result.content[0]?.text || '{}';
        const result = JSON.parse(text);

        if (result.error) {
          setShowCreateModal(true);
          setCurrentStep(1);
        } else {
          setSummary(result);
          setShowCreateModal(false);
        }
      }
    } catch (error) {
      console.error('Failed to fetch wallet:', error);
      setNetworkError(true);
      toast.error('无法连接到服务器，请检查网络连接');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, getUserId, fetchWithRetry]);

  // 创建钱包
  const handleCreateWallet = useCallback(async () => {
    if (!walletName.trim()) {
      toast.error('请输入钱包名称');
      return;
    }

    if (password.length < CONFIG.minPasswordLength) {
      toast.error(`密码长度至少为 ${CONFIG.minPasswordLength} 位`);
      return;
    }

    if (securityCode.length !== CONFIG.securityCodeLength || !/^\d+$/.test(securityCode)) {
      toast.error(`请输入 ${CONFIG.securityCodeLength} 位数字安全码`);
      return;
    }

    setLoading(true);

    try {
      const userId = getUserId();
      const params = new URLSearchParams({
        tool: 'moral_wallet',
        action: 'create_wallet',
        userId,
        name: walletName.trim(),
        level: selectedLevel,
      });

      const res = await fetchWithRetry(`/api/mcp?${params.toString()}`);
      const data = await res.json();

      if (data.result?.content) {
        const text = data.result.content[0]?.text || '{}';
        const result = JSON.parse(text);

        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success(`道德钱包「${walletName}」已成功创建！`);
          setShowCreateModal(false);
          setCurrentStep(0);
          resetForm();
          fetchWallet();
        }
      }
    } catch (error) {
      console.error('Failed to create wallet:', error);
      toast.error('钱包创建失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [walletName, password, securityCode, selectedLevel, getUserId, fetchWithRetry, fetchWallet]);

  // 获取功德
  const earnMerit = useCallback(async (source: string) => {
    if (!summary) {
      toast.warning('请先创建钱包');
      return;
    }

    setLoading(true);
    try {
      const userId = getUserId();
      const params = new URLSearchParams({
        tool: 'moral_wallet',
        action: 'earn_merit',
        userId,
        source,
      });

      const res = await fetchWithRetry(`/api/mcp?${params.toString()}`);
      const data = await res.json();

      if (data.result?.content) {
        toast.success('功德积分已添加');
        fetchWallet();
      }
    } catch (error) {
      console.error('Failed to earn merit:', error);
      toast.error('无法获取功德积分');
    } finally {
      setLoading(false);
    }
  }, [summary, getUserId, fetchWithRetry, fetchWallet]);

  // 重置表单
  const resetForm = useCallback(() => {
    setWalletName('');
    setPassword('');
    setSecurityCode('');
    setSelectedLevel('闻道');
    setEthicalCriteria({
      enableTransparency: true,
      enablePrivacy: true,
      autoReportEnabled: false,
      requireTwoFactor: true,
    });
  }, []);

  // 初始加载
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchWallet();
    }
  }, [isAuthenticated, user, fetchWallet]);

  // 监听认证状态
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast.warning('请先登录后再创建道德钱包');
    }
  }, [authLoading, isAuthenticated]);

  // 渲染步骤内容
  const renderStepContent = useCallback(() => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <User className="w-16 h-16 mx-auto mb-4 text-dao-primary" />
              <h2 className="text-xl font-semibold text-gray-800 mb-2">身份验证</h2>
              <p className="text-gray-600">请验证您的身份以继续</p>
            </div>

            <div className="dao-card bg-gray-50">
              {isAuthenticated && user ? (
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-dao-primary flex items-center justify-center text-white font-bold text-lg">
                    {user.name?.[0] || user.email?.[0] || 'U'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{user.name || '已认证用户'}</p>
                    <p className="text-sm text-gray-500">{user.email || '身份已验证'}</p>
                  </div>
                  <CheckCircle className="w-6 h-6 text-green-500 ml-auto" />
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-600 mb-4">您尚未登录</p>
                  <a href="/api/auth/login" className="dao-button inline-flex items-center gap-2">
                    登录后再试
                  </a>
                </div>
              )}
            </div>

            {isAuthenticated && (
              <LoadingButton
                onClick={() => setCurrentStep(1)}
                loading={false}
                className="w-full"
              >
                <Shield className="w-5 h-5" />
                验证通过，继续
              </LoadingButton>
            )}
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Settings className="w-16 h-16 mx-auto mb-4 text-dao-primary" />
              <h2 className="text-xl font-semibold text-gray-800 mb-2">钱包配置</h2>
              <p className="text-gray-600">设置您的道德钱包基本参数</p>
            </div>

            <div className="dao-card space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  钱包名称 <span className="text-gray-400">({walletName.length}/{CONFIG.maxNameLength})</span>
                </label>
                <input
                  type="text"
                  value={walletName}
                  onChange={(e) => setWalletName(e.target.value.slice(0, CONFIG.maxNameLength))}
                  placeholder="给您的钱包起个名字"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dao-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">初始境界</label>
                <div className="grid grid-cols-5 gap-2">
                  {LEVEL_OPTIONS.map((level) => (
                    <button
                      key={level.value}
                      onClick={() => setSelectedLevel(level.value)}
                      className={`p-3 rounded-lg border-2 transition-all text-center ${
                        selectedLevel === level.value
                          ? 'border-dao-primary bg-dao-primary/10'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <p className="font-medium text-sm">{level.label}</p>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {LEVEL_OPTIONS.find(l => l.value === selectedLevel)?.description}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep(0)}
                className="dao-button-secondary flex-1"
              >
                返回
              </button>
              <button
                onClick={() => setCurrentStep(2)}
                disabled={!walletName.trim()}
                className="dao-button flex-1"
              >
                下一步
              </button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Lock className="w-16 h-16 mx-auto mb-4 text-dao-primary" />
              <h2 className="text-xl font-semibold text-gray-800 mb-2">安全设置</h2>
              <p className="text-gray-600">配置您的钱包安全级别</p>
            </div>

            <div className="dao-card space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  钱包密码 <span className="text-gray-400">(至少 {CONFIG.minPasswordLength} 位)</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="设置钱包密码"
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dao-primary focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <PasswordStrengthIndicator password={password} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  安全码 <span className="text-gray-400">({CONFIG.securityCodeLength} 位数字)</span>
                </label>
                <input
                  type="text"
                  value={securityCode}
                  onChange={(e) => setSecurityCode(e.target.value.replace(/\D/g, '').slice(0, CONFIG.securityCodeLength))}
                  placeholder="输入安全码"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dao-primary focus:border-transparent"
                  maxLength={CONFIG.securityCodeLength}
                />
                <p className="text-xs text-gray-500 mt-1">请牢记此安全码，用于重要操作验证</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep(1)}
                className="dao-button-secondary flex-1"
              >
                返回
              </button>
              <LoadingButton
                onClick={handleCreateWallet}
                loading={loading}
                disabled={password.length < CONFIG.minPasswordLength || securityCode.length !== CONFIG.securityCodeLength}
                className="flex-1"
              >
                <CheckCircle className="w-5 h-5" />
                创建钱包
              </LoadingButton>
            </div>
          </div>
        );

      default:
        return null;
    }
  }, [
    currentStep, isAuthenticated, user, walletName, selectedLevel, password, securityCode,
    showPassword, loading, handleCreateWallet
  ]);

  // 渲染交易图标
  const getTransactionIcon = useCallback((type: string) => {
    switch (type) {
      case 'earning':
        return <Plus className="w-4 h-4 text-green-600" />;
      case 'spending':
      case 'donation':
        return <Coins className="w-4 h-4 text-red-600" />;
      default:
        return <ArrowUpDown className="w-4 h-4 text-gray-600" />;
    }
  }, []);

  // 渲染交易颜色
  const getTransactionColor = useCallback((amount: number) => {
    if (amount > 0) return 'text-green-600';
    if (amount < 0) return 'text-red-600';
    return 'text-gray-600';
  }, []);

  if (authLoading) {
    return (
      <div className="space-y-8">
        <section className="text-center py-8">
          <h1 className="text-4xl font-bold text-dao-primary mb-4 flex items-center justify-center gap-3">
            <Wallet className="w-10 h-10" />
            道德钱包
          </h1>
          <p className="text-lg text-dao-secondary/80 max-w-2xl mx-auto">
            功德积分体系，让道德修行可量化、可流通
          </p>
        </section>
        <WalletSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="text-center py-8">
        <h1 className="text-4xl font-bold text-dao-primary mb-4 flex items-center justify-center gap-3">
          <Wallet className="w-10 h-10" />
          道德钱包
        </h1>
        <p className="text-lg text-dao-secondary/80 max-w-2xl mx-auto">
          功德积分体系，让道德修行可量化、可流通
        </p>
      </section>

      {networkError && (
        <div className="dao-card bg-red-50 border border-red-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <div>
              <p className="font-medium text-red-800">网络连接异常</p>
              <p className="text-sm text-red-600">无法连接到服务器</p>
            </div>
            <LoadingButton onClick={fetchWallet} loading={loading} className="ml-auto">
              重试
            </LoadingButton>
          </div>
        </div>
      )}

      {showCreateModal && (
        <section className="dao-card max-w-2xl mx-auto">
          <StepIndicator
            currentStep={currentStep}
            steps={['身份验证', '钱包配置', '安全设置']}
          />
          {renderStepContent()}
        </section>
      )}

      {!summary && !showCreateModal && !networkError && (
        <section className="dao-card text-center py-12">
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-8 mb-6">
            <Sparkles className="w-16 h-16 mx-auto mb-4 text-amber-500" />
            <h2 className="text-2xl font-semibold text-amber-800 mb-2">欢迎加入道德人生</h2>
            <p className="text-amber-700 mb-4">创建您的道德钱包，开始积累功德</p>
            <div className="inline-flex items-center gap-2 bg-white rounded-lg px-4 py-2 text-amber-800">
              <Gift className="w-5 h-5" />
              <span>新用户将获得 100 功德积分初始奖励</span>
            </div>
          </div>
          <LoadingButton
            onClick={() => {
              if (!isAuthenticated) {
                toast.warning('请先登录后再创建钱包');
                return;
              }
              setShowCreateModal(true);
              setCurrentStep(0);
            }}
            loading={loading}
            className="mx-auto"
          >
            <Plus className="w-5 h-5" />
            创建道德钱包
          </LoadingButton>
        </section>
      )}

      {loading && !summary && !networkError && <WalletSkeleton />}

      {summary && !loading && (
        <>
          <section className="grid md:grid-cols-3 gap-6">
            <div className="dao-card bg-gradient-to-br from-amber-50 to-white border-l-4 border-amber-400">
              <div className="flex items-center gap-3 mb-4">
                <Coins className="w-8 h-8 text-amber-500" />
                <div>
                  <p className="text-3xl font-bold text-amber-600">{summary.meritBalance}</p>
                  <p className="text-sm text-gray-600">功德积分</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">等级：{summary.level}</p>
            </div>

            <div className="dao-card bg-gradient-to-br from-blue-50 to-white border-l-4 border-blue-400">
              <div className="flex items-center gap-3 mb-4">
                <Gift className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-3xl font-bold text-blue-600">{summary.trustQuota}</p>
                  <p className="text-sm text-gray-600">信任额度</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">信誉分：{summary.trustScore}</p>
            </div>

            <div className="dao-card">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">累计收益 / 支出</p>
                <p className="text-2xl font-bold text-green-600">+{summary.totalEarned}</p>
                <p className="text-xl text-red-600">-{summary.totalSpent}</p>
              </div>
            </div>
          </section>

          <section className="dao-card">
            <h2 className="text-lg font-semibold text-dao-primary mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5" />
              获取功德
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { key: 'daily_practice', label: '每日修身', points: '+5' },
                { key: 'roundtable_participation', label: '参与圆桌', points: '+3' },
                { key: 'help_others', label: '帮助他人', points: '+10' },
                { key: 'share_experience', label: '共享经验', points: '+5' },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => earnMerit(item.key)}
                  className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-left"
                  disabled={loading}
                >
                  <p className="font-medium text-green-800">{item.label}</p>
                  <p className="text-sm text-green-600">{item.points} 功德</p>
                </button>
              ))}
            </div>
          </section>

          <section className="dao-card">
            <h2 className="text-lg font-semibold text-dao-primary mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              钱包操作
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                onClick={() => setShowSpendModal(true)}
                className="p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors text-left"
                disabled={loading}
              >
                <ArrowDownCircle className="w-5 h-5 text-red-600 mb-1" />
                <p className="font-medium text-red-800">消费积分</p>
              </button>
              <button
                onClick={() => setShowDonationModal(true)}
                className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-left"
                disabled={loading}
              >
                <Gift className="w-5 h-5 text-purple-600 mb-1" />
                <p className="font-medium text-purple-800">捐赠功德</p>
              </button>
              <button
                onClick={() => setShowTrustModal(true)}
                className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-left"
                disabled={loading}
              >
                <CreditCard className="w-5 h-5 text-blue-600 mb-1" />
                <p className="font-medium text-blue-800">使用额度</p>
              </button>
              <button
                onClick={() => toast.info('境界提升功能开发中')}
                className="p-4 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors text-left"
                disabled={loading}
              >
                <TrendingUp className="w-5 h-5 text-amber-600 mb-1" />
                <p className="font-medium text-amber-800">提升境界</p>
              </button>
            </div>
          </section>

          <section className="dao-card">
            <h2 className="text-lg font-semibold text-dao-primary mb-4 flex items-center gap-2">
              <History className="w-5 h-5" />
              最近交易
            </h2>
            {summary.recentTransactions.length === 0 ? (
              <p className="text-center text-gray-500 py-8">暂无交易记录</p>
            ) : (
              <>
                <div className="space-y-3">
                  {summary.recentTransactions
                    .slice((currentPage - 1) * CONFIG.transactionsPerPage, currentPage * CONFIG.transactionsPerPage)
                    .map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                        <div className="flex items-center gap-3">
                          {getTransactionIcon(tx.type)}
                          <div>
                            <p className="text-sm text-gray-800">{tx.note || tx.source || tx.target || '交易'}</p>
                            <p className="text-xs text-gray-500">{new Date(tx.date).toLocaleDateString('zh-CN')}</p>
                          </div>
                        </div>
                        <span className={`font-bold ${getTransactionColor(tx.amount)}`}>
                          {tx.amount > 0 ? '+' : ''}{tx.amount}
                        </span>
                      </div>
                    ))}
                </div>
                {summary.recentTransactions.length > CONFIG.transactionsPerPage && (
                  <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm text-gray-600">
                      第 {currentPage} / {Math.ceil(summary.recentTransactions.length / CONFIG.transactionsPerPage)} 页
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => p + 1)}
                      disabled={currentPage >= Math.ceil(summary.recentTransactions.length / CONFIG.transactionsPerPage)}
                      className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </>
      )}

      {/* 消费模态框 */}
      {showSpendModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="dao-card max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">消费积分</h3>
            <input
              type="number"
              value={spendAmount}
              onChange={(e) => setSpendAmount(e.target.value)}
              placeholder="输入积分数量"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowSpendModal(false); setSpendAmount(''); }}
                className="dao-button-secondary flex-1"
              >
                取消
              </button>
              <button
                onClick={() => {
                  const amount = parseInt(spendAmount);
                  if (amount > 0 && amount <= (summary?.meritBalance || 0)) {
                    toast.success(`已消费 ${amount} 积分`);
                    setShowSpendModal(false);
                    setSpendAmount('');
                    fetchWallet();
                  } else {
                    toast.error('积分不足或输入无效');
                  }
                }}
                className="dao-button flex-1"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 捐赠模态框 */}
      {showDonationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="dao-card max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">捐赠功德</h3>
            <input
              type="number"
              value={donationAmount}
              onChange={(e) => setDonationAmount(e.target.value)}
              placeholder="输入捐赠积分"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDonationModal(false); setDonationAmount(''); }}
                className="dao-button-secondary flex-1"
              >
                取消
              </button>
              <button
                onClick={() => {
                  const amount = parseInt(donationAmount);
                  if (amount > 0 && amount <= (summary?.meritBalance || 0)) {
                    toast.success(`已捐赠 ${amount} 功德`);
                    setShowDonationModal(false);
                    setDonationAmount('');
                    fetchWallet();
                  } else {
                    toast.error('积分不足或输入无效');
                  }
                }}
                className="dao-button flex-1"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 信任额度模态框 */}
      {showTrustModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="dao-card max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">使用信任额度</h3>
            <input
              type="number"
              value={trustAmount}
              onChange={(e) => setTrustAmount(e.target.value)}
              placeholder="输入额度"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowTrustModal(false); setTrustAmount(''); }}
                className="dao-button-secondary flex-1"
              >
                取消
              </button>
              <button
                onClick={() => {
                  const amount = parseInt(trustAmount);
                  if (amount > 0 && amount <= (summary?.trustQuota || 0)) {
                    toast.success(`已使用 ${amount} 信任额度`);
                    setShowTrustModal(false);
                    setTrustAmount('');
                    fetchWallet();
                  } else {
                    toast.error('额度不足或输入无效');
                  }
                }}
                className="dao-button flex-1"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
