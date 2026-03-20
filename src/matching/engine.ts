import { cosineSimilarity, Vector } from './similarity';
import { TopKRetrieval, RetrievalItem } from './retrieval';
import { matchHistoryManager, MatchResult } from './history';

export interface UserVectorData {
  userId: string;
  vector: number[];
  profile: {
    interests: string[];
    personality: string[];
    behavior: string[];
  };
}

export interface MatchOptions {
  topK?: number;
  minScore?: number;
  includeReasons?: boolean;
}

export class MatchingEngine {
  private retrieval: TopKRetrieval<UserVectorData>;
  private dimension: number;

  constructor(dimension: number = 128) {
    this.dimension = dimension;
    this.retrieval = new TopKRetrieval<UserVectorData>(dimension);
  }

  addUser(user: UserVectorData): void {
    this.retrieval.add(user.userId, user.vector, user);
  }

  removeUser(userId: string): boolean {
    return this.retrieval.remove(userId);
  }

  findMatches(queryVector: number[], options?: MatchOptions): Array<{
    userId: string;
    score: number;
    reasons: string[];
  }> {
    const topK = options?.topK || 10;
    const minScore = options?.minScore || 0;

    const searchResult = this.retrieval.search(queryVector, topK * 2);

    const results: Array<{ userId: string; score: number; reasons: string[] }> = [];

    for (const item of searchResult.items) {
      if (item.score < minScore) continue;
      if (results.length >= topK) break;

      const reasons: string[] = [];
      if (options?.includeReasons !== false) {
        const data = item.data;
        const queryProfile = this.getQueryProfile(queryVector);
        if (queryProfile) {
          const commonInterests = queryProfile.interests.filter(i =>
            data.profile.interests.includes(i)
          );
          if (commonInterests.length > 0) {
            reasons.push(`共同兴趣: ${commonInterests.slice(0, 3).join(', ')}`);
          }
        }
      }

      results.push({
        userId: item.data.userId,
        score: item.score,
        reasons,
      });

      matchHistoryManager.addMatch(item.data.userId, item.score, reasons);
    }

    return results;
  }

  private getQueryProfile(vector: number[]): { interests: string[]; personality: string[]; behavior: string[] } | null {
    const item = this.retrieval.getItem('query');
    if (item) {
      return item.data.profile;
    }
    return null;
  }

  getUser(userId: string): UserVectorData | undefined {
    const item = this.retrieval.getItem(userId);
    return item?.data;
  }

  getMatchHistory(): MatchResult[] {
    return matchHistoryManager.getRecentMatches(20);
  }

  size(): number {
    return this.retrieval.size();
  }

  clear(): void {
    this.retrieval.clear();
  }
}

export const matchingEngine = new MatchingEngine();
