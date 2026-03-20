import { FileStorage, AsyncStorageAdapter } from '../storage';
import { CloudStorageAdapter } from './cloud-adapters';
import { VercelKVStorage } from './vercel-kv';
import { isVercelKVConfigured } from './vercel-kv';
import { VercelPostgresStorage } from './vercel-postgres';
import { isVercelPostgresConfigured } from './vercel-postgres';
import { STORAGE_PROVIDER, KV_STORAGE_CONFIG, POSTGRES_STORAGE_CONFIG } from '../../config';
import { logger } from '../logger';

export type StorageType = 'file' | 'kv' | 'postgres';

export interface StorageManager {
  companionStorage: AsyncStorageAdapter<any>;
  moralCreditStorage: AsyncStorageAdapter<any>;
  moralWalletStorage: AsyncStorageAdapter<any>;
  worldStateStorage: AsyncStorageAdapter<any>;
  initialize(): Promise<void>;
  close(): Promise<void>;
  getProvider(): StorageType;
  isCloud(): boolean;
}

class ProductionStorageManager implements StorageManager {
  companionStorage: AsyncStorageAdapter<any>;
  moralCreditStorage: AsyncStorageAdapter<any>;
  moralWalletStorage: AsyncStorageAdapter<any>;
  worldStateStorage: AsyncStorageAdapter<any>;
  private readonly provider: StorageType;
  private cloudAdapter: CloudStorageAdapter<any> | null = null;

  constructor(type: StorageType) {
    this.provider = type;

    if (type === 'kv' && isVercelKVConfigured()) {
      const kvStorage = new VercelKVStorage({
        url: KV_STORAGE_CONFIG.url,
        restApiUrl: KV_STORAGE_CONFIG.restApiUrl,
        httpApiToken: KV_STORAGE_CONFIG.httpApiToken,
        premiumApiToken: KV_STORAGE_CONFIG.premiumApiToken,
      });

      this.cloudAdapter = kvStorage;

      this.companionStorage = new KVNamespaceAdapter(kvStorage, 'companion-sessions:');
      this.moralCreditStorage = new KVNamespaceAdapter(kvStorage, 'moral-credit:');
      this.moralWalletStorage = new KVNamespaceAdapter(kvStorage, 'moral-wallet:');
      this.worldStateStorage = new KVNamespaceAdapter(kvStorage, 'world-state:');

      logger.info({ provider: 'kv' }, 'Storage initialized with Vercel KV');
    } else if (type === 'postgres' && isVercelPostgresConfigured()) {
      const pgAdapter = new VercelPostgresStorage({
        connectionString: POSTGRES_STORAGE_CONFIG.connectionString!,
        maxConnections: POSTGRES_STORAGE_CONFIG.maxConnections,
      });

      this.cloudAdapter = pgAdapter;

      this.companionStorage = new PostgresNamespaceAdapter(pgAdapter, 'companion-sessions');
      this.moralCreditStorage = new PostgresNamespaceAdapter(pgAdapter, 'moral-credit');
      this.moralWalletStorage = new PostgresNamespaceAdapter(pgAdapter, 'moral-wallet');
      this.worldStateStorage = new PostgresNamespaceAdapter(pgAdapter, 'world-state');

      logger.info({ provider: 'postgres' }, 'Storage initialized with Vercel Postgres');
    } else {
      const fileStorage = new FileStorage<any>('moral-life-data');
      this.companionStorage = new FileNamespaceAdapter(fileStorage, 'companion-sessions');
      this.moralCreditStorage = new FileNamespaceAdapter(fileStorage, 'moral-credit');
      this.moralWalletStorage = new FileNamespaceAdapter(fileStorage, 'moral-wallet');
      this.worldStateStorage = new FileNamespaceAdapter(fileStorage, 'world-state');

      logger.warn({ provider: 'file' }, 'Cloud storage not configured, falling back to FileStorage');
    }
  }

  async initialize(): Promise<void> {
    if (this.cloudAdapter instanceof VercelPostgresStorage) {
      await this.cloudAdapter.initialize();
    }
  }

  async close(): Promise<void> {
    if (this.cloudAdapter) {
      await this.cloudAdapter.close();
    }
  }

  getProvider(): StorageType {
    return this.provider;
  }

  isCloud(): boolean {
    return this.provider === 'kv' || this.provider === 'postgres';
  }
}

class KVNamespaceAdapter implements AsyncStorageAdapter<any> {
  constructor(
    private kv: VercelKVStorage,
    private namespace: string
  ) {}

