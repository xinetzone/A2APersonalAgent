import { getSpaceEngine } from '../../space/engine';
import { getPresenceManager } from '../../space/presence';
import { getRelationshipGraph } from '../../space/relationship';
import { getConnectionTrigger } from '../../space/trigger';

export interface SpaceToolArgument {
  spaceId?: string;
  type?: 'dao-space' | 'market' | 'lounge';
  name?: string;
  description?: string;
  hostAgentId?: string;
  hostUserId?: string;
  hostName?: string;
  agentId?: string;
  userId?: string;
  userName?: string;
  content?: string;
  limit?: number;
  topicId?: string;
  targetAgentId?: string;
  targetUserId?: string;
  targetUserName?: string;
  matchScore?: number;
  sharedTopics?: string[];
  ttlHours?: number;
}

export function getSpaceTools() {
  return [
    {
      name: 'space_create',
      description: '创建一个新的第三空间（圆桌、市集或休闲大厅）',
      inputSchema: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['dao-space', 'market', 'lounge'],
            description: '空间类型：dao-space=道德圆桌, market=道德市集, lounge=休闲大厅'
          },
          name: { type: 'string', description: '空间名称' },
          description: { type: 'string', description: '空间描述（可选）' },
          hostAgentId: { type: 'string', description: '主持人 Agent ID' },
          hostUserId: { type: 'string', description: '主持人用户 ID' },
          hostName: { type: 'string', description: '主持人用户名（可选）' },
          maxParticipants: { type: 'number', description: '最大参与人数，默认20' },
        },
        required: ['type', 'name', 'hostAgentId', 'hostUserId'],
      },
    },
    {
      name: 'space_list',
      description: '列出当前可加入的空间',
      inputSchema: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['dao-space', 'market', 'lounge'],
            description: '按类型筛选（可选）'
          },
          status: {
            type: 'string',
            enum: ['active', 'idle'],
            description: '按状态筛选（可选）'
          },
          limit: { type: 'number', description: '返回数量，默认20' },
        },
      },
    },
    {
      name: 'space_get',
      description: '获取指定空间的详细信息',
      inputSchema: {
        type: 'object',
        properties: {
          spaceId: { type: 'string', description: '空间 ID' },
        },
        required: ['spaceId'],
      },
    },
    {
      name: 'space_join',
      description: '加入一个第三空间',
      inputSchema: {
        type: 'object',
        properties: {
          spaceId: { type: 'string', description: '空间 ID' },
          agentId: { type: 'string', description: 'Agent ID' },
          userId: { type: 'string', description: '用户 ID' },
          userName: { type: 'string', description: '用户名（可选）' },
        },
        required: ['spaceId', 'agentId', 'userId'],
      },
    },
    {
      name: 'space_leave',
      description: '离开当前所在空间',
      inputSchema: {
        type: 'object',
        properties: {
          spaceId: { type: 'string', description: '空间 ID' },
          agentId: { type: 'string', description: 'Agent ID' },
          reason: { type: 'string', description: '离开原因（可选）' },
        },
        required: ['spaceId', 'agentId'],
      },
    },
    {
      name: 'space_send_message',
      description: '在空间中发送消息',
      inputSchema: {
        type: 'object',
        properties: {
          spaceId: { type: 'string', description: '空间 ID' },
          agentId: { type: 'string', description: 'Agent ID' },
          userId: { type: 'string', description: '用户 ID' },
          userName: { type: 'string', description: '用户名（可选）' },
          content: { type: 'string', description: '消息内容' },
          type: {
            type: 'string',
            enum: ['text', 'action'],
            description: '消息类型，默认text'
          },
        },
        required: ['spaceId', 'agentId', 'userId', 'content'],
      },
    },
    {
      name: 'space_get_messages',
      description: '获取空间中的最新消息',
      inputSchema: {
        type: 'object',
        properties: {
          spaceId: { type: 'string', description: '空间 ID' },
          limit: { type: 'number', description: '返回消息数量，默认50' },
          before: { type: 'number', description: '获取此时间戳之前的消息（可选）' },
        },
        required: ['spaceId'],
      },
    },
    {
      name: 'space_set_topic',
      description: '设置空间当前话题（关联知乎热榜话题）',
      inputSchema: {
        type: 'object',
        properties: {
          spaceId: { type: 'string', description: '空间 ID' },
          topic: { type: 'string', description: '话题内容' },
          topicId: { type: 'string', description: '知乎话题 ID（可选）' },
        },
        required: ['spaceId', 'topic'],
      },
    },
    {
      name: 'space_get_participants',
      description: '获取空间参与者列表',
      inputSchema: {
        type: 'object',
        properties: {
          spaceId: { type: 'string', description: '空间 ID' },
        },
        required: ['spaceId'],
      },
    },
    {
      name: 'connection_find_matches',
      description: '发现可能感兴趣连接的其他用户（基于关系图谱）',
      inputSchema: {
        type: 'object',
        properties: {
          agentId: { type: 'string', description: '当前 Agent ID' },
          userId: { type: 'string', description: '当前用户 ID' },
          limit: { type: 'number', description: '返回数量，默认5' },
        },
        required: ['agentId', 'userId'],
      },
    },
    {
      name: 'connection_accept',
      description: '接受一个连接邀请',
      inputSchema: {
        type: 'object',
        properties: {
          connectionId: { type: 'string', description: '连接 ID' },
        },
        required: ['connectionId'],
      },
    },
    {
      name: 'connection_reject',
      description: '拒绝一个连接邀请',
      inputSchema: {
        type: 'object',
        properties: {
          connectionId: { type: 'string', description: '连接 ID' },
          reason: { type: 'string', description: '拒绝原因（可选）' },
        },
        required: ['connectionId'],
      },
    },
    {
      name: 'connection_get_pending',
      description: '获取待处理的连接邀请',
      inputSchema: {
        type: 'object',
        properties: {
          userId: { type: 'string', description: '用户 ID' },
        },
        required: ['userId'],
      },
    },
    {
      name: 'relationship_get',
      description: '获取与指定用户的关系信息',
      inputSchema: {
        type: 'object',
        properties: {
          sourceAgentId: { type: 'string', description: '源 Agent ID' },
          targetAgentId: { type: 'string', description: '目标 Agent ID' },
        },
        required: ['sourceAgentId', 'targetAgentId'],
      },
    },
    {
      name: 'relationship_list',
      description: '获取用户的所有关系列表',
      inputSchema: {
        type: 'object',
        properties: {
          agentId: { type: 'string', description: 'Agent ID' },
          type: {
            type: 'string',
            enum: ['met', 'discussed', 'collaborated', 'conflicted', 'recommended'],
            description: '按关系类型筛选（可选）'
          },
          minStrength: {
            type: 'string',
            enum: ['weak', 'medium', 'strong', 'deep'],
            description: '最小关系强度（可选）'
          },
          limit: { type: 'number', description: '返回数量，默认20' },
        },
        required: ['agentId'],
      },
    },
  ];
}

