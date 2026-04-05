import crypto from 'crypto';
import {
  AgentPresence,
  PresenceStatus,
  PresenceEvent,
  SpaceType,
} from './types';
import { EventEmitter } from 'events';

const PRESENCE_TTL = 30 * 1000;
const CLEANUP_INTERVAL = 60 * 1000;

export class AgentPresenceManager extends EventEmitter {
  private presences: Map<string, AgentPresence> = new Map();
  private presenceListeners: Map<string, Set<(event: PresenceEvent) => void>> = new Map();
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;
  private storage: {
    get: (key: string) => Promise<string | null>;
    set: (key: string, value: string, ttl?: number) => Promise<void>;
    del: (key: string) => Promise<void>;
    keys: (pattern: string) => Promise<string[]>;
  } | null = null;

  constructor(storage?: AgentPresenceManager['storage']) {
    super();
    this.storage = storage || null;
    this.startCleanupTimer();
  }

  private generateSessionId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  private getPresenceKey(agentId: string): string {
    return `presence:${agentId}`;
  }

  private startCleanupTimer(): void {
    if (typeof setInterval !== 'undefined') {
      this.cleanupTimer = setInterval(() => {
        this.cleanupStaleSessions().catch((err) => {
          console.error('Presence cleanup error:', err);
        });
      }, CLEANUP_INTERVAL);
    }
  }

  async setStatus(agentId: string, userId: string, status: PresenceStatus): Promise<void> {
    let presence = this.presences.get(agentId);

    if (presence) {
      presence.status = status;
      presence.lastHeartbeat = Date.now();
    } else {
      presence = {
        agentId,
        userId,
        status,
        lastHeartbeat: Date.now(),
        sessionId: this.generateSessionId(),
        location: {},
      };
    }

    this.presences.set(agentId, presence);

    if (this.storage) {
      await this.storage.set(
        this.getPresenceKey(agentId),
        JSON.stringify(presence),
        PRESENCE_TTL
      );
    }

    const event: PresenceEvent = {
      type: 'status_change',
      agentId,
      userId,
      timestamp: Date.now(),
      payload: { status },
    };

    this.emit('presence_event', event);
    this.broadcastToAgent(agentId, event);
  }

  async getStatus(agentId: string): Promise<AgentPresence | null> {
    let presence = this.presences.get(agentId);

    if (!presence && this.storage) {
      const data = await this.storage.get(this.getPresenceKey(agentId));
      if (data) {
        const parsed = JSON.parse(data) as AgentPresence;
        if (Date.now() - parsed.lastHeartbeat < PRESENCE_TTL * 2) {
          this.presences.set(agentId, parsed);
          presence = parsed;
        }
      }
    }

    if (!presence) return null;

    if (Date.now() - presence.lastHeartbeat > PRESENCE_TTL * 2) {
      presence.status = 'offline';
      this.presences.set(agentId, presence);
    }

    return presence;
  }

  async getAllOnlineAgents(): Promise<AgentPresence[]> {
    const now = Date.now();
    const online: AgentPresence[] = [];

    for (const presence of this.presences.values()) {
      if (now - presence.lastHeartbeat < PRESENCE_TTL * 2) {
        online.push(presence);
      }
    }

    if (online.length === 0 && this.storage) {
      const allKeys = await this.storage.keys('presence:*');
      await Promise.all(
        allKeys.map(async (key) => {
          const data = await this.storage!.get(key);
          if (data) {
            const presence = JSON.parse(data) as AgentPresence;
            if (Date.now() - presence.lastHeartbeat < PRESENCE_TTL * 2) {
              this.presences.set(presence.agentId, presence);
              online.push(presence);
            }
          }
        })
      );
    }

    return online;
  }

  async enterSpace(agentId: string, spaceId: string, spaceType: SpaceType): Promise<void> {
    let presence = this.presences.get(agentId);

    if (!presence) {
      throw new Error('Agent not registered');
    }

    const previousSpaceId = presence.currentSpaceId;

    presence.currentSpaceId = spaceId;
    presence.location = {
      spaceType,
      spaceId,
    };
    presence.status = 'online';
    presence.lastHeartbeat = Date.now();

    this.presences.set(agentId, presence);

    if (this.storage) {
      await this.storage.set(
        this.getPresenceKey(agentId),
        JSON.stringify(presence),
        PRESENCE_TTL
      );
    }

    const event: PresenceEvent = {
      type: 'join',
      agentId,
      userId: presence.userId,
      timestamp: Date.now(),
      payload: {
        currentSpaceId: spaceId,
        location: presence.location,
      },
    };

    this.emit('presence_event', event);
    this.broadcastToSpace(spaceId, event);

    if (previousSpaceId && previousSpaceId !== spaceId) {
      this.emit('presence_event', {
        type: 'leave',
        agentId,
        userId: presence.userId,
        timestamp: Date.now(),
        payload: { currentSpaceId: previousSpaceId } as Partial<AgentPresence>,
      });
    }
  }

  async leaveSpace(agentId: string): Promise<void> {
    const presence = this.presences.get(agentId);
    if (!presence) return;

    const previousSpaceId = presence.currentSpaceId;

    presence.currentSpaceId = undefined;
    presence.location = {};
    presence.lastHeartbeat = Date.now();

    this.presences.set(agentId, presence);

    if (this.storage) {
      await this.storage.set(
        this.getPresenceKey(agentId),
        JSON.stringify(presence),
        PRESENCE_TTL
      );
    }

    if (previousSpaceId) {
      const event: PresenceEvent = {
        type: 'leave',
        agentId,
        userId: presence.userId,
        timestamp: Date.now(),
        payload: { currentSpaceId: previousSpaceId } as Partial<AgentPresence>,
      };

      this.emit('presence_event', event);
      this.broadcastToSpace(previousSpaceId, event);
    }
  }

