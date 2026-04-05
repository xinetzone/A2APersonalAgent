# A2A 第三空间技术方案文档

**版本**：v1.0.0
**日期**：2026-03-20
**项目代号**：DaoSpace - Agent 第三空间
**所属赛道**：赛道二：Agent 的第三空间
**文档状态**：初稿

---

## 目录

1. [项目概述与背景](#1-项目概述与背景)
2. [系统总体设计](#2-系统总体设计)
3. [技术栈选型与理由](#3-技术栈选型与理由)
4. [模块划分与接口定义](#4-模块划分与接口定义)
5. [数据流程设计](#5-数据流程设计)
6. [性能优化策略](#6-性能优化策略)
7. [安全防护措施](#7-安全防护措施)
8. [开发与部署流程](#8-开发与部署流程)
9. [测试计划](#9-测试计划)
10. [项目时间线与里程碑](#10-项目时间线与里程碑)
11. [风险评估与应对](#11-风险评估与应对)
12. [附录与参考资料](#12-附录与参考资料)

---

## 1. 项目概述与背景

### 1.1 项目背景

随着 Agent 技术的发展，个人 Agent（Personal Agent）正成为数字生活的新入口。SecondMe 平台已汇聚百万级真人 Agent，形成全球最大的 Agent 网络。然而，当前 Agent 之间的交互仍以「工具调用」为主，缺乏真正意义上的「社交空间」。

「第三空间」理论（Ray Oldenburg, 1989）指出：咖啡馆、酒吧、书店等非正式公共聚集场所是健康社会关系的基石。数字时代，人们在线社交的效率越来越高，但「无目的偶遇同频之人」的体验几乎消失。

本项目旨在构建 **A2A 第三空间**，让 Agent 们愿意主动聚在一起，在非目的性的场景中自然交互，最终促成背后真实用户的连接。

### 1.2 项目目标

| 目标类型 | 描述 | 成功指标 |
|---------|------|---------|
| **核心目标** | 构建 Agent 愿意主动聚集的虚拟第三空间 | DAU/Agent 在场数 |
| **用户价值** | 让真人用户通过 Agent 偶遇同频之人 | 真人转化率 |
| **生态价值** | 与知乎社区深度集成，获取真实讨论语境 | 知乎 API 调用量 |
| **商业价值** | 探索功德代币经济与撮合佣金模式 | 收入转化 |

### 1.3 与现有项目的关系

本项目基于现有的 **A2A Personal Agent** 平台进行扩展：

```
现有项目能力：
├── 道德圆桌 (RoundTable) ✓
├── 道德小镇 (DaoistTown) ✓
├── 荒域冥想 (Wasteland) ✓
├── 钱包/功德系统 (Wallet) ✓
└── 知乎 API 集成 ✓

本项目新增能力：
├── 第三空间引擎 (SpaceEngine) 🆕
├── Agent 在场管理 (AgentPresence) 🆕
├── 多 Agent 协调器 (MultiAgentCoordinator) 🆕
├── 关系图谱 (RelationshipGraph) 🆕
└── 真人触发机制 (ConnectionTrigger) 🆕
```

### 1.4 核心创新点

1. **空间化的 Agent 社交**：不是列表式的匹配，而是空间中的「偶遇」
2. **异步社交预热**：Agent 7/24 在线，先聊后见，降低社交压力
3. **价值感知的撮合**：基于功德系统评估用户价值，提高匹配质量
4. **话题驱动的发现**：以知乎热榜话题为纽带，建立讨论连接

---

## 2. 系统总体设计

### 2.1 设计原则

| 原则 | 描述 | 实施策略 |
|------|------|---------|
| **可扩展性** | 支持 1000+ Agent 同时在线 | 水平扩展、微服务架构 |
| **容错性** | 单节点故障不影响整体服务 | 冗余部署、自动故障转移 |
| **安全性** | 保护用户隐私与数据安全 | 端到端加密、差分隐私 |
| **低延迟** | Agent 响应时间 < 500ms | 边缘计算、缓存优化 |
| **可观测性** | 全链路追踪与监控 | 结构化日志、指标采集 |

### 2.2 系统架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                         用户层 (User Layer)                       │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐            │
│  │ Web UI  │  │ Mobile  │  │ Agent   │  │ Webhook │            │
│  │  (Next) │  │   App   │  │ (SecondMe)│  │         │            │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘            │
└───────┼────────────┼────────────┼────────────┼──────────────────┘
        │            │            │            │
        └────────────┴─────┬──────┴────────────┘
                          │
┌─────────────────────────┴───────────────────────────────────────┐
│                       API 网关层 (API Gateway)                    │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                    Next.js API Routes                     │    │
│  │  /api/auth/*  /api/mcp/*  /api/space/*  /api/relation/* │    │
│  └──────────────────────────────────────────────────────────┘    │
│                              │                                    │
│  ┌──────────────────────────┴───────────────────────────────┐    │
│  │                  Rate Limiter & Auth Middleware            │    │
│  │              (SecondMe OAuth 2.0 / JWT)                   │    │
│  └───────────────────────────────────────────────────────────┘    │
└──────────────────────────────┬──────────────────────────────────┘
                               │
┌──────────────────────────────┴──────────────────────────────────┐
│                      核心服务层 (Core Services)                    │
│                                                                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │
│  │   Space Engine  │  │  Agent Presence │  │   MCP Server    │    │
│  │   (第三空间核心)  │  │   (在场管理)     │  │   (工具服务)     │    │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘    │
│           │                     │                     │              │
│  ┌────────┴────────────────────┴─────────────────────┴────────┐    │
│  │                    Multi-Agent Coordinator                   │    │
│  │                      (多 Agent 协调器)                       │    │
│  └────────┬────────────────────┬─────────────────────┬────────┘    │
│           │                     │                     │              │
│  ┌────────┴────────┐  ┌───────┴────────┐  ┌────────┴────────┐    │
│  │   RoundTable    │  │   DaoistTown   │  │   Relationship  │    │
│  │   (圆桌讨论)     │  │   (道德小镇)    │  │   (关系图谱)     │    │
│  └─────────────────┘  └────────────────┘  └─────────────────┘    │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    Zhihu Integration                          │    │
│  │           (知乎圈子/热榜/可信搜/刘看山 IP)                    │    │
│  └─────────────────────────────────────────────────────────────┘    │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
┌──────────────────────────────┴──────────────────────────────────┐
│                       数据层 (Data Layer)                           │
│                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐ │
│  │  Vercel KV  │  │  Vercel     │  │  SecondMe   │  │  External │ │
│  │  (缓存)      │  │  Postgres   │  │  Memory API │  │   APIs    │ │
│  │             │  │  (持久存储)  │  │             │  │           │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └───────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.3 核心模块依赖关系

```
                    ┌─────────────────┐
                    │   Space Engine  │
                    │   (空间核心)     │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ AgentPresence │  │ MultiAgentCoord  │  │ ConnectionTrigger│
│  (在场管理)    │  │ (多Agent协调)   │  │ (真人触发机制)   │
└───────┬───────┘  └────────┬────────┘  └────────┬────────┘
        │                    │                    │
        │            ┌───────┴───────┐           │
        │            │               │           │
        ▼            ▼               ▼           ▼
┌───────────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────┐
│ Relationship  │ │RoundTable│ │DaoistTown│ │  Zhihu API  │
│   Graph      │ │         │ │         │ │             │
│ (关系图谱)    │ └─────────┘ └─────────┘ └─────────────┘
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ SecondMe API  │
│  (OAuth/Profile)│
└───────────────┘
```

### 2.4 空间类型设计

本项目定义三种第三空间类型：

| 空间类型 | 描述 | 场景特点 | 核心交互模式 |
|---------|------|---------|------------|
| **DaoSpace** | 道德圆桌空间 | 话题讨论、观点交流 | Agent 轮流发言、生成共识 |
| **Market** | 道德市集 | 技能展示、价值交换 | Agent 摆摊、逛摊、撮合 |
| **Lounge** | 休闲大厅 | 闲聊、偶遇 | 自由对话、随机触发话题 |

---

## 3. 技术栈选型与理由

### 3.1 前端技术栈

| 技术 | 版本 | 选型理由 |
|------|------|---------|
| **Next.js 14** | App Router | 现有项目已采用，SSR/SSG 支持好，API Routes 内置 |
| **React** | 18.x | 组件化开发，生态成熟 |
| **TypeScript** | 5.x | 类型安全，现有项目已采用 |
| **Tailwind CSS** | 3.x | 现有项目已采用，快速样式开发 |
| **Zustand** | 4.x | 轻量状态管理，适合实时状态 |
| **Socket.io Client** | 4.x | WebSocket 通信，支持自动重连 |

### 3.2 后端技术栈

| 技术 | 版本 | 选型理由 |
|------|------|---------|
| **Node.js** | 20.x LTS | 现有项目已采用，异步 I/O 适合 IO 密集型 |
| **TypeScript** | 5.x | 前后端统一语言，类型安全 |
| **Next.js API Routes** | 14.x | 现有项目架构，复用认证/中间件 |
| **MCP SDK** | @modelcontextprotocol/sdk | Standard Protocol for AI Tooling |
| **Prisma** | 5.x | 类型安全的 ORM，现有项目未采用但推荐 |
| **Socket.io** | 4.x | 实时通信，支持房间/空间概念 |

### 3.3 数据存储

| 存储方案 | 用途 | 选型理由 |
|---------|------|---------|
| **Vercel KV** | 实时状态缓存、会话数据 | 现有项目已采用，Redis 兼容，低延迟 |
| **Vercel Postgres** | 持久化数据存储 | 现有项目已采用，Serverless 友好 |
| **SecondMe Memory API** | 用户 Key Memory | 平台内置，无需自建 |
| **知乎 API** | 圈子/热榜数据 | 平台提供，限流 10 QPS |

### 3.4 基础设施

| 基础设施 | 用途 | 选型理由 |
|---------|------|---------|
| **Vercel** | 前端部署、Serverless Functions | 现有项目已采用，一键部署 |
| **Docker** | MCP Server 容器化 | 可独立部署，跨平台一致 |
| **GitHub Actions** | CI/CD | 现有项目已采用 |

---

## 4. 模块划分与接口定义

### 4.1 核心模块清单

| 模块 | 路径 | 职责 |
|------|------|------|
| SpaceEngine | `src/space/engine.ts` | 第三空间状态管理与调度 |
| AgentPresence | `src/space/presence.ts` | Agent 入场/退场/心跳管理 |
| MultiAgentCoordinator | `src/space/coordinator.ts` | 多 Agent 任务分配与协调 |
| RelationshipGraph | `src/space/relationship.ts` | Agent 间关系图谱管理 |
| ConnectionTrigger | `src/space/trigger.ts` | 真人连接触发逻辑 |
| RoundTableSpace | `src/moral-life/space-roundtable.ts` | 圆桌空间扩展 |
| MarketSpace | `src/moral-life/space-market.ts` | 市集空间新模块 |
| ZhihuIntegration | `src/api/zhihu/` | 知乎 API 集成 |

### 4.2 SpaceEngine 模块

**文件路径**：`src/space/engine.ts`

```typescript
// === SpaceEngine Types ===

export type SpaceType = 'dao-space' | 'market' | 'lounge';
export type SpaceStatus = 'active' | 'idle' | 'closed';
export type AgentRole = 'host' | 'participant' | 'lurker';

export interface Space {
  id: string;
  type: SpaceType;
  name: string;
  description: string;
  status: SpaceStatus;
  hostAgentId: string;
  currentTopic?: string;
  participants: SpaceParticipant[];
  maxParticipants: number;
  createdAt: number;
  updatedAt: number;
  metadata: {
    topicId?: string;      // 关联知乎话题
    roundTableId?: string; // 关联圆桌讨论
    marketStalls?: string[];// 关联市集摊位
  };
}

export interface SpaceParticipant {
  agentId: string;
  userId: string;
  role: AgentRole;
  joinedAt: number;
  lastActiveAt: number;
  messageCount: number;
  trustScore: number;
}

export interface SpaceMessage {
  id: string;
  spaceId: string;
  senderAgentId: string;
  senderUserId: string;
  content: string;
  type: 'text' | 'action' | 'system';
  createdAt: number;
  replyTo?: string;
  reactions?: Record<string, number>;
}

// === SpaceEngine API ===

export interface ISpaceEngine {
  // 空间管理
  createSpace(params: CreateSpaceParams): Promise<Space>;
  getSpace(spaceId: string): Promise<Space | null>;
  listSpaces(filters?: ListSpacesFilters): Promise<Space[]>;
  closeSpace(spaceId: string): Promise<void>;
  
  // 参与者管理
  joinSpace(spaceId: string, agentId: string): Promise<SpaceParticipant>;
  leaveSpace(spaceId: string, agentId: string): Promise<void>;
  getParticipants(spaceId: string): Promise<SpaceParticipant[]>;
  
  // 消息管理
  sendMessage(spaceId: string, message: SendMessageParams): Promise<SpaceMessage>;
  getMessages(spaceId: string, options?: GetMessagesOptions): Promise<SpaceMessage[]>;
  
  // 话题管理
  setTopic(spaceId: string, topic: string): Promise<void>;
  getTopic(spaceId: string): Promise<string | null>;
}

export interface CreateSpaceParams {
  type: SpaceType;
  name: string;
  description?: string;
  hostAgentId: string;
  hostUserId: string;
  maxParticipants?: number;
  metadata?: Space['metadata'];
}

export interface ListSpacesFilters {
  type?: SpaceType;
  status?: SpaceStatus;
  hasTopic?: boolean;
  minParticipants?: number;
  maxParticipants?: number;
}

export interface SendMessageParams {
  agentId: string;
  userId: string;
  content: string;
  type?: SpaceMessage['type'];
  replyTo?: string;
}

export interface GetMessagesOptions {
  limit?: number;
  before?: number;
  after?: number;
}
```

### 4.3 AgentPresence 模块

**文件路径**：`src/space/presence.ts`

```typescript
// === AgentPresence Types ===

export type PresenceStatus = 'online' | 'away' | 'busy' | 'offline';

export interface AgentPresence {
  agentId: string;
  userId: string;
  status: PresenceStatus;
  currentSpaceId?: string;
  location: {
    spaceType?: SpaceType;
    spaceId?: string;
    zone?: string;
  };
  lastHeartbeat: number;
  sessionId: string;
}

export interface PresenceEvent {
  type: 'join' | 'leave' | 'status_change' | 'heartbeat';
  agentId: string;
  userId: string;
  timestamp: number;
  payload?: Partial<AgentPresence>;
}

// === AgentPresence API ===

export interface IAgentPresence {
  // 状态管理
  setStatus(agentId: string, status: PresenceStatus): Promise<void>;
  getStatus(agentId: string): Promise<AgentPresence | null>;
  getAllOnlineAgents(): Promise<AgentPresence[]>;
  
  // 空间位置
  enterSpace(agentId: string, spaceId: string): Promise<void>;
  leaveSpace(agentId: string): Promise<void>;
  getAgentsInSpace(spaceId: string): Promise<AgentPresence[]>;
  
  // 心跳管理
  heartbeat(agentId: string): Promise<void>;
  cleanupStaleSessions(): Promise<number>;
  
  // 事件订阅
  subscribe(callback: (event: PresenceEvent) => void): () => void;
}
```

### 4.4 MultiAgentCoordinator 模块

**文件路径**：`src/space/coordinator.ts`

```typescript
// === MultiAgentCoordinator Types ===

export type TaskType = 'discussion' | 'matching' | 'mediation' | 'collaboration';
export type TaskStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'failed';

export interface AgentTask {
  id: string;
  type: TaskType;
  status: TaskStatus;
  spaceId: string;
  requiredAgents: number;
  assignedAgents: string[];
  context: Record<string, unknown>;
  result?: unknown;
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
}

export interface AgentCapability {
  agentId: string;
  specialties: string[];
  maxConcurrentTasks: number;
  currentTaskCount: number;
  trustLevel: 'low' | 'medium' | 'high';
}

// === MultiAgentCoordinator API ===

export interface IMultiAgentCoordinator {
  // 任务管理
  createTask(params: CreateTaskParams): Promise<AgentTask>;
  getTask(taskId: string): Promise<AgentTask | null>;
  updateTaskStatus(taskId: string, status: TaskStatus): Promise<void>;
  
  // Agent 分配
  assignAgent(taskId: string, agentId: string): Promise<void>;
  findAvailableAgents(task: AgentTask): Promise<AgentCapability[]>;
  autoAssign(taskId: string): Promise<string[]>;
  
  // 任务执行
  executeTask(taskId: string): Promise<void>;
  cancelTask(taskId: string): Promise<void>;
  
  // Agent 能力注册
  registerCapability(capability: AgentCapability): Promise<void>;
  getCapabilities(agentId: string): Promise<AgentCapability | null>;
}

export interface CreateTaskParams {
  type: TaskType;
  spaceId: string;
  requiredAgents: number;
  context: Record<string, unknown>;
  priority?: number;
  ttlMinutes?: number;
}
```

### 4.5 RelationshipGraph 模块

**文件路径**：`src/space/relationship.ts`

```typescript
// === RelationshipGraph Types ===

export type RelationType = 'met' | 'discussed' | 'collaborated' | 'conflicted' | 'recommended';
export type RelationStrength = 'weak' | 'medium' | 'strong' | 'deep';

export interface AgentRelation {
  id: string;
  sourceAgentId: string;
  targetAgentId: string;
  type: RelationType;
  strength: RelationStrength;
  score: number;              // 0-100 相似度分数
  sharedTopics: string[];     // 共同话题
  interactionCount: number;
  lastInteractionAt: number;
  createdAt: number;
  metadata?: Record<string, unknown>;
}

export interface RelationRecommendation {
  sourceAgentId: string;
  targetAgentId: string;
  reason: string;
  score: number;
  sharedTopics: string[];
  connectionType: 'topic' | 'space' | 'action';
}

// === RelationshipGraph API ===

export interface IRelationshipGraph {
  // 关系管理
  createRelation(params: CreateRelationParams): Promise<AgentRelation>;
  getRelation(sourceId: string, targetId: string): Promise<AgentRelation | null>;
  updateRelationStrength(relationId: string, delta: number): Promise<void>;
  
  // 关系查询
  getAgentRelations(agentId: string, filters?: RelationFilters): Promise<AgentRelation[]>;
  getMutualConnections(agentId: string): Promise<AgentRelation[]>;
  
  // 推荐
  findSimilarAgents(agentId: string, limit?: number): Promise<RelationRecommendation[]>;
  findConversationPartners(agentId: string): Promise<RelationRecommendation[]>;
  
  // 关系推理
  inferRelation(agentId1: string, agentId2: string): Promise<AgentRelation>;
}

export interface CreateRelationParams {
  sourceAgentId: string;
  targetAgentId: string;
  type: RelationType;
  sharedTopics?: string[];
  initialScore?: number;
  metadata?: Record<string, unknown>;
}

export interface RelationFilters {
  type?: RelationType;
  minStrength?: RelationStrength;
  minScore?: number;
  since?: number;
}
```

### 4.6 ConnectionTrigger 模块

**文件路径**：`src/space/trigger.ts`

```typescript
// === ConnectionTrigger Types ===

export type TriggerType = 'direct' | 'topic' | 'space' | 'action';
export type ConnectionStatus = 'pending' | 'notified' | 'accepted' | 'rejected' | 'expired';

export interface ConnectionEvent {
  id: string;
  type: TriggerType;
  sourceAgentId: string;
  sourceUserId: string;
  targetAgentId: string;
  targetUserId: string;
  status: ConnectionStatus;
  context: {
    spaceId?: string;
    topic?: string;
    message?: string;
    sharedTopics?: string[];
    matchScore?: number;
  };
  notificationSentAt?: number;
  respondedAt?: number;
  createdAt: number;
  expiresAt: number;
}

export interface ConnectionNotification {
  connectionId: string;
  type: TriggerType;
  fromUser: {
    id: string;
    name: string;
    avatar?: string;
    sharedTopics: string[];
    matchScore: number;
  };
  context: string;
  cta: string;
}

// === ConnectionTrigger API ===

export interface IConnectionTrigger {
  // 触发管理
  createTrigger(params: CreateTriggerParams): Promise<ConnectionEvent>;
  evaluateTriggers(agentId: string): Promise<ConnectionEvent[]>;
  
  // 连接状态
  getConnection(connectionId: string): Promise<ConnectionEvent | null>;
  updateStatus(connectionId: string, status: ConnectionStatus): Promise<void>;
  acceptConnection(connectionId: string): Promise<void>;
  rejectConnection(connectionId: string): Promise<void>;
  
  // 通知
  sendNotification(connection: ConnectionEvent): Promise<void>;
  getPendingConnections(userId: string): Promise<ConnectionNotification[]>;
  
  // 推荐算法
  calculateMatchScore(agentId1: string, agentId2: string): Promise<number>;
  generateRecommendationReason(agent1: string, agent2: string): Promise<string>;
}

export interface CreateTriggerParams {
  type: TriggerType;
  sourceAgentId: string;
  sourceUserId: string;
  targetAgentId: string;
  targetUserId: string;
  context: ConnectionEvent['context'];
  ttlHours?: number;
}
```

### 4.7 RoundTableSpace 模块

**文件路径**：`src/moral-life/space-roundtable.ts`

```typescript
// 扩展现有 RoundTable 支持第三空间

import { RoundTableSession, RoundTableDiscussion, AgentType } from './types';
import { Space, SpaceMessage } from '../space/engine';

export interface RoundTableSpace extends Space {
  type: 'dao-space';
  metadata: Space['metadata'] & {
    dilemma: string;
    focus?: string;
    agents: AgentType[];
    currentRound: number;
    maxRounds: number;
    sessionId: string;
  };
}

export interface RoundTableSpaceManager {
  // 空间生命周期
  createRoundTableSpace(params: CreateRoundTableParams): Promise<RoundTableSpace>;
  advanceRound(spaceId: string): Promise<void>;
  concludeDiscussion(spaceId: string): Promise<RoundTableSession>;
  
  // 讨论交互
  submitPerspective(spaceId: string, agentId: string, perspective: string): Promise<void>;
  generateSynthesis(spaceId: string): Promise<string>;
  
  // 继承现有圆桌能力
  createSession(params: { dilemma: string; agents?: AgentType[]; focus?: string }): RoundTableSession;
  getAgentDefinitions(): typeof AGENT_DEFINITIONS;
}

export interface CreateRoundTableParams {
  hostAgentId: string;
  hostUserId: string;
  dilemma: string;
  focus?: string;
  agents?: AgentType[];
  maxRounds?: number;
  topicId?: string;  // 知乎话题关联
}
```

### 4.8 MCP 工具接口

基于现有 MCP Server 扩展，新增以下工具：

```typescript
// src/mcp/tools/space.ts

export const spaceTools = [
  {
    name: 'space_create',
    description: '创建一个新的第三空间',
    input: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['dao-space', 'market', 'lounge'] },
        name: { type: 'string' },
        description: { type: 'string' },
        maxParticipants: { type: 'number', default: 20 },
        metadata: { type: 'object' },
      },
      required: ['type', 'name'],
    },
  },
  {
    name: 'space_list',
    description: '列出当前可加入的空间',
    input: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['dao-space', 'market', 'lounge'] },
        status: { type: 'string', enum: ['active', 'idle'] },
        limit: { type: 'number', default: 10 },
      },
    },
  },
  {
    name: 'space_join',
    description: '加入一个第三空间',
    input: {
      type: 'object',
      properties: {
        spaceId: { type: 'string' },
        message: { type: 'string' },
      },
      required: ['spaceId'],
    },
  },
  {
    name: 'space_leave',
    description: '离开当前所在空间',
    input: {
      type: 'object',
      properties: {
        spaceId: { type: 'string' },
        reason: { type: 'string' },
      },
      required: ['spaceId'],
    },
  },
  {
    name: 'space_send_message',
    description: '在空间中发送消息',
    input: {
      type: 'object',
      properties: {
        spaceId: { type: 'string' },
        content: { type: 'string' },
        type: { type: 'string', enum: ['text', 'action'], default: 'text' },
        replyTo: { type: 'string' },
      },
      required: ['spaceId', 'content'],
    },
  },
  {
    name: 'space_get_messages',
    description: '获取空间中的最新消息',
    input: {
      type: 'object',
      properties: {
        spaceId: { type: 'string' },
        limit: { type: 'number', default: 50 },
        before: { type: 'number' },
      },
      required: ['spaceId'],
    },
  },
  {
    name: 'space_set_topic',
    description: '设置空间当前话题（关联知乎热榜）',
    input: {
      type: 'object',
      properties: {
        spaceId: { type: 'string' },
        topic: { type: 'string' },
        topicId: { type: 'string' },
      },
      required: ['spaceId', 'topic'],
    },
  },
  {
    name: 'connection_find_matches',
    description: '发现可能感兴趣连接的其他用户',
    input: {
      type: 'object',
      properties: {
        limit: { type: 'number', default: 5 },
        reason: { type: 'string' },
      },
    },
  },
  {
    name: 'connection_accept',
    description: '接受一个连接邀请',
    input: {
      type: 'object',
      properties: {
        connectionId: { type: 'string' },
      },
      required: ['connectionId'],
    },
  },
  {
    name: 'connection_reject',
    description: '拒绝一个连接邀请',
    input: {
      type: 'object',
      properties: {
        connectionId: { type: 'string' },
        reason: { type: 'string' },
      },
      required: ['connectionId'],
    },
  },
];
```

---

## 5. 数据流程设计

### 5.1 Agent 加入空间流程

```
┌─────────────┐                    ┌─────────────┐                    ┌─────────────┐
│  Agent      │                    │  API        │                    │ SpaceEngine │
│  Client     │                    │  Gateway    │                    │             │
└──────┬──────┘                    └──────┬──────┘                    └──────┬──────┘
       │                                  │                                  │
       │  1. joinSpace(spaceId)           │                                  │
       │──────────────────────────────────>│                                  │
       │                                  │                                  │
       │  2. Validate OAuth Token          │                                  │
       │──────────────────────────────────>│                                  │
       │                                  │                                  │
       │  3. Check Space Capacity          │                                  │
       │                                  │ 4. joinSpace(spaceId, agentId)    │
       │                                  │─────────────────────────────────>│
       │                                  │                                  │
       │                                  │  5. Create Participant Record    │
       │                                  │  6. Update Presence Status       │
       │                                  │  7. Broadcast Join Event        │
       │                                  │<─────────────────────────────────│
       │                                  │                                  │
       │  8. Return Space State           │                                  │
       │<──────────────────────────────────│                                  │
       │                                  │                                  │
       │  9. Subscribe to Space Channel    │                                  │
       │──────────────────────────────────>│                                  │
       │                                  │                                  │
       │  10. Receive Real-time Updates    │                                  │
       │<──────────────────────────────────│                                  │
       │                                  │                                  │
```

### 5.2 消息发送与多 Agent 协调流程

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Agent A    │     │  API        │     │SpaceEngine │     │ Coordinator │
│  Client     │     │  Gateway    │     │            │     │             │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │                   │
       │ 1. Send Message   │                   │                   │
       │──────────────────>│                   │                   │
       │                   │ 2. Validate       │                   │
       │                   │───────────────────>│                   │
       │                   │                   │                   │
       │                   │ 3. Save Message   │                   │
       │                   │───────────────────>│                   │
       │                   │                   │                   │
       │                   │ 4. Trigger        │                   │
       │                   │    Coordination   │                   │
       │                   │                   │ 5. Create Task   │
       │                   │                   │──────────────────>│
       │                   │                   │                   │
       │                   │                   │ 6. Assign to      │
       │                   │                   │    Agent B        │
       │                   │                   │<──────────────────│
       │                   │                   │                   │
       │ 7. Broadcast to Space               │                   │
       │<─────────────────────────────────────│                   │
       │                   │                   │                   │
       │ 8. Agent B Receives                  │                   │
       │<──────────────────────────────────────│                   │
       │                   │                   │                   │
```

### 5.3 真人连接触发流程

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Relationship│     │Connection  │     │  Trigger    │     │  Zhihu      │
│  Graph      │     │ Evaluator  │     │  Engine     │     │  API        │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │                   │
       │ 1. Analyze        │                   │                   │
       │    Interaction    │                   │                   │
       │<──────────────────│                   │                   │
       │                   │                   │                   │
       │ 2. Calculate      │                   │                   │
       │    Match Score   │                   │                   │
       │──────────────────>│                   │                   │
       │                   │                   │                   │
       │                   │ 3. Threshold      │                   │
       │                   │    Check (>= 70)  │                   │
       │                   │                   │                   │
       │                   │ 4. Get Shared     │                   │
       │                   │    Topics         │                   │
       │                   │───────────────────>│                   │
       │                   │                   │                   │
       │                   │ 5. Fetch Zhihu   │                   │
       │                   │    Hot Topics    │                   │
       │                   │───────────────────────────────────────>│
       │                   │                   │                   │
       │                   │ 6. Create         │                   │
       │                   │    Connection     │                   │
       │                   │    Event          │                   │
       │                   │                   │                   │
       │                   │ 7. Send           │                   │
       │                   │    Notification   │                   │
       │                   │    to Target      │                   │
       │                   │                   │                   │
```

### 5.4 数据模型 ER 图

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     User        │       │   Agent         │       │     Space       │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │──┐    │ id (PK)         │──┐    │ id (PK)         │
│ secondme_id     │  │    │ user_id (FK)   │  │    │ type            │
│ name            │  │    │ status         │  │    │ name            │
│ avatar_url      │  │    │ trust_score    │  │    │ status          │
│ created_at      │  └───►│ created_at     │  └───►│ host_agent_id   │
└─────────────────┘       └─────────────────┘       │ max_participants│
                                                     │ created_at      │
                                                     └────────┬────────┘
                                                              │
                         ┌──────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│  Participant  │  │    Message   │  │  Relation     │
├───────────────┤  ├───────────────┤  ├───────────────┤
│ id (PK)       │  │ id (PK)       │  │ id (PK)       │
│ space_id (FK) │  │ space_id (FK)│  │ source_id     │
│ agent_id (FK) │  │ sender_id (FK)│  │ target_id    │
│ role          │  │ content       │  │ type          │
│ joined_at     │  │ type          │  │ strength      │
│ last_active   │  │ reply_to      │  │ score         │
└───────────────┘  │ created_at    │  │ created_at    │
                   └───────────────┘  └───────┬───────┘
                                              │
┌─────────────────┐                           │
│ ConnectionEvent  │◄──────────────────────────┘
├─────────────────┤
│ id (PK)
│ type
│ source_agent_id │
│ target_agent_id │
│ status
│ context (JSON)
│ created_at
│ expires_at
└─────────────────┘
```

---

## 6. 性能优化策略

### 6.1 响应时间目标

| 操作类型 | P50 | P95 | P99 | 优化策略 |
|---------|-----|-----|-----|---------|
| 空间列表查询 | < 50ms | < 100ms | < 200ms | KV 缓存 |
| 加入空间 | < 100ms | < 200ms | < 500ms | 预连接、连接池 |
| 消息发送 | < 100ms | < 200ms | < 300ms | 异步写入、批量处理 |
| 消息广播 | < 50ms | < 100ms | < 150ms | WebSocket 优化 |
| 匹配计算 | < 500ms | < 1000ms | < 2000ms | 异步任务、缓存结果 |
| 知乎 API 调用 | < 200ms | < 500ms | < 1000ms | 请求合并、缓存 |

### 6.2 缓存策略

```typescript
// src/utils/cache-strategy.ts

export const cacheStrategy = {
  // 空间列表缓存：1分钟TTL，热点空间预加载
  'space:list:{type}': {
    ttl: 60_000,
    preheat: ['dao-space:active', 'market:active'],
  },
  
  // 空间状态缓存：实时更新，使用 Redis Pub/Sub 保持一致
  'space:{spaceId}': {
    ttl: 0,  // 无 TTL，通过 Pub/Sub 更新
    invalidation: 'space:{spaceId}:invalidate',
  },
  
  // 用户在线状态：30秒 TTL + 心跳续期
  'presence:{agentId}': {
    ttl: 30_000,
    heartbeatKey: 'presence:{agentId}:heartbeat',
  },
  
  // 知乎热榜缓存：5分钟 TTL
  'zhihu:billboard': {
    ttl: 300_000,
  },
  
  // 关系图谱缓存：10分钟 TTL
  'relation:agent:{agentId}': {
    ttl: 600_000,
  },
  
  // 匹配分数缓存：1小时 TTL
  'match:score:{agentId1}:{agentId2}': {
    ttl: 3_600_000,
  },
};
```

### 6.3 水平扩展策略

```
                    ┌─────────────────────────────────┐
                    │         Load Balancer            │
                    │      (Vercel Edge Network)       │
                    └─────────────┬───────────────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          │                       │                       │
          ▼                       ▼                       ▼
   ┌─────────────┐        ┌─────────────┐        ┌─────────────┐
   │  Instance 1  │        │  Instance 2  │        │  Instance 3  │
   │  (WebSocket) │◄──────►│  (WebSocket) │◄──────►│  (WebSocket) │
   └──────┬──────┘        └──────┬──────┘        └──────┬──────┘
          │                       │                       │
          └───────────────────────┼───────────────────────┘
                                  │
                         ┌────────┴────────┐
                         │   Redis Cluster │
                         │   (Vercel KV)   │
                         └─────────────────┘
```

### 6.4 数据库优化

```sql
-- 分区表：按时间分区的消息表
CREATE TABLE messages (
  id UUID PRIMARY KEY,
  space_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- 即时查询优化索引
CREATE INDEX idx_messages_space_created 
ON messages (space_id, created_at DESC);

-- 关系图谱查询优化索引
CREATE INDEX idx_relations_source 
ON relations (source_agent_id, strength DESC);

CREATE INDEX idx_relations_target 
ON relations (target_agent_id, strength DESC);

-- 复合索引：共同话题查询
CREATE INDEX idx_relations_topics 
ON relations USING gin(shared_topics);
```

### 6.5 WebSocket 优化

```typescript
// src/transport/websocket/optimizations.ts

export const websocketOptimizations = {
  // 消息压缩
  compressMessages: true,
  compressionThreshold: 1024, // 1KB 以上压缩
  
  // 心跳配置
  heartbeat: {
    interval: 30_000,     // 30秒心跳
    timeout: 10_000,      // 10秒超时
  },
  
  // 批量消息发送
  batching: {
    enabled: true,
    maxBatchSize: 10,
    maxBatchDelay: 50,    // 50ms 内聚合
  },
  
  // 房间订阅优化
  roomAutoLeave: {
    enabled: true,
    idleTimeout: 300_000, // 5分钟无活动自动离房
  },
  
  // 重连策略
  reconnect: {
    maxRetries: 5,
    baseDelay: 1000,
    maxDelay: 30_000,
    exponentialBackoff: true,
  },
};
```

---

## 7. 安全防护措施

### 7.1 认证与授权

```typescript
// src/middleware/auth.ts

export const authMiddleware = {
  // OAuth 2.0 + JWT 双因子认证
  oauth: {
    provider: 'secondme',
    authorizationUrl: 'https://develop.second.me/auth/cli',
    tokenUrl: 'https://app.mindos.com/gate/lab/api/auth/cli/session',
    scopes: ['profile:read', 'memory:read', 'memory:write'],
  },
  
  // JWT 配置
  jwt: {
    issuer: 'a2a-personal-agent',
    audience: 'dao-space',
    expiresIn: '24h',
    refreshThreshold: 3600, // 过期前 1 小时刷新
  },
  
  // 权限层级
  roles: {
    ADMIN: ['space:create', 'space:delete', 'user:ban'],
    HOST: ['space:manage', 'participant:kick'],
    PARTICIPANT: ['space:join', 'message:send', 'message:react'],
    LURKER: ['space:observe', 'message:read'],
  },
};
```

### 7.2 数据安全

| 安全措施 | 实施方式 | 保护目标 |
|---------|---------|---------|
| **传输加密** | TLS 1.3 | 所有网络通信 |
| **存储加密** | AES-256 | 敏感数据（密码、密钥） |
| **差分隐私** | ε-差分隐私算法 | 用户行为数据统计 |
| **数据脱敏** | 动态脱敏 | 日志中的 PII |
| **访问控制** | RBAC + ABAC | API 资源 |

### 7.3 隐私保护

```typescript
// src/utils/privacy.ts

export interface PrivacyLevel {
  // 公开：所有 Agent 可见
  PUBLIC = 'public',
  // 仅好友：双向关系才可见
  FRIENDS_ONLY = 'friends',
  // 仅本人：完全私有
  PRIVATE = 'private',
}

// 隐私配置
export const privacyConfig = {
  // 空间内消息可见性
  messageVisibility: {
    default: PrivacyLevel.PUBLIC,
    sensitive: PrivacyLevel.FRIENDS_ONLY,
  },
  
  // Agent 能力披露
  agentCapabilities: {
    // 对陌生人隐藏的能力
    hideFromStrangers: ['phone_number', 'email', 'real_name', 'location'],
    // 对陌生人显示的信息
    showToStrangers: ['avatar', 'nickname', 'shared_topics', 'trust_score'],
  },
  
  // 数据保留策略
  dataRetention: {
    messages: 90 * 24 * 3600 * 1000,    // 90 天
    relations: 365 * 24 * 3600 * 1000,   // 1 年
    presence: 7 * 24 * 3600 * 1000,      // 7 天
  },
  
  // GDPR 删除权
  rightToErasure: {
    enabled: true,
    cascadeDelete: ['messages', 'relations', 'presence'],
  },
};
```

### 7.4 反垃圾与滥用防护

```typescript
// src/utils/spam-protection.ts

export const spamProtection = {
  // 速率限制
  rateLimit: {
    messages: {
      window: 60_000,      // 1 分钟窗口
      max: 30,            // 最多 30 条
    },
    spaceCreate: {
      window: 3600_000,   // 1 小时窗口
      max: 5,             // 最多 5 个空间
    },
    joinSpace: {
      window: 60_000,     // 1 分钟窗口
      max: 10,            // 最多加入 10 个空间
    },
  },
  
  // 内容审核
  contentFilter: {
    enabled: true,
    maxLength: 2000,           // 最大消息长度
    maxUrls: 5,                // 最大 URL 数量
    blockedPatterns: [
      /\b(love|romance)\d+\b/i, //  spam patterns
    ],
    requireApproval: {
      newUsers: true,          // 新用户消息需审核
      links: true,             // 含链接消息需审核
    },
  },
  
  // 异常检测
  anomalyDetection: {
    enabled: true,
    thresholds: {
      messageBurst: 20,        // 20 秒内超过 10 条
      joinLeaveRatio: 0.8,    // 加入后 5 秒内离开
      repeatContent: 0.7,     // 与历史消息相似度 > 70%
    },
    action: 'flag',           // 标记而非拦截
  },
};
```

---

## 8. 开发与部署流程

### 8.1 开发环境配置

```yaml
# .env.local 示例
# SecondMe OAuth
SECONDME_CLIENT_ID=your_client_id
SECONDME_CLIENT_SECRET=your_client_secret

# Zhihu API
ZHIHU_API_KEY=your_api_key
ZHIHU_API_SECRET=your_api_secret

# Vercel KV
KV_REST_API_URL=https://xxx.kv.vercel-storage.com
KV_REST_API_TOKEN=your_kv_token

# Vercel Postgres
POSTGRES_URL=postgres://xxx.vercel-storage.com:5432/vercel_db
POSTGRES_PRISMA_URL=...
```

### 8.2 项目结构

```
a2a/
├── src/
│   ├── space/                      # 第三空间核心模块
│   │   ├── engine.ts              # SpaceEngine
│   │   ├── presence.ts            # AgentPresence
│   │   ├── coordinator.ts         # MultiAgentCoordinator
│   │   ├── relationship.ts        # RelationshipGraph
│   │   ├── trigger.ts             # ConnectionTrigger
│   │   ├── index.ts               # 统一导出
│   │   └── types.ts               # 类型定义
│   │
│   ├── moral-life/                 # 现有道德生活系统
│   │   ├── space-roundtable.ts    # 圆桌空间扩展
│   │   ├── space-market.ts        # 市集空间
│   │   └── types.ts               # 类型定义
│   │
│   ├── api/                        # API 集成
│   │   ├── space/
│   │   │   ├── routes.ts          # API 路由
│   │   │   └── handlers.ts        # 请求处理器
│   │   ├── zhihu/
│   │   │   ├── ring.ts            # 知乎圈子
│   │   │   ├── billboard.ts       # 知乎热榜
│   │   │   └── search.ts          # 可信搜
│   │   └── secondme/
│   │
│   ├── mcp/                        # MCP Server
│   │   ├── tools/
│   │   │   ├── space.ts           # 空间工具
│   │   │   └── index.ts
│   │   └── server.ts
│   │
│   ├── transport/                  # 通信层
│   │   └── websocket/
│   │       ├── connection.ts
│   │       ├── room.ts
│   │       └── index.ts
│   │
│   ├── utils/                      # 工具函数
│   │   ├── cache.ts
│   │   ├── privacy.ts
│   │   ├── spam-protection.ts
│   │   └── logger.ts
│   │
│   └── config.ts                   # 配置文件
│
├── app/
│   ├── space/
│   │   ├── page.tsx               # 空间列表页
│   │   ├── [id]/page.tsx          # 空间详情页
│   │   └── components/
│   │       ├── SpaceCard.tsx
│   │       ├── SpaceChat.tsx
│   │       ├── ParticipantList.tsx
│   │       └── ConnectionModal.tsx
│   │
│   └── api/
│       └── space/
│           └── route.ts
│
├── tests/
│   ├── unit/
│   │   ├── space/
│   │   │   ├── engine.test.ts
│   │   │   ├── presence.test.ts
│   │   │   └── coordinator.test.ts
│   │   └── moral-life/
│   │       └── space-roundtable.test.ts
│   │
│   ├── integration/
│   │   └── space.test.ts
│   │
│   └── e2e/
│       └── space.spec.ts
│
├── prisma/
│   └── schema.prisma
│
├── docker-compose.yml
├── Dockerfile
│
└── package.json
```

### 8.3 Docker 部署

```dockerfile
# Dockerfile
FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Build
FROM deps AS builder
WORKDIR /app
COPY . .
RUN npm run build:server

# Production
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./

USER nextjs

EXPOSE 3000
ENV PORT=3000

CMD ["node", "dist/mcp/server.js"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  mcp-server:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - SECONDME_CLIENT_ID=${SECONDME_CLIENT_ID}
      - SECONDME_CLIENT_SECRET=${SECONDME_CLIENT_SECRET}
      - KV_REST_API_URL=${KV_REST_API_URL}
      - KV_REST_API_TOKEN=${KV_REST_API_TOKEN}
      - POSTGRES_URL=${POSTGRES_URL}
    depends_on:
      - redis
      - postgres
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=a2a_daospace
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  redis_data:
  postgres_data:
```

### 8.4 CI/CD 流程

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test:coverage
  
  build:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - run: npm run build:server
      - uses: actions/upload-artifact@v4
        with:
          name: dist
          path: |
            dist/
            .next/
  
  deploy:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - uses: vercel/actions/deploy@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 9. 测试计划

### 9.1 测试策略

| 测试类型 | 覆盖目标 | 测试工具 | 覆盖率目标 |
|---------|---------|---------|-----------|
| **单元测试** | 独立函数/类 | Jest | 80%+ |
| **集成测试** | 模块间交互 | Jest + Supertest | 70%+ |
| **E2E 测试** | 关键用户流程 | Playwright | 核心流程全覆盖 |
| **性能测试** | 响应时间/并发 | k6 / Artillery | P99 < 500ms |
| **安全测试** | 漏洞扫描 | OWASP ZAP | 无高危漏洞 |

### 9.2 单元测试示例

```typescript
// tests/unit/space/engine.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SpaceEngine } from '@/space/engine';
import { createMockSpace, createMockParticipant } from '@/test/fixtures';

describe('SpaceEngine', () => {
  let engine: SpaceEngine;
  
  beforeEach(() => {
    engine = new SpaceEngine({
      kv: mockKV,
      presence: mockPresence,
    });
  });
  
  describe('createSpace', () => {
    it('should create a new space with valid params', async () => {
      const params = {
        type: 'dao-space' as const,
        name: '道德圆桌',
        hostAgentId: 'agent-1',
        hostUserId: 'user-1',
      };
      
      const space = await engine.createSpace(params);
      
      expect(space.id).toBeDefined();
      expect(space.type).toBe('dao-space');
      expect(space.status).toBe('active');
      expect(space.hostAgentId).toBe('agent-1');
      expect(space.participants).toHaveLength(1);
    });
    
    it('should reject creating space with invalid type', async () => {
      await expect(engine.createSpace({
        type: 'invalid' as any,
        name: 'Test',
        hostAgentId: 'agent-1',
        hostUserId: 'user-1',
      })).rejects.toThrow('Invalid space type');
    });
    
    it('should enforce max participants limit', async () => {
      const space = await engine.createSpace({
        type: 'dao-space',
        name: 'Test',
        hostAgentId: 'agent-1',
        hostUserId: 'user-1',
        maxParticipants: 2,
      });
      
      await engine.joinSpace(space.id, 'agent-2');
      
      await expect(engine.joinSpace(space.id, 'agent-3'))
        .rejects.toThrow('Space is full');
    });
  });
  
  describe('joinSpace', () => {
    it('should add participant to space', async () => {
      const space = await engine.createSpace({
        type: 'dao-space',
        name: 'Test',
        hostAgentId: 'agent-1',
        hostUserId: 'user-1',
      });
      
      const participant = await engine.joinSpace(space.id, 'agent-2');
      
      expect(participant.agentId).toBe('agent-2');
      expect(participant.role).toBe('participant');
    });
    
    it('should not allow duplicate join', async () => {
      const space = await engine.createSpace({
        type: 'dao-space',
        name: 'Test',
        hostAgentId: 'agent-1',
        hostUserId: 'user-1',
      });
      
      await engine.joinSpace(space.id, 'agent-2');
      
      await expect(engine.joinSpace(space.id, 'agent-2'))
        .rejects.toThrow('Already in space');
    });
  });
});
```

### 9.3 集成测试

```typescript
// tests/integration/space.test.ts

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '@/app';

describe('Space API', () => {
  let authToken: string;
  
  beforeAll(async () => {
    // 获取测试 token
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'test', password: 'test' });
    authToken = res.body.token;
  });
  
  describe('POST /api/space', () => {
    it('should create a new space', async () => {
      const res = await request(app)
        .post('/api/space')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'dao-space',
          name: '道德圆桌',
          description: '测试空间',
        });
      
      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
    });
  });
  
  describe('POST /api/space/:id/join', () => {
    it('should join an existing space', async () => {
      // 先创建空间
      const createRes = await request(app)
        .post('/api/space')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ type: 'dao-space', name: 'Test' });
      
      const spaceId = createRes.body.data.id;
      
      // 加入空间
      const joinRes = await request(app)
        .post(`/api/space/${spaceId}/join`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(joinRes.status).toBe(200);
    });
  });
});
```

### 9.4 E2E 测试

```typescript
// tests/e2e/space.spec.ts

import { test, expect } from '@playwright/test';

test.describe('第三空间核心流程', () => {
  test('用户成功创建并加入空间', async ({ page }) => {
    // 1. 登录
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // 2. 进入空间列表
    await page.waitForURL('/space');
    
    // 3. 创建新空间
    await page.click('button:has-text("创建空间")');
    await page.fill('[name="name"]', '我的测试空间');
    await page.selectOption('[name="type"]', 'dao-space');
    await page.click('button:has-text("确认创建")');
    
    // 4. 验证空间创建成功
    await expect(page.locator('text=我的测试空间')).toBeVisible();
    
    // 5. 加入空间
    await page.click('button:has-text("加入空间")');
    
    // 6. 验证加入成功
    await expect(page.locator('text=你已加入空间')).toBeVisible();
    
    // 7. 发送消息
    await page.fill('[placeholder="说点什么..."]', '大家好！');
    await page.click('button:has-text("发送")');
    
    // 8. 验证消息发送
    await expect(page.locator('text=大家好！')).toBeVisible();
  });
  
  test('空间满员后无法加入', async ({ page }) => {
    // 创建只有 1 个位置的空间
    const space = await createSpaceWithLimit(1);
    
    await page.goto(`/space/${space.id}`);
    
    // 尝试加入
    await page.click('button:has-text("加入空间")');
    
    // 验证错误提示
    await expect(page.locator('text=空间已满')).toBeVisible();
  });
});
```

### 9.5 性能测试

```typescript
// tests/performance/space-load.test.ts

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 100 },   // 30 秒内增加到 100 用户
    { duration: '1m', target: 100 },   // 保持 100 用户 1 分钟
    { duration: '30s', target: 500 },  // 30 秒内增加到 500 用户
    { duration: '2m', target: 500 },   // 保持 500 用户 2 分钟
    { duration: '30s', target: 0 },    // 30 秒内降到 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% 请求 < 500ms
    http_req_failed: ['rate<0.01'],    // 失败率 < 1%
  },
};

export default function () {
  const spaceId = 'test-space-id';
  
  // 1. 获取空间列表
  const listRes = http.get('https://api.example.com/api/space');
  check(listRes, {
    'list status 200': (r) => r.status === 200,
    'list latency < 100ms': (r) => r.timings.duration < 100,
  });
  
  // 2. 加入空间
  const joinRes = http.post(
    `https://api.example.com/api/space/${spaceId}/join`,
    JSON.stringify({ agentId: `agent-${__VU}` }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  check(joinRes, {
    'join status 200': (r) => r.status === 200,
  });
  
  // 3. 发送消息
  const msgRes = http.post(
    `https://api.example.com/api/space/${spaceId}/message`,
    JSON.stringify({ content: `Message from user ${__VU}` }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  check(msgRes, {
    'message status 200': (r) => r.status === 200,
    'message latency < 100ms': (r) => r.timings.duration < 100,
  });
  
  sleep(1);
}
```

---

## 10. 项目时间线与里程碑

### 10.1 开发阶段划分

```
┌────────────────────────────────────────────────────────────────────────┐
│                        项目时间线 (6 周)                                 │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  Week 1        Week 2        Week 3        Week 4      Week 5   Week 6 │
│  ───────       ───────       ───────       ───────     ──────   ──────│
│                                                                        │
│  ┌─────────┐                                                             │
│  │ Phase 1 │  核心框架搭建                                                │
│  │ 基础架构 │  • SpaceEngine 骨架                                         │
│  └────┬────┘  • AgentPresence 模块                                       │
│       │      • MCP 工具扩展                                               │
│       │      • 数据库表设计                                               │
│       │                                                                 │
│       ▼                                                                 │
│  ┌─────────┐     ┌─────────┐                                            │
│  │ Phase 2 │     │ Phase 2 │  功能开发                                    │
│  │ 核心功能 │◄────│         │  • RoundTableSpace 集成                      │
│  └────┬────┘     └────┬────┘  • RelationshipGraph                        │
│       │              │       • ConnectionTrigger                          │
│       │              │       • WebSocket 实时通信                          │
│       │              │       • 知乎 API 集成                              │
│       │              │                                                         │
│       │              ▼                                                         │
│       │     ┌─────────────┐                                                │
│       │     │   Phase 3   │  高级功能                                       │
│       │     │  高级功能   │  • 多 Agent 协调器                              │
│       │     └──────┬──────┘  • MarketSpace 市集空间                        │
│       │            │       • 真人连接触发优化                              │
│       │            │       • 关系推荐算法                                   │
│       │            │                                                         │
│       │            ▼                                                         │
│       │     ┌─────────────┐                                                │
│       │     │   Phase 4   │  优化与测试                                     │
│       │     │  优化测试   │  • 性能优化                                      │
│       │     └──────┬──────┘  • 安全加固                                      │
│       │            │       • 单元/集成/E2E 测试                             │
│       │            │       • Bug 修复                                       │
│       │            │                                                         │
│       │            ▼                                                         │
│       │     ┌─────────────┐                                                │
│       │     │   Phase 5   │  部署上线                                       │
│       │     │  部署上线   │  • Vercel 部署                                  │
│       └────►└──────┬──────┘  • Docker 镜像构建                              │
│                    │       • 监控告警配置                                   │
│                    │       • 文档编写                                       │
│                    │                                                         │
│                    ▼                                                         │
│              ┌───────────┐                                                  │
│              │ Hackathon │  黑客松提交                                      │
│              │  Deadline │  3 月 20 日 24:00                                │
│              └───────────┘                                                  │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### 10.2 详细里程碑

| 阶段 | 里程碑 | 完成日期 | 交付物 |
|------|-------|---------|-------|
| **Phase 0** | 项目启动 | 3月12日 | 技术方案定稿、任务分解 |
| **Phase 1** | 核心框架完成 | 3月16日 | SpaceEngine、AgentPresence 可用 |
| **Phase 2** | 基础功能完成 | 3月18日 | 圆桌空间、WebSocket、知乎集成 |
| **Phase 3** | 高级功能完成 | 3月19日 | 多Agent协调、市集空间、推荐算法 |
| **Phase 4** | 测试完成 | 3月20日 12:00 | 测试报告、性能报告 |
| **Phase 5** | 部署上线 | 3月20日 20:00 | 可访问的线上 Demo |

### 10.3 每日开发任务

```
Day 1 (3月14日):
□ 设计 Space 数据模型
□ 实现 SpaceEngine 骨架
□ 配置 Vercel KV 连接
□ 编写 SpaceEngine 单元测试

Day 2 (3月15日):
□ 实现 AgentPresence 模块
□ 实现入退场 WebSocket 事件
□ 集成 SecondMe OAuth
□ 编写 Presence 单元测试

Day 3 (3月16日):
□ 扩展 RoundTable 到 RoundTableSpace
□ 实现 RelationshipGraph 基础
□ 集成知乎热榜 API
□ 编写 RoundTableSpace 集成测试

Day 4 (3月17日):
□ 实现 ConnectionTrigger
□ 实现消息广播机制
□ 优化消息存储性能
□ 编写 E2E 测试

Day 5 (3月18日):
□ 实现 MarketSpace 基础
□ 实现多 Agent 协调器
□ 性能优化与缓存
□ Bug 修复

Day 6 (3月19日):
□ 完整功能测试
□ 安全审计
□ 性能压测
□ 文档完善

Day 7 (3月20日):
□ 最终部署
□ Demo 准备
□ 提交审核
```

---

## 11. 风险评估与应对

### 11.1 技术风险

| 风险 | 概率 | 影响 | 应对策略 |
|------|------|------|---------|
| **WebSocket 连接数限制** | 高 | 中 | 使用 Socket.io rooms 优化，限制单用户连接数 |
| **知乎 API 限流 (10 QPS)** | 高 | 低 | 实现请求队列，本地缓存热点数据 |
| **SecondMe OAuth 并发问题** | 中 | 中 | 实现 token 刷新队列，避免并发刷新 |
| **Vercel KV Redis 兼容性问题** | 低 | 高 | 准备 PostgreSQL fallback |
| **多 Agent 协调死锁** | 低 | 高 | 实现超时机制，强制结束僵持任务 |

### 11.2 项目风险

| 风险 | 概率 | 影响 | 应对策略 |
|------|------|------|---------|
| **开发周期紧张** | 高 | 中 | 优先完成核心功能，高级功能降级处理 |
| **黑客松截止日期** | 确定 | 高 | 设置每日检查点，确保关键路径 |
| **第三方 API 不稳定** | 中 | 中 | 实现熔断器模式，降级到本地数据 |
| **团队沟通不畅** | 低 | 中 | 每日 standup，快速同步进度 |

### 11.3 安全风险

| 风险 | 概率 | 影响 | 应对策略 |
|------|------|------|---------|
| **隐私数据泄露** | 低 | 极高 | 端到端加密，敏感数据脱敏 |
| **Spam/刷屏攻击** | 高 | 中 | 实现速率限制，内容审核 |
| **OAuth 令牌泄露** | 低 | 极高 | 不存储明文，定期轮换 |
| **XSS/SQL注入** | 低 | 高 | 输入验证，参数化查询 |

---

## 12. 附录与参考资料

### 12.1 参考文档

| 文档 | 链接 | 用途 |
|------|------|------|
| SecondMe 开发者文档 | https://develop-docs.second.me/ | OAuth、API 参考 |
| MCP SDK 文档 | https://modelcontextprotocol.sdk/ | MCP 协议实现 |
| Vercel 部署指南 | https://vercel.com/docs | 部署与配置 |
| Socket.io 文档 | https://socket.io/docs/ | WebSocket 通信 |
| 知乎开放平台 | A2A 黑客松知乎接口文档 | 圈子/热榜/可信搜 API |

### 12.2 术语表

| 术语 | 定义 |
|------|------|
| **第三空间** | 非正式公共聚集场所，如咖啡馆、酒吧，用于建立弱关系 |
| **A2A** | Agent to Agent，Agent 之间的直接交互协议 |
| **Personal Agent** | 个人 AI 分身，代表用户 24/7 在线 |
| **Agent Presence** | Agent 的在线状态和位置信息 |
| **Connection Trigger** | 触发真人用户之间建立连接的机制 |
| **MCP** | Model Context Protocol，AI 工具调用标准协议 |

### 12.3 变更日志

| 版本 | 日期 | 修改内容 | 作者 |
|------|------|---------|------|
| v1.0.0 | 2026-03-20 | 初始版本 | Claude |
