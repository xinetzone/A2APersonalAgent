import { shortTermMemory, ShortTermMemory } from './short-term';
import { longTermMemory, LongTermMemory } from './long-term';

export interface MemoryQuery {
  keyword?: string;
  type?: 'preference' | 'experience' | 'knowledge' | 'relationship';
  limit?: number;
  offset?: number;
}

export interface MemoryResult {
  items: Array<{
    memoryId: string;
    content: string;
    type: string;
    isLongTerm: boolean;
    timestamp: Date;
  }>;
  total: number;
}

export class MemoryRetrieval {
  private shortTerm: ShortTermMemory;
  private longTerm: LongTermMemory;

  constructor() {
    this.shortTerm = shortTermMemory;
    this.longTerm = longTermMemory;
  }

  async retrieve(query: MemoryQuery): Promise<MemoryResult> {
    const items: MemoryResult['items'] = [];
    let total = 0;

    const promises: Promise<void>[] = [];

    if (!query.type || query.type === 'preference' || query.type === 'experience') {
      const shortTermItems = this.shortTerm.getRecentItems(query.limit || 20);
      for (const item of shortTermItems) {
        items.push({
          memoryId: item.key,
          content: JSON.stringify(item.value),
          type: 'short_term',
          isLongTerm: false,
          timestamp: item.timestamp,
        });
        total++;
      }
    }

    if (query.keyword) {
      promises.push(
        this.longTerm.search(query.keyword, 1, query.limit || 20).then(longTermResults => {
          for (const memory of longTermResults.list) {
            items.push({
              memoryId: String(memory.memoryId),
              content: memory.factContent || '',
              type: 'long_term',
              isLongTerm: true,
              timestamp: new Date(memory.createTime),
            });
            total++;
          }
        })
      );
    }

    await Promise.all(promises);

    return {
      items: items.slice(query.offset || 0, (query.offset || 0) + (query.limit || 20)),
      total,
    };
  }

  async retrieveByKeyword(keyword: string, limit: number = 20): Promise<MemoryResult> {
    return this.retrieve({ keyword, limit });
  }
}

export const memoryRetrieval = new MemoryRetrieval();
