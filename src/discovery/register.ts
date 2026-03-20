import { AgentInfo, AgentCapability } from '../protocol/a2a/message';
import { agentRegistry } from '../protocol/a2a/registry';

export interface RegistrationRequest {
  agentId: string;
  name: string;
  description?: string;
  capabilities: AgentCapability[];
  endpoint?: string;
}

export interface RegistrationResponse {
  success: boolean;
  agent?: AgentInfo;
  message?: string;
}

export class AgentRegistration {
  register(request: RegistrationRequest): RegistrationResponse {
    try {
      const existingAgent = agentRegistry.getAgent(request.agentId);
      if (existingAgent) {
        return {
          success: false,
          message: 'Agent already registered',
        };
      }

      const agentInfo: AgentInfo = {
        agentId: request.agentId,
        capabilities: request.capabilities,
        name: request.name,
        description: request.description,
        endpoint: request.endpoint,
      };

      agentRegistry.register(agentInfo);

      return {
        success: true,
        agent: agentInfo,
        message: 'Agent registered successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Registration failed',
      };
    }
  }

  unregister(agentId: string): boolean {
    return agentRegistry.unregister(agentId);
  }

  getAgent(agentId: string): AgentInfo | undefined {
    return agentRegistry.getAgent(agentId);
  }

  getAllAgents(): AgentInfo[] {
    return agentRegistry.getAllAgents();
  }

  findByCapability(capability: AgentCapability): AgentInfo[] {
    return agentRegistry.findAgentsByCapability(capability);
  }

  updateHeartbeat(agentId: string): boolean {
    return agentRegistry.updateHeartbeat(agentId);
  }

  isActive(agentId: string): boolean {
    return agentRegistry.isAgentActive(agentId);
  }

  getStats(): { total: number; active: number; inactive: number } {
    return agentRegistry.getRegistryStats();
  }
}

export const agentRegistration = new AgentRegistration();
