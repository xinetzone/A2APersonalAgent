import {
  createMoralWallet,
  addMeritTransaction,
  makeDonation,
  spendTrustQuota,
  updateTrustScore,
  upgradeLevel,
  getWalletSummary,
  CONFIG,
  LEVEL_ORDER,
} from './wallet-optimized';
import { MoralWallet } from './types';

describe('Wallet Optimized Module', () => {
  describe('createMoralWallet', () => {
    it('should create a wallet with valid parameters', () => {
      const wallet = createMoralWallet({
        userId: 'user-123',
        name: 'Test Wallet',
        level: '闻道',
      });

      expect(wallet).toBeDefined();
      expect(wallet.userId).toBe('user-123');
      expect(wallet.agentCard.name).toBe('Test Wallet');
      expect(wallet.agentCard.level).toBe('闻道');
      expect(wallet.balance.merit).toBe(CONFIG.initialBalance);
      expect(wallet.transactions).toHaveLength(1);
    });

    it('should throw error for invalid userId', () => {
      expect(() => createMoralWallet({ userId: '', name: 'Test', level: '闻道' }))
        .toThrow('Invalid userId');
    });

    it('should throw error for invalid name', () => {
      expect(() => createMoralWallet({ userId: 'user-123', name: '', level: '闻道' }))
        .toThrow('Invalid name');
    });

    it('should throw error for invalid level', () => {
      expect(() => createMoralWallet({ userId: 'user-123', name: 'Test', level: 'invalid' as any }))
        .toThrow('Invalid level');
    });

    it('should trim wallet name', () => {
      const wallet = createMoralWallet({
        userId: 'user-123',
        name: '  Test Wallet  ',
        level: '闻道',
      });
      expect(wallet.agentCard.name).toBe('Test Wallet');
    });

    it('should generate unique wallet IDs', () => {
      const wallet1 = createMoralWallet({ userId: 'user-1', name: 'Wallet 1', level: '闻道' });
      const wallet2 = createMoralWallet({ userId: 'user-2', name: 'Wallet 2', level: '闻道' });
      expect(wallet1.walletId).not.toBe(wallet2.walletId);
    });
  });

  describe('addMeritTransaction', () => {
    let wallet: MoralWallet;

    beforeEach(() => {
      wallet = createMoralWallet({ userId: 'user-123', name: 'Test', level: '闻道' });
    });

    it('should add earning transaction', () => {
      const newWallet = addMeritTransaction(wallet, { source: 'daily_practice' });
      expect(newWallet.balance.merit).toBe(CONFIG.initialBalance + 5);
      expect(newWallet.transactions).toHaveLength(2);
    });

    it('should add spending transaction', () => {
      const newWallet = addMeritTransaction(wallet, { source: 'course_exchange' });
      expect(newWallet.balance.merit).toBe(CONFIG.initialBalance - 30);
    });

    it('should not exceed max balance', () => {
      wallet = { ...wallet, balance: { ...wallet.balance, merit: 995 } };
      const newWallet = addMeritTransaction(wallet, { source: 'help_others' });
      expect(newWallet.balance.merit).toBe(995); // No change
    });

    it('should handle custom amount', () => {
      const newWallet = addMeritTransaction(wallet, { source: 'daily_practice', customAmount: 20 });
      expect(newWallet.balance.merit).toBe(CONFIG.initialBalance + 20);
    });

    it('should limit transactions to max', () => {
      for (let i = 0; i < 110; i++) {
        wallet = addMeritTransaction(wallet, { source: 'daily_practice' });
      }
      expect(wallet.transactions.length).toBeLessThanOrEqual(CONFIG.maxTransactions);
    });
  });

  describe('makeDonation', () => {
    let wallet: MoralWallet;

    beforeEach(() => {
      wallet = createMoralWallet({ userId: 'user-123', name: 'Test', level: '闻道' });
    });

    it('should make donation', () => {
      const newWallet = makeDonation(wallet, { amount: 50, recipient: 'Charity' });
      expect(newWallet.balance.merit).toBe(CONFIG.initialBalance - 50);
    });

    it('should not allow donation exceeding balance', () => {
      const newWallet = makeDonation(wallet, { amount: 200 });
      expect(newWallet.balance.merit).toBe(CONFIG.initialBalance);
    });

    it('should not allow negative donation', () => {
      const newWallet = makeDonation(wallet, { amount: -10 });
      expect(newWallet.balance.merit).toBe(CONFIG.initialBalance);
    });

    it('should handle anonymous donation', () => {
      const newWallet = makeDonation(wallet, { amount: 10, isAnonymous: true });
      const donationTx = newWallet.transactions[0];
      expect(donationTx.recipient).toBeUndefined();
      expect(donationTx.note).toBe('匿名捐赠');
    });
  });

  describe('spendTrustQuota', () => {
    let wallet: MoralWallet;

    beforeEach(() => {
      wallet = createMoralWallet({ userId: 'user-123', name: 'Test', level: '闻道' });
    });

    it('should spend trust quota successfully', () => {
      const result = spendTrustQuota(wallet, 20);
      expect(result.success).toBe(true);
      expect(result.wallet.balance.trustQuota).toBe(30);
    });

    it('should fail when quota insufficient', () => {
      const result = spendTrustQuota(wallet, 100);
      expect(result.success).toBe(false);
      expect(result.message).toBe('信任额度不足');
    });

    it('should fail for negative amount', () => {
      const result = spendTrustQuota(wallet, -10);
      expect(result.success).toBe(false);
      expect(result.message).toBe('金额必须为正数');
    });
  });

  describe('updateTrustScore', () => {
    let wallet: MoralWallet;

    beforeEach(() => {
      wallet = createMoralWallet({ userId: 'user-123', name: 'Test', level: '闻道' });
    });

    it('should increase trust score', () => {
      const newWallet = updateTrustScore(wallet, 10);
      expect(newWallet.trustScore).toBe(CONFIG.initialTrustScore + 10);
    });

    it('should decrease trust score', () => {
      const newWallet = updateTrustScore(wallet, -10);
      expect(newWallet.trustScore).toBe(CONFIG.initialTrustScore - 10);
    });

    it('should not exceed 100', () => {
      const newWallet = updateTrustScore(wallet, 50);
      expect(newWallet.trustScore).toBe(100);
    });

    it('should not go below 0', () => {
      const newWallet = updateTrustScore(wallet, -100);
      expect(newWallet.trustScore).toBe(0);
    });
  });

  describe('upgradeLevel', () => {
    let wallet: MoralWallet;

    beforeEach(() => {
      wallet = createMoralWallet({ userId: 'user-123', name: 'Test', level: '闻道' });
    });

    it('should upgrade level successfully', () => {
      const newWallet = upgradeLevel(wallet, '悟道');
      expect(newWallet.agentCard.level).toBe('悟道');
      expect(newWallet.balance.merit).toBe(CONFIG.initialBalance - CONFIG.upgradeCost);
    });

    it('should not allow downgrade', () => {
      wallet = { ...wallet, agentCard: { ...wallet.agentCard, level: '行道' } };
      const newWallet = upgradeLevel(wallet, '闻道');
      expect(newWallet.agentCard.level).toBe('行道');
    });

    it('should not allow same level upgrade', () => {
      const newWallet = upgradeLevel(wallet, '闻道');
      expect(newWallet.agentCard.level).toBe('闻道');
    });

    it('should not upgrade without sufficient merit', () => {
      wallet = { ...wallet, balance: { ...wallet.balance, merit: 50 } };
      const newWallet = upgradeLevel(wallet, '悟道');
      expect(newWallet.agentCard.level).toBe('闻道');
    });

    it('should update trust quota after upgrade', () => {
      const newWallet = upgradeLevel(wallet, '悟道');
      expect(newWallet.balance.trustQuota).toBe(100);
    });
  });

  describe('getWalletSummary', () => {
    let wallet: MoralWallet;

    beforeEach(() => {
      wallet = createMoralWallet({ userId: 'user-123', name: 'Test', level: '闻道' });
    });

    it('should return correct summary', () => {
      const summary = getWalletSummary(wallet);
      expect(summary.meritBalance).toBe(CONFIG.initialBalance);
      expect(summary.trustQuota).toBe(50);
      expect(summary.trustScore).toBe(CONFIG.initialTrustScore);
      expect(summary.level).toBe('闻道');
    });

    it('should calculate total earned correctly', () => {
      wallet = addMeritTransaction(wallet, { source: 'daily_practice' });
      wallet = addMeritTransaction(wallet, { source: 'help_others' });
      const summary = getWalletSummary(wallet);
      expect(summary.totalEarned).toBe(CONFIG.initialBalance + 5 + 10);
    });

    it('should calculate total spent correctly', () => {
      wallet = makeDonation(wallet, { amount: 20 });
      wallet = makeDonation(wallet, { amount: 30 });
      const summary = getWalletSummary(wallet);
      expect(summary.totalSpent).toBe(50);
    });

    it('should limit recent transactions', () => {
      for (let i = 0; i < 20; i++) {
        wallet = addMeritTransaction(wallet, { source: 'daily_practice' });
      }
      const summary = getWalletSummary(wallet);
      expect(summary.recentTransactions.length).toBeLessThanOrEqual(10);
    });
  });

  describe('Configuration', () => {
    it('should have correct initial balance', () => {
      expect(CONFIG.initialBalance).toBe(100);
    });

    it('should have correct max balance', () => {
      expect(CONFIG.maxBalance).toBe(1000);
    });

    it('should have correct level order', () => {
      expect(LEVEL_ORDER).toEqual(['闻道', '悟道', '行道', '得道', '同道']);
    });

    it('should have correct trust quota config', () => {
      expect(CONFIG.trustQuota['闻道']).toBe(50);
      expect(CONFIG.trustQuota['同道']).toBe(1000);
    });
  });
});
