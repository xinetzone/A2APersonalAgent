import crypto from 'crypto';
import {
  AgentRelation,
  RelationType,
  RelationStrength,
  RelationRecommendation,
  CreateRelationParams,
  RelationFilters,
} from './types';

const RELATION_TTL = 365 * 24 * 60 * 60 * 1000;
const RECOMMENDATION_CACHE_TTL = 10 * 60 * 1000;

export class RelationshipGraph {
  private relations: Map<string, AgentRelation> = new Map();
  private relationIndex: Map<string, Set<string>> = new Map();
  private recommendationCache: Map<string, { recommendations: RelationRecommendation[]; timestamp: number }> = new Map();
  private storage: {
    get: (key: string) => Promise<string | null>;
    set: (key: string, value: string, ttl?: number) => Promise<void>;
    del: (key: string) => Promise<void>;
    keys: (pattern: string) => Promise<string[]>;
  } | null = null;

  constructor(storage?: RelationshipGraph['storage']) {
    this.storage = storage || null;
  }

  private generateId(): string {
    return crypto.randomBytes(12).toString('hex');
  }

  private getRelationKey(sourceId: string, targetId: string): string {
    return [sourceId, targetId].sort().join(':');
  }

  private getAgentRelationsKey(agentId: string): string {
    return `relations:${agentId}`;
  }

  private strengthFromScore(score: number): RelationStrength {
    if (score >= 80) return 'deep';
    if (score >= 60) return 'strong';
    if (score >= 40) return 'medium';
    return 'weak';
  }

  async createRelation(params: CreateRelationParams): Promise<AgentRelation> {
    const key = this.getRelationKey(params.sourceAgentId, params.targetAgentId);
    const existing = this.relations.get(key);

    if (existing) {
      return this.updateRelation(key, existing, params);
    }

    const now = Date.now();
    const relation: AgentRelation = {
      id: this.generateId(),
      sourceAgentId: params.sourceAgentId,
      targetAgentId: params.targetAgentId,
      type: params.type,
      strength: this.strengthFromScore(params.initialScore || 30),
      score: params.initialScore || 30,
      sharedTopics: params.sharedTopics || [],
      interactionCount: 1,
      lastInteractionAt: now,
      createdAt: now,
      metadata: params.metadata,
    };

    this.relations.set(key, relation);

    this.addToIndex(params.sourceAgentId, key);
    this.addToIndex(params.targetAgentId, key);

    if (this.storage) {
      await this.storage.set(`relation:${key}`, JSON.stringify(relation), RELATION_TTL);
      await this.saveAgentIndex(params.sourceAgentId);
      await this.saveAgentIndex(params.targetAgentId);
    }

    this.invalidateCache(params.sourceAgentId);
    this.invalidateCache(params.targetAgentId);

    return relation;
  }

  private addToIndex(agentId: string, relationKey: string): void {
    if (!this.relationIndex.has(agentId)) {
      this.relationIndex.set(agentId, new Set());
    }
    this.relationIndex.get(agentId)!.add(relationKey);
  }

  private async saveAgentIndex(agentId: string): Promise<void> {
    if (!this.storage) return;
    const keys = this.relationIndex.get(agentId);
    if (keys) {
      await this.storage.set(
        this.getAgentRelationsKey(agentId),
        JSON.stringify([...keys])
      );
    }
  }

  private async updateRelation(
    key: string,
    existing: AgentRelation,
    params: Partial<CreateRelationParams>
  ): Promise<AgentRelation> {
    const now = Date.now();

    existing.interactionCount++;
    existing.lastInteractionAt = now;

    if (params.type) {
      existing.type = params.type;
    }

    if (params.sharedTopics) {
      const existingTopics = new Set(existing.sharedTopics);
      params.sharedTopics.forEach((t) => existingTopics.add(t));
      existing.sharedTopics = [...existingTopics];
    }

    if (params.initialScore !== undefined) {
      existing.score = Math.min(100, existing.score + params.initialScore * 0.1);
    } else {
      existing.score = Math.min(100, existing.score + 2);
    }

    existing.strength = this.strengthFromScore(existing.score);

    this.relations.set(key, existing);

    if (this.storage) {
      await this.storage.set(`relation:${key}`, JSON.stringify(existing), RELATION_TTL);
    }

    this.invalidateCache(existing.sourceAgentId);
    this.invalidateCache(existing.targetAgentId);

    return existing;
  }

  async getRelation(sourceId: string, targetId: string): Promise<AgentRelation | null> {
    const key = this.getRelationKey(sourceId, targetId);
    let relation = this.relations.get(key);

    if (!relation && this.storage) {
      const data = await this.storage.get(`relation:${key}`);
      if (data) {
        relation = JSON.parse(data);
        if (relation) {
          this.relations.set(key, relation);
          this.addToIndex(sourceId, key);
          this.addToIndex(targetId, key);
        }
      }
    }

    return relation || null;
  }

