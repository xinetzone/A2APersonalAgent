'use client';

import { useState, useEffect, useCallback } from 'react';
import { Wallet, Coins, Gift, ArrowUpDown, Plus, History, Shield, CheckCircle, XCircle, AlertCircle, Settings, Lock, User, Eye, EyeOff, ChevronLeft, ChevronRight, CreditCard, TrendingUp, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

interface WalletSummary {
  meritBalance: number;
  trustQuota: number;
  trustScore: number;
  level: string;
  totalEarned: number;
  totalSpent: number;
  recentTransactions: {
    id: string;
    type: string;
    amount: number;
    source?: string;
    target?: string;
    date: string;
    note?: string;
  }[];
}

interface EthicalCriteria {
  enableTransparency: boolean;
  enablePrivacy: boolean;
  autoReportEnabled: boolean;
  maxDailyTransactions: number;
  requireTwoFactor: boolean;
}

interface SecurityProtocol {
  encryptionLevel: 'standard' | 'enhanced';
  auditLogging: boolean;
  realTimeMonitoring: boolean;
}

interface CreateWalletConfig {
  name: string;
  level: '闻道' | '悟道' | '行道' | '得道' | '同道';
  ethicalCriteria: EthicalCriteria;
  securityProtocol: SecurityProtocol;
}

const ETHICAL_CRITERIA_OPTIONS = [
  { key: 'enableTransparency', label: '交易透明度', description: '允许查看所有交易记录', default: true },
  { key: 'enablePrivacy', label: '隐私保护', description: '隐藏敏感交易信息', default: true },
  { key: 'autoReportEnabled', label: '自动报告', description: '定期生成道德报告', default: false },
  { key: 'requireTwoFactor', label: '双因素认证', description: '重要操作需要验证', default: true },
];

const LEVEL_OPTIONS = [
  { value: '闻道', label: '闻道', description: '初入道德之门', dailyLimit: 30, trustQuota: 50 },
  { value: '悟道', label: '悟道', description: '理解道德真谛', dailyLimit: 50, trustQuota: 100 },
  { value: '行道', label: '行道', description: '践行道德准则', dailyLimit: 100, trustQuota: 200 },
  { value: '得道', label: '得道', description: '道德修养深厚', dailyLimit: 200, trustQuota: 500 },
  { value: '同道', label: '同道', description: '与道合真', dailyLimit: 500, trustQuota: 1000 },
];

function WalletSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
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
      <div className="dao-card">
        <div className="w-24 h-6 bg-gray-200 rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full" />
                <div className="space-y-1">
                  <div className="w-24 h-4 bg-gray-200 rounded" />
                  <div className="w-16 h-3 bg-gray-100 rounded" />
                </div>
              </div>
              <div className="w-12 h-5 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function WalletPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [wallet, setWallet] = useState<any | null>(null);
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [walletName, setWalletName] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<'闻道' | '悟道' | '行道' | '得道' | '同道'>('闻道');
  const [ethicalCriteria, setEthicalCriteria] = useState<EthicalCriteria>({
    enableTransparency: true,
    enablePrivacy: true,
    autoReportEnabled: false,
    maxDailyTransactions: 10,
    requireTwoFactor: true,
  });
  const [securityProtocol, setSecurityProtocol] = useState<SecurityProtocol>({
    encryptionLevel: 'standard',
    auditLogging: true,
    realTimeMonitoring: true,
  });
  const [securityCode, setSecurityCode] = useState('');
  const [step, setStep] = useState<'auth' | 'config' | 'security' | 'confirm' | 'creating' | 'complete'>('auth');
  const [networkError, setNetworkError] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [transactionsPerPage] = useState(5);
  const [displayedTransactions, setDisplayedTransactions] = useState<WalletSummary['recentTransactions']>([]);
  const [showSpendModal, setShowSpendModal] = useState(false);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [showTrustModal, setShowTrustModal] = useState(false);
  const [spendAmount, setSpendAmount] = useState('');
  const [donationAmount, setDonationAmount] = useState('');
  const [trustAmount, setTrustAmount] = useState('');

  const getUserId = useCallback(() => {
    if (user?.id) return user.id;
    if (user?.email) return `user-${btoa(user.email).slice(0, 8)}`;
    return `user-${Date.now()}`;
  }, [user]);

  const fetchWallet = async () => {
    setLoading(true);
    setNetworkError(false);
    try {
      const userId = getUserId();
      const params = new URLSearchParams({ tool: 'moral_wallet', action: 'get_summary', userId });
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(`/api/mcp?${params.toString()}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();

      if (data.result?.content) {
        const text = data.result.content[0]?.text || '{}';
        const result = JSON.parse(text);
        if (result.error) {
          setShowCreate(true);
          setStep('config');
        } else {
          setSummary(result);
          setShowCreate(false);
        }
      }
    } catch (error) {
      console.error('Failed to fetch wallet:', error);
      if ((error as Error).name === 'AbortError') {
        toast.error('请求超时，请检查网络连接');
      } else {
        setNetworkError(true);
        toast.error('无法连接到服务器，请检查网络连接');
      }
    } finally {
      setLoading(false);
    }
  };

  const validateSecurityCode = (code: string): boolean => {
    const pattern = /^[0-9]{6}$/;
    return pattern.test(code);
  };

  const handleCreateWallet = async () => {
    if (!walletName.trim()) {
      toast.error('请输入钱包名称');
      return;
    }

    if (password.length < 8) {
      toast.error('密码长度至少为8位');
      return;
    }

    if (!validateSecurityCode(securityCode)) {
      toast.error('请输入6位数字安全码');
      return;
    }

    setStep('creating');
    setLoading(true);

    try {
      const userId = getUserId();
      const params = new URLSearchParams({
        tool: 'moral_wallet',
        action: 'create_wallet',
        userId,
        name: walletName,
        level: selectedLevel,
        ethicalCriteria: JSON.stringify(ethicalCriteria),
        securityProtocol: JSON.stringify(securityProtocol),
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(`/api/mcp?${params.toString()}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await res.json();

      if (data.result?.content) {
        const text = data.result.content[0]?.text || '{}';
        const result = JSON.parse(text);

        if (result.error) {
          toast.error(result.error);
          setStep('confirm');
        } else {
          setWallet(result);
          setShowCreate(false);
          setShowConfig(false);
          toast.success(`道德钱包「${walletName}」已成功创建！`);
          setStep('complete');
          fetchWallet();
        }
      }
    } catch (error) {
      console.error('Failed to create wallet:', error);
      toast.error('钱包创建过程中发生错误，请稍后重试');
      setStep('confirm');
    } finally {
      setLoading(false);
    }
  };

  const earnMerit = async (source: string) => {
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

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(`/api/mcp?${params.toString()}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

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
  };

  const handleEthicalCriteriaChange = (key: keyof EthicalCriteria, value: boolean | number) => {
    setEthicalCriteria(prev => ({ ...prev, [key]: value }));
  };

  const resetCreationFlow = () => {
    setStep('auth');
    setShowConfig(false);
    setWalletName('');
    setPassword('');
    setSecurityCode('');
    setSelectedLevel('闻道');
    setEthicalCriteria({
      enableTransparency: true,
      enablePrivacy: true,
      autoReportEnabled: false,
      maxDailyTransactions: 10,
      requireTwoFactor: true,
    });
    setSecurityProtocol({
      encryptionLevel: 'standard',
      auditLogging: true,
      realTimeMonitoring: true,
    });
  };

  const getTransactionIcon = (type: string) => {
    if (type === 'earning') return <Plus className="w-4 h-4 text-green-600" />;
    if (type === 'spending' || type === 'donation') return <Coins className="w-4 h-4 text-red-600" />;
    return <ArrowUpDown className="w-4 h-4 text-gray-600" />;
  };

  const getTransactionColor = (amount: number) => {
    if (amount > 0) return 'text-green-600';
    if (amount < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast.warning('请先登录后再创建道德钱包');
    }
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchWallet();
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (summary?.recentTransactions) {
      const start = (currentPage - 1) * transactionsPerPage;
      const end = start + transactionsPerPage;
      setDisplayedTransactions(summary.recentTransactions.slice(start, end));
    }
  }, [summary, currentPage, transactionsPerPage]);

  const renderAuthStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <User className="w-16 h-16 mx-auto mb-4 text-dao-primary" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">身份验证</h2>
        <p className="text-gray-600">请验证您的身份以继续创建道德钱包</p>
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
        <button
          onClick={() => setStep('config')}
          className="dao-button w-full flex items-center justify-center gap-2"
        >
          <Shield className="w-5 h-5" />
          验证通过，继续
        </button>
      )}
    </div>
  );

  const renderConfigStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Settings className="w-16 h-16 mx-auto mb-4 text-dao-primary" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">钱包配置</h2>
        <p className="text-gray-600">设置您的道德钱包基本参数</p>
      </div>

      <div className="dao-card space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">钱包名称</label>
          <input
            type="text"
            value={walletName}
            onChange={(e) => setWalletName(e.target.value)}
            placeholder="给您的钱包起个名字"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dao-primary focus:border-transparent"
            maxLength={20}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">初始境界</label>
          <div className="grid grid-cols-5 gap-2">
            {LEVEL_OPTIONS.map((level) => (
              <button
                key={level.value}
                onClick={() => setSelectedLevel(level.value as typeof selectedLevel)}
                className={`p-3 rounded-lg border-2 transition-all text-center ${
                  selectedLevel === level.value
                    ? 'border-dao-primary bg-dao-primary/10'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className="font-medium text-sm">{level.label}</p>
                <p className="text-xs text-gray-500 mt-1">{level.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5 text-dao-primary" />
            道德准则配置
          </h3>
          <div className="space-y-3">
            {ETHICAL_CRITERIA_OPTIONS.map((option) => (
              <label key={option.key} className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-medium text-gray-800">{option.label}</p>
                  <p className="text-xs text-gray-500">{option.description}</p>
                </div>
                <input
                  type="checkbox"
                  checked={ethicalCriteria[option.key as keyof EthicalCriteria] as boolean}
                  onChange={(e) => handleEthicalCriteriaChange(option.key as keyof EthicalCriteria, e.target.checked)}
                  className="w-5 h-5 text-dao-primary rounded border-gray-300 focus:ring-dao-primary"
                />
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">每日最大交易次数</label>
          <input
            type="number"
            value={ethicalCriteria.maxDailyTransactions}
            onChange={(e) => handleEthicalCriteriaChange('maxDailyTransactions', parseInt(e.target.value) || 10)}
            min={1}
            max={100}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dao-primary focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={resetCreationFlow}
          className="dao-button-secondary flex-1"
        >
          返回
        </button>
        <button
          onClick={() => setStep('security')}
          className="dao-button flex-1 flex items-center justify-center gap-2"
        >
          <Lock className="w-5 h-5" />
          下一步：安全设置
        </button>
      </div>
    </div>
  );

  const renderSecurityStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Lock className="w-16 h-16 mx-auto mb-4 text-dao-primary" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">安全协议</h2>
        <p className="text-gray-600">配置您的钱包安全级别</p>
      </div>

      <div className="dao-card space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">加密级别</label>
          <div className="grid grid-cols-2 gap-3">
            {['standard', 'enhanced'].map((level) => (
              <button
                key={level}
                onClick={() => setSecurityProtocol(prev => ({ ...prev, encryptionLevel: level as 'standard' | 'enhanced' }))}
                className={`p-4 rounded-lg border-2 transition-all ${
                  securityProtocol.encryptionLevel === level
                    ? 'border-dao-primary bg-dao-primary/10'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Lock className="w-6 h-6 mx-auto mb-2 text-dao-primary" />
                <p className="font-medium">{level === 'standard' ? '标准加密' : '增强加密'}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {level === 'standard' ? 'SHA-256 加密' : 'AES-256 + 多重签名'}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t border-gray-200">
          <h3 className="font-medium text-gray-800">安全功能</h3>
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="font-medium text-gray-800">审计日志</p>
              <p className="text-xs text-gray-500">记录所有操作历史</p>
            </div>
            <input
              type="checkbox"
              checked={securityProtocol.auditLogging}
              onChange={(e) => setSecurityProtocol(prev => ({ ...prev, auditLogging: e.target.checked }))}
              className="w-5 h-5 text-dao-primary rounded border-gray-300 focus:ring-dao-primary"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="font-medium text-gray-800">实时监控</p>
              <p className="text-xs text-gray-500">监测异常活动</p>
            </div>
            <input
              type="checkbox"
              checked={securityProtocol.realTimeMonitoring}
              onChange={(e) => setSecurityProtocol(prev => ({ ...prev, realTimeMonitoring: e.target.checked }))}
              className="w-5 h-5 text-dao-primary rounded border-gray-300 focus:ring-dao-primary"
            />
          </label>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">钱包密码</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="设置8位以上的钱包密码"
              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dao-primary focus:border-transparent"
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            安全码 <span className="text-gray-400 font-normal">(6位数字)</span>
          </label>
          <input
            type="text"
            value={securityCode}
            onChange={(e) => setSecurityCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="输入6位数字安全码"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dao-primary focus:border-transparent"
            maxLength={6}
          />
          <p className="text-xs text-gray-500 mt-1">请牢记此安全码，用于重要操作验证</p>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setStep('config')}
          className="dao-button-secondary flex-1"
        >
          返回
        </button>
        <button
          onClick={() => setStep('confirm')}
          disabled={password.length < 8 || securityCode.length !== 6}
          className="dao-button flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          下一步：确认
        </button>
      </div>
    </div>
  );

  const renderConfirmStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircle className="w-16 h-16 mx-auto mb-4 text-dao-primary" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">确认创建</h2>
        <p className="text-gray-600">请确认您的道德钱包配置</p>
      </div>

      <div className="dao-card space-y-4">
        <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
          <h3 className="font-semibold text-amber-800 mb-3">钱包信息</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-500">名称</p>
              <p className="font-medium">{walletName || '未设置'}</p>
            </div>
            <div>
              <p className="text-gray-500">境界</p>
              <p className="font-medium">{selectedLevel}</p>
            </div>
            <div>
              <p className="text-gray-500">初始积分</p>
              <p className="font-medium text-green-600">100 功德</p>
            </div>
            <div>
              <p className="text-gray-500">信任额度</p>
              <p className="font-medium text-blue-600">
                {LEVEL_OPTIONS.find(l => l.value === selectedLevel)?.trustQuota || 50}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            安全配置
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-500">加密级别</p>
              <p className="font-medium">
                {securityProtocol.encryptionLevel === 'standard' ? '标准加密' : '增强加密'}
              </p>
            </div>
            <div>
              <p className="text-gray-500">审计日志</p>
              <p className="font-medium">{securityProtocol.auditLogging ? '启用' : '关闭'}</p>
            </div>
            <div>
              <p className="text-gray-500">实时监控</p>
              <p className="font-medium">{securityProtocol.realTimeMonitoring ? '启用' : '关闭'}</p>
            </div>
            <div>
              <p className="text-gray-500">双因素认证</p>
              <p className="font-medium">{ethicalCriteria.requireTwoFactor ? '启用' : '关闭'}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <h3 className="font-semibold text-green-800 mb-3">道德准则</h3>
          <div className="space-y-2 text-sm">
            {ETHICAL_CRITERIA_OPTIONS.map((option) => (
              <div key={option.key} className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>{option.label}</span>
                <span className="text-gray-500">({ethicalCriteria[option.key as keyof EthicalCriteria] ? '启用' : '关闭'})</span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-xs text-gray-500 text-center pt-2">
          创建即表示您同意遵守道德钱包的所有规范和使用条款
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setStep('security')}
          className="dao-button-secondary flex-1"
        >
          返回修改
        </button>
        <button
          onClick={handleCreateWallet}
          disabled={loading}
          className="dao-button flex-1 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="animate-spin">⟳</span>
              创建中...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              确认创建
            </>
          )}
        </button>
      </div>
    </div>
  );

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
              <p className="text-sm text-red-600">无法连接到服务器，请检查网络后</p>
            </div>
            <button
              onClick={() => fetchWallet()}
              className="dao-button ml-auto"
              disabled={loading}
            >
              重试
            </button>
          </div>
        </div>
      )}

      {step !== 'complete' && showConfig && (
        <section className="dao-card max-w-2xl mx-auto">
          {step === 'auth' && renderAuthStep()}
          {step === 'config' && renderConfigStep()}
          {step === 'security' && renderSecurityStep()}
          {step === 'confirm' && renderConfirmStep()}
        </section>
      )}

      {step === 'complete' && (
        <section className="dao-card max-w-2xl mx-auto text-center py-8">
          <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">钱包创建完成</h2>
          <p className="text-gray-600 mb-6">您的道德钱包已成功创建，现在可以开始您的道德修行之旅</p>
          <button
            onClick={() => {
              setShowConfig(false);
              setStep('auth');
              fetchWallet();
            }}
            className="dao-button"
          >
            查看钱包
          </button>
        </section>
      )}

      {!wallet && !summary && !showConfig && !networkError && (
        <section className="dao-card text-center py-12">
          <Wallet className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-700 mb-4">还没有钱包</h2>
          <p className="text-gray-600 mb-6">创建你的道德钱包，开始积累功德</p>
          <button
            onClick={() => {
              if (!isAuthenticated) {
                toast.warning('请先登录：创建钱包前请先登录您的账号');
                return;
              }
              setShowConfig(true);
              setStep('config');
            }}
            disabled={loading}
            className="dao-button flex items-center gap-2 mx-auto"
          >
            {loading ? <span className="animate-spin">⟳</span> : <Plus className="w-5 h-5" />}
            创建道德钱包
          </button>
        </section>
      )}

      {showCreate && !wallet && !showConfig && (
        <section className="dao-card text-center py-8">
          <div className="bg-amber-50 rounded-lg p-6 mb-6">
            <Coins className="w-12 h-12 mx-auto mb-3 text-amber-500" />
            <h2 className="text-xl font-semibold text-amber-800 mb-2">欢迎加入道德人生</h2>
            <p className="text-amber-700">新用户将获得 100 功德积分初始奖励</p>
          </div>
          <button
            onClick={() => {
              if (!isAuthenticated) {
                toast.warning('请先登录：创建钱包前请先登录您的账号');
                return;
              }
              setShowConfig(true);
              setStep('config');
            }}
            disabled={loading}
            className="dao-button flex items-center gap-2 mx-auto"
          >
            {loading ? <span className="animate-spin">⟳</span> : <Plus className="w-5 h-5" />}
            立即创建
          </button>
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
              <button
                onClick={() => earnMerit('daily_practice')}
                className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-left"
                disabled={loading}
              >
                <p className="font-medium text-green-800">每日修身</p>
                <p className="text-sm text-green-600">+5 功德</p>
              </button>
              <button
                onClick={() => earnMerit('roundtable_participation')}
                className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-left"
                disabled={loading}
              >
                <p className="font-medium text-green-800">参与圆桌</p>
                <p className="text-sm text-green-600">+3 功德</p>
              </button>
              <button
                onClick={() => earnMerit('help_others')}
                className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-left"
                disabled={loading}
              >
                <p className="font-medium text-green-800">帮助他人</p>
                <p className="text-sm text-green-600">+10 功德</p>
              </button>
              <button
                onClick={() => earnMerit('share_experience')}
                className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-left"
                disabled={loading}
              >
                <p className="font-medium text-green-800">共享经验</p>
                <p className="text-sm text-green-600">+5 功德</p>
              </button>
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
                className="p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors text-left flex flex-col gap-1"
                disabled={loading}
              >
                <ArrowDownCircle className="w-5 h-5 text-red-600" />
                <p className="font-medium text-red-800">消费积分</p>
                <p className="text-xs text-red-600">课程/书籍交换</p>
              </button>
              <button
                onClick={() => setShowDonationModal(true)}
                className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-left flex flex-col gap-1"
                disabled={loading}
              >
                <Gift className="w-5 h-5 text-purple-600" />
                <p className="font-medium text-purple-800">捐赠功德</p>
                <p className="text-xs text-purple-600">帮助有需要的人</p>
              </button>
              <button
                onClick={() => setShowTrustModal(true)}
                className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-left flex flex-col gap-1"
                disabled={loading}
              >
                <CreditCard className="w-5 h-5 text-blue-600" />
                <p className="font-medium text-blue-800">使用额度</p>
                <p className="text-xs text-blue-600">信任额度借款</p>
              </button>
              <button
                onClick={() => {
                  toast.info('境界提升功能开发中，请积累更多功德后尝试');
                }}
                className="p-4 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors text-left flex flex-col gap-1"
                disabled={loading}
              >
                <TrendingUp className="w-5 h-5 text-amber-600" />
                <p className="font-medium text-amber-800">提升境界</p>
                <p className="text-xs text-amber-600">消耗100功德</p>
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
                  {displayedTransactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div className="flex items-center gap-3">
                        {getTransactionIcon(tx.type)}
                        <div>
                          <p className="text-sm text-gray-800">{tx.source || tx.target || tx.note || '交易'}</p>
                          <p className="text-xs text-gray-500">{new Date(tx.date).toLocaleDateString('zh-CN')}</p>
                        </div>
                      </div>
                      <span className={`font-bold ${getTransactionColor(tx.amount)}`}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount}
                      </span>
                    </div>
                  ))}
                </div>
                {summary.recentTransactions.length > transactionsPerPage && (
                  <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm text-gray-600">
                      第 {currentPage} / {Math.ceil(summary.recentTransactions.length / transactionsPerPage)} 页
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(Math.ceil(summary.recentTransactions.length / transactionsPerPage), p + 1))}
                      disabled={currentPage >= Math.ceil(summary.recentTransactions.length / transactionsPerPage)}
                      className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

      {showSpendModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="dao-card max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ArrowDownCircle className="w-5 h-5 text-red-600" />
              消费积分
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">消费金额</label>
                <input
                  type="number"
                  value={spendAmount}
                  onChange={(e) => setSpendAmount(e.target.value)}
                  placeholder="输入积分数量"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <p className="text-sm text-gray-500">可用积分: {summary?.meritBalance || 0}</p>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowSpendModal(false); setSpendAmount(''); }}
                className="dao-button-secondary flex-1"
              >
                取消
              </button>
              <button
                onClick={() => {
                  const amount = parseInt(spendAmount);
                  if (isNaN(amount) || amount <= 0) {
                    toast.error('请输入有效的积分数量');
                    return;
                  }
                  if (amount > (summary?.meritBalance || 0)) {
                    toast.error('积分不足');
                    return;
                  }
                  toast.success(`已消费 ${amount} 积分`);
                  setShowSpendModal(false);
                  setSpendAmount('');
                  fetchWallet();
                }}
                className="dao-button flex-1"
              >
                确认消费
              </button>
            </div>
          </div>
        </div>
      )}

      {showDonationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="dao-card max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Gift className="w-5 h-5 text-purple-600" />
              捐赠功德
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">捐赠金额</label>
                <input
                  type="number"
                  value={donationAmount}
                  onChange={(e) => setDonationAmount(e.target.value)}
                  placeholder="输入捐赠积分"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <p className="text-sm text-gray-500">可用积分: {summary?.meritBalance || 0}</p>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowDonationModal(false); setDonationAmount(''); }}
                className="dao-button-secondary flex-1"
              >
                取消
              </button>
              <button
                onClick={() => {
                  const amount = parseInt(donationAmount);
                  if (isNaN(amount) || amount <= 0) {
                    toast.error('请输入有效的积分数量');
                    return;
                  }
                  if (amount > (summary?.meritBalance || 0)) {
                    toast.error('积分不足');
                    return;
                  }
                  toast.success(`已捐赠 ${amount} 功德`);
                  setShowDonationModal(false);
                  setDonationAmount('');
                  fetchWallet();
                }}
                className="dao-button flex-1"
              >
                确认捐赠
              </button>
            </div>
          </div>
        </div>
      )}

      {showTrustModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="dao-card max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              使用信任额度
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">额度金额</label>
                <input
                  type="number"
                  value={trustAmount}
                  onChange={(e) => setTrustAmount(e.target.value)}
                  placeholder="输入额度"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <p className="text-sm text-gray-500">可用额度: {summary?.trustQuota || 0}</p>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowTrustModal(false); setTrustAmount(''); }}
                className="dao-button-secondary flex-1"
              >
                取消
              </button>
              <button
                onClick={() => {
                  const amount = parseInt(trustAmount);
                  if (isNaN(amount) || amount <= 0) {
                    toast.error('请输入有效的额度');
                    return;
                  }
                  if (amount > (summary?.trustQuota || 0)) {
                    toast.error('额度不足');
                    return;
                  }
                  toast.success(`已使用 ${amount} 信任额度`);
                  setShowTrustModal(false);
                  setTrustAmount('');
                  fetchWallet();
                }}
                className="dao-button flex-1"
              >
                确认使用
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
