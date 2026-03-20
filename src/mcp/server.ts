import http from 'http';
import { URL } from 'url';
import { SECONDME_API_BASE, API_ENDPOINTS } from '../config';
import { getDailyGuidance, getTopicGuidance, listQuotes, saveGuidanceAsMemory } from '../dao/app';
import { isAppError, ValidationError } from '../errors';
import { validateToolArguments, ToolName } from '../schemas/mcp';
import { logger } from '../utils/logger';
import { TimedCache } from '../utils/cache';
import {
  createRoundTableSession,
  createCompanionSession,
  addJournalEntry,
  addMilestone,
  updateTrustLevel,
  generateDailyMessage,
  generateWeeklyReport,
  generateGreeting,
  createMoralCreditProfile,
  addDimensionEvidence,
  updateDimensionTrend,
  applyNaturalDecay,
  createMoralWallet,
  addMeritTransaction,
  makeDonation,
  useTrustQuota,
  updateTrustScore,
  upgradeLevel,
  getWalletSummary,
  getScenarios,
  processUserChoice,
  getTownCharacters,
  getCharacterById,
  getZoneInfo,
  getAllZones,
  getEnterQuote,
  getTownNarrative,
  createTownExperience,
  createInitialWorldState,
  evolveWorldState,
  getWastelandZones,
  canEnterWasteland,
  getEntryNarrative,
  getMeditationNarrative,
  getGuardianWisdom,
  getReturnQuote,
  createWastelandExperience,
  processWastelandMeditation,
} from '../moral-life';

const isProduction = process.env.NODE_ENV === 'production';
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || ['https://a2-a-personal-agent.vercel.app', 'http://localhost:3000'];

const inMemoryStorage = {
  companionSessions: new Map<string, any>(),
  moralCreditProfiles: new Map<string, any>(),
  moralWallets: new Map<string, any>(),
  worldStates: new Map<string, any>(),
};

const requestCache = new TimedCache<unknown>(30000);
const pendingRequests = new Map<string, Promise<unknown>>();

function corsMiddleware(req: http.IncomingMessage, res: http.ServerResponse): boolean {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
  }

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return true;
  }
  return false;
}

function handleError(error: unknown): { code: number; message: string } {
  if (isAppError(error)) {
    return { code: -32603, message: error.message };
  }

  if (isProduction) {
    logger.error({ err: error }, 'Internal server error');
    return { code: -32603, message: 'Internal server error' };
  }

  return {
    code: -32603,
    message: error instanceof Error ? error.message : 'Internal error',
  };
}

interface MCPRequest {
  jsonrpc: string;
  id: string | number;
  method: string;
  params?: {
    name?: string;
    arguments?: Record<string, unknown>;
  };
}

interface MCPResponse {
  jsonrpc: string;
  id: string | number;
  result?: unknown;
  error?: {
    code: number;
    message: string;
  };
}

function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
}

async function cachedFetch<T>(cacheKey: string, fetchFn: () => Promise<T>): Promise<T> {
  const cached = requestCache.get(cacheKey);
  if (cached !== undefined) {
    return cached as T;
  }

  const pending = pendingRequests.get(cacheKey);
  if (pending !== undefined) {
    return pending as Promise<T>;
  }

  const promise = fetchFn().finally(() => {
    pendingRequests.delete(cacheKey);
  });

  pendingRequests.set(cacheKey, promise as Promise<unknown>);
  const result = await promise;
  requestCache.set(cacheKey, result);
  return result;
}

function invalidateCache(pattern: string): void {
  const keys = [...pendingRequests.keys(), ...Array.from({ length: 1000 }, (_, i) => `key_${i}`)];
  for (const key of keys) {
    if (key.startsWith(pattern)) {
      requestCache.invalidate(key);
    }
  }
}

