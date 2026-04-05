import { AgentInfo, AgentCapability } from '../../protocol/a2a/message';
import { agentRegistry } from '../../protocol/a2a/registry';

export type AgentState = 'initialized' | 'authenticating' | 'ready' | 'working' | 'error' | 'shutdown';

export interface AgentConfig {
  agentId: string;
  name: string;
  description?: string;
  capabilities: AgentCapability[];
  endpoint?: string;
}

export interface AgentContext {
  config: AgentConfig;
  state: AgentState;
  error?: Error;
  startTime?: Date;
}

export class AgentLifecycle {
  private context: AgentContext;
  private stateListeners: Map<AgentState, ((state: AgentState) => void)[]> = new Map();

  constructor(config: AgentConfig) {
    this.context = {
      config,
      state: 'initialized',
    };
  }

  async initialize(): Promise<void> {
    this.transitionTo('initialized');
    const agentInfo: AgentInfo = {
      agentId: this.context.config.agentId,
      capabilities: this.context.config.capabilities,
      name: this.context.config.name,
      description: this.context.config.description,
      endpoint: this.context.config.endpoint,
    };
    agentRegistry.register(agentInfo);
    this.context.startTime = new Date();
  }

  async authenticate(): Promise<void> {
    this.transitionTo('authenticating');
  }

  async setReady(): Promise<void> {
    this.transitionTo('ready');
  }

  async setWorking(): Promise<void> {
    this.transitionTo('working');
  }

  async setError(error: Error): Promise<void> {
    this.context.error = error;
    this.transitionTo('error');
  }

  async shutdown(): Promise<void> {
    agentRegistry.unregister(this.context.config.agentId);
    this.transitionTo('shutdown');
  }

  private transitionTo(newState: AgentState): void {
    const oldState = this.context.state;
    this.context.state = newState;
    const listeners = this.stateListeners.get(newState);
    if (listeners) {
      listeners.forEach(listener => listener(newState));
    }
  }

  getState(): AgentState {
    return this.context.state;
  }

  getContext(): AgentContext {
    return { ...this.context };
  }

  getAgentId(): string {
    return this.context.config.agentId;
  }

  onStateChange(state: AgentState, listener: (state: AgentState) => void): void {
    const listeners = this.stateListeners.get(state) || [];
    listeners.push(listener);
    this.stateListeners.set(state, listeners);
  }
}
