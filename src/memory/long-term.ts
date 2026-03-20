import { Memory, memoryClient, MemorySearchResult, CreateMemoryOptions } from '../api/secondme';

export interface LongTermMemoryItem {
  memoryId: string;
  content: string;
  type: 'preference' | 'experience' | 'knowledge' | 'relationship';
  visibility: number;
  createdAt: Date;
  updatedAt: Date;
}

export class LongTermMemory {
  private syncInProgress: boolean = false;
  private lastSyncTime?: Date;
  private localCache: Map<string, Memory> = new Map();

  async store(content: string, type: 'preference' | 'experience' | 'knowledge' | 'relationship', visibility: number = 1): Promise<LongTermMemoryItem> {
    const memory = await memoryClient.createMemory({ content, visibility });
    const item = this.mapToItem(memory);
    this.localCache.set(item.memoryId, memory);
    return item;
  }

  async storeBatch(items: CreateMemoryOptions[]): Promise<number> {
    const count = await memoryClient.createMemoryBatch(items);
    this.localCache.clear();
    return count;
  }

  async retrieve(memoryId: string): Promise<LongTermMemoryItem | null> {
    const cached = this.localCache.get(memoryId);
    if (cached) {
      return this.mapToItem(cached);
    }
    return null;
  }

  async search(keyword: string, pageNo: number = 1, pageSize: number = 20): Promise<MemorySearchResult> {
    return await memoryClient.searchMemories(keyword, pageNo, pageSize);
  }

  async update(memoryId: string, content: string, visibility?: number): Promise<LongTermMemoryItem> {
    const memory = await memoryClient.updateMemory(memoryId, content, visibility);
    const item = this.mapToItem(memory);
    this.localCache.set(item.memoryId, memory);
    return item;
  }

  async delete(memoryId: string): Promise<void> {
    await memoryClient.deleteMemory(memoryId);
    this.localCache.delete(memoryId);
  }

  async sync(): Promise<void> {
    if (this.syncInProgress) return;
    this.syncInProgress = true;
    try {
      this.localCache.clear();
      this.lastSyncTime = new Date();
    } finally {
      this.syncInProgress = false;
    }
  }

  getLastSyncTime(): Date | undefined {
    return this.lastSyncTime;
  }

  private mapToItem(memory: Memory): LongTermMemoryItem {
    let type: 'preference' | 'experience' | 'knowledge' | 'relationship' = 'knowledge';
    const content = memory.factContent || memory.factContent;
    if (content.includes('[偏好]') || content.includes('[preference]')) {
      type = 'preference';
    } else if (content.includes('[经历]') || content.includes('[experience]')) {
      type = 'experience';
    } else if (content.includes('[关系]') || content.includes('[relationship]')) {
      type = 'relationship';
    }
    return {
      memoryId: String(memory.memoryId),
      content,
      type,
      visibility: memory.visibility,
      createdAt: new Date(memory.createTime),
      updatedAt: new Date(memory.updateTime),
    };
  }
}

export const longTermMemory = new LongTermMemory();
