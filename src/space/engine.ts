import crypto from 'crypto';
import {
  Space,
  SpaceType,
  SpaceStatus,
  SpaceParticipant,
  SpaceMessage,
  SpaceEvent,
  CreateSpaceParams,
  ListSpacesFilters,
  SendMessageParams,
  GetMessagesOptions,
} from './types';
import { EventEmitter } from 'events';

const SPACE_TTL = 24 * 60 * 60 * 1000;
const MESSAGE_TTL = 90 * 24 * 60 * 60 * 1000;
const MAX_MESSAGE_LENGTH = 2000;

export class SpaceEngine extends EventEmitter {
  private spaces: Map<string, Space> = new Map();
  private spaceMessages: Map<string, SpaceMessage[]> = new Map();
  private spaceListeners: Map<string, Set<(event: SpaceEvent) => void>> = new Map();

  private storage: {
    get: (key: string) => Promise<string | null>;
    set: (key: string, value: string, ttl?: number) => Promise<void>;
    del: (key: string) => Promise<void>;
    keys: (pattern: string) => Promise<string[]>;
  } | null = null;

  constructor(storage?: SpaceEngine['storage']) {
    super();
    this.storage = storage || null;
  }

  private generateId(prefix: string): string {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(4).toString('hex');
    return `${prefix}-${timestamp}-${random}`;
  }

  private isExpired(space: Space): boolean {
    return Date.now() - space.updatedAt > SPACE_TTL;
  }

  async createSpace(params: CreateSpaceParams): Promise<Space> {
    const spaceId = this.generateId('space');
    const now = Date.now();

    const space: Space = {
      id: spaceId,
      type: params.type,
      name: params.name,
      description: params.description || '',
      status: 'active',
      hostAgentId: params.hostAgentId,
      hostUserId: params.hostUserId,
      currentTopic: undefined,
      participants: [
        {
          agentId: params.hostAgentId,
          userId: params.hostUserId,
          role: 'host',
          joinedAt: now,
          lastActiveAt: now,
          messageCount: 0,
          trustScore: 50,
        },
      ],
      maxParticipants: params.maxParticipants || 20,
      createdAt: now,
      updatedAt: now,
      metadata: params.metadata || {},
    };

    this.spaces.set(spaceId, space);
    this.spaceMessages.set(spaceId, []);

    if (this.storage) {
      await this.storage.set(`space:${spaceId}`, JSON.stringify(space), SPACE_TTL);
      await this.storage.set('space:index', JSON.stringify([...this.spaces.keys()]));
    }

    this.emit('space_created', { spaceId, space });
    this.broadcastToSpace(spaceId, {
      type: 'space_created',
      spaceId,
      timestamp: now,
      data: { space },
    });

    return space;
  }

  async getSpace(spaceId: string): Promise<Space | null> {
    let space = this.spaces.get(spaceId);

    if (!space && this.storage) {
      const data = await this.storage.get(`space:${spaceId}`);
      if (data) {
        space = JSON.parse(data);
        if (space && !this.isExpired(space)) {
          this.spaces.set(spaceId, space);
        } else {
          return null;
        }
      }
    }

    if (!space) return null;
    if (this.isExpired(space)) {
      await this.closeSpace(spaceId);
      return null;
    }

    return space;
  }

  async listSpaces(filters?: ListSpacesFilters): Promise<Space[]> {
    const allSpaces: Space[] = [];

    if (this.storage && !this.spaces.size) {
      const indexData = await this.storage.get('space:index');
      if (indexData) {
        const ids: string[] = JSON.parse(indexData);
        await Promise.all(
          ids.map(async (id) => {
            const space = await this.getSpace(id);
            if (space) allSpaces.push(space);
          })
        );
      }
    } else {
      allSpaces.push(...this.spaces.values());
    }

    let filtered = allSpaces.filter((s) => s.status !== 'closed');

    if (filters) {
      if (filters.type) {
        filtered = filtered.filter((s) => s.type === filters.type);
      }
      if (filters.status) {
        filtered = filtered.filter((s) => s.status === filters.status);
      }
      if (filters.hasTopic !== undefined) {
        filtered = filtered.filter((s) =>
          filters.hasTopic ? !!s.currentTopic : !s.currentTopic
        );
      }
      if (filters.minParticipants !== undefined) {
        filtered = filtered.filter((s) => s.participants.length >= filters.minParticipants!);
      }
      if (filters.maxParticipants !== undefined) {
        filtered = filtered.filter((s) => s.participants.length <= filters.maxParticipants!);
      }
    }

    filtered.sort((a, b) => {
      const aActive = a.participants.filter((p) => Date.now() - p.lastActiveAt < 300000).length;
      const bActive = b.participants.filter((p) => Date.now() - p.lastActiveAt < 300000).length;
      return bActive - aActive;
    });

    return filtered;
  }