  private makeKey(key: string): string {
    return `${this.namespace}${key}`;
  }

  async get(key: string): Promise<any> {
    const value = await this.kv.get(this.makeKey(key));
    return value ? JSON.parse(value as string) : undefined;
  }

  async set(key: string, value: any): Promise<void> {
    await this.kv.set(this.makeKey(key), value);
  }

  async has(key: string): Promise<boolean> {
    return await this.kv.has(this.makeKey(key));
  }

  async delete(key: string): Promise<boolean> {
    return await this.kv.delete(this.makeKey(key));
  }

  async clear(): Promise<void> {
    const allKeys = await this.keys();
    await Promise.all(allKeys.map(k => this.kv.delete(this.makeKey(k))));
  }

  async keys(): Promise<string[]> {
    const allKeys = await this.kv.keys();
    const prefix = this.namespace;
    return allKeys
      .filter(k => k.startsWith(prefix))
      .map(k => k.slice(prefix.length));
  }
}

class PostgresNamespaceAdapter implements AsyncStorageAdapter<any> {
  private cache: Map<string, any> = new Map();

  constructor(
    private pg: VercelPostgresStorage,
    private namespace: string
  ) {}

  private makeKey(key: string): string {
    return `${this.namespace}:${key}`;
  }

  async init(): Promise<void> {
    const value = await this.pg.get(this.makeKey('_all_keys'));
    if (value && typeof value === 'object' && 'keys' in (value as object)) {
      const keys = (value as { keys: string[] }).keys;
      for (const k of keys) {
        const v = await this.pg.get(this.makeKey(k));
        if (v) {
          this.cache.set(k, v);
        }
      }
    }
  }

  async get(key: string): Promise<any> {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    const value = await this.pg.get(this.makeKey(key));
    if (value) {
      this.cache.set(key, value);
    }
    return value;
  }

  async set(key: string, value: any): Promise<void> {
    this.cache.set(key, value);
    await this.pg.set(this.makeKey(key), value);
    await this.syncAllKeys();
  }

  async delete(key: string): Promise<boolean> {
    this.cache.delete(key);
    const result = await this.pg.delete(this.makeKey(key));
    await this.syncAllKeys();
    return result;
  }

  async has(key: string): Promise<boolean> {
    if (this.cache.has(key)) {
      return true;
    }
    return await this.pg.has(this.makeKey(key));
  }

  async clear(): Promise<void> {
    this.cache.clear();
    await this.pg.clear();
  }

  async keys(): Promise<string[]> {
    if (this.cache.size === 0) {
      await this.init();
    }
    return Array.from(this.cache.keys());
  }

  private async syncAllKeys(): Promise<void> {
    const keys = Array.from(this.cache.keys());
    await this.pg.set(this.makeKey('_all_keys'), { keys });
  }
}

class FileNamespaceAdapter implements AsyncStorageAdapter<any> {
  constructor(
    private fileStorage: FileStorage<any>,
    private namespace: string
  ) {}

  private getNamespaceData(): Record<string, any> {
    const data = this.fileStorage.get(this.namespace);
    return (data as Record<string, any>) || {};
  }

  private setNamespaceData(data: Record<string, any>): void {
    this.fileStorage.set(this.namespace, data);
  }

  async get(key: string): Promise<any> {
    return this.getNamespaceData()[key];
  }

  async set(key: string, value: any): Promise<void> {
    const data = this.getNamespaceData();
    data[key] = value;
    this.setNamespaceData(data);
  }

  async has(key: string): Promise<boolean> {
    return key in this.getNamespaceData();
  }

  async delete(key: string): Promise<boolean> {
    const data = this.getNamespaceData();
    if (key in data) {
      delete data[key];
      this.setNamespaceData(data);
      return true;
    }
    return false;
  }

  async clear(): Promise<void> {
    this.setNamespaceData({});
  }

  async keys(): Promise<string[]> {
    return Object.keys(this.getNamespaceData());
  }
}

let storageManager: StorageManager | null = null;

export async function createStorage(type?: StorageType): Promise<StorageManager> {
  const storageType = type || STORAGE_PROVIDER as StorageType;

  if (storageManager) {
    await storageManager.close();
  }

  const manager = new ProductionStorageManager(storageType);
  await manager.initialize();
  storageManager = manager;

  return storageManager;
}

export function getStorageManager(): StorageManager | null {
  return storageManager;
}

export function isCloudStorageAvailable(): boolean {
  return isVercelKVConfigured() || isVercelPostgresConfigured();
}
