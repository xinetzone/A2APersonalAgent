import { A2AMessage, ActionType } from './message';
import { agentRegistry, AgentRegistry } from './registry';

export interface RouteRule {
  actionType: ActionType;
  handler: (message: A2AMessage) => Promise<A2AMessage | null>;
}

export type MessageHandler = (message: A2AMessage) => Promise<A2AMessage | null>;

export class MessageRouter {
  private rules: Map<ActionType, MessageHandler> = new Map();
  private defaultHandler?: MessageHandler;
  private registry: AgentRegistry;

  constructor(registry?: AgentRegistry) {
    this.registry = registry || agentRegistry;
  }

  registerHandler(actionType: ActionType, handler: MessageHandler): void {
    this.rules.set(actionType, handler);
  }

  setDefaultHandler(handler: MessageHandler): void {
    this.defaultHandler = handler;
  }

  async route(message: A2AMessage): Promise<A2AMessage | null> {
    const handler = this.rules.get(message.action.type);
    if (handler) {
      return await handler(message);
    }
    if (this.defaultHandler) {
      return await this.defaultHandler(message);
    }
    return null;
  }

  async routeToAgent(message: A2AMessage, targetAgentId: string): Promise<boolean> {
    const targetAgent = this.registry.getAgent(targetAgentId);
    if (!targetAgent || !targetAgent.endpoint) {
      return false;
    }
    try {
      const response = await fetch(targetAgent.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  broadcast(message: A2AMessage, capabilityFilter?: string): number {
    const agents = capabilityFilter
      ? this.registry.findAgentsByCapability(capabilityFilter as any)
      : this.registry.getAllAgents();

    let successCount = 0;
    for (const agent of agents) {
      if (agent.agentId !== message.sender.agentId && agent.endpoint) {
        fetch(agent.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...message,
            receiver: agent,
          }),
        }).then(res => {
          if (res.ok) successCount++;
        });
      }
    }
    return successCount;
  }
}

export const messageRouter = new MessageRouter();