  async updateRelationStrength(relationId: string, delta: number): Promise<void> {
    for (const relation of this.relations.values()) {
      if (relation.id === relationId) {
        relation.score = Math.max(0, Math.min(100, relation.score + delta));
        relation.strength = this.strengthFromScore(relation.score);
        relation.lastInteractionAt = Date.now();

        if (this.storage) {
          const key = this.getRelationKey(relation.sourceAgentId, relation.targetAgentId);
          await this.storage.set(`relation:${key}`, JSON.stringify(relation), RELATION_TTL);
        }

        this.invalidateCache(relation.sourceAgentId);
        this.invalidateCache(relation.targetAgentId);
        return;
      }
    }
  }

  async getAgentRelations(agentId: string, filters?: RelationFilters): Promise<AgentRelation[]> {
    let relationKeys = this.relationIndex.get(agentId);

    if (!relationKeys && this.storage) {
      const data = await this.storage.get(this.getAgentRelationsKey(agentId));
      if (data) {
        const keys: string[] = JSON.parse(data);
        relationKeys = new Set(keys);
        keys.forEach((k) => this.addToIndex(agentId, k));
      }
    }

    if (!relationKeys) return [];

    const relations: AgentRelation[] = [];

    for (const key of relationKeys) {
      let relation = this.relations.get(key);

      if (!relation && this.storage) {
        const data = await this.storage.get(`relation:${key}`);
        if (data) {
          relation = JSON.parse(data);
          if (relation) {
            this.relations.set(key, relation);
          }
        }
      }

      if (relation) {
        if (
          agentId === relation.sourceAgentId ||
          agentId === relation.targetAgentId
        ) {
          if (this.matchesFilters(relation, agentId, filters)) {
            relations.push(relation);
          }
        }
      }
    }

    relations.sort((a, b) => b.score - a.score);

    return relations;
  }

  private matchesFilters(
    relation: AgentRelation,
    agentId: string,
    filters?: RelationFilters
  ): boolean {
    if (!filters) return true;

    if (filters.type && relation.type !== filters.type) return false;

    if (filters.minStrength) {
      const strengthOrder = { weak: 0, medium: 1, strong: 2, deep: 3 };
      if (strengthOrder[relation.strength] < strengthOrder[filters.minStrength]) {
        return false;
      }
    }

    if (filters.minScore !== undefined && relation.score < filters.minScore) {
      return false;
    }

    if (filters.since && relation.lastInteractionAt < filters.since) {
      return false;
    }

    return true;
  }

  async getMutualConnections(agentId: string): Promise<AgentRelation[]> {
    const relations = await this.getAgentRelations(agentId);
    const mutual: AgentRelation[] = [];

    for (const relation of relations) {
      const otherId =
        relation.sourceAgentId === agentId
          ? relation.targetAgentId
          : relation.sourceAgentId;

      const otherRelations = await this.getAgentRelations(otherId, {
        minStrength: 'medium',
      });

      const isMutual = otherRelations.some(
        (r) =>
          (r.sourceAgentId === otherId && r.targetAgentId === agentId) ||
          (r.targetAgentId === otherId && r.sourceAgentId === agentId)
      );

      if (isMutual) {
        mutual.push(relation);
      }
    }

    return mutual;
  }

  async findSimilarAgents(
    agentId: string,
    limit: number = 5,
    userNames?: Map<string, string>
  ): Promise<RelationRecommendation[]> {
    const cacheKey = `similar:${agentId}`;
    const cached = this.recommendationCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < RECOMMENDATION_CACHE_TTL) {
      return cached.recommendations.slice(0, limit);
    }

    const relations = await this.getAgentRelations(agentId, {
      minStrength: 'medium',
    });

    const topicScores: Map<string, { score: number; topics: string[] }> = new Map();

    for (const relation of relations) {
      const otherId =
        relation.sourceAgentId === agentId
          ? relation.targetAgentId
          : relation.sourceAgentId;

      for (const topic of relation.sharedTopics) {
        if (!topicScores.has(otherId)) {
          topicScores.set(otherId, { score: 0, topics: [] });
        }
        const current = topicScores.get(otherId)!;
        current.score += relation.score;
        current.topics.push(topic);
      }
    }

    for (const [otherId, data] of topicScores.entries()) {
      const existingRelation = relations.find(
        (r) =>
          r.sourceAgentId === otherId || r.targetAgentId === otherId
      );
      if (existingRelation) {
        data.score = Math.max(0, data.score - existingRelation.score * 2);
      }
    }

    const recommendations: RelationRecommendation[] = [];

    for (const [otherId, data] of topicScores.entries()) {
      if (data.score > 20) {
        recommendations.push({
          sourceAgentId: agentId,
          targetAgentId: otherId,
          targetUserId: otherId,
          targetUserName: userNames?.get(otherId) || otherId,
          reason: `你们都关注：${[...new Set(data.topics)].slice(0, 3).join('、')}`,
          score: Math.min(100, data.score),
          sharedTopics: [...new Set(data.topics)],
          connectionType: 'topic',
        });
      }
    }

    recommendations.sort((a, b) => b.score - a.score);
    const result = recommendations.slice(0, limit);