  async joinSpace(
    spaceId: string,
    agentId: string,
    userId: string,
    userName?: string
  ): Promise<SpaceParticipant> {
    const space = await this.getSpace(spaceId);
    if (!space) {
      throw new Error('Space not found');
    }

    if (space.status === 'closed') {
      throw new Error('Space is closed');
    }

    if (space.participants.length >= space.maxParticipants) {
      throw new Error('Space is full');
    }

    const existing = space.participants.find((p) => p.agentId === agentId);
    if (existing) {
      throw new Error('Already in space');
    }

    const now = Date.now();
    const participant: SpaceParticipant = {
      agentId,
      userId,
      role: space.participants.length === 0 ? 'host' : 'participant',
      joinedAt: now,
      lastActiveAt: now,
      messageCount: 0,
      trustScore: 50,
    };

    space.participants.push(participant);
    space.updatedAt = now;
    space.status = 'active';
    this.spaces.set(spaceId, space);

    if (this.storage) {
      await this.storage.set(`space:${spaceId}`, JSON.stringify(space), SPACE_TTL);
    }

    const joinMessage = this.createSystemMessage(
      spaceId,
      `${userName || agentId} 加入了空间`,
      userId
    );
    this.addMessage(spaceId, joinMessage);

    this.emit('participant_joined', { spaceId, participant });
    this.broadcastToSpace(spaceId, {
      type: 'participant_joined',
      spaceId,
      timestamp: now,
      data: { participant },
    });

    return participant;
  }

  async leaveSpace(spaceId: string, agentId: string, reason?: string): Promise<void> {
    const space = await this.getSpace(spaceId);
    if (!space) {
      throw new Error('Space not found');
    }

    const participantIndex = space.participants.findIndex((p) => p.agentId === agentId);
    if (participantIndex === -1) {
      throw new Error('Not in space');
    }

    const participant = space.participants[participantIndex];
    space.participants.splice(participantIndex, 1);
    space.updatedAt = Date.now();

    if (space.participants.length === 0) {
      space.status = 'idle';
    } else if (participant.role === 'host') {
      space.hostAgentId = space.participants[0].agentId;
      space.hostUserId = space.participants[0].userId;
      space.participants[0].role = 'host';
    }

    this.spaces.set(spaceId, space);

    if (this.storage) {
      await this.storage.set(`space:${spaceId}`, JSON.stringify(space), SPACE_TTL);
    }

    const leaveMessage = this.createSystemMessage(
      spaceId,
      `${participant.userId} 离开了空间${reason ? ` (${reason})` : ''}`,
      participant.userId
    );
    this.addMessage(spaceId, leaveMessage);

    this.emit('participant_left', { spaceId, agentId, reason });
    this.broadcastToSpace(spaceId, {
      type: 'participant_left',
      spaceId,
      timestamp: Date.now(),
      data: { agentId, reason },
    });
  }

  async closeSpace(spaceId: string): Promise<void> {
    const space = await this.getSpace(spaceId);
    if (!space) {
      throw new Error('Space not found');
    }

    space.status = 'closed';
    space.updatedAt = Date.now();
    this.spaces.set(spaceId, space);

    if (this.storage) {
      await this.storage.set(`space:${spaceId}`, JSON.stringify(space), SPACE_TTL);
    }

    this.emit('space_closed', { spaceId });
    this.broadcastToSpace(spaceId, {
      type: 'space_closed',
      spaceId,
      timestamp: Date.now(),
    });
  }

  async getParticipants(spaceId: string): Promise<SpaceParticipant[]> {
    const space = await this.getSpace(spaceId);
    if (!space) {
      throw new Error('Space not found');
    }
    return space.participants;
  }

  async sendMessage(spaceId: string, params: SendMessageParams): Promise<SpaceMessage> {
    const space = await this.getSpace(spaceId);
    if (!space) {
      throw new Error('Space not found');
    }

    if (space.status === 'closed') {
      throw new Error('Space is closed');
    }

    const participant = space.participants.find((p) => p.agentId === params.agentId);
    if (!participant) {
      throw new Error('Not in space');
    }

    const content = params.content.trim();
    if (!content) {
      throw new Error('Message cannot be empty');
    }

    if (content.length > MAX_MESSAGE_LENGTH) {
      throw new Error(`Message too long (max ${MAX_MESSAGE_LENGTH} characters)`);
    }

    const message: SpaceMessage = {
      id: this.generateId('msg'),
      spaceId,
      senderAgentId: params.agentId,
      senderUserId: params.userId,
      senderName: params.userName || params.agentId,
      content,
      type: params.type || 'text',
      createdAt: Date.now(),
      replyTo: params.replyTo,
      reactions: {},
    };

    participant.messageCount++;
    participant.lastActiveAt = Date.now();
    space.updatedAt = Date.now();
    this.spaces.set(spaceId, space);

    this.addMessage(spaceId, message);

    this.emit('message_sent', { spaceId, message });
    this.broadcastToSpace(spaceId, {
      type: 'message_sent',
      spaceId,
      timestamp: message.createdAt,
      data: { message },
    });

    return message;
  }

