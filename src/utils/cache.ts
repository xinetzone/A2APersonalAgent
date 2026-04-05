interface CacheItem<T> {
  value: T;
  expiresAt: number;
  createdAt: number;
}

export class TimedCache<T> {
  private cache = new Map<string, CacheItem<T>>();
  private defaultTTL: number;
  private cleanupInterval: NodeJS.Timeout;

  constructor(defaultTTLMs: number = 300000) {
    this.defaultTTL = defaultTTLMs;
    // 每5分钟自动清理过期项
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  get(key: string): T | undefined {
    const item = this.cache.get(key);
    if (!item) return undefined;
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }
    return item.value;
  }

  set(key: string, value: T, ttlMs?: number): void {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + (ttlMs || this.defaultTTL),
      createdAt: Date.now(),
    });
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidatePattern(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    this.cleanup();
    return this.cache.size;
  }

  stats(): {
    size: number;
    oldestItemAge: number | null;
    newestItemAge: number | null;
  } {
    this.cleanup();
    const now = Date.now();
    let oldestAge: number | null = null;
    let newestAge: number | null = null;

    for (const item of this.cache.values()) {
      const age = now - item.createdAt;
      if (oldestAge === null || age > oldestAge) {
        oldestAge = age;
      }
      if (newestAge === null || age < newestAge) {
        newestAge = age;
      }
    }

    return {
      size: this.cache.size,
      oldestItemAge: oldestAge,
      newestItemAge: newestAge,
    };
  }

  private cleanup(): void {
    const now = Date.now();
    let deleted = 0;
    for (const [key, item] of this.cache.entries()) {
      if (item.expiresAt < now) {
        this.cache.delete(key);
        deleted++;
      }
    }
    if (deleted > 0) {
      console.log(`Cache cleanup: deleted ${deleted} expired items`);
    }
  }

  dispose(): void {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
  }
}