    this.recommendationCache.set(cacheKey, {
      recommendations: result,
      timestamp: Date.now(),
    });

    return result;
  }

  async findConversationPartners(
    agentId: string,
    limit: number = 5,
    userNames?: Map<string, string>
  ): Promise<RelationRecommendation[]> {
    const relations = await this.getAgentRelations(agentId, {
      minStrength: 'weak',
    });

    const potentialPartners: RelationRecommendation[] = [];

    for (const relation of relations) {
      const otherId =
        relation.sourceAgentId === agentId
          ? relation.targetAgentId
          : relation.sourceAgentId;

      if (relation.score >= 30) {
        potentialPartners.push({
          sourceAgentId: agentId,
          targetAgentId: otherId,
          targetUserId: otherId,
          targetUserName: userNames?.get(otherId) || otherId,
          reason: `你们在 ${relation.type === 'discussed' ? '讨论' : relation.type} 中有过交流`,
          score: relation.score,
          sharedTopics: relation.sharedTopics,
          connectionType: 'action',
        });
      }
    }

    potentialPartners.sort((a, b) => b.score - a.score);

    return potentialPartners.slice(0, limit);
  }

  async inferRelation(
    agentId1: string,
    agentId2: string
  ): Promise<AgentRelation | null> {
    const existing = await this.getRelation(agentId1, agentId2);
    if (existing) return existing;

    const relations1 = await this.getAgentRelations(agentId1, {
      minStrength: 'medium',
    });
    const relations2 = await this.getAgentRelations(agentId2, {
      minStrength: 'medium',
    });

    const agents1 = new Set(relations1.map((r) => r.sourceAgentId === agentId1 ? r.targetAgentId : r.sourceAgentId));
    const agents2 = new Set(relations2.map((r) => r.sourceAgentId === agentId2 ? r.targetAgentId : r.sourceAgentId));

    const mutualAgents = [...agents1].filter((a) => agents2.has(a));

    let mutualScore = 0;
    const sharedTopics: string[] = [];

    for (const mutualAgent of mutualAgents) {
      const rel1 = relations1.find(
        (r) =>
          (r.sourceAgentId === agentId1 && r.targetAgentId === mutualAgent) ||
          (r.targetAgentId === agentId1 && r.sourceAgentId === mutualAgent)
      );
      const rel2 = relations2.find(
        (r) =>
          (r.sourceAgentId === agentId2 && r.targetAgentId === mutualAgent) ||
          (r.targetAgentId === agentId2 && r.sourceAgentId === mutualAgent)
      );

      if (rel1 && rel2) {
        mutualScore += (rel1.score + rel2.score) / 4;
        sharedTopics.push(...rel1.sharedTopics, ...rel2.sharedTopics);
      }
    }

    if (mutualAgents.length > 0) {
      return this.createRelation({
        sourceAgentId: agentId1,
        targetAgentId: agentId2,
        type: 'met',
        sharedTopics: [...new Set(sharedTopics)],
        initialScore: Math.min(50, mutualScore),
        metadata: { inferred: true, mutualConnections: mutualAgents.length },
      });
    }

    return null;
  }

  private invalidateCache(agentId: string): void {
    this.recommendationCache.delete(`similar:${agentId}`);
    this.recommendationCache.delete(`partners:${agentId}`);
  }

  async getRelationStats(agentId: string): Promise<{
    totalRelations: number;
    byType: Record<RelationType, number>;
    byStrength: Record<RelationStrength, number>;
    averageScore: number;
  }> {
    const relations = await this.getAgentRelations(agentId);

    const stats = {
      totalRelations: relations.length,
      byType: {
        met: 0,
        discussed: 0,
        collaborated: 0,
        conflicted: 0,
        recommended: 0,
      } as Record<RelationType, number>,
      byStrength: {
        weak: 0,
        medium: 0,
        strong: 0,
        deep: 0,
      } as Record<RelationStrength, number>,
      averageScore: 0,
    };

    let totalScore = 0;

    for (const relation of relations) {
      stats.byType[relation.type]++;
      stats.byStrength[relation.strength]++;
      totalScore += relation.score;
    }

    stats.averageScore = relations.length > 0 ? totalScore / relations.length : 0;

    return stats;
  }

  async cleanup(): Promise<number> {
    let cleaned = 0;
    const now = Date.now();
    const staleThreshold = 180 * 24 * 60 * 60 * 1000;

    for (const [key, relation] of this.relations.entries()) {
      if (now - relation.lastInteractionAt > staleThreshold && relation.strength === 'weak') {
        this.relations.delete(key);

        if (this.storage) {
          await this.storage.del(`relation:${key}`);
        }

        cleaned++;
      }
    }

    return cleaned;
  }
}

let relationshipGraphInstance: RelationshipGraph | null = null;

export function getRelationshipGraph(
  storage?: RelationshipGraph['storage']
): RelationshipGraph {
  if (!relationshipGraphInstance) {
    relationshipGraphInstance = new RelationshipGraph(storage);
  }
  return relationshipGraphInstance;
}

export function resetRelationshipGraph(): void {
  relationshipGraphInstance = null;
}