  async getAgentsInSpace(spaceId: string): Promise<AgentPresence[]> {
    const agents: AgentPresence[] = [];

    for (const presence of this.presences.values()) {
      if (presence.currentSpaceId === spaceId) {
        if (Date.now() - presence.lastHeartbeat < PRESENCE_TTL * 2) {
          agents.push(presence);
        }
      }
    }

    return agents;
  }

  async heartbeat(agentId: string): Promise<void> {
    const presence = this.presences.get(agentId);
    if (!presence) return;

    presence.lastHeartbeat = Date.now();
    this.presences.set(agentId, presence);

    if (this.storage) {
      await this.storage.set(
        this.getPresenceKey(agentId),
        JSON.stringify(presence),
        PRESENCE_TTL
      );
    }

    const event: PresenceEvent = {
      type: 'heartbeat',
      agentId,
      userId: presence.userId,
      timestamp: Date.now(),
    };

    this.emit('presence_event', event);
  }

  async cleanupStaleSessions(): Promise<number> {
    const now = Date.now();
    const staleThreshold = PRESENCE_TTL * 3;
    let cleaned = 0;

    for (const [agentId, presence] of this.presences.entries()) {
      if (now - presence.lastHeartbeat > staleThreshold) {
        if (presence.currentSpaceId) {
          const leaveEvent: PresenceEvent = {
            type: 'leave',
            agentId,
            userId: presence.userId,
            timestamp: now,
            payload: { currentSpaceId: presence.currentSpaceId } as Partial<AgentPresence>,
          };
          this.broadcastToSpace(presence.currentSpaceId, leaveEvent);
        }

        this.presences.delete(agentId);
        this.presenceListeners.delete(agentId);

        if (this.storage) {
          await this.storage.del(this.getPresenceKey(agentId));
        }

        cleaned++;
      }
    }

    return cleaned;
  }

  subscribe(callback: (event: PresenceEvent) => void): () => void {
    const wrappedCallback = (event: PresenceEvent) => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in presence event listener:', error);
      }
    };

    if (!this.presenceListeners.has('global')) {
      this.presenceListeners.set('global', new Set());
    }
    this.presenceListeners.get('global')!.add(wrappedCallback);

    return () => {
      const globalListeners = this.presenceListeners.get('global');
      if (globalListeners) {
        globalListeners.delete(wrappedCallback);
      }
    };
  }

  private broadcastToAgent(agentId: string, event: PresenceEvent): void {
    const agentListeners = this.presenceListeners.get(agentId);
    if (agentListeners) {
      agentListeners.forEach((callback) => callback(event));
    }
  }

  private broadcastToSpace(spaceId: string, event: PresenceEvent): void {
    const spaceListeners = this.presenceListeners.get(`space:${spaceId}`);
    if (spaceListeners) {
      spaceListeners.forEach((callback) => callback(event));
    }

    const globalListeners = this.presenceListeners.get('global');
    if (globalListeners) {
      globalListeners.forEach((callback) => callback(event));
    }
  }

  subscribeToSpace(
    spaceId: string,
    callback: (event: PresenceEvent) => void
  ): () => void {
    const wrappedCallback = (event: PresenceEvent) => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in space presence listener:', error);
      }
    };

    const key = `space:${spaceId}`;
    if (!this.presenceListeners.has(key)) {
      this.presenceListeners.set(key, new Set());
    }
    this.presenceListeners.get(key)!.add(wrappedCallback);

    return () => {
      const listeners = this.presenceListeners.get(key);
      if (listeners) {
        listeners.delete(wrappedCallback);
      }
    };
  }

  getStats(): {
    totalOnline: number;
    inSpaces: number;
    byStatus: Record<PresenceStatus, number>;
    bySpaceType: Record<SpaceType, number>;
  } {
    const now = Date.now();
    const stats = {
      totalOnline: 0,
      inSpaces: 0,
      byStatus: {
        online: 0,
        away: 0,
        busy: 0,
        offline: 0,
      } as Record<PresenceStatus, number>,
      bySpaceType: {
        'dao-space': 0,
        market: 0,
        lounge: 0,
      } as Record<SpaceType, number>,
    };

    for (const presence of this.presences.values()) {
      if (now - presence.lastHeartbeat < PRESENCE_TTL * 2) {
        stats.totalOnline++;
        stats.byStatus[presence.status]++;

        if (presence.currentSpaceId) {
          stats.inSpaces++;
          if (presence.location.spaceType) {
            stats.bySpaceType[presence.location.spaceType]++;
          }
        }
      }
    }

    return stats;
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.presences.clear();
    this.presenceListeners.clear();
    this.removeAllListeners();
  }
}

let presenceManagerInstance: AgentPresenceManager | null = null;

export function getPresenceManager(
  storage?: AgentPresenceManager['storage']
): AgentPresenceManager {
  if (!presenceManagerInstance) {
    presenceManagerInstance = new AgentPresenceManager(storage);
  }
  return presenceManagerInstance;
}

export function resetPresenceManager(): void {
  if (presenceManagerInstance) {
    presenceManagerInstance.destroy();
    presenceManagerInstance = null;
  }
}
