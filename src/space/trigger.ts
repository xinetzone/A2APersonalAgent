import crypto from 'crypto';
import {
  ConnectionEvent,
  ConnectionStatus,
  ConnectionNotification,
  CreateTriggerParams,
  TriggerType,
  RelationRecommendation,
} from './types';
import { RelationshipGraph } from './relationship';

const CONNECTION_TTL = 7 * 24 * 60 * 60 * 1000;
const MATCH_THRESHOLD = 70;

export class ConnectionTrigger {
  private connections: Map<string, ConnectionEvent> = new Map();
  private userConnections: Map<string, Set<string>> = new Map();
  private relationshipGraph: RelationshipGraph;
  private storage: {
    get: (key: string) => Promise<string | null>;
    set: (key: string, value: string, ttl?: number) => Promise<void>;
    del: (key: string) => Promise<void>;
    keys: (pattern: string) => Promise<string[]>;
  } | null = null;
  private notificationCallback?: (notification: ConnectionNotification) => Promise<void>;

  constructor(
    relationshipGraph: RelationshipGraph,
    storage?: ConnectionTrigger['storage'],
    notificationCallback?: (notification: ConnectionNotification) => Promise<void>
  ) {
    this.relationshipGraph = relationshipGraph;
    this.storage = storage || null;
    this.notificationCallback = notificationCallback;
  }

  private generateId(): string {
    return crypto.randomBytes(12).toString('hex');
  }

  private getConnectionKey(connectionId: string): string {
    return `connection:${connectionId}`;
  }

  private getUserConnectionsKey(userId: string): string {
    return `user_connections:${userId}`;
  }

  setNotificationCallback(callback: (notification: ConnectionNotification) => Promise<void>): void {
    this.notificationCallback = callback;
  }

  async createTrigger(params: CreateTriggerParams): Promise<ConnectionEvent> {
    const existingConnection = await this.findExistingConnection(
      params.sourceAgentId,
      params.targetAgentId
    );
    if (existingConnection) {
      if (existingConnection.status === 'pending' || existingConnection.status === 'notified') {
        return existingConnection;
      }
    }

    const ttlMs = (params.ttlHours || 72) * 60 * 60 * 1000;
    const now = Date.now();

    const connection: ConnectionEvent = {
      id: this.generateId(),
      type: params.type,
      sourceAgentId: params.sourceAgentId,
      sourceUserId: params.sourceUserId,
      sourceUserName: params.sourceUserName,
      targetAgentId: params.targetAgentId,
      targetUserId: params.targetUserId,
      targetUserName: params.targetUserName,
      status: 'pending',
      context: params.context,
      createdAt: now,
      expiresAt: now + ttlMs,
    };

    this.connections.set(connection.id, connection);

    this.addToUserIndex(connection.sourceUserId, connection.id);
    this.addToUserIndex(connection.targetUserId, connection.id);

    await this.relationshipGraph.createRelation({
      sourceAgentId: params.sourceAgentId,
      targetAgentId: params.targetAgentId,
      type: 'recommended',
      sharedTopics: params.context.sharedTopics,
      initialScore: params.context.matchScore,
      metadata: { connectionId: connection.id },
    });

    if (this.storage) {
      await this.storage.set(
        this.getConnectionKey(connection.id),
        JSON.stringify(connection),
        CONNECTION_TTL
      );
      await this.saveUserConnections(connection.sourceUserId);
      await this.saveUserConnections(connection.targetUserId);
    }

    return connection;
  }

