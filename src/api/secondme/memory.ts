import { API_ENDPOINTS } from '../../config';
import { credentialManager } from './credentials';
import { AuthenticationError, NetworkError, ValidationError } from '../../errors';
import { withRetry } from '../../utils/retry';

export interface Memory {
  memoryId: string;
  factActor?: string;
  factObject?: string;
  factContent: string;
  createTime: string;
  updateTime: string;
  visibility: number;
}

export interface MemorySearchResult {
  list: Memory[];
  total: number;
}

export interface CreateMemoryOptions {
  content: string;
  visibility?: number;
}

export interface ExtractMemoryOptions {
  content: string;
  source: string;
  sourceId: string;
  context?: string;
}

export class MemoryClient {
  async createMemory(options: CreateMemoryOptions): Promise<Memory> {
    if (!options.content || options.content.length > 10000) {
      throw new ValidationError('Content must be between 1 and 10000 characters');
    }

    return withRetry(async () => {
      const token = await credentialManager.getAccessToken();
      if (!token) {
        throw new AuthenticationError('Not authenticated. Please login first.');
      }

      const response = await fetch(API_ENDPOINTS.memoriesKey, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          mode: 'direct',
          content: options.content,
          visibility: options.visibility || 1,
        }),
      });

      if (!response.ok) {
        throw new NetworkError(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json() as { data: Memory };
      return result.data;
    });
  }

  async createMemoryBatch(items: CreateMemoryOptions[]): Promise<number> {
    return withRetry(async () => {
      const token = await credentialManager.getAccessToken();
      if (!token) {
        throw new AuthenticationError('Not authenticated. Please login first.');
      }

      const response = await fetch(API_ENDPOINTS.memoriesKeyBatch, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: items.map(item => ({
            content: item.content,
            visibility: item.visibility || 1,
          })),
        }),
      });

      if (!response.ok) {
        throw new NetworkError(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json() as { data: { insertedCount: number } };
      return result.data.insertedCount;
    });
  }

  async extractMemory(options: ExtractMemoryOptions): Promise<Memory> {
    return withRetry(async () => {
      const token = await credentialManager.getAccessToken();
      if (!token) {
        throw new AuthenticationError('Not authenticated. Please login first.');
      }

      const response = await fetch(API_ENDPOINTS.memoriesKey, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          mode: 'extract',
          content: options.content,
          source: options.source,
          sourceId: options.sourceId,
          context: options.context,
        }),
      });

      if (!response.ok) {
        throw new NetworkError(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json() as { data: Memory };
      return result.data;
    });
  }

  async searchMemories(keyword: string, pageNo: number = 1, pageSize: number = 20): Promise<MemorySearchResult> {
    return withRetry(async () => {
      const token = await credentialManager.getAccessToken();
      if (!token) {
        throw new AuthenticationError('Not authenticated. Please login first.');
      }

      const url = new URL(API_ENDPOINTS.memoriesKeySearch);
      url.searchParams.set('keyword', keyword);
      url.searchParams.set('pageNo', String(pageNo));
      url.searchParams.set('pageSize', String(pageSize));

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new NetworkError(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json() as { data: MemorySearchResult };
      return result.data;
    });
  }

  async updateMemory(memoryId: string, content: string, visibility?: number): Promise<Memory> {
    return withRetry(async () => {
      const token = await credentialManager.getAccessToken();
      if (!token) {
        throw new AuthenticationError('Not authenticated. Please login first.');
      }

      const response = await fetch(`${API_ENDPOINTS.memoriesKey}/${memoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          content,
          ...(visibility !== undefined && { visibility }),
        }),
      });

      if (!response.ok) {
        throw new NetworkError(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json() as { data: Memory };
      return result.data;
    });
  }

  async deleteMemory(memoryId: string): Promise<void> {
    return withRetry(async () => {
      const token = await credentialManager.getAccessToken();
      if (!token) {
        throw new AuthenticationError('Not authenticated. Please login first.');
      }

      const response = await fetch(`${API_ENDPOINTS.memoriesKey}/${memoryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new NetworkError(`HTTP error! status: ${response.status}`);
      }
    });
  }
}

export const memoryClient = new MemoryClient();
