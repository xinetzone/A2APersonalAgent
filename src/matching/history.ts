export interface MatchResult {
  matchId: string;
  userId: string;
  score: number;
  reasons: string[];
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  createdAt: Date;
}

export interface MatchHistory {
  matches: MatchResult[];
  totalMatches: number;
}

export class MatchHistoryManager {
  private history: Map<string, MatchResult> = new Map();

  addMatch(userId: string, score: number, reasons: string[]): MatchResult {
    const matchId = `match_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const result: MatchResult = {
      matchId,
      userId,
      score,
      reasons,
      status: 'pending',
      createdAt: new Date(),
    };
    this.history.set(matchId, result);
    return result;
  }

  getMatch(matchId: string): MatchResult | undefined {
    return this.history.get(matchId);
  }

  updateStatus(matchId: string, status: MatchResult['status']): boolean {
    const match = this.history.get(matchId);
    if (match) {
      match.status = status;
      return true;
    }
    return false;
  }

  getMatchesByUser(userId: string): MatchResult[] {
    return Array.from(this.history.values()).filter(m => m.userId === userId);
  }

  getMatchesByStatus(status: MatchResult['status']): MatchResult[] {
    return Array.from(this.history.values()).filter(m => m.status === status);
  }

  getRecentMatches(count: number = 10): MatchResult[] {
    return Array.from(this.history.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, count);
  }

  clear(): void {
    this.history.clear();
  }

  size(): number {
    return this.history.size;
  }
}

export const matchHistoryManager = new MatchHistoryManager();
