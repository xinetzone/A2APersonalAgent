import crypto from 'crypto';
import { MoralWallet, MoralWalletTransaction, AgentCard, TransactionType } from './types';

// 预计算的常量配置，避免运行时重复计算
const CONFIG = {
  merit: Object.freeze({
    daily_practice: { amount: 5, type: 'earning' as const },
    roundtable_participation: { amount: 3, type: 'earning' as const },
    help_others: { amount: 10, type: 'earning' as const },
    share_experience: { amount: 5, type: 'earning' as const },
    course_exchange: { amount: -30, type: 'spending' as const },
    book_exchange: { amount: -50, type: 'spending' as const },
    companion_upgrade: { amount: -50, type: 'spending' as const },
  }),
  trustQuota: Object.freeze({
    '闻道': 50,
    '悟道': 100,
    '行道': 200,
    '得道': 500,
    '同道': 1000,
  }),
  dailyLimit: Object.freeze({
    '闻道': 30,
    '悟道': 50,
    '行道': 100,
    '得道': 200,
    '同道': 500,
  }),
  maxBalance: 1000,
  maxTransactions: 100,
  initialBalance: 100,
  initialTrustScore: 75,
  upgradeCost: 100,
} as const;

// 级别顺序数组，用于快速比较
const LEVEL_ORDER = Object.freeze(['闻道', '悟道', '行道', '得道', '同道'] as const);

// 安全的随机数生成器
function secureRandomBytes(length: number): Buffer {
  return crypto.randomBytes(length);
}

// 高性能哈希函数 - 使用更轻量的算法
function fastHash(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex').slice(0, 16);
}

// 生成唯一ID - 优化版本，减少内存分配
function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = secureRandomBytes(4).toString('hex').slice(0, 8);
  return `${prefix}-${timestamp}-${random}`;
}

// 生成安全的公钥 - 使用加密安全的随机数
function generateSecurePublicKey(userId: string): string {
  const hash = fastHash(`pk:${userId}:${secureRandomBytes(8).toString('hex')}`);
  return `0x${hash}`;
}

// 获取信任额度 - 使用Map提高查找效率
const trustQuotaMap = new Map<string, number>(Object.entries(CONFIG.trustQuota));
function calculateTrustQuota(level: MoralWallet['agentCard']['level']): number {
  return trustQuotaMap.get(level) ?? 50;
}

// 获取每日限额
const dailyLimitMap = new Map<string, number>(Object.entries(CONFIG.dailyLimit));
function calculateDailyLimit(level: MoralWallet['agentCard']['level']): number {
  return dailyLimitMap.get(level) ?? 30;
}

// 验证参数类型
interface CreateWalletParams {
  userId: string;
  name: string;
  level: MoralWallet['agentCard']['level'];
  publicKey?: string;
}

function validateCreateParams(params: CreateWalletParams): void {
  if (!params.userId || typeof params.userId !== 'string') {
    throw new Error('Invalid userId: must be a non-empty string');
  }
  if (!params.name || typeof params.name !== 'string' || params.name.length > 50) {
    throw new Error('Invalid name: must be a non-empty string with max 50 chars');
  }
  if (!LEVEL_ORDER.includes(params.level)) {
    throw new Error(`Invalid level: must be one of ${LEVEL_ORDER.join(', ')}`);
  }
}

// 优化的钱包创建函数
export function createMoralWallet(params: CreateWalletParams): MoralWallet {
  // 参数验证
  validateCreateParams(params);

  const walletId = generateId('wallet');
  const cardId = generateId('card');
  const now = new Date().toISOString();

  // 创建钱包对象
  const wallet: MoralWallet = {
    userId: params.userId,
    walletId,
    balance: {
      merit: CONFIG.initialBalance,
      trustQuota: calculateTrustQuota(params.level),
    },
    agentCard: {
      cardId,
      name: params.name.trim(),
      level: params.level,
      publicKey: params.publicKey || generateSecurePublicKey(params.userId),
      dailyLimit: calculateDailyLimit(params.level),
    },
    transactions: [{
      id: generateId('tx'),
      type: 'earning' as TransactionType,
      amount: CONFIG.initialBalance,
      source: 'welcome_bonus',
      date: now,
      note: '欢迎加入道德人生',
    }],
    trustScore: CONFIG.initialTrustScore,
  };

  return wallet;
}

// 交易参数接口
interface TransactionParams {
  source: keyof typeof CONFIG.merit;
  customAmount?: number;
  note?: string;
}

// 优化的添加功德交易函数
export function addMeritTransaction(
  wallet: MoralWallet,
  params: TransactionParams
): MoralWallet {
  const config = CONFIG.merit[params.source];
  if (!config) {
    console.warn(`Unknown merit source: ${params.source}`);
    return wallet;
  }

  const amount = params.customAmount ?? config.amount;
  
  // 验证余额限制
  if (config.type === 'earning' && amount > 0) {
    if (wallet.balance.merit + amount > CONFIG.maxBalance) {
      console.warn('Merit balance would exceed maximum');
      return wallet;
    }
  }

  const now = new Date().toISOString();
  const transaction: MoralWalletTransaction = {
    id: generateId('tx'),
    type: config.type,
    amount,
    source: config.type === 'earning' ? params.source : undefined,
    target: config.type === 'spending' ? params.source : undefined,
    date: now,
    note: params.note,
  };

  const newBalance = config.type === 'earning'
    ? wallet.balance.merit + amount
    : Math.max(0, wallet.balance.merit + amount);

  // 创建新钱包对象
  return {
    ...wallet,
    balance: {
      ...wallet.balance,
      merit: newBalance,
    },
    transactions: [
      transaction,
      ...wallet.transactions.slice(0, CONFIG.maxTransactions - 1),
    ],
  };
}