  private addToUserIndex(userId: string, connectionId: string): void {
    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, new Set());
    }
    this.userConnections.get(userId)!.add(connectionId);
  }

  private async saveUserConnections(userId: string): Promise<void> {
    if (!this.storage) return;
    const connections = this.userConnections.get(userId);
    if (connections) {
      await this.storage.set(
        this.getUserConnectionsKey(userId),
        JSON.stringify([...connections])
      );
    }
  }

  private async findExistingConnection(
    sourceAgentId: string,
    targetAgentId: string
  ): Promise<ConnectionEvent | null> {
    for (const connection of this.connections.values()) {
      if (
        connection.sourceAgentId === sourceAgentId &&
        connection.targetAgentId === targetAgentId &&
        ['pending', 'notified'].includes(connection.status)
      ) {
        return connection;
      }
    }
    return null;
  }

  async evaluateTriggers(agentId: string, userId: string): Promise<ConnectionEvent[]> {
    const recommendations = await this.relationshipGraph.findSimilarAgents(agentId, 5);

    const triggered: ConnectionEvent[] = [];

    for (const rec of recommendations) {
      if (rec.score >= MATCH_THRESHOLD) {
        const connection = await this.createTrigger({
          type: 'topic',
          sourceAgentId: agentId,
          sourceUserId: userId,
          sourceUserName: userId,
          targetAgentId: rec.targetAgentId,
          targetUserId: rec.targetUserId,
          targetUserName: rec.targetUserName,
          context: {
            matchScore: rec.score,
            sharedTopics: rec.sharedTopics,
            topic: rec.reason,
          },
        });

        triggered.push(connection);
      }
    }

    return triggered;
  }

  async getConnection(connectionId: string): Promise<ConnectionEvent | null> {
    let connection = this.connections.get(connectionId);

    if (!connection && this.storage) {
      const data = await this.storage.get(this.getConnectionKey(connectionId));
      if (data) {
        connection = JSON.parse(data);
        if (connection) {
          this.connections.set(connectionId, connection);
        }
      }
    }

    if (!connection) return null;

    if (Date.now() > connection.expiresAt) {
      await this.updateStatus(connectionId, 'expired');
      return this.connections.get(connectionId) || null;
    }

    return connection;
  }

  async updateStatus(connectionId: string, status: ConnectionStatus): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      const data = await this.storage?.get(this.getConnectionKey(connectionId));
      if (data) {
        const parsed = JSON.parse(data) as ConnectionEvent;
        this.connections.set(connectionId, parsed);
      }
    }

    const conn = this.connections.get(connectionId);
    if (!conn) return;

    conn.status = status;

    if (status === 'notified') {
      conn.notificationSentAt = Date.now();
    } else if (['accepted', 'rejected', 'expired'].includes(status)) {
      conn.respondedAt = Date.now();
    }

    this.connections.set(connectionId, conn);

    if (this.storage) {
      await this.storage.set(
        this.getConnectionKey(connectionId),
        JSON.stringify(conn),
        CONNECTION_TTL
      );
    }
  }

  async acceptConnection(connectionId: string): Promise<void> {
    const connection = await this.getConnection(connectionId);
    if (!connection) {
      throw new Error('Connection not found');
    }

    if (connection.status !== 'pending' && connection.status !== 'notified') {
      throw new Error(`Cannot accept connection in status: ${connection.status}`);
    }

    await this.updateStatus(connectionId, 'accepted');

    await this.relationshipGraph.createRelation({
      sourceAgentId: connection.sourceAgentId,
      targetAgentId: connection.targetAgentId,
      type: 'met',
      sharedTopics: connection.context.sharedTopics,
      initialScore: connection.context.matchScore || 50,
      metadata: { connectionId, accepted: true },
    });
  }

  async rejectConnection(connectionId: string, reason?: string): Promise<void> {
    await this.updateStatus(connectionId, 'rejected');
  }

  async sendNotification(connection: ConnectionEvent): Promise<void> {
    if (!this.notificationCallback) {
      console.warn('No notification callback configured');
      return;
    }

    await this.updateStatus(connection.id, 'notified');

    const sharedTopicsStr = connection.context.sharedTopics?.slice(0, 3).join('、') || '多个共同话题';

    const notification: ConnectionNotification = {
      connectionId: connection.id,
      type: connection.type,
      fromUser: {
        id: connection.sourceUserId,
        name: connection.sourceUserName,
        sharedTopics: connection.context.sharedTopics || [],
        matchScore: connection.context.matchScore || 50,
      },
      context: connection.context.topic ||
        connection.context.message?.slice(0, 100) ||
        `你们有共同话题：${sharedTopicsStr}`,
      cta: '建立连接',
    };

    await this.notificationCallback(notification);
  }

  async getPendingConnections(userId: string): Promise<ConnectionNotification[]> {
    const connectionIds = this.userConnections.get(userId);

    if (!connectionIds && this.storage) {
      const data = await this.storage.get(this.getUserConnectionsKey(userId));
      if (data) {
        const ids: string[] = JSON.parse(data);
        ids.forEach((id) => this.addToUserIndex(userId, id));
      }
    }

    if (!connectionIds) return [];

    const pending: ConnectionNotification[] = [];

    for (const connectionId of connectionIds) {
      const connection = await this.getConnection(connectionId);
      if (
        connection &&
        connection.targetUserId === userId &&
        (connection.status === 'pending' || connection.status === 'notified')
      ) {
        const sharedTopicsStr = connection.context.sharedTopics?.slice(0, 3).join('、') || '多个共同话题';

        pending.push({
          connectionId: connection.id,
          type: connection.type,
          fromUser: {
            id: connection.sourceUserId,
            name: connection.sourceUserName,
            sharedTopics: connection.context.sharedTopics || [],
            matchScore: connection.context.matchScore || 50,
          },
          context: connection.context.topic ||
            connection.context.message?.slice(0, 100) ||
            `你们有共同话题：${sharedTopicsStr}`,
          cta: '接受连接',
        });
      }
    }

    pending.sort((a, b) => b.fromUser.matchScore - a.fromUser.matchScore);

    return pending;
  }

  async calculateMatchScore(agentId1: string, agentId2: string): Promise<number> {
    const relation = await this.relationshipGraph.getRelation(agentId1, agentId2);
    if (relation) {
      return relation.score;
    }

    const recommendations = await this.relationshipGraph.findSimilarAgents(agentId1, 10);
    const rec = recommendations.find((r) => r.targetAgentId === agentId2);
    if (rec) {
      return rec.score;
    }

    return 0;
  }

  async generateRecommendationReason(agentId1: string, agentId2: string): Promise<string> {
    const relation = await this.relationshipGraph.getRelation(agentId1, agentId2);

    if (relation && relation.sharedTopics.length > 0) {
      return `你们都关注：${relation.sharedTopics.slice(0, 3).join('、')}`;
    }

    const recommendations = await this.relationshipGraph.findSimilarAgents(agentId1, 10);
    const rec = recommendations.find((r) => r.targetAgentId === agentId2);

    if (rec) {
      return rec.reason;
    }

    return '基于你们的兴趣和互动模式，你们可能会聊得来';
  }

  async getConnectionHistory(userId: string): Promise<{
    sent: ConnectionEvent[];
    received: ConnectionEvent[];
    accepted: number;
    rejected: number;
  }> {
    const connectionIds = this.userConnections.get(userId);

    if (!connectionIds && this.storage) {
      const data = await this.storage.get(this.getUserConnectionsKey(userId));
      if (data) {
        const ids: string[] = JSON.parse(data);
        ids.forEach((id) => this.addToUserIndex(userId, id));
      }
    }

    if (!connectionIds) {
      return { sent: [], received: [], accepted: 0, rejected: 0 };
    }

    const sent: ConnectionEvent[] = [];
    const received: ConnectionEvent[] = [];
    let accepted = 0;
    let rejected = 0;

    for (const connectionId of connectionIds) {
      const connection = await this.getConnection(connectionId);
      if (connection) {
        if (connection.sourceUserId === userId) {
          sent.push(connection);
        } else if (connection.targetUserId === userId) {
          received.push(connection);
        }

        if (connection.status === 'accepted') accepted++;
        if (connection.status === 'rejected') rejected++;
      }
    }

    sent.sort((a, b) => b.createdAt - a.createdAt);
    received.sort((a, b) => b.createdAt - a.createdAt);

    return { sent, received, accepted, rejected };
  }

  async cleanup(): Promise<number> {
    let cleaned = 0;
    const now = Date.now();

    for (const [id, connection] of this.connections.entries()) {
      if (now > connection.expiresAt && connection.status === 'pending') {
        await this.updateStatus(id, 'expired');
        cleaned++;
      }
    }

    return cleaned;
  }
}

let connectionTriggerInstance: ConnectionTrigger | null = null;

export function getConnectionTrigger(
  relationshipGraph?: RelationshipGraph,
  storage?: ConnectionTrigger['storage'],
  notificationCallback?: (notification: ConnectionNotification) => Promise<void>
): ConnectionTrigger {
  if (!connectionTriggerInstance) {
    const rg = relationshipGraph || (() => {
      const rgFn = require('./relationship');
      return rgFn.getRelationshipGraph();
    })();
    connectionTriggerInstance = new ConnectionTrigger(
      rg,
      storage,
      notificationCallback
    );
  }
  return connectionTriggerInstance;
}

export function resetConnectionTrigger(): void {
  connectionTriggerInstance = null;
}
