import crypto from 'crypto';
import { MoralWallet, MoralWalletTransaction, AgentCard, TransactionType } from './types';

function stableHash(input: string): number {
  const buf = crypto.createHash('sha256').update(input).digest();
  return buf.readUInt32BE(0);
}

const MERIT_POINTS_CONFIG: Record<string, { amount: number; type: 'earning' | 'spending' }> = {
  'daily_practice': { amount: 5, type: 'earning' },
  'roundtable_participation': { amount: 3, type: 'earning' },
  'help_others': { amount: 10, type: 'earning' },
  'share_experience': { amount: 5, type: 'earning' },
  'course_exchange': { amount: -30, type: 'spending' },
  'book_exchange': { amount: -50, type: 'spending' },
  'companion_upgrade': { amount: -50, type: 'spending' },
};

const TRUST_QUOTA_CONFIG: Record<string, number> = {
  '闻道': 50,
  '悟道': 100,
  '行道': 200,
  '得道': 500,
  '同道': 1000,
};

const DAILY_LIMIT_CONFIG: Record<string, number> = {
  '闻道': 30,
  '悟道': 50,
  '行道': 100,
  '得道': 200,
  '同道': 500,
};

function generateWalletId(): string {
  return `wallet-${stableHash(`wallet:${Date.now()}`)}`;
}

function generateCardId(): string {
  return `card-${stableHash(`card:${Date.now()}`)}`;
}

function generateTransactionId(): string {
  return `tx-${stableHash(`tx:${Date.now()}:${Math.random()}`)}`;
}

function calculateTrustQuota(level: MoralWallet['agentCard']['level']): number {
  return TRUST_QUOTA_CONFIG[level] || 50;
}

function calculateDailyLimit(level: MoralWallet['agentCard']['level']): number {
  return DAILY_LIMIT_CONFIG[level] || 30;
}

export function createMoralWallet(params: {
  userId: string;
  name: string;
  level: MoralWallet['agentCard']['level'];
  publicKey?: string;
}): MoralWallet {
  const walletId = generateWalletId();
  const cardId = generateCardId();

  const wallet: MoralWallet = {
    userId: params.userId,
    walletId,
    balance: {
      merit: 100,
      trustQuota: calculateTrustQuota(params.level),
    },
    agentCard: {
      cardId,
      name: params.name,
      level: params.level,
      publicKey: params.publicKey || `0x${stableHash(`pk:${params.userId}`).toString(16).padStart(8, '0')}...`,
      dailyLimit: calculateDailyLimit(params.level),
    },
    transactions: [],
    trustScore: 75,
  };

  const welcomeTx: MoralWalletTransaction = {
    id: generateTransactionId(),
    type: 'earning',
    amount: 100,
    source: 'welcome_bonus',
    date: new Date().toISOString(),
    note: '欢迎加入道德人生',
  };

  wallet.transactions.push(welcomeTx);
  return wallet;
}

export function addMeritTransaction(
  wallet: MoralWallet,
  params: {
    source: keyof typeof MERIT_POINTS_CONFIG;
    customAmount?: number;
    note?: string;
  }
): MoralWallet {
  const config = MERIT_POINTS_CONFIG[params.source];
  if (!config) return wallet;

  const amount = params.customAmount !== undefined ? params.customAmount : config.amount;
  if (config.type === 'earning' && amount > 0) {
    if (wallet.balance.merit + amount > 1000) {
      return wallet;
    }
  }

  const transaction: MoralWalletTransaction = {
    id: generateTransactionId(),
    type: config.type,
    amount,
    source: config.type === 'earning' ? params.source : undefined,
    target: config.type === 'spending' ? params.source : undefined,
    date: new Date().toISOString(),
    note: params.note,
  };

  const newBalance = config.type === 'earning'
    ? wallet.balance.merit + amount
    : Math.max(0, wallet.balance.merit + amount);

  return {
    ...wallet,
    balance: {
      ...wallet.balance,
      merit: newBalance,
    },
    transactions: [transaction, ...wallet.transactions].slice(0, 100),
  };
}