async function fetchWithToken(token: string, endpoint: string, options: RequestInit = {}): Promise<unknown> {
  const url = endpoint.startsWith('http') ? endpoint : `${SECONDME_API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json() as { data: unknown };
  return result.data;
}

async function handleToolsList(token: string): Promise<unknown[]> {
  return [
    {
      name: 'get_profile',
      description: '获取当前用户的 Profile 信息',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'search_memories',
      description: '搜索用户的记忆内容',
      inputSchema: {
        type: 'object',
        properties: {
          keyword: { type: 'string', description: '搜索关键词' },
          pageNo: { type: 'number', description: '页码，默认1' },
          pageSize: { type: 'number', description: '每页数量，默认20' },
        },
        required: ['keyword'],
      },
    },
    {
      name: 'create_memory',
      description: '创建新的记忆',
      inputSchema: {
        type: 'object',
        properties: {
          content: { type: 'string', description: '记忆内容' },
          visibility: { type: 'number', description: '可见性，1为私有，2为公开' },
        },
        required: ['content'],
      },
    },
    {
      name: 'discover_users',
      description: '发现同频用户',
      inputSchema: {
        type: 'object',
        properties: {
          pageNo: { type: 'number', description: '页码，默认1' },
          pageSize: { type: 'number', description: '每页数量，默认20' },
          circleType: { type: 'string', description: '圈子类型' },
        },
      },
    },
    {
      name: 'get_matching_score',
      description: '获取与指定用户的匹配分数',
      inputSchema: {
        type: 'object',
        properties: {
          targetUsername: { type: 'string', description: '目标用户名' },
        },
        required: ['targetUsername'],
      },
    },

    {
      name: 'dao_daily_guidance',
      description: '生成一条“道德经（帛书版）”风格的今日箴言与行动建议',
      inputSchema: {
        type: 'object',
        properties: {
          date: { type: 'string', description: '日期（YYYY-MM-DD），默认今天' },
          topic: { type: 'string', description: '主题/困惑，如“焦虑”“关系”“工作”' },
          mood: { type: 'string', description: '情绪，如“低落”“烦躁”“平静”' },
        },
      },
    },
    {
      name: 'dao_topic_guidance',
      description: '按主题生成“道德经（帛书版）”风格的指导与反思问题',
      inputSchema: {
        type: 'object',
        properties: {
          topic: { type: 'string', description: '主题/困惑' },
          context: { type: 'string', description: '上下文补充（可选）' },
          mood: { type: 'string', description: '情绪（可选）' },
        },
        required: ['topic'],
      },
    },
    {
      name: 'dao_quotes_list',
      description: '列出可用的帛书版道德经摘句（用于选择/调试）',
      inputSchema: {
        type: 'object',
        properties: {
          theme: { type: 'string', description: '按主题过滤，如“无为”“知足”“柔弱”' },
          limit: { type: 'number', description: '返回条数，默认 20' },
        },
      },
    },
    {
      name: 'dao_save_daily_guidance_memory',
      description: '将"今日箴言"保存为 SecondMe Key Memory（需要鉴权）',
      inputSchema: {
        type: 'object',
        properties: {
          date: { type: 'string', description: '日期（YYYY-MM-DD），默认今天' },
          topic: { type: 'string', description: '主题（可选）' },
          mood: { type: 'string', description: '情绪（可选）' },
          visibility: { type: 'number', description: '可见性，1私有，2公开；默认1' },
        },
      },
    },
    {
      name: 'moral_roundtable',
      description: '启动多 Agent 圆桌讨论',
      inputSchema: {
        type: 'object',
        properties: {
          dilemma: { type: 'string', description: '道德困境描述' },
          agents: { type: 'array', items: { type: 'string' }, description: '参与的 Agent 列表' },
          focus: { type: 'string', description: '讨论焦点（可选）' },
        },
        required: ['dilemma'],
      },
    },
    {
      name: 'moral_companion',
      description: '共修伙伴交互',
      inputSchema: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['get_session', 'add_journal', 'add_milestone', 'update_trust', 'get_greeting', 'get_weekly_report'] },
          userId: { type: 'string', description: '用户 ID' },
          companionId: { type: 'string', description: '共修伙伴 ID' },
          content: { type: 'string', description: '日志内容' },
          reflection: { type: 'string', description: '反思内容' },
          event: { type: 'string', description: '里程碑事件' },
          insight: { type: 'string', description: '感悟内容' },
          newTrust: { type: 'string', enum: ['low', 'moderate', 'high', 'deep'] },
        },
        required: ['action', 'userId'],
      },
    },
    {
      name: 'moral_credit',
      description: '道德信誉查询与更新',
      inputSchema: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['get_profile', 'add_evidence', 'update_trend', 'apply_decay'] },
          userId: { type: 'string', description: '用户 ID' },
          dimension: { type: 'string', enum: ['闻道', '行善', '清静', '知足', '玄德', '应时'] },
          evidence: { type: 'string', description: '证据描述' },
          trend: { type: 'string', enum: ['up', 'stable', 'down'] },
          inactiveDays: { type: 'number', description: '不活跃天数' },
        },
        required: ['action', 'userId'],
      },
    },
    {
      name: 'moral_training_camp',
      description: '道德修炼场场景',
      inputSchema: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['list_scenarios', 'get_scenario', 'submit_choice'] },
          scenarioType: { type: 'string', enum: ['两难抉择', '欲望考验', '人际冲突', '权力使用', '长期规划'] },
          difficulty: { type: 'string', enum: ['初级', '中级', '进阶', '高阶'] },
          theme: { type: 'string', description: '主题关键词' },
          scenarioId: { type: 'string', description: '场景 ID' },
          choiceId: { type: 'string', description: '选择 ID' },
        },
      },
    },
    {
      name: 'moral_decision_support',
      description: 'A2A 决策支持',
      inputSchema: {
        type: 'object',
        properties: {
          decision: { type: 'string', description: '决策描述' },
          context: { type: 'string', description: '决策上下文' },
          agents: { type: 'array', items: { type: 'string' }, description: '参与的 Agent' },
        },
        required: ['decision'],
      },
    },
    {
      name: 'moral_wallet',
      description: '道德钱包管理',
      inputSchema: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['get_balance', 'get_summary', 'earn_merit', 'spend_merit', 'donate', 'use_trust_quota', 'upgrade_level', 'create_wallet'] },
          userId: { type: 'string', description: '用户 ID' },
          source: { type: 'string', description: '积分来源/去向' },
          amount: { type: 'number', description: '金额' },
          recipient: { type: 'string', description: '接收者' },
          isAnonymous: { type: 'boolean', description: '是否匿名' },
          note: { type: 'string', description: '备注' },
          newLevel: { type: 'string', enum: ['闻道', '悟道', '行道', '得道', '同道'] },
          name: { type: 'string', description: '钱包名称' },
        },
        required: ['action', 'userId'],
      },
    },
    {
      name: 'life_monetization',
      description: '人生变现服务',
      inputSchema: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['get_profile', 'publish_service', 'update_service', 'get_orders'] },
          userId: { type: 'string', description: '用户 ID' },
          serviceType: { type: 'string', enum: ['mentoring', 'experience_sharing', 'collaborative_creation', 'consulting'] },
          title: { type: 'string', description: '服务标题' },
          description: { type: 'string', description: '服务描述' },
          priceRange: { type: 'string', description: '价格区间' },
          serviceId: { type: 'string', description: '服务 ID' },
          status: { type: 'string', enum: ['active', 'inactive', 'pending'] },
        },
        required: ['action', 'userId'],
      },
    },
    {
      name: 'daoist_town',
      description: '道德小镇虚拟环境',
      inputSchema: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['get_characters', 'get_zones', 'get_narrative', 'create_experience', 'get_state', 'enter_zone'] },
          userId: { type: 'string', description: '用户 ID' },
          zone: { type: 'string', enum: ['道场', '市集', '山林', '水域', '静室'] },
          character: { type: 'string', description: '角色名称' },
          activity: { type: 'string', description: '活动描述' },
          content: { type: 'string', description: '体验内容' },
          emotionalResonance: { type: 'number', description: '情感共鸣度 1-10' },
        },
        required: ['action', 'userId'],
      },
    },
    {
      name: 'wasteland',
      description: '荒域虚拟环境',
      inputSchema: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['get_zones', 'can_enter', 'enter', 'meditate', 'get_wisdom'] },
          userId: { type: 'string', description: '用户 ID' },
          zone: { type: 'string', enum: ['太虚', '玄墟', '浑沌', '无无'] },
          durationMinutes: { type: 'number', description: '冥想时长（分钟）' },
        },
        required: ['action', 'userId'],
      },
    },
  ];
}

async function handleToolCall(token: string, toolName: string, args: Record<string, unknown> = {}): Promise<unknown> {
  const validation = validateToolArguments(toolName, args);
  if (!validation.valid) {
    throw new ValidationError(validation.error || 'Invalid arguments');
  }

  const validatedArgs = validation.data as Record<string, unknown>;

  const MORAL_LIFE_TOOLS = [
    'moral_roundtable', 'moral_companion', 'moral_credit', 'moral_training_camp',
    'moral_decision_support', 'moral_wallet', 'life_monetization', 'daoist_town', 'wasteland'
  ] as const;
  type MoralLifeToolName = typeof MORAL_LIFE_TOOLS[number];

  switch (toolName as ToolName | MoralLifeToolName) {
    case 'get_profile':
      return await fetchWithToken(token, API_ENDPOINTS.profile);

    case 'search_memories': {
      const keyword = validatedArgs.keyword as string;
      const pageNo = validatedArgs.pageNo as number || 1;
      const pageSize = validatedArgs.pageSize as number || 20;
      const url = new URL(API_ENDPOINTS.memoriesKeySearch);
      url.searchParams.set('keyword', keyword);
      url.searchParams.set('pageNo', String(pageNo));
      url.searchParams.set('pageSize', String(pageSize));
      return await fetchWithToken(token, url.pathname + url.search);
    }

    case 'create_memory': {
      const content = validatedArgs.content as string;
      const visibility = validatedArgs.visibility as number || 1;
      return await fetchWithToken(token, API_ENDPOINTS.memoriesKey, {
        method: 'POST',
        body: JSON.stringify({ mode: 'direct', content, visibility }),
      });
    }

    case 'discover_users': {
      const pageNo = validatedArgs.pageNo as number || 1;
      const pageSize = validatedArgs.pageSize as number || 20;
      const circleType = validatedArgs.circleType as string | undefined;
      const url = new URL(API_ENDPOINTS.discoverUsers);
      url.searchParams.set('pageNo', String(pageNo));
      url.searchParams.set('pageSize', String(pageSize));
      if (circleType) url.searchParams.set('circleType', circleType);
      return await fetchWithToken(token, url.pathname + url.search);
    }

    case 'get_matching_score': {
      const targetUsername = validatedArgs.targetUsername as string;
      return await fetchWithToken(token, `${API_ENDPOINTS.discoverUsers}?keyword=${encodeURIComponent(targetUsername)}&pageSize=1`);
    }

    case 'dao_daily_guidance': {
      const date = validatedArgs.date as string | undefined;
      const topic = validatedArgs.topic as string | undefined;
      const mood = validatedArgs.mood as string | undefined;
      const cacheKey = `daily:${date || 'today'}:${topic || ''}:${mood || ''}`;
      return await cachedFetch(cacheKey, async () => getDailyGuidance({ date, topic, mood }));
    }

    case 'dao_topic_guidance': {
      const topic = validatedArgs.topic as string;
      const context = validatedArgs.context as string | undefined;
      const mood = validatedArgs.mood as string | undefined;
      return await getTopicGuidance({ topic, context, mood });
    }

    case 'dao_quotes_list': {
      const theme = validatedArgs.theme as string | undefined;
      const limit = validatedArgs.limit as number || 20;
      const cacheKey = `quotes:${theme || 'all'}:${limit}`;
      return await cachedFetch(cacheKey, async () => listQuotes({ theme, limit }));
    }

    case 'dao_save_daily_guidance_memory': {
      const date = validatedArgs.date as string | undefined;
      const topic = validatedArgs.topic as string | undefined;
      const mood = validatedArgs.mood as string | undefined;
      const visibility = validatedArgs.visibility as number || 1;
      return await saveGuidanceAsMemory({ token, date, topic, mood, visibility, fetchWithToken });
    }

    case 'moral_roundtable': {
      const dilemma = validatedArgs.dilemma as string;
      const agents = validatedArgs.agents as any[] || ['daoist', 'confucian', 'philosopher'];
      const focus = validatedArgs.focus as string | undefined;
      return createRoundTableSession({ dilemma, agents, focus });
    }

    case 'moral_companion': {
      const action = validatedArgs.action as string;
      const userId = validatedArgs.userId as string;
      const companionId = validatedArgs.companionId as any;
      const sessionKey = `${userId}:${companionId}`;

      switch (action) {
        case 'get_session': {
          if (!inMemoryStorage.companionSessions.has(sessionKey)) {
            inMemoryStorage.companionSessions.set(sessionKey, createCompanionSession({ userId, companionId }));
          }
          return inMemoryStorage.companionSessions.get(sessionKey);
        }
        case 'add_journal': {
          if (!inMemoryStorage.companionSessions.has(sessionKey)) {
            inMemoryStorage.companionSessions.set(sessionKey, createCompanionSession({ userId, companionId }));
          }
          const session = inMemoryStorage.companionSessions.get(sessionKey);
          inMemoryStorage.companionSessions.set(sessionKey, addJournalEntry(session, { content: validatedArgs.content as string, reflection: validatedArgs.reflection as string }));
          return inMemoryStorage.companionSessions.get(sessionKey);
        }
        case 'add_milestone': {
          if (!inMemoryStorage.companionSessions.has(sessionKey)) {
            inMemoryStorage.companionSessions.set(sessionKey, createCompanionSession({ userId, companionId }));
          }
          const session2 = inMemoryStorage.companionSessions.get(sessionKey);
          inMemoryStorage.companionSessions.set(sessionKey, addMilestone(session2, { event: validatedArgs.event as string, insight: validatedArgs.insight as string }));
          return inMemoryStorage.companionSessions.get(sessionKey);
        }
        case 'update_trust': {
          if (!inMemoryStorage.companionSessions.has(sessionKey)) {
            inMemoryStorage.companionSessions.set(sessionKey, createCompanionSession({ userId, companionId }));
          }
          const session3 = inMemoryStorage.companionSessions.get(sessionKey);
          inMemoryStorage.companionSessions.set(sessionKey, updateTrustLevel(session3, validatedArgs.newTrust as any));
          return inMemoryStorage.companionSessions.get(sessionKey);
        }
        case 'get_greeting': {
          return generateGreeting(companionId);
        }
        case 'get_weekly_report': {
          if (!inMemoryStorage.companionSessions.has(sessionKey)) {
            inMemoryStorage.companionSessions.set(sessionKey, createCompanionSession({ userId, companionId }));
          }
          return generateWeeklyReport(inMemoryStorage.companionSessions.get(sessionKey));
        }
        default:
          throw new ValidationError(`Unknown action: ${action}`);
      }
    }

    case 'moral_credit': {
      const action = validatedArgs.action as string;
      const userId = validatedArgs.userId as string;
      const profileKey = `credit:${userId}`;

      switch (action) {
        case 'get_profile': {
          if (!inMemoryStorage.moralCreditProfiles.has(profileKey)) {
            inMemoryStorage.moralCreditProfiles.set(profileKey, createMoralCreditProfile(userId));
          }
          return inMemoryStorage.moralCreditProfiles.get(profileKey);
        }
        case 'add_evidence': {
          if (!inMemoryStorage.moralCreditProfiles.has(profileKey)) {
            inMemoryStorage.moralCreditProfiles.set(profileKey, createMoralCreditProfile(userId));
          }
          const profile = inMemoryStorage.moralCreditProfiles.get(profileKey);
          inMemoryStorage.moralCreditProfiles.set(profileKey, addDimensionEvidence(profile, validatedArgs.dimension as any, validatedArgs.evidence as string));
          return inMemoryStorage.moralCreditProfiles.get(profileKey);
        }
        case 'update_trend': {
          if (!inMemoryStorage.moralCreditProfiles.has(profileKey)) {
            inMemoryStorage.moralCreditProfiles.set(profileKey, createMoralCreditProfile(userId));
          }
          const profile2 = inMemoryStorage.moralCreditProfiles.get(profileKey);
          inMemoryStorage.moralCreditProfiles.set(profileKey, updateDimensionTrend(profile2, validatedArgs.dimension as any, validatedArgs.trend as any));
          return inMemoryStorage.moralCreditProfiles.get(profileKey);
        }
        case 'apply_decay': {
          if (!inMemoryStorage.moralCreditProfiles.has(profileKey)) {
            inMemoryStorage.moralCreditProfiles.set(profileKey, createMoralCreditProfile(userId));
          }
          const profile3 = inMemoryStorage.moralCreditProfiles.get(profileKey);
          inMemoryStorage.moralCreditProfiles.set(profileKey, applyNaturalDecay(profile3, validatedArgs.inactiveDays as number || 0));
          return inMemoryStorage.moralCreditProfiles.get(profileKey);
        }
        default:
          throw new ValidationError(`Unknown action: ${action}`);
      }
    }

    case 'moral_training_camp': {
      const action = validatedArgs.action as string;

      switch (action) {
        case 'list_scenarios': {
          return getScenarios({ type: validatedArgs.scenarioType as any, difficulty: validatedArgs.difficulty as any, theme: validatedArgs.theme as string });
        }
        case 'get_scenario': {
          const { getScenarioById } = await import('../moral-life');
          return getScenarioById(validatedArgs.scenarioId as string);
        }
        case 'submit_choice': {
          return processUserChoice({ scenarioId: validatedArgs.scenarioId as string, choiceId: validatedArgs.choiceId as string });
        }
        default:
          throw new ValidationError(`Unknown action: ${action}`);
      }
    }

    case 'moral_decision_support': {
      const decision = validatedArgs.decision as string;
      const context = validatedArgs.context as string | undefined;
      const agents = validatedArgs.agents as any[] || ['daoist', 'confucian', 'philosopher'];
      return createRoundTableSession({ dilemma: decision, agents, focus: context });
    }

    case 'moral_wallet': {
      const action = validatedArgs.action as string;
      const userId = validatedArgs.userId as string;
      const walletKey = `wallet:${userId}`;

      switch (action) {
        case 'get_balance':
        case 'get_summary': {
          if (!inMemoryStorage.moralWallets.has(walletKey)) {
            return { error: '钱包不存在，请先创建钱包' };
          }
          return getWalletSummary(inMemoryStorage.moralWallets.get(walletKey));
        }
        case 'create_wallet': {
          const wallet = createMoralWallet({ userId, name: validatedArgs.name as string || '道德修行者', level: validatedArgs.newLevel as any || '闻道' });
          inMemoryStorage.moralWallets.set(walletKey, wallet);
          return wallet;
        }
        case 'earn_merit': {
          if (!inMemoryStorage.moralWallets.has(walletKey)) {
            return { error: '钱包不存在，请先创建钱包' };
          }
          const wallet2 = inMemoryStorage.moralWallets.get(walletKey);
          inMemoryStorage.moralWallets.set(walletKey, addMeritTransaction(wallet2, { source: validatedArgs.source as any, note: validatedArgs.note as string }));
          return getWalletSummary(inMemoryStorage.moralWallets.get(walletKey));
        }
        case 'spend_merit': {
          if (!inMemoryStorage.moralWallets.has(walletKey)) {
            return { error: '钱包不存在，请先创建钱包' };
          }
          const wallet3 = inMemoryStorage.moralWallets.get(walletKey);
          inMemoryStorage.moralWallets.set(walletKey, addMeritTransaction(wallet3, { source: validatedArgs.source as any, customAmount: -(validatedArgs.amount as number), note: validatedArgs.note as string }));
          return getWalletSummary(inMemoryStorage.moralWallets.get(walletKey));
        }
        case 'donate': {
          if (!inMemoryStorage.moralWallets.has(walletKey)) {
            return { error: '钱包不存在，请先创建钱包' };
          }
          const wallet4 = inMemoryStorage.moralWallets.get(walletKey);
          inMemoryStorage.moralWallets.set(walletKey, makeDonation(wallet4, { amount: validatedArgs.amount as number, recipient: validatedArgs.recipient as string, isAnonymous: validatedArgs.isAnonymous as boolean, note: validatedArgs.note as string }));
          return getWalletSummary(inMemoryStorage.moralWallets.get(walletKey));
        }
        case 'use_trust_quota': {
          if (!inMemoryStorage.moralWallets.has(walletKey)) {
            return { error: '钱包不存在，请先创建钱包' };
          }
          const wallet5 = inMemoryStorage.moralWallets.get(walletKey);
          const result = useTrustQuota(wallet5, validatedArgs.amount as number);
          inMemoryStorage.moralWallets.set(walletKey, result.wallet);
          return result;
        }
        case 'upgrade_level': {
          if (!inMemoryStorage.moralWallets.has(walletKey)) {
            return { error: '钱包不存在，请先创建钱包' };
          }
          const wallet6 = inMemoryStorage.moralWallets.get(walletKey);
          inMemoryStorage.moralWallets.set(walletKey, upgradeLevel(wallet6, validatedArgs.newLevel as any));
          return getWalletSummary(inMemoryStorage.moralWallets.get(walletKey));
        }
        default:
          throw new ValidationError(`Unknown action: ${action}`);
      }
    }

    case 'life_monetization': {
      return { message: '人生变现服务开发中，敬请期待' };
    }

    case 'daoist_town': {
      const action = validatedArgs.action as string;
      const userId = validatedArgs.userId as string;
      const stateKey = `world:${userId}`;

      switch (action) {
        case 'get_characters': {
          return getTownCharacters();
        }
        case 'get_zones': {
          const zones = getAllZones().map(z => getZoneInfo(z as any));
          return zones;
        }
        case 'get_narrative': {
          return getTownNarrative();
        }
        case 'get_state': {
          if (!inMemoryStorage.worldStates.has(stateKey)) {
            inMemoryStorage.worldStates.set(stateKey, createInitialWorldState(userId));
          }
          return inMemoryStorage.worldStates.get(stateKey);
        }
        case 'create_experience': {
          if (!inMemoryStorage.worldStates.has(stateKey)) {
            inMemoryStorage.worldStates.set(stateKey, createInitialWorldState(userId));
          }
          const state = inMemoryStorage.worldStates.get(stateKey);
          const experience = createTownExperience({
            userId,
            zone: validatedArgs.zone as any,
            character: validatedArgs.character as string,
            activity: validatedArgs.activity as string,
            content: validatedArgs.content as string,
            emotionalResonance: validatedArgs.emotionalResonance as number,
          });
          inMemoryStorage.worldStates.set(stateKey, evolveWorldState(state, experience));
          return experience;
        }
        case 'enter_zone': {
          if (!inMemoryStorage.worldStates.has(stateKey)) {
            inMemoryStorage.worldStates.set(stateKey, createInitialWorldState(userId));
          }
          const state2 = inMemoryStorage.worldStates.get(stateKey);
          const zoneInfo = getZoneInfo(validatedArgs.zone as any);
          return { state: { ...state2, currentZone: validatedArgs.zone }, zoneInfo, enterQuote: getEnterQuote() };
        }
        default:
          throw new ValidationError(`Unknown action: ${action}`);
      }
    }

    case 'wasteland': {
      const action = validatedArgs.action as string;
      const userId = validatedArgs.userId as string;
      const stateKey = `world:${userId}`;

      switch (action) {
        case 'get_zones': {
          return getWastelandZones();
        }
        case 'can_enter': {
          if (!inMemoryStorage.worldStates.has(stateKey)) {
            inMemoryStorage.worldStates.set(stateKey, createInitialWorldState(userId));
          }
          const state = inMemoryStorage.worldStates.get(stateKey);
          return { canEnter: canEnterWasteland(state, validatedArgs.zone as any), zone: validatedArgs.zone };
        }
        case 'enter': {
          if (!inMemoryStorage.worldStates.has(stateKey)) {
            inMemoryStorage.worldStates.set(stateKey, createInitialWorldState(userId));
          }
          const state2 = inMemoryStorage.worldStates.get(stateKey);
          if (!canEnterWasteland(state2, validatedArgs.zone as any)) {
            return { error: '境界不足，无法进入该区域' };
          }
          return { narrative: getEntryNarrative(), returnQuote: getReturnQuote() };
        }
        case 'meditate': {
          if (!inMemoryStorage.worldStates.has(stateKey)) {
            inMemoryStorage.worldStates.set(stateKey, createInitialWorldState(userId));
          }
          const state3 = inMemoryStorage.worldStates.get(stateKey);
          const result = processWastelandMeditation(state3, validatedArgs.durationMinutes as number || 30);
          inMemoryStorage.worldStates.set(stateKey, result.newState);
          return result;
        }
        case 'get_wisdom': {
          return { wisdom: getGuardianWisdom(), meditation: getMeditationNarrative() };
        }
        default:
          throw new ValidationError(`Unknown action: ${action}`);
      }
    }
  }
}

async function handleRequest(token: string, request: MCPRequest): Promise<MCPResponse> {
  const response: MCPResponse = {
    jsonrpc: '2.0',
    id: request.id,
  };

  try {
    if (request.method === 'tools/list') {
      response.result = { tools: await handleToolsList(token) };
    } else if (request.method === 'tools/call') {
      const toolName = request.params?.name;
      const args = request.params?.arguments || {};
      if (!toolName) {
        throw new Error('Tool name is required');
      }
      const result = await handleToolCall(token, toolName, args);
      response.result = { content: [{ type: 'text', text: JSON.stringify(result) }] };
    } else {
      throw new Error(`Method not found: ${request.method}`);
    }
  } catch (error) {
    response.error = handleError(error);
  }

  return response;
}

function parseBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (corsMiddleware(req, res)) return;

  const url = new URL(req.url || '/', 'http://localhost');

  if (url.pathname === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  const authHeader = req.headers.authorization;
  const token = extractBearerToken(authHeader);

  if (!token) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Missing or invalid Authorization header' }));
    return;
  }

  if (url.pathname === '/mcp') {
    if (req.method === 'POST') {
      try {
        const body = await parseBody(req);
        const request = JSON.parse(body) as MCPRequest;
        const response = await handleRequest(token, request);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          jsonrpc: '2.0',
          id: 0,
          error: { code: -32700, message: 'Parse error' },
        }));
      }
    } else if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        jsonrpc: '2.0',
        id: 0,
        result: { tools: [] },
      }));
    } else {
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Method not allowed' }));
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

const rawPort = Number(process.env.MCP_PORT || process.env.PORT || 3000);
const PORT = Number.isFinite(rawPort)
  ? Math.max(1, Math.min(65535, Math.trunc(rawPort)))
  : 3000;

server.listen(PORT, () => {
  logger.info({ port: PORT }, `A2A Personal Agent MCP Server running on port ${PORT}`);
  logger.info({ endpoint: `http://localhost:${PORT}/mcp` }, 'MCP endpoint');
});

export { server };
