import { AgentInfo, AgentCapability } from '../protocol/a2a/message';
import { agentRegistry } from '../protocol/a2a/registry';

export interface DiscoveryQuery {
  capability?: AgentCapability;
  agentId?: string;
  limit?: number;
}

export interface DiscoveryResult {
  agents: AgentInfo[];
  total: number;
  matchedBy: string;
}

export class AgentDiscovery {
  discover(query?: DiscoveryQuery): DiscoveryResult {
    let agents: AgentInfo[];

    if (query?.capability) {
      agents = agentRegistry.findAgentsByCapability(query.capability);
    } else if (query?.agentId) {
      const agent = agentRegistry.getAgent(query.agentId);
      agents = agent ? [agent] : [];
    } else {
      agents = agentRegistry.getAllAgents();
    }

    const limit = query?.limit || agents.length;
    const limitedAgents = agents.slice(0, limit);

    let matchedBy = 'all';
    if (query?.capability) {
      matchedBy = `capability:${query.capability}`;
    } else if (query?.agentId) {
      matchedBy = `agentId:${query.agentId}`;
    }

    return {
      agents: limitedAgents,
      total: agents.length,
      matchedBy,
    };
  }

  findByCapabilities(capabilities: AgentCapability[]): AgentInfo[] {
    const result: AgentInfo[] = [];
    for (const capability of capabilities) {
      const agents = agentRegistry.findAgentsByCapability(capability);
      for (const agent of agents) {
        if (!result.find(a => a.agentId === agent.agentId)) {
          result.push(agent);
        }
      }
    }
    return result;
  }

  getActiveAgents(): AgentInfo[] {
    return agentRegistry.getAllAgents();
  }

  isAgentAvailable(agentId: string): boolean {
    return agentRegistry.isAgentActive(agentId);
  }
}

export const agentDiscovery = new AgentDiscovery();
