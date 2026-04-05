import { z } from 'zod';

export const MCPRequestSchema = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.union([z.string(), z.number()]),
  method: z.string(),
  params: z.object({
    name: z.string().optional(),
    arguments: z.record(z.unknown()).optional(),
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
      const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
      return { valid: false, error: messages };
    }
    return { valid: false, error: 'Validation failed' };
  }
}
