import { AgentInfo, AgentCapability } from './message';

export interface RegistryEntry {
  agent: AgentInfo;
  registeredAt: Date;
  lastHeartbeat: Date;
  status: 'active' | 'inactive' | 'removed';
}

export class AgentRegistry {
  private registry: Map<string, RegistryEntry> = new Map();
  private static instance: AgentRegistry;

  static getInstance(): AgentRegistry {
    if (!AgentRegistry.instance) {
      AgentRegistry.instance = new AgentRegistry();
    }
    return AgentRegistry.instance;
  }

  register(agent: AgentInfo): void {
    const entry: RegistryEntry = {
      agent,
      registeredAt: new Date(),
      lastHeartbeat: new Date(),
      status: 'active',
    };
    this.registry.set(agent.agentId, entry);
  }

  unregister(agentId: string): boolean {
    const entry = this.registry.get(agentId);
    if (entry) {
      entry.status = 'removed';
      this.registry.delete(agentId);
      return true;
    }
    return false;
  }

  getAgent(agentId: string): AgentInfo | undefined {
    const entry = this.registry.get(agentId);
    return entry?.agent;
  }

  getAllAgents(): AgentInfo[] {
    return Array.from(this.registry.values())
      .filter(entry => entry.status === 'active')
      .map(entry => entry.agent);
  }

  findAgentsByCapability(capability: AgentCapability): AgentInfo[] {
    return this.getAllAgents().filter(agent =>
      agent.capabilities.includes(capability)
    );
  }

  updateHeartbeat(agentId: string): boolean {
    const entry = this.registry.get(agentId);
    if (entry) {
      entry.lastHeartbeat = new Date();
      return true;
    }
    return false;
  }

  isAgentActive(agentId: string): boolean {
    const entry = this.registry.get(agentId);
    return entry?.status === 'active';
  }

  getAgentsByIds(agentIds: string[]): AgentInfo[] {
    return agentIds
      .map(id => this.getAgent(id))
      .filter((agent): agent is AgentInfo => agent !== undefined);
  }

  clearInactiveAgents(timeoutMs: number = 60000): number {
    const now = Date.now();
    let removedCount = 0;
    for (const [agentId, entry] of this.registry.entries()) {
      if (entry.status === 'active' && now - entry.lastHeartbeat.getTime() > timeoutMs) {
        entry.status = 'inactive';
        removedCount++;
      }
    }
    return removedCount;
  }

  getRegistryStats(): {
    total: number;
    active: number;
    inactive: number;
  } {
    let active = 0;
    let inactive = 0;
    for (const entry of this.registry.values()) {
      if (entry.status === 'active') active++;
      else if (entry.status === 'inactive') inactive++;
    }
    return {
      total: this.registry.size,
      active,
      inactive,
    };
  }
}

export const agentRegistry = AgentRegistry.getInstance();