  private addMessage(spaceId: string, message: SpaceMessage): void {
    const messages = this.spaceMessages.get(spaceId) || [];
    messages.push(message);

    if (messages.length > 1000) {
      messages.splice(0, messages.length - 1000);
    }

    this.spaceMessages.set(spaceId, messages);

    if (this.storage) {
      this.storage.set(`messages:${spaceId}`, JSON.stringify(messages), MESSAGE_TTL);
    }
  }

  async getMessages(spaceId: string, options?: GetMessagesOptions): Promise<SpaceMessage[]> {
    let messages = this.spaceMessages.get(spaceId);

    if (!messages && this.storage) {
      const data = await this.storage.get(`messages:${spaceId}`);
      if (data) {
        messages = JSON.parse(data);
        this.spaceMessages.set(spaceId, messages || []);
      }
    }

    if (!messages) return [];

    let filtered = messages;

    if (options?.before) {
      filtered = filtered.filter((m) => m.createdAt < options.before!);
    }
    if (options?.after) {
      filtered = filtered.filter((m) => m.createdAt > options.after!);
    }

    filtered.sort((a, b) => b.createdAt - a.createdAt);

    if (options?.limit) {
      filtered = filtered.slice(0, options.limit);
    }

    return filtered;
  }

  async setTopic(spaceId: string, topic: string, topicId?: string): Promise<void> {
    const space = await this.getSpace(spaceId);
    if (!space) {
      throw new Error('Space not found');
    }

    space.currentTopic = topic;
    if (topicId) {
      space.metadata.topicId = topicId;
    }
    space.updatedAt = Date.now();
    this.spaces.set(spaceId, space);

    if (this.storage) {
      await this.storage.set(`space:${spaceId}`, JSON.stringify(space), SPACE_TTL);
    }

    const topicMessage = this.createSystemMessage(
      spaceId,
      `话题已更新：${topic}`,
      'system'
    );
    this.addMessage(spaceId, topicMessage);

    this.emit('topic_changed', { spaceId, topic });
    this.broadcastToSpace(spaceId, {
      type: 'topic_changed',
      spaceId,
      timestamp: Date.now(),
      data: { topic, topicId },
    });
  }

  async getTopic(spaceId: string): Promise<string | null> {
    const space = await this.getSpace(spaceId);
    return space?.currentTopic || null;
  }

  private createSystemMessage(spaceId: string, content: string, senderId: string): SpaceMessage {
    return {
      id: this.generateId('msg'),
      spaceId,
      senderAgentId: 'system',
      senderUserId: senderId,
      senderName: '系统',
      content,
      type: 'system',
      createdAt: Date.now(),
    };
  }

  private broadcastToSpace(spaceId: string, event: SpaceEvent): void {
    const listeners = this.spaceListeners.get(spaceId);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in space event listener:', error);
        }
      });
    }
  }

  subscribeToSpace(spaceId: string, callback: (event: SpaceEvent) => void): () => void {
    if (!this.spaceListeners.has(spaceId)) {
      this.spaceListeners.set(spaceId, new Set());
    }
    this.spaceListeners.get(spaceId)!.add(callback);

    return () => {
      const spaceListeners = this.spaceListeners.get(spaceId);
      if (spaceListeners) {
        spaceListeners.delete(callback);
        if (spaceListeners.size === 0) {
          this.spaceListeners.delete(spaceId);
        }
      }
    };
  }

  async cleanup(): Promise<number> {
    let cleaned = 0;
    const now = Date.now();

    for (const [spaceId, space] of this.spaces.entries()) {
      if (space.status === 'closed') {
        continue;
      }

      const hasActiveParticipants = space.participants.some(
        (p) => now - p.lastActiveAt < 300000
      );

      if (!hasActiveParticipants && space.status === 'active') {
        space.status = 'idle';
        space.updatedAt = now;
        this.spaces.set(spaceId, space);
        cleaned++;
      }

      if (now - space.updatedAt > SPACE_TTL) {
        space.status = 'closed';
        this.spaces.set(spaceId, space);
        cleaned++;
      }
    }

    return cleaned;
  }

  getStats(): {
    totalSpaces: number;
    activeSpaces: number;
    totalMessages: number;
    totalParticipants: number;
  } {
    let totalMessages = 0;
    let totalParticipants = 0;

    this.spaces.forEach((space) => {
      totalMessages += this.spaceMessages.get(space.id)?.length || 0;
      totalParticipants += space.participants.length;
    });

    return {
      totalSpaces: this.spaces.size,
      activeSpaces: [...this.spaces.values()].filter((s) => s.status === 'active').length,
      totalMessages,
      totalParticipants,
    };
  }
}

let spaceEngineInstance: SpaceEngine | null = null;

export function getSpaceEngine(storage?: SpaceEngine['storage']): SpaceEngine {
  if (!spaceEngineInstance) {
    spaceEngineInstance = new SpaceEngine(storage);
  }
  return spaceEngineInstance;
}

export function resetSpaceEngine(): void {
  spaceEngineInstance = null;
}
