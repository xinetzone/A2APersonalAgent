import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

export interface StorageOptions {
  dataDir?: string;
  fileExtension?: string;
  autoSave?: boolean;
  saveInterval?: number;
}

export interface StorageAdapter<T = unknown> {
  get(key: string): T | undefined;
  set(key: string, value: T): void;
  has(key: string): boolean;
  delete(key: string): boolean;
  clear(): void;
  save(): Promise<void>;
  load(): Promise<void>;
}

export interface AsyncStorageAdapter<T = unknown> {
  get(key: string): Promise<T | undefined>;
  set(key: string, value: T): Promise<void>;
  has(key: string): Promise<boolean>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
  keys(): Promise<string[]>;
}

class FileStorage<T = unknown> implements StorageAdapter<T> {
  private cache: Map<string, T> = new Map();
  private dataDir: string;
  private fileExtension: string;
  private filePath: string;
  private dirty = false;
  private saveTimer?: NodeJS.Timeout;
  private autoSave: boolean;
  private saveInterval: number;

  constructor(storageName: string, options: StorageOptions = {}) {
    this.dataDir = options.dataDir || path.join(os.homedir(), '.openclaw', 'data');
    this.fileExtension = options.fileExtension || '.json';
    this.filePath = path.join(this.dataDir, `${storageName}${this.fileExtension}`);
    this.autoSave = options.autoSave ?? true;
    this.saveInterval = options.saveInterval ?? 5000;
  }

  async init(): Promise<void> {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
    } catch {
    }
    await this.load();
  }

  get(key: string): T | undefined {
    return this.cache.get(key);
  }

  set(key: string, value: T): void {
    this.cache.set(key, value);
    this.dirty = true;
    if (this.autoSave) {
      this.scheduleSave();
    }
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  delete(key: string): boolean {
    const result = this.cache.delete(key);
    if (result) {
      this.dirty = true;
      if (this.autoSave) {
        this.scheduleSave();
      }
    }
    return result;
  }

  clear(): void {
    this.cache.clear();
    this.dirty = true;
    if (this.autoSave) {
      this.scheduleSave();
    }
  }

  async save(): Promise<void> {
    if (!this.dirty) {
      return;
    }

    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      const data = Object.fromEntries(this.cache);
      await fs.writeFile(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
      this.dirty = false;
    } catch (error) {
      console.error('Failed to save storage:', error);
      throw error;
    }
  }

  async load(): Promise<void> {
    try {
      const data = await fs.readFile(this.filePath, 'utf-8');
      const parsed = JSON.parse(data);
      this.cache = new Map(Object.entries(parsed));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.error('Failed to load storage:', error);
      }
    }
  }

  private scheduleSave(): void {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }
    this.saveTimer = setTimeout(() => {
      this.save();
    }, this.saveInterval);
  }
}

export { FileStorage };
