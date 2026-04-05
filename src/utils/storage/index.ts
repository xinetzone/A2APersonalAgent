import * as storage from '../storage';
import * as cloudAdapters from './cloud-adapters';
import * as vercelKv from './vercel-kv';
import * as vercelPostgres from './vercel-postgres';
import * as factory from './factory';
import * as errors from './errors';

export { storage };
export { cloudAdapters };
export { vercelKv };
export { vercelPostgres };
export { factory };
export { errors };

export const createStorage = factory.createStorage;
export const getStorageManager = factory.getStorageManager;
export const isCloudStorageAvailable = factory.isCloudStorageAvailable;
export type { StorageManager } from './factory';
export type { StorageType } from './factory';