export async function handleSpaceToolCall(
  toolName: string,
  args: Record<string, unknown>
): Promise<unknown> {
  const spaceEngine = getSpaceEngine();
  const presenceManager = getPresenceManager();
  const relationshipGraph = getRelationshipGraph();
  const connectionTrigger = getConnectionTrigger(relationshipGraph);

  switch (toolName) {
    case 'space_create': {
      return await spaceEngine.createSpace({
        type: args.type as 'dao-space' | 'market' | 'lounge',
        name: args.name as string,
        description: args.description as string,
        hostAgentId: args.hostAgentId as string,
        hostUserId: args.hostUserId as string,
        hostName: args.hostName as string,
        maxParticipants: args.maxParticipants as number,
      });
    }

    case 'space_list': {
      return await spaceEngine.listSpaces({
        type: args.type as any,
        status: args.status as any,
      });
    }

    case 'space_get': {
      return await spaceEngine.getSpace(args.spaceId as string);
    }

    case 'space_join': {
      const space = await spaceEngine.getSpace(args.spaceId as string);
      if (!space) {
        throw new Error('Space not found');
      }
      await presenceManager.setStatus(args.agentId as string, args.userId as string, 'online');
      const participant = await spaceEngine.joinSpace(
        args.spaceId as string,
        args.agentId as string,
        args.userId as string,
        args.userName as string
      );
      await presenceManager.enterSpace(args.agentId as string, args.spaceId as string, space.type);
      await relationshipGraph.createRelation({
        sourceAgentId: space.hostAgentId,
        targetAgentId: args.agentId as string,
        type: 'met',
        sharedTopics: space.currentTopic ? [space.currentTopic] : [],
        initialScore: 20,
        metadata: { spaceId: args.spaceId },
      });
      return participant;
    }

    case 'space_leave': {
      await spaceEngine.leaveSpace(args.spaceId as string, args.agentId as string, args.reason as string);
      await presenceManager.leaveSpace(args.agentId as string);
      return { success: true };
    }

    case 'space_send_message': {
      const space = await spaceEngine.getSpace(args.spaceId as string);
      if (!space) {
        throw new Error('Space not found');
      }
      const message = await spaceEngine.sendMessage(args.spaceId as string, {
        agentId: args.agentId as string,
        userId: args.userId as string,
        userName: args.userName as string || args.userId as string,
        content: args.content as string,
        type: args.type as 'text' | 'action' | undefined,
      });

      const participants = space.participants.filter(p => p.agentId !== args.agentId);
      for (const p of participants) {
        await relationshipGraph.createRelation({
          sourceAgentId: args.agentId as string,
          targetAgentId: p.agentId,
          type: 'discussed',
          sharedTopics: space.currentTopic ? [space.currentTopic] : [],
          metadata: { spaceId: args.spaceId, messageId: message.id },
        });
      }

      return message;
    }

    case 'space_get_messages': {
      return await spaceEngine.getMessages(args.spaceId as string, {
        limit: args.limit as number,
        before: args.before as number,
      });
    }

    case 'space_set_topic': {
      await spaceEngine.setTopic(args.spaceId as string, args.topic as string, args.topicId as string);
      return { success: true };
    }

    case 'space_get_participants': {
      return await spaceEngine.getParticipants(args.spaceId as string);
    }

    case 'connection_find_matches': {
      const recommendations = await relationshipGraph.findSimilarAgents(args.agentId as string, args.limit as number);
      return recommendations;
    }

    case 'connection_accept': {
      await connectionTrigger.acceptConnection(args.connectionId as string);
      return { success: true };
    }

    case 'connection_reject': {
      await connectionTrigger.rejectConnection(args.connectionId as string, args.reason as string);
      return { success: true };
    }

    case 'connection_get_pending': {
      return await connectionTrigger.getPendingConnections(args.userId as string);
    }

    case 'relationship_get': {
      return await relationshipGraph.getRelation(args.sourceAgentId as string, args.targetAgentId as string);
    }

    case 'relationship_list': {
      return await relationshipGraph.getAgentRelations(args.agentId as string, {
        type: args.type as any,
        minStrength: args.minStrength as any,
      });
    }

    default:
      throw new Error(`Unknown space tool: ${toolName}`);
  }
}
