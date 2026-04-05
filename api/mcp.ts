import type { VercelRequest, VercelResponse } from '@vercel/node';

const SECONDME_API_BASE = 'https://app.mindos.com/gate/in/rest/third-party-agent/v1';

const API_ENDPOINTS = {
  profile: `${SECONDME_API_BASE}/profile`,
  memoriesKey: `${SECONDME_API_BASE}/memories/key`,
  memoriesKeySearch: `${SECONDME_API_BASE}/memories/key/search`,
  discoverUsers: `${SECONDME_API_BASE}/discover/users`,
};

interface MCPRequest {
  jsonrpc: string;
  id: string | number;
  method: string;
  params?: {
    name?: string;
    arguments?: Record<string, unknown>;
  };
}

function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
}

async function fetchWithToken(token: string, endpoint: string, options: RequestInit = {}): Promise<unknown> {
  const response = await fetch(endpoint, {
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

async function handleToolsList(): Promise<unknown[]> {
  return [
    {
      name: 'get_profile',
      description: '获取当前用户的 Profile 信息',
      inputSchema: { type: 'object', properties: {} },
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
      description: '生成一条"道德经（帛书版）"风格的今日箴言与行动建议',
      inputSchema: {
        type: 'object',
        properties: {
          date: { type: 'string', description: '日期（YYYY-MM-DD），默认今天' },
          topic: { type: 'string', description: '主题/困惑，如"焦虑""关系""工作"' },
          mood: { type: 'string', description: '情绪，如"低落""烦躁""平静"' },
        },
      },
    },
    {
      name: 'dao_topic_guidance',
      description: '针对特定主题或困惑，从帛书版道德经中寻找启示',
      inputSchema: {
        type: 'object',
        properties: {
          topic: { type: 'string', description: '主题/困惑' },
          context: { type: 'string', description: '背景说明（可选）' },
          mood: { type: 'string', description: '当前情绪（可选）' },
        },
        required: ['topic'],
      },
    },
    {
      name: 'dao_quotes_list',
      description: '获取道德经（帛书版）箴言列表',
      inputSchema: {
        type: 'object',
        properties: {
          theme: { type: 'string', description: '主题筛选，如"上善若水""无为而治"' },
          limit: { type: 'number', description: '返回数量，默认20' },
        },
      },
    },
    {
      name: 'dao_save_daily_guidance_memory',
      description: '将今日箴言保存为记忆',
      inputSchema: {
        type: 'object',
        properties: {
          date: { type: 'string', description: '日期（YYYY-MM-DD）' },
          topic: { type: 'string', description: '主题' },
          mood: { type: 'string', description: '情绪' },
          visibility: { type: 'number', description: '可见性，1为私有，2为公开' },
        },
      },
    },
  ];
}

async function handleToolCall(token: string, toolName: string, args: Record<string, unknown> = {}): Promise<unknown> {
  switch (toolName) {
    case 'get_profile':
      return await fetchWithToken(token, API_ENDPOINTS.profile);

    case 'search_memories': {
      const keyword = args.keyword as string;
      const pageNo = (args.pageNo as number) || 1;
      const pageSize = (args.pageSize as number) || 20;
      const url = new URL(API_ENDPOINTS.memoriesKeySearch);
      url.searchParams.set('keyword', keyword);
      url.searchParams.set('pageNo', String(pageNo));
      url.searchParams.set('pageSize', String(pageSize));
      return await fetchWithToken(token, url.toString());
    }

    case 'create_memory': {
      const content = args.content as string;
      const visibility = (args.visibility as number) || 1;
      return await fetchWithToken(token, API_ENDPOINTS.memoriesKey, {
        method: 'POST',
        body: JSON.stringify({ mode: 'direct', content, visibility }),
      });
    }

    case 'discover_users': {
      const pageNo = (args.pageNo as number) || 1;
      const pageSize = (args.pageSize as number) || 20;
      const circleType = args.circleType as string | undefined;
      const url = new URL(API_ENDPOINTS.discoverUsers);
      url.searchParams.set('pageNo', String(pageNo));
      url.searchParams.set('pageSize', String(pageSize));
      if (circleType) url.searchParams.set('circleType', circleType);
      return await fetchWithToken(token, url.toString());
    }

    case 'get_matching_score': {
      const targetUsername = args.targetUsername as string;
      const url = new URL(API_ENDPOINTS.discoverUsers);
      url.searchParams.set('keyword', encodeURIComponent(targetUsername));
      url.searchParams.set('pageSize', '1');
      return await fetchWithToken(token, url.toString());
    }

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    const tools = await handleToolsList();
    res.status(200).json({ jsonrpc: '2.0', id: 0, result: { tools } });
    return;
  }

  if (req.method === 'POST') {
    try {
      const request = req.body as MCPRequest;

      if (request.method === 'tools/list') {
        const tools = await handleToolsList();
        res.status(200).json({ jsonrpc: '2.0', id: request.id, result: { tools } });
        return;
      }

      const authHeader = req.headers.authorization;
      const token = extractBearerToken(authHeader);

      if (!token) {
        res.status(401).json({ error: 'Missing or invalid Authorization header' });
        return;
      }

      if (request.method === 'tools/call') {
        const toolName = request.params?.name;
        const args = request.params?.arguments || {};

        if (!toolName) {
          res.status(400).json({ jsonrpc: '2.0', id: request.id, error: { code: -32602, message: 'Invalid params' } });
          return;
        }

        const result = await handleToolCall(token, toolName, args);
        res.status(200).json({ jsonrpc: '2.0', id: request.id, result: { content: [{ type: 'text', text: JSON.stringify(result) }] } });
      } else {
        res.status(400).json({ jsonrpc: '2.0', id: request.id, error: { code: -32601, message: 'Method not found' } });
      }
    } catch (error) {
      res.status(500).json({ jsonrpc: '2.0', id: 0, error: { code: -32603, message: error instanceof Error ? error.message : 'Internal error' } });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}