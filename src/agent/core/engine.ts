import { AgentLifecycle, AgentConfig, AgentState } from './lifecycle';
import { taskScheduler, TaskScheduler } from './scheduler';
import { eventBus, EventBus } from './events';
import { AgentInfo, AgentCapability, createA2AMessage, A2AMessage } from '../../protocol/a2a/message';
import { agentRegistry } from '../../protocol/a2a/registry';
import { profileClient } from '../../api/secondme';
import { memoryClient } from '../../api/secondme';

export class PersonalAgentEngine {
  private lifecycle: AgentLifecycle;
  private scheduler: TaskScheduler;
  private eventBus: EventBus;
  private agentInfo: AgentInfo;

  constructor(config: AgentConfig) {
    this.lifecycle = new AgentLifecycle(config);
    this.scheduler = new TaskScheduler();
    this.eventBus = EventBus.getInstance();
    this.agentInfo = {
      agentId: config.agentId,
      capabilities: config.capabilities,
      name: config.name,
      description: config.description,
      endpoint: config.endpoint,
    };
  }

  async start(): Promise<void> {
    await this.lifecycle.initialize();
    this.setupTaskHandlers();
    this.setupEventListeners();
    await this.lifecycle.setReady();
    await this.eventBus.emitAsync('agent:started', { agentId: this.lifecycle.getAgentId() }, this.lifecycle.getAgentId());
  }

  async stop(): Promise<void> {
    await this.lifecycle.shutdown();
    this.scheduler.clear();
    await this.eventBus.emitAsync('agent:stopped', { agentId: this.lifecycle.getAgentId() }, this.lifecycle.getAgentId());
  }

  getState(): AgentState {
    return this.lifecycle.getState();
  }

  getAgentId(): string {
    return this.lifecycle.getAgentId();
  }

  getAgentInfo(): AgentInfo {
    return this.agentInfo;
  }

  onStateChange(callback: (state: AgentState) => void): void {
    this.lifecycle.onStateChange('ready', callback);
    this.lifecycle.onStateChange('working', callback);
    this.lifecycle.onStateChange('error', callback);
  }

  private setupTaskHandlers(): void {
    this.scheduler.registerHandler('sync_profile', async (task) => {
      const profile = await profileClient.getProfile();
      await this.eventBus.emitAsync('profile:synced', profile, this.getAgentId());
    });

    this.scheduler.registerHandler('store_memory', async (task) => {
      const { content } = task.data as { content: string };
      const memory = await memoryClient.createMemory({ content, visibility: 1 });
      await this.eventBus.emitAsync('memory:stored', memory, this.getAgentId());
    });

    this.scheduler.registerHandler('match_users', async (task) => {
      await this.eventBus.emitAsync('match:started', task.data, this.getAgentId());
    });
  }

  private setupEventListeners(): void {
    this.eventBus.subscribe('match:completed', async (event) => {
      await this.lifecycle.setWorking();
    });
  }

  async scheduleTask(type: string, data: unknown, priority?: number): Promise<string> {
    return this.scheduler.addTask(type, data, priority || 0);
  }

  async handleIncomingMessage(message: A2AMessage): Promise<A2AMessage> {
    if (message.action.type === 'discover') {
      const matchingAgents = agentRegistry.findAgentsByCapability('matching');
      return createA2AMessage(
        this.agentInfo,
        'response',
        { type: 'discover', parameters: {} },
        { agents: matchingAgents },
        message.sender
      );
    }
    if (message.action.type === 'profile_exchange') {
      const profile = await profileClient.getProfile().catch(() => null);
      return createA2AMessage(
        this.agentInfo,
        'response',
        { type: 'profile_exchange', parameters: {} },
        { profile },
        message.sender
      );
    }
    return createA2AMessage(
      this.agentInfo,
      'response',
      { type: 'message', parameters: {} },
      { message: 'Action not handled' },
      message.sender
    );
  }
}