export function makeDonation(
  wallet: MoralWallet,
  params: {
    amount: number;
    recipient?: string;
    isAnonymous?: boolean;
    note?: string;
  }
): MoralWallet {
  if (params.amount <= 0 || params.amount > wallet.balance.merit) {
    return wallet;
  }

  const transaction: MoralWalletTransaction = {
    id: generateTransactionId(),
    type: 'donation',
    amount: -params.amount,
    target: 'donation',
    recipient: params.isAnonymous ? undefined : params.recipient,
    date: new Date().toISOString(),
    note: params.note || (params.isAnonymous ? '匿名捐赠' : `捐赠给 ${params.recipient}`),
  };

  return {
    ...wallet,
    balance: {
      ...wallet.balance,
      merit: wallet.balance.merit - params.amount,
    },
    transactions: [transaction, ...wallet.transactions].slice(0, 100),
  };
}

export function useTrustQuota(
  wallet: MoralWallet,
  amount: number
): { wallet: MoralWallet; success: boolean; message: string } {
  if (amount <= 0) {
    return { wallet, success: false, message: '金额必须为正数' };
  }

  if (wallet.balance.trustQuota < amount) {
    return { wallet, success: false, message: '信任额度不足' };
  }

  const transaction: MoralWalletTransaction = {
    id: generateTransactionId(),
    type: 'transfer',
    amount: -amount,
    target: 'trust_usage',
    date: new Date().toISOString(),
    note: `使用信任额度：${amount}`,
  };

  return {
    wallet: {
      ...wallet,
      balance: {
        ...wallet.balance,
        trustQuota: wallet.balance.trustQuota - amount,
      },
      transactions: [transaction, ...wallet.transactions].slice(0, 100),
    },
    success: true,
    message: '信任额度使用成功',
  };
}

export function updateTrustScore(wallet: MoralWallet, delta: number): MoralWallet {
  const newScore = Math.max(0, Math.min(100, wallet.trustScore + delta));
  return {
    ...wallet,
    trustScore: newScore,
  };
}

export function upgradeLevel(wallet: MoralWallet, newLevel: MoralWallet['agentCard']['level']): MoralWallet {
  const levelOrder: MoralWallet['agentCard']['level'][] = ['闻道', '悟道', '行道', '得道', '同道'];
  const currentIdx = levelOrder.indexOf(wallet.agentCard.level);
  const newIdx = levelOrder.indexOf(newLevel);

  if (newIdx <= currentIdx) {
    return wallet;
  }

  const transaction: MoralWalletTransaction = {
    id: generateTransactionId(),
    type: 'spending',
    amount: -100,
    target: 'level_upgrade',
    date: new Date().toISOString(),
    note: `境界提升：${wallet.agentCard.level} → ${newLevel}`,
  };

  return {
    ...wallet,
    balance: {
      merit: wallet.balance.merit - 100,
      trustQuota: calculateTrustQuota(newLevel),
    },
    agentCard: {
      ...wallet.agentCard,
      level: newLevel,
      dailyLimit: calculateDailyLimit(newLevel),
    },
    transactions: [transaction, ...wallet.transactions].slice(0, 100),
  };
}

export function getWalletSummary(wallet: MoralWallet): {
  meritBalance: number;
  trustQuota: number;
  trustScore: number;
  level: MoralWallet['agentCard']['level'];
  totalEarned: number;
  totalSpent: number;
  recentTransactions: MoralWalletTransaction[];
} {
  const totalEarned = wallet.transactions
    .filter((tx) => tx.amount > 0)
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalSpent = Math.abs(wallet.transactions
    .filter((tx) => tx.amount < 0)
    .reduce((sum, tx) => sum + tx.amount, 0));

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

export { MERIT_POINTS_CONFIG, TRUST_QUOTA_CONFIG, DAILY_LIMIT_CONFIG };
