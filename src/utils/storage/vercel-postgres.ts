import { Pool, PoolClient } from '@neondatabase/serverless';
import { CloudStorageAdapter, StorageMetrics } from './cloud-adapters';
import { withRetry } from '../retry';
import { logger } from '../logger';

export interface VercelPostgresOptions {
  connectionString: string;
  maxConnections?: number;
}

export class VercelPostgresStorage implements CloudStorageAdapter<Record<string, unknown>> {
  readonly provider = 'postgres' as const;
  private pool: Pool | null = null;
  private ready = false;
  private readonly tableName: string;
  private metrics: StorageMetrics = { hits: 0, misses: 0, errors: 0, latency: 0 };

  constructor(options: VercelPostgresOptions, tableName: string = 'storage') {
    this.tableName = tableName;
    if (options.connectionString) {
      this.pool = new Pool({
        connectionString: options.connectionString,
        max: options.maxConnections || 10,
      });
      this.ready = true;
    }
  }

  isReady(): boolean {
    return this.ready && this.pool !== null;
  }

  private async measureLatency<T>(fn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    try {
      return await fn();
    } finally {
      this.metrics.latency += Date.now() - start;
    }
  }

  private async ensureTable(): Promise<void> {
    if (!this.pool) return;

    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        key VARCHAR(255) PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_storage_updated_at ON ${this.tableName}(updated_at);
    `;

    await this.pool.query(createTableSQL);
  }

  async initialize(): Promise<void> {
    if (this.pool) {
      try {
        await this.ensureTable();
        logger.info({ table: this.tableName }, 'VercelPostgresStorage table initialized');
      } catch (error) {
        logger.error({ error }, 'Failed to initialize VercelPostgresStorage');
        throw error;
      }
    }
  }

  async get(key: string): Promise<Record<string, unknown> | undefined> {
    if (!this.pool) {
      this.metrics.misses++;
      return undefined;
    }

    try {
      const result = await withRetry(async () => {
        const client: PoolClient = await this.pool!.connect();
        try {
          const { rows } = await client.query(
            `SELECT value FROM ${this.tableName} WHERE key = $1`,
            [key]
          );
          return rows[0]?.value;
        } finally {
          client.release();
        }
      }, { maxAttempts: 3, baseDelay: 500 });

      if (!result) {
        this.metrics.misses++;
      } else {
        this.metrics.hits++;
      }
      return result as Record<string, unknown> | undefined;
    } catch (error) {
      this.metrics.errors++;
      logger.error({ error, key }, 'VercelPostgres get error');
      return undefined;
    }
  }

  async set(key: string, value: Record<string, unknown>): Promise<void> {
    if (!this.pool) {
      this.metrics.errors++;
      return;
    }

    try {
      await withRetry(async () => {
        const client: PoolClient = await this.pool!.connect();
        try {
          await client.query(
            `INSERT INTO ${this.tableName} (key, value, updated_at)
             VALUES ($1, $2, NOW())
             ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
            [key, JSON.stringify(value)]
          );
        } finally {
          client.release();
        }
      }, { maxAttempts: 3, baseDelay: 500 });
    } catch (error) {
      this.metrics.errors++;
      logger.error({ error, key }, 'VercelPostgres set error');
      throw error;
    }
  }

  async delete(key: string): Promise<boolean> {
    if (!this.pool) {
      this.metrics.errors++;
      return false;
    }

    try {
      const result = await withRetry(async () => {
        const client: PoolClient = await this.pool!.connect();
        try {
          const { rowCount } = await client.query(
            `DELETE FROM ${this.tableName} WHERE key = $1`,
            [key]
          );
          return rowCount ?? 0;
        } finally {
          client.release();
        }
      }, { maxAttempts: 3, baseDelay: 500 });
      return result > 0;
    } catch (error) {
      this.metrics.errors++;
      logger.error({ error, key }, 'VercelPostgres delete error');
      return false;
    }
  }

  async has(key: string): Promise<boolean> {
    if (!this.pool) {
      return false;
    }

    try {
      const result = await withRetry(async () => {
        const client: PoolClient = await this.pool!.connect();
        try {
          const { rows } = await client.query(
            `SELECT 1 FROM ${this.tableName} WHERE key = $1 LIMIT 1`,
            [key]
          );
          return rows.length > 0;
        } finally {
          client.release();
        }
      }, { maxAttempts: 3, baseDelay: 500 });
      return result;
    } catch (error) {
      this.metrics.errors++;
      logger.error({ error, key }, 'VercelPostgres has error');
      return false;
    }
  }

  async keys(): Promise<string[]> {
    if (!this.pool) {
      return [];
    }

    try {
      return await withRetry(async () => {
        const client: PoolClient = await this.pool!.connect();
        try {
          const { rows } = await client.query(
            `SELECT key FROM ${this.tableName} ORDER BY updated_at DESC`
          );
          return rows.map((row: { key: string }) => row.key as string);
        } finally {
          client.release();
        }
      }, { maxAttempts: 3, baseDelay: 500 });
    } catch (error) {
      this.metrics.errors++;
      logger.error({ error }, 'VercelPostgres keys error');
      return [];
    }
  }

  async clear(): Promise<void> {
    if (!this.pool) {
      return;
    }

    try {
      await withRetry(async () => {
        const client: PoolClient = await this.pool!.connect();
        try {
          await client.query(`TRUNCATE TABLE ${this.tableName}`);
        } finally {
          client.release();
        }
      }, { maxAttempts: 3, baseDelay: 500 });
    } catch (error) {
      this.metrics.errors++;
      logger.error({ error }, 'VercelPostgres clear error');
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
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

export function createVercelPostgresStorage(
  options: VercelPostgresOptions,
  tableName?: string
): VercelPostgresStorage {
  return new VercelPostgresStorage(options, tableName);
}

export function isVercelPostgresConfigured(): boolean {
  return Boolean(process.env.POSTGRES_CONNECTION_STRING);
}
