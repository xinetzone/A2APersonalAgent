import { Space, SpaceType, SpaceMessage } from './types';
import { SpaceEngine } from './engine';
import {
  RoundTableSession,
  RoundTableDiscussion,
  AgentType,
  RoundTableSpace as RoundTableSpaceType,
  CreateRoundTableParams,
} from '../moral-life/types';
import { createRoundTableSession, getAgentDefinitions, AGENT_DEFINITIONS } from '../moral-life/roundtable';

export class RoundTableSpaceManager {
  private spaceEngine: SpaceEngine;
  private sessions: Map<string, RoundTableSession> = new Map();

  constructor(spaceEngine: SpaceEngine) {
    this.spaceEngine = spaceEngine;
  }

  async createRoundTableSpace(params: CreateRoundTableParams): Promise<RoundTableSpaceType> {
    const space = await this.spaceEngine.createSpace({
      type: 'dao-space',
      name: params.dilemma.slice(0, 50) || '道德圆桌',
      description: `围绕「${params.dilemma}」展开的多方讨论`,
      hostAgentId: params.hostAgentId,
      hostUserId: params.hostUserId,
      maxParticipants: params.agents?.length || 5,
      metadata: {
        roundTableId: undefined,
        topicId: params.topicId,
      },
    });

    const agents = params.agents || ['daoist', 'confucian', 'philosopher', 'scenario'];

    const roundTableSession = createRoundTableSession({
      dilemma: params.dilemma,
      agents,
      focus: params.focus,
    });

    this.sessions.set(space.id, roundTableSession);

    await this.spaceEngine.sendMessage(space.id, {
      agentId: 'system',
      userId: 'system',
      userName: '系统',
      content: `圆桌讨论开始：「${params.dilemma}」`,
      type: 'system',
    });

    for (const discussion of roundTableSession.discussion) {
      await this.spaceEngine.sendMessage(space.id, {
        agentId: 'system',
        userId: discussion.agent,
        userName: '系统',
        content: `${discussion.agentName}：${discussion.response}`,
        type: 'system',
      });
    }

    if (roundTableSession.conclusion) {
      await this.spaceEngine.sendMessage(space.id, {
        agentId: 'system',
        userId: 'system',
        userName: '系统',
        content: `【综合建议】\n${roundTableSession.conclusion}`,
        type: 'system',
      });
    }

    return {
      ...space,
      type: 'dao-space' as SpaceType,
      metadata: {
        ...space.metadata,
        roundTableId: roundTableSession.id,
        topicId: params.topicId,
      },
    } as RoundTableSpaceType;
  }

  async joinRoundTableSpace(
    spaceId: string,
    agentId: string,
    userId: string,
    userName: string,
    perspective?: string
  ): Promise<void> {
    await this.spaceEngine.joinSpace(spaceId, agentId, userId, userName);

    if (perspective) {
      await this.spaceEngine.sendMessage(spaceId, {
        agentId,
        userId,
        userName,
        content: perspective,
        type: 'text',
      });

      const session = this.sessions.get(spaceId);
      if (session) {
        session.discussion.push({
          agent: 'participant' as AgentType,
          agentName: userName,
          response: perspective,
          keyQuote: this.extractKeyQuote(perspective),
          timestamp: Date.now(),
        });
      }
    }
  }

  private extractKeyQuote(text: string): string {
    const quotes = text.match(/「([^」]+)」/g);
    if (quotes && quotes.length > 0) {
      return quotes[0].slice(1, -1);
    }
    const boldMatch = text.match(/\*\*([^*]+)\*\*/);
    if (boldMatch) {
      return boldMatch[1].slice(0, 20);
    }
    return text.slice(0, 20) + (text.length > 20 ? '...' : '');
  }

