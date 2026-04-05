import { VercelKVStorage, createVercelKVStorage, isVercelKVConfigured } from './vercel-kv';

const mockKV = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  keys: jest.fn(),
};

jest.mock('@vercel/kv', () => ({
  KV: jest.fn().mockImplementation(() => mockKV),
}));

describe('VercelKVStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create instance without options', () => {
      const storage = new VercelKVStorage();
      expect(storage.isReady()).toBe(false);
      expect(storage.provider).toBe('kv');
    });

    it('should create instance with url and httpApiToken', () => {
      const storage = new VercelKVStorage({
        url: 'https://test.vercel.ai',
        httpApiToken: 'test-token',
      });
      expect(storage.isReady()).toBe(true);
    });

    it('should create instance with restApiUrl and premiumApiToken', () => {
      const storage = new VercelKVStorage({
        restApiUrl: 'https://test.vercel.ai',
        premiumApiToken: 'test-token',
      });
      expect(storage.isReady()).toBe(true);
    });
  });

  describe('get', () => {
    it('should return undefined when not ready', async () => {
      const storage = new VercelKVStorage();
      const result = await storage.get('test-key');
      expect(result).toBeUndefined();
    });

    it('should return value when key exists', async () => {
      const storage = new VercelKVStorage({
        url: 'https://test.vercel.ai',
        httpApiToken: 'test-token',
      });

      mockKV.get.mockResolvedValueOnce(JSON.stringify({ data: 'test-value' }));

      const result = await storage.get('test-key');
      expect(result).toEqual({ data: 'test-value' });
      expect(mockKV.get).toHaveBeenCalledWith('test-key');
    });

    it('should return undefined when key does not exist', async () => {
      const storage = new VercelKVStorage({
        url: 'https://test.vercel.ai',
        httpApiToken: 'test-token',
      });

      mockKV.get.mockResolvedValueOnce(null);

      const result = await storage.get('nonexistent-key');
      expect(result).toBeUndefined();
    });

    it('should handle errors gracefully', async () => {
      const storage = new VercelKVStorage({
        url: 'https://test.vercel.ai',
        httpApiToken: 'test-token',
      });

      mockKV.get.mockRejectedValueOnce(new Error('Network error'));

      const result = await storage.get('test-key');
      expect(result).toBeUndefined();
    });
  });

  describe('set', () => {
    it('should set value successfully', async () => {
      const storage = new VercelKVStorage({
        url: 'https://test.vercel.ai',
        httpApiToken: 'test-token',
      });

      mockKV.set.mockResolvedValueOnce('OK');

      await storage.set('test-key', { data: 'test-value' });
      expect(mockKV.set).toHaveBeenCalledWith('test-key', JSON.stringify({ data: 'test-value' }));
    });

    it('should throw error when not ready', async () => {
      const storage = new VercelKVStorage();

      await expect(storage.set('test-key', { data: 'test' })).rejects.toBeDefined();
    });
  });

  describe('delete', () => {
    it('should delete key successfully', async () => {
      const storage = new VercelKVStorage({
        url: 'https://test.vercel.ai',
        httpApiToken: 'test-token',
      });

      mockKV.del.mockResolvedValueOnce(1);

      const result = await storage.delete('test-key');
      expect(result).toBe(true);
      expect(mockKV.del).toHaveBeenCalledWith('test-key');
    });

    it('should return false when key not found', async () => {
      const storage = new VercelKVStorage({
        url: 'https://test.vercel.ai',
        httpApiToken: 'test-token',
      });

      mockKV.del.mockResolvedValueOnce(0);

      const result = await storage.delete('nonexistent-key');
      expect(result).toBe(false);
    });
  });

  describe('has', () => {
    it('should return true when key exists', async () => {
      const storage = new VercelKVStorage({
        url: 'https://test.vercel.ai',
        httpApiToken: 'test-token',
      });

      mockKV.exists.mockResolvedValueOnce(1);

      const result = await storage.has('test-key');
      expect(result).toBe(true);
    });

    it('should return false when key does not exist', async () => {
      const storage = new VercelKVStorage({
        url: 'https://test.vercel.ai',
        httpApiToken: 'test-token',
      });

      mockKV.exists.mockResolvedValueOnce(0);

      const result = await storage.has('nonexistent-key');
      expect(result).toBe(false);
    });
  });

  describe('keys', () => {
    it('should return all keys', async () => {
      const storage = new VercelKVStorage({
        url: 'https://test.vercel.ai',
        httpApiToken: 'test-token',
      });

      const mockKeys = ['key1', 'key2', 'key3'];
      mockKV.keys.mockReturnValueOnce({
        [Symbol.asyncIterator]: () => ({
          next: () => Promise.resolve({ value: mockKeys.shift(), done: mockKeys.length === 0 }),
        }),
      });

      const result = await storage.keys();
      expect(result).toEqual(['key1', 'key2', 'key3']);
    });

    it('should return empty array when not ready', async () => {
      const storage = new VercelKVStorage();
      const result = await storage.keys();
      expect(result).toEqual([]);
    });
  });

  describe('metrics', () => {
    it('should track hits and misses', async () => {
      const storage = new VercelKVStorage({
        url: 'https://test.vercel.ai',
        httpApiToken: 'test-token',
      });

      mockKV.get.mockResolvedValueOnce(JSON.stringify({ data: 'value1' }));
      await storage.get('key1');

      mockKV.get.mockResolvedValueOnce(null);
      await storage.get('key2');

      const metrics = storage.getMetrics();
      expect(metrics.hits).toBe(1);
      expect(metrics.misses).toBe(1);
    });

    it('should reset metrics', async () => {
      const storage = new VercelKVStorage({
        url: 'https://test.vercel.ai',
        httpApiToken: 'test-token',
      });

      storage.resetMetrics();
      const metrics = storage.getMetrics();
      expect(metrics.hits).toBe(0);
      expect(metrics.misses).toBe(0);
      expect(metrics.errors).toBe(0);
    });
  });
});

describe('createVercelKVStorage', () => {
  it('should create VercelKVStorage instance', () => {
    const storage = createVercelKVStorage();
    expect(storage).toBeInstanceOf(VercelKVStorage);
  });
});

describe('isVercelKVConfigured', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return true when KV_URL and KV_HTTP_API_TOKEN are set', () => {
    process.env = {
      ...originalEnv,
      KV_URL: 'https://test.vercel.ai',
      KV_HTTP_API_TOKEN: 'test-token',
    };
    jest.resetModules();
    const { isVercelKVConfigured } = require('./vercel-kv');
    expect(isVercelKVConfigured()).toBe(true);
  });

  it('should return true when KV_REST_API_URL and KV_PREMIUM_API_TOKEN are set', () => {
    process.env = {
      ...originalEnv,
      KV_REST_API_URL: 'https://test.vercel.ai',
      KV_PREMIUM_API_TOKEN: 'test-token',
    };
    jest.resetModules();
    const { isVercelKVConfigured } = require('./vercel-kv');
    expect(isVercelKVConfigured()).toBe(true);
  });

  it('should return false when no env vars are set', () => {
    process.env = { ...originalEnv };
    delete process.env.KV_URL;
    delete process.env.KV_HTTP_API_TOKEN;
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_PREMIUM_API_TOKEN;
    jest.resetModules();
    const { isVercelKVConfigured } = require('./vercel-kv');
    expect(isVercelKVConfigured()).toBe(false);
  });
});
