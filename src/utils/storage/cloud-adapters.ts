import type { AsyncStorageAdapter } from '../storage';

export type CloudStorageProvider = 'kv' | 'postgres';

export interface CloudStorageConfig {
  provider: CloudStorageProvider;
  isConnected?: boolean;
}

export interface CloudStorageAdapter<T = unknown> extends AsyncStorageAdapter<T> {
  readonly provider: CloudStorageProvider;
  isReady(): boolean;
  close(): Promise<void>;
}

export interface StorageMetrics {
  hits: number;
  misses: number;
  errors: number;
  latency: number;
}

export function createCloudStorageAdapter<T>(
  provider: CloudStorageProvider,
  adapter: CloudStorageAdapter<T>
): CloudStorageAdapter<T> {
  return adapter;
}

export function isCloudStorageAdapter(
  adapter: unknown
): adapter is CloudStorageAdapter<unknown> {
  return (
    typeof adapter === 'object' &&
    adapter !== null &&
    'provider' in adapter &&
    'isReady' in adapter
  );
}