  async advanceRound(spaceId: string): Promise<RoundTableSession | null> {
    const session = this.sessions.get(spaceId);
    if (!session) return null;

    const maxRounds = 3;
    const currentRound = Math.floor(session.discussion.length / 4);

    if (currentRound >= maxRounds) {
      return this.concludeDiscussion(spaceId);
    }

    await this.spaceEngine.sendMessage(spaceId, {
      agentId: 'system',
      userId: 'system',
      userName: '系统',
      content: `第 ${currentRound + 1} 轮讨论开始，请各位智者继续发表观点...`,
      type: 'system',
    });

    return session;
  }

  async concludeDiscussion(spaceId: string): Promise<RoundTableSession | null> {
    const session = this.sessions.get(spaceId);
    if (!session) return null;

    const conclusion = this.generateSynthesis(session);

    await this.spaceEngine.sendMessage(spaceId, {
      agentId: 'system',
      userId: 'system',
      userName: '系统',
      content: `【讨论总结】\n${conclusion}`,
      type: 'system',
    });

    await this.spaceEngine.setTopic(spaceId, '讨论已结束');

    return {
      ...session,
      conclusion,
    };
  }

  private generateSynthesis(session: RoundTableSession): string {
    const keyInsights = session.discussion
      .map((d) => d.keyQuote)
      .filter(Boolean);
    const uniqueInsights = [...new Set(keyInsights)].slice(0, 3);

    let synthesis = '综合各方智慧，面对这个困境的建议如下：\n\n';

    synthesis += '1. **道家视角**：上善若水，以柔克刚。不争并非退缩，而是找到最自然的解决之道。\n';
    synthesis += '2. **儒家视角**：君子和而不同。在坚持原则的同时，也要顾及和谐的关系。\n';
    synthesis += '3. **实践智慧**：知行合一。再好的道理，也需要结合实际情况灵活运用。\n\n';

    synthesis += `关键智慧：${uniqueInsights.join('、')}\n\n`;
    synthesis += '记住：没有标准答案，只有适合你的选择。';

    return synthesis;
  }

  async submitPerspective(
    spaceId: string,
    agentId: string,
    userId: string,
    userName: string,
    perspective: string
  ): Promise<void> {
    await this.spaceEngine.sendMessage(spaceId, {
      agentId,
      userId,
      userName,
      content: perspective,
      type: 'text',
    });

    const session = this.sessions.get(spaceId);
    if (session) {
      session.discussion.push({
        agent: 'participant',
        agentName: userName,
        response: perspective,
        keyQuote: this.extractKeyQuote(perspective),
        timestamp: Date.now(),
      });
    }
  }

  async generateSynthesisForSpace(spaceId: string): Promise<string | null> {
    const session = this.sessions.get(spaceId);
    if (!session) return null;

    return this.generateSynthesis(session);
  }

  getSession(spaceId: string): RoundTableSession | undefined {
    return this.sessions.get(spaceId);
  }

  getAgentDefinitionsForSpace(): typeof AGENT_DEFINITIONS {
    return getAgentDefinitions();
  }

  createNewSession(params: {
    dilemma: string;
    agents?: AgentType[];
    focus?: string;
  }): RoundTableSession {
    return createRoundTableSession(params);
  }

  async closeSpace(spaceId: string): Promise<void> {
    await this.concludeDiscussion(spaceId);
    await this.spaceEngine.closeSpace(spaceId);
    this.sessions.delete(spaceId);
  }
}

let roundTableSpaceManagerInstance: RoundTableSpaceManager | null = null;

export function getRoundTableSpaceManager(spaceEngine?: SpaceEngine): RoundTableSpaceManager {
  if (!roundTableSpaceManagerInstance) {
    const engine = spaceEngine || (() => {
      const engineFn = require('./engine');
      return engineFn.getSpaceEngine();
    })();
    roundTableSpaceManagerInstance = new RoundTableSpaceManager(engine);
  }
  return roundTableSpaceManagerInstance;
}

export function resetRoundTableSpaceManager(): void {
  roundTableSpaceManagerInstance = null;
}
