import { z } from 'zod';

export const MCPRequestSchema = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.union([z.string(), z.number()]),
  method: z.string(),
  params: z.object({
    name: z.string().optional(),
    arguments: z.record(z.string(), z.unknown()).optional(),
  }).optional(),
});

export const ToolArgumentsSchemas = {
  get_profile: z.object({}),

  search_memories: z.object({
    keyword: z.string().min(1, '关键词不能为空').max(100, '关键词最长100字符'),
    pageNo: z.number().int().positive().default(1),
    pageSize: z.number().int().min(1).max(100).default(20),
  }),

  create_memory: z.object({
    content: z.string().min(1, '内容不能为空').max(10000, '内容最长10000字符'),
    visibility: z.number().int().min(1).max(2).default(1),
  }),

  discover_users: z.object({
    pageNo: z.number().int().positive().default(1),
    pageSize: z.number().int().min(1).max(100).default(20),
    circleType: z.string().optional(),
  }),

  get_matching_score: z.object({
    targetUsername: z.string().min(1, '目标用户名不能为空'),
  }),

  dao_daily_guidance: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式应为YYYY-MM-DD').optional(),
    topic: z.string().max(100).optional(),
    mood: z.string().max(50).optional(),
  }),

  dao_topic_guidance: z.object({
    topic: z.string().min(1, '主题不能为空').max(100),
    context: z.string().max(500).optional(),
    mood: z.string().max(50).optional(),
  }),

  dao_quotes_list: z.object({
    theme: z.string().max(50).optional(),
    limit: z.number().int().min(1).max(100).default(20),
  }),

  dao_save_daily_guidance_memory: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式应为YYYY-MM-DD').optional(),
    topic: z.string().max(100).optional(),
    mood: z.string().max(50).optional(),
    visibility: z.number().int().min(1).max(2).default(1),
  }),

  moral_wallet: z.object({
    action: z.enum(['get_balance', 'get_summary', 'earn_merit', 'spend_merit', 'donate', 'use_trust_quota', 'upgrade_level', 'create_wallet']),
    userId: z.string().min(1, '用户ID不能为空'),
    source: z.string().optional(),
    amount: z.number().optional(),
    recipient: z.string().optional(),
    isAnonymous: z.boolean().optional(),
    note: z.string().optional(),
    newLevel: z.enum(['闻道', '悟道', '行道', '得道', '同道']).optional(),
    name: z.string().optional(),
  }),

  moral_roundtable: z.object({
    dilemma: z.string().min(1, '道德困境描述不能为空'),
    agents: z.array(z.string()).optional(),
    focus: z.string().optional(),
  }),

  daoist_town: z.object({
    action: z.enum(['get_characters', 'get_zones', 'get_narrative', 'create_experience', 'get_state', 'enter_zone']),
    userId: z.string().min(1, '用户ID不能为空'),
    zone: z.enum(['道场', '市集', '山林', '水域', '静室']).optional(),
    character: z.string().optional(),
    activity: z.string().optional(),
    content: z.string().optional(),
    emotionalResonance: z.number().min(1).max(10).optional(),
  }),

  wasteland: z.object({
    action: z.enum(['get_zones', 'can_enter', 'enter', 'meditate', 'get_wisdom']),
    userId: z.string().min(1, '用户ID不能为空'),
    zone: z.enum(['太虚', '玄墟', '浑沌', '无无']).optional(),
    durationMinutes: z.number().optional(),
  }),
} as const;

export type ToolName = keyof typeof ToolArgumentsSchemas;

export function validateToolArguments(toolName: string, args: Record<string, unknown>) {
  const schema = ToolArgumentsSchemas[toolName as ToolName];
  if (!schema) {
    return { valid: false, error: `Unknown tool: ${toolName}` };
  }
  try {
    const result = schema.parse(args);
    return { valid: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
      return { valid: false, error: messages };
    }
    return { valid: false, error: 'Validation failed' };
  }
}
