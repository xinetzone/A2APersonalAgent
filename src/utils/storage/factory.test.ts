import { createStorage, isCloudStorageAvailable } from './factory';

jest.mock('@vercel/kv', () => ({
  KV: jest.fn().mockImplementation(() => ({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    exists: jest.fn().mockResolvedValue(0),
    keys: jest.fn().mockReturnValue({
      [Symbol.asyncIterator]: () => ({
        next: () => Promise.resolve({ value: undefined, done: true }),
      }),
    }),
  })),
}));

jest.mock('@neondatabase/serverless', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    query: jest.fn().mockResolvedValue({ rows: [] }),
    connect: jest.fn().mockImplementation(() => ({
      query: jest.fn().mockResolvedValue({ rows: [] }),
      release: jest.fn(),
    })),
    end: jest.fn().mockResolvedValue(undefined),
  })),
}));

describe('Storage Factory', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('createStorage', () => {
    it('should create file storage when STORAGE_PROVIDER is not set', async () => {
      delete process.env.STORAGE_PROVIDER;

      const storage = await createStorage('file');
      expect(storage.getProvider()).toBe('file');
      expect(storage.isCloud()).toBe(false);
    });

    it('should create kv storage when KV is configured', async () => {
      process.env.STORAGE_PROVIDER = 'kv';
      process.env.KV_URL = 'https://test.vercel.ai';
      process.env.KV_HTTP_API_TOKEN = 'test-token';

      const storage = await createStorage('kv');
      expect(storage.getProvider()).toBe('kv');
      expect(storage.isCloud()).toBe(true);
    });

    it('should create postgres storage when configured', async () => {
      process.env.STORAGE_PROVIDER = 'postgres';
      process.env.POSTGRES_CONNECTION_STRING = 'postgresql://test:test@localhost:5432/testdb';

      const storage = await createStorage('postgres');
      expect(storage.getProvider()).toBe('postgres');
      expect(storage.isCloud()).toBe(true);
    });

    it('should fall back to file storage when cloud storage not available', async () => {
      process.env.STORAGE_PROVIDER = 'kv';
      delete process.env.KV_URL;
      delete process.env.KV_HTTP_API_TOKEN;

      const storage = await createStorage('kv');
      expect(storage.getProvider()).toBe('file');
      expect(storage.isCloud()).toBe(false);
    });
  });

  describe('isCloudStorageAvailable', () => {
    it('should return true when KV is configured', () => {
      process.env.KV_URL = 'https://test.vercel.ai';
      process.env.KV_HTTP_API_TOKEN = 'test-token';

      jest.resetModules();
      const { isCloudStorageAvailable } = require('./factory');
      expect(isCloudStorageAvailable()).toBe(true);
    });

    it('should return true when Postgres is configured', () => {
      process.env.POSTGRES_CONNECTION_STRING = 'postgresql://test:test@localhost:5432/testdb';

      jest.resetModules();
      const { isCloudStorageAvailable } = require('./factory');
      expect(isCloudStorageAvailable()).toBe(true);
    });

    it('should return false when no cloud storage is configured', () => {
      delete process.env.KV_URL;
      delete process.env.KV_HTTP_API_TOKEN;
      delete process.env.POSTGRES_CONNECTION_STRING;

      jest.resetModules();
      const { isCloudStorageAvailable } = require('./factory');
      expect(isCloudStorageAvailable()).toBe(false);
    });
  });
});