// 捐赠参数接口
interface DonationParams {
  amount: number;
  recipient?: string;
  isAnonymous?: boolean;
  note?: string;
}

// 优化的捐赠函数
export function makeDonation(
  wallet: MoralWallet,
  params: DonationParams
): MoralWallet {
  if (params.amount <= 0 || params.amount > wallet.balance.merit) {
    console.warn('Invalid donation amount');
    return wallet;
  }

  const now = new Date().toISOString();
  const transaction: MoralWalletTransaction = {
    id: generateId('tx'),
    type: 'donation',
    amount: -params.amount,
    target: 'donation',
    recipient: params.isAnonymous ? undefined : params.recipient,
    date: now,
    note: params.note || (params.isAnonymous ? '匿名捐赠' : `捐赠给 ${params.recipient}`),
  };

  return {
    ...wallet,
    balance: {
      ...wallet.balance,
      merit: wallet.balance.merit - params.amount,
    },
    transactions: [
      transaction,
      ...wallet.transactions.slice(0, CONFIG.maxTransactions - 1),
    ],
  };
}

// 使用信任额度
export function spendTrustQuota(
  wallet: MoralWallet,
  amount: number
): { wallet: MoralWallet; success: boolean; message: string } {
  if (amount <= 0) {
    return { wallet, success: false, message: '金额必须为正数' };
  }

  if (wallet.balance.trustQuota < amount) {
    return { wallet, success: false, message: '信任额度不足' };
  }

  const now = new Date().toISOString();
  const transaction: MoralWalletTransaction = {
    id: generateId('tx'),
    type: 'transfer',
    amount: -amount,
    target: 'trust_usage',
    date: now,
    note: `使用信任额度：${amount}`,
  };

  return {
    wallet: {
      ...wallet,
      balance: {
        ...wallet.balance,
        trustQuota: wallet.balance.trustQuota - amount,
      },
      transactions: [
        transaction,
        ...wallet.transactions.slice(0, CONFIG.maxTransactions - 1),
      ],
    },
    success: true,
    message: '信任额度使用成功',
  };
}

// 更新信任分数
export function updateTrustScore(wallet: MoralWallet, delta: number): MoralWallet {
  const newScore = Math.max(0, Math.min(100, wallet.trustScore + delta));
  return {
    ...wallet,
    trustScore: newScore,
  };
}

// 升级境界
export function upgradeLevel(
  wallet: MoralWallet,
  newLevel: MoralWallet['agentCard']['level']
): MoralWallet {
  const currentIdx = LEVEL_ORDER.indexOf(wallet.agentCard.level);
  const newIdx = LEVEL_ORDER.indexOf(newLevel);

  if (newIdx <= currentIdx) {
    console.warn('Cannot downgrade or upgrade to same level');
    return wallet;
  }

  if (wallet.balance.merit < CONFIG.upgradeCost) {
    console.warn('Insufficient merit for upgrade');
    return wallet;
  }

  const now = new Date().toISOString();
  const transaction: MoralWalletTransaction = {
    id: generateId('tx'),
    type: 'spending',
    amount: -CONFIG.upgradeCost,
    target: 'level_upgrade',
    date: now,
    note: `境界提升：${wallet.agentCard.level} → ${newLevel}`,
  };

  return {
    ...wallet,
    balance: {
      merit: wallet.balance.merit - CONFIG.upgradeCost,
      trustQuota: calculateTrustQuota(newLevel),
    },
    agentCard: {
      ...wallet.agentCard,
      level: newLevel,
      dailyLimit: calculateDailyLimit(newLevel),
    },
    transactions: [
      transaction,
      ...wallet.transactions.slice(0, CONFIG.maxTransactions - 1),
    ],
  };
}

// 钱包摘要接口
interface WalletSummary {
  meritBalance: number;
  trustQuota: number;
  trustScore: number;
  level: MoralWallet['agentCard']['level'];
  totalEarned: number;
  totalSpent: number;
  recentTransactions: MoralWalletTransaction[];
}

// 获取钱包摘要 - 优化版本
export function getWalletSummary(wallet: MoralWallet): WalletSummary {
  let totalEarned = 0;
  let totalSpent = 0;

  // 单次遍历计算总收入和支出
  for (const tx of wallet.transactions) {
    if (tx.amount > 0) {
      totalEarned += tx.amount;
    } else {
      totalSpent += Math.abs(tx.amount);
    }
  }

  return {
    meritBalance: wallet.balance.merit,
    trustQuota: wallet.balance.trustQuota,
    trustScore: wallet.trustScore,
    level: wallet.agentCard.level,
    totalEarned,
    totalSpent,
    recentTransactions: wallet.transactions.slice(0, 10),
  };
}

// 导出配置常量
export { CONFIG, LEVEL_ORDER };
