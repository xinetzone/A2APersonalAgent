import { createClient } from '@vercel/kv';
import { CloudStorageAdapter, StorageMetrics } from './cloud-adapters';
import { withRetry } from '../retry';
import { logger } from '../logger';

export interface VercelKVOptions {
  url?: string;
  restApiUrl?: string;
  httpApiToken?: string;
  premiumApiToken?: string;
}

export class VercelKVStorage implements CloudStorageAdapter<unknown> {
  readonly provider = 'kv' as const;
  private kv: ReturnType<typeof createClient> | null = null;
  private ready = false;
  private metrics: StorageMetrics = { hits: 0, misses: 0, errors: 0, latency: 0 };

  constructor(options: VercelKVOptions = {}) {
    if (options.url && options.httpApiToken) {
      this.kv = createClient({
        url: options.url,
        token: options.httpApiToken,
      });
      this.ready = true;
    } else if (options.restApiUrl && options.premiumApiToken) {
      this.kv = createClient({
        url: options.restApiUrl,
        token: options.premiumApiToken,
      });
      this.ready = true;
    }
  }

  isReady(): boolean {
    return this.ready && this.kv !== null;
  }

  private async measureLatency<T>(fn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    try {
      return await fn();
    } finally {
      this.metrics.latency += Date.now() - start;
    }
  }

  async get(key: string): Promise<unknown | undefined> {
    if (!this.kv) {
      this.metrics.misses++;
      return undefined;
    }

    try {
      const result = await withRetry(async () => {
        return await this.kv!.get(key);
      }, { maxAttempts: 3, baseDelay: 500 });

      if (result === null || result === undefined) {
        this.metrics.misses++;
      } else {
        this.metrics.hits++;
      }
      return result;
    } catch (error) {
      this.metrics.errors++;
      logger.error({ error, key }, 'VercelKV get error');
      return undefined;
    }
  }

  async set(key: string, value: unknown): Promise<void> {
    if (!this.kv) {
      this.metrics.errors++;
      return;
    }

    try {
      await withRetry(async () => {
        await this.kv!.set(key, JSON.stringify(value));
      }, { maxAttempts: 3, baseDelay: 500 });
    } catch (error) {
      this.metrics.errors++;
      logger.error({ error, key }, 'VercelKV set error');
      throw error;
    }
  }

  async delete(key: string): Promise<boolean> {
    if (!this.kv) {
      this.metrics.errors++;
      return false;
    }

    try {
      const result = await withRetry(async () => {
        return await this.kv!.del(key);
      }, { maxAttempts: 3, baseDelay: 500 });
      return result === 1;
    } catch (error) {
      this.metrics.errors++;
      logger.error({ error, key }, 'VercelKV delete error');
      return false;
    }
  }

  async has(key: string): Promise<boolean> {
    if (!this.kv) {
      return false;
    }

    try {
      const result = await withRetry(async () => {
        return await this.kv!.exists(key);
      }, { maxAttempts: 3, baseDelay: 500 });
      return result === 1;
    } catch (error) {
      this.metrics.errors++;
      logger.error({ error, key }, 'VercelKV exists error');
      return false;
    }
  }

  async keys(): Promise<string[]> {
    if (!this.kv) {
      return [];
    }

    try {
      return await withRetry(async () => {
        return await this.kv!.keys('*');
      }, { maxAttempts: 3, baseDelay: 500 });
    } catch (error) {
      this.metrics.errors++;
      logger.error({ error }, 'VercelKV keys error');
      return [];
    }
  }

  async clear(): Promise<void> {
    if (!this.kv) {
      return;
    }

    try {
      const allKeys = await this.keys();
      await withRetry(async () => {
        await this.kv!.del(...allKeys);
      }, { maxAttempts: 3, baseDelay: 500 });
    } catch (error) {
      this.metrics.errors++;
      logger.error({ error }, 'VercelKV clear error');
      throw error;
    }
  }

  async close(): Promise<void> {
    this.kv = null;
    this.ready = false;
  }

  async save(): Promise<void> {
    return Promise.resolve();
  }

  async load(): Promise<void> {
    return Promise.resolve();
  }

  getMetrics(): StorageMetrics {
    return { ...this.metrics };
  }

  resetMetrics(): void {
    this.metrics = { hits: 0, misses: 0, errors: 0, latency: 0 };
  }
}

export function createVercelKVStorage(options?: VercelKVOptions): VercelKVStorage {
  return new VercelKVStorage(options);
}

export function isVercelKVConfigured(): boolean {
  const url = process.env.KV_URL;
  const restApiUrl = process.env.KV_REST_API_URL;
  const httpApiToken = process.env.KV_HTTP_API_TOKEN;
  const premiumApiToken = process.env.KV_PREMIUM_API_TOKEN;

  return Boolean(
    (url && httpApiToken) || (restApiUrl && premiumApiToken)
  );
}
