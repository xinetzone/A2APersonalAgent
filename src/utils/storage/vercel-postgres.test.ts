import { VercelPostgresStorage, createVercelPostgresStorage, isVercelPostgresConfigured } from './vercel-postgres';

const mockQuery = jest.fn();
const mockConnect = jest.fn();
const mockRelease = jest.fn();
const mockEnd = jest.fn();

const mockPool = {
  query: mockQuery,
  connect: mockConnect,
  end: mockEnd,
};

jest.mock('@neondatabase/serverless', () => ({
  Pool: jest.fn().mockImplementation(() => mockPool),
}));

describe('VercelPostgresStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConnect.mockImplementation(() => ({
      query: mockQuery,
      release: mockRelease,
    }));
  });

  describe('constructor', () => {
    it('should create instance without connection string', () => {
      const storage = new VercelPostgresStorage({ connectionString: '' });
      expect(storage.isReady()).toBe(false);
      expect(storage.provider).toBe('postgres');
    });

    it('should create instance with connection string', () => {
      const storage = new VercelPostgresStorage({
        connectionString: 'postgresql://test:test@localhost:5432/testdb',
      });
      expect(storage.isReady()).toBe(true);
    });

    it('should accept custom table name', () => {
      const storage = new VercelPostgresStorage({
        connectionString: 'postgresql://test:test@localhost:5432/testdb',
      }, 'custom_table');
      expect(storage.isReady()).toBe(true);
    });
  });

  describe('initialize', () => {
    it('should create table if not exists', async () => {
      const storage = new VercelPostgresStorage({
        connectionString: 'postgresql://test:test@localhost:5432/testdb',
      });

      mockQuery.mockResolvedValueOnce({ rows: [] });

      await storage.initialize();

      expect(mockQuery).toHaveBeenCalled();
    });
  });

  describe('get', () => {
    it('should return undefined when not ready', async () => {
      const storage = new VercelPostgresStorage({ connectionString: '' });
      const result = await storage.get('test-key');
      expect(result).toBeUndefined();
    });

    it('should return value when key exists', async () => {
      const storage = new VercelPostgresStorage({
        connectionString: 'postgresql://test:test@localhost:5432/testdb',
      });

      const mockValue = { data: 'test-value' };
      mockQuery
        .mockResolvedValueOnce({ rows: [{ value: mockValue }] });

      const result = await storage.get('test-key');
      expect(result).toEqual(mockValue);
    });

    it('should return undefined when key does not exist', async () => {
      const storage = new VercelPostgresStorage({
        connectionString: 'postgresql://test:test@localhost:5432/testdb',
      });

      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await storage.get('nonexistent-key');
      expect(result).toBeUndefined();
    });

    it('should handle errors gracefully', async () => {
      const storage = new VercelPostgresStorage({
        connectionString: 'postgresql://test:test@localhost:5432/testdb',
      });

      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      const result = await storage.get('test-key');
      expect(result).toBeUndefined();
    });
  });

  describe('set', () => {
    it('should set value successfully', async () => {
      const storage = new VercelPostgresStorage({
        connectionString: 'postgresql://test:test@localhost:5432/testdb',
      });

      mockQuery.mockResolvedValue({ rows: [] });

      await storage.set('test-key', { data: 'test-value' });
      expect(mockQuery).toHaveBeenCalled();
    });

    it('should throw error when not ready', async () => {
      const storage = new VercelPostgresStorage({ connectionString: '' });

      await expect(storage.set('test-key', { data: 'test' })).rejects.toBeDefined();
    });
  });

  describe('delete', () => {
    it('should delete key successfully', async () => {
      const storage = new VercelPostgresStorage({
        connectionString: 'postgresql://test:test@localhost:5432/testdb',
      });

      mockQuery.mockResolvedValueOnce({ rowCount: 1 });

      const result = await storage.delete('test-key');
      expect(result).toBe(true);
    });

    it('should return false when key not found', async () => {
      const storage = new VercelPostgresStorage({
        connectionString: 'postgresql://test:test@localhost:5432/testdb',
      });

      mockQuery.mockResolvedValueOnce({ rowCount: 0 });

      const result = await storage.delete('nonexistent-key');
      expect(result).toBe(false);
    });
  });

  describe('has', () => {
    it('should return true when key exists', async () => {
      const storage = new VercelPostgresStorage({
        connectionString: 'postgresql://test:test@localhost:5432/testdb',
      });

      mockQuery.mockResolvedValueOnce({ rows: [{ 1: 1 }] });

      const result = await storage.has('test-key');
      expect(result).toBe(true);
    });

    it('should return false when key does not exist', async () => {
      const storage = new VercelPostgresStorage({
        connectionString: 'postgresql://test:test@localhost:5432/testdb',
      });

      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await storage.has('nonexistent-key');
      expect(result).toBe(false);
    });
  });

  describe('keys', () => {
    it('should return all keys', async () => {
      const storage = new VercelPostgresStorage({
        connectionString: 'postgresql://test:test@localhost:5432/testdb',
      });

      mockQuery.mockResolvedValueOnce({
        rows: [{ key: 'key1' }, { key: 'key2' }, { key: 'key3' }],
      });

      const result = await storage.keys();
      expect(result).toEqual(['key1', 'key2', 'key3']);
    });

    it('should return empty array when not ready', async () => {
      const storage = new VercelPostgresStorage({ connectionString: '' });
      const result = await storage.keys();
      expect(result).toEqual([]);
    });
  });

  describe('clear', () => {
    it('should clear all data', async () => {
      const storage = new VercelPostgresStorage({
        connectionString: 'postgresql://test:test@localhost:5432/testdb',
      });

      mockQuery.mockResolvedValue({ rows: [] });

      await storage.clear();
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('TRUNCATE'));
    });
  });

  describe('close', () => {
    it('should close pool', async () => {
      mockEnd.mockResolvedValueOnce(undefined);

      const storage = new VercelPostgresStorage({
        connectionString: 'postgresql://test:test@localhost:5432/testdb',
      });

      await storage.close();
      expect(storage.isReady()).toBe(false);
      expect(mockEnd).toHaveBeenCalled();
    });
  });

  describe('metrics', () => {
    it('should track hits and misses', async () => {
      const storage = new VercelPostgresStorage({
        connectionString: 'postgresql://test:test@localhost:5432/testdb',
      });

      mockQuery.mockResolvedValueOnce({ rows: [{ value: { data: 'value1' } }] });
      await storage.get('key1');

      mockQuery.mockResolvedValueOnce({ rows: [] });
      await storage.get('key2');

      const metrics = storage.getMetrics();
      expect(metrics.hits).toBe(1);
      expect(metrics.misses).toBe(1);
    });

    it('should reset metrics', async () => {
      const storage = new VercelPostgresStorage({
        connectionString: 'postgresql://test:test@localhost:5432/testdb',
      });

      storage.resetMetrics();
      const metrics = storage.getMetrics();
      expect(metrics.hits).toBe(0);
      expect(metrics.misses).toBe(0);
      expect(metrics.errors).toBe(0);
    });
  });
});

describe('createVercelPostgresStorage', () => {
  it('should create VercelPostgresStorage instance', () => {
    const storage = createVercelPostgresStorage({
      connectionString: 'postgresql://test:test@localhost:5432/testdb',
    });
    expect(storage).toBeInstanceOf(VercelPostgresStorage);
  });
});

describe('isVercelPostgresConfigured', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return true when POSTGRES_CONNECTION_STRING is set', () => {
    process.env = {
      ...originalEnv,
      POSTGRES_CONNECTION_STRING: 'postgresql://test:test@localhost:5432/testdb',
    };
    jest.resetModules();
    const { isVercelPostgresConfigured } = require('./vercel-postgres');
    expect(isVercelPostgresConfigured()).toBe(true);
  });

  it('should return false when POSTGRES_CONNECTION_STRING is not set', () => {
    process.env = { ...originalEnv };
    delete process.env.POSTGRES_CONNECTION_STRING;
    jest.resetModules();
    const { isVercelPostgresConfiguring } = require('./vercel-postgres');
    expect(isVercelPostgresConfigured()).toBe(false);
  });
});
