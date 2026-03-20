export interface ShortTermMemoryItem {
  key: string;
  value: unknown;
  timestamp: Date;
  expiresAt?: Date;
}

export class ShortTermMemory {
  private memory: Map<string, ShortTermMemoryItem> = new Map();
  private maxItems: number;
  private defaultTTL: number;
  private cleanupInterval?: NodeJS.Timeout;
  private readonly CLEANUP_INTERVAL_MS = 60000;

  constructor(maxItems: number = 100, defaultTTLMs: number = 3600000) {
    this.maxItems = maxItems;
    this.defaultTTL = defaultTTLMs;
    this.startBackgroundCleanup();
  }

  private startBackgroundCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.CLEANUP_INTERVAL_MS);
  }

  public dispose(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  set(key: string, value: unknown, ttlMs?: number): void {
    if (this.memory.size >= this.maxItems && !this.memory.has(key)) {
      const oldestKey = this.findOldestKey();
      if (oldestKey) this.memory.delete(oldestKey);
    }
    const expiresAt = ttlMs ? new Date(Date.now() + ttlMs) : undefined;
    this.memory.set(key, {
      key,
      value,
      timestamp: new Date(),
      expiresAt,
    });
  }

  get(key: string): unknown | null {
    const item = this.memory.get(key);
    if (!item) return null;
    if (item.expiresAt && item.expiresAt < new Date()) {
      this.memory.delete(key);
      return null;
    }
    return item.value;
  }

  has(key: string): boolean {
    const item = this.memory.get(key);
    if (!item) return false;
    if (item.expiresAt && item.expiresAt < new Date()) {
      this.memory.delete(key);
      return false;
    }
    return true;
  }

  delete(key: string): boolean {
    return this.memory.delete(key);
  }

  clear(): void {
    this.memory.clear();
  }

  keys(): string[] {
    return Array.from(this.memory.keys());
  }

  size(): number {
    return this.memory.size;
  }

  private findOldestKey(): string | null {
    let oldest: string | null = null;
    let oldestTime = Date.now();
    for (const [key, item] of this.memory.entries()) {
      if (item.timestamp.getTime() < oldestTime) {
        oldestTime = item.timestamp.getTime();
        oldest = key;
      }
    }
    return oldest;
  }

  private cleanup(): void {
    const now = new Date();
    for (const [key, item] of this.memory.entries()) {
      if (item.expiresAt && item.expiresAt < now) {
        this.memory.delete(key);
      }
    }
  }

  getRecentItems(count: number = 10): ShortTermMemoryItem[] {
    return Array.from(this.memory.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, count);
  }
}

export const shortTermMemory = new ShortTermMemory();