describe('Storage Integration Scenarios', () => {
  it('should handle moral credit profile storage', async () => {
    const storage = await createStorage('file');

    const userId = 'test-user-123';
    const profileKey = `credit:${userId}`;
    const testProfile = {
      userId,
      sixDimensions: {
        '闻道': { score: 10, evidence: ['test'], trend: 'up' as const },
        '行善': { score: 20, evidence: [], trend: 'stable' as const },
        '清静': { score: 15, evidence: [], trend: 'stable' as const },
        '知足': { score: 5, evidence: [], trend: 'down' as const },
        '玄德': { score: 8, evidence: [], trend: 'stable' as const },
        '应时': { score: 12, evidence: [], trend: 'stable' as const },
      },
      creditScore: 70,
      rank: '悟道' as const,
    };

    await storage.moralCreditStorage.set(profileKey, testProfile);
    const retrieved = await storage.moralCreditStorage.get(profileKey);

    expect(retrieved).toEqual(testProfile);
    expect(await storage.moralCreditStorage.has(profileKey)).toBe(true);
  });

  it('should handle companion session storage', async () => {
    const storage = await createStorage('file');

    const userId = 'test-user-456';
    const companionId = 'daoist-brother';
    const sessionKey = `${userId}:${companionId}`;
    const testSession = {
      companionId,
      userId,
      startDate: new Date().toISOString(),
      personality: {
        communicationStyle: 'guiding' as const,
        emphasis: '道德修行',
        interactionFrequency: 'daily' as const,
      },
      progress: {
        currentChapter: 1,
        insightsCount: 0,
        dilemmasResolved: 0,
      },
      relationship: {
        trustLevel: 'low' as const,
        interactionStyle: 'balanced' as const,
        sharedValues: ['道德经'],
      },
      milestones: [],
      journal: [],
    };

    await storage.companionStorage.set(sessionKey, testSession);
    const retrieved = await storage.companionStorage.get(sessionKey);

    expect(retrieved).toEqual(testSession);
  });

  it('should handle world state storage', async () => {
    const storage = await createStorage('file');

    const userId = 'test-user-789';
    const stateKey = `world:${userId}`;
    const testState = {
      userId,
      currentRealm: '道德小镇' as const,
      currentZone: '道场' as const,
      visitedRealms: ['现实'] as const[],
      unlockedZones: ['道场'] as const[],
      cultivationProgress: {
        level: '闻道' as const,
        experience: 100,
        insights: ['缘起性空'],
      },
      companions: [],
      recentExperiences: [],
    };

    await storage.worldStateStorage.set(stateKey, testState);
    const retrieved = await storage.worldStateStorage.get(stateKey);

    expect(retrieved).toEqual(testState);
  });

  it('should handle moral wallet storage', async () => {
    const storage = await createStorage('file');

    const userId = 'test-user-wallet';
    const walletKey = `wallet:${userId}`;
    const testWallet = {
      userId,
      walletId: 'wallet-001',
      balance: {
        merit: 500,
        trustQuota: 100,
      },
      agentCard: {
        cardId: 'card-001',
        name: '道德修行者',
        level: '悟道' as const,
        publicKey: 'test-public-key',
        dailyLimit: 10,
      },
      transactions: [],
      trustScore: 75,
    };

    await storage.moralWalletStorage.set(walletKey, testWallet);
    const retrieved = await storage.moralWalletStorage.get(walletKey);

    expect(retrieved).toEqual(testWallet);
  });

  it('should delete storage entries', async () => {
    const storage = await createStorage('file');

    const userId = 'test-user-delete';
    const profileKey = `credit:${userId}`;
    const testProfile = { userId, creditScore: 50 };

    await storage.moralCreditStorage.set(profileKey, testProfile);
    expect(await storage.moralCreditStorage.has(profileKey)).toBe(true);

    await storage.moralCreditStorage.delete(profileKey);
    expect(await storage.moralCreditStorage.has(profileKey)).toBe(false);
  });

  it('should clear all storage for a namespace', async () => {
    const storage = await createStorage('file');

    await storage.moralCreditStorage.set('key1', { data: 'value1' });
    await storage.moralCreditStorage.set('key2', { data: 'value2' });
    await storage.moralCreditStorage.set('key3', { data: 'value3' });

    expect(await storage.moralCreditStorage.has('key1')).toBe(true);
    expect(await storage.moralCreditStorage.has('key2')).toBe(true);
    expect(await storage.moralCreditStorage.has('key3')).toBe(true);

    await storage.moralCreditStorage.clear();

    expect(await storage.moralCreditStorage.has('key1')).toBe(false);
    expect(await storage.moralCreditStorage.has('key2')).toBe(false);
    expect(await storage.moralCreditStorage.has('key3')).toBe(false);
  });
});
