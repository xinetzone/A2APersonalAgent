---
name: agentpit-tokens
description: 在 AgentPit 项目中生成 token 消耗上报接口，包含 Prisma model 和 API 路由
user-invocable: true
---

# AgentPit Token 消耗上报

在 AgentPit 项目中生成完整的 token 消耗上报功能，包含 Prisma 数据模型和 API 路由。

---

## 生成文件列表

本 Skill 生成以下文件：

```
prisma/schema.prisma                       # 新增 TokenUsage model
app/api/agentpit/tokens/route.ts            # Token 上报 API 端点
app/api/agentpit/tokens/stats/route.ts      # Token 统计查询端点
app/api/agentpit/tokens/report/route.ts     # Token 报表端点（可选）
```

---

## Prisma Model

### TokenUsage Model

在 `prisma/schema.prisma` 中新增：

```prisma
model TokenUsage {
  id          String   @id @default(cuid())
  userId      String   @map("user_id")
  sessionId   String?  @map("session_id")
  model       String
  promptTokens    Int    @map("prompt_tokens")
  completionTokens Int    @map("completion_tokens")
  totalTokens     Int    @map("total_tokens")
  costUsd     Decimal? @map("cost_usd") @db.Decimal(10, 6)
  costCny     Decimal? @map("cost_cny") @db.Decimal(10, 6)
  latencyMs   Int?      @map("latency_ms")
  endpoint    String?
  metadata    Json?
  createdAt   DateTime @default(now()) @map("created_at")

  @@index([userId, createdAt])
  @@index([sessionId])
  @@index([model])
  @@map("token_usage")
}
```

**字段说明：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `userId` | String | 用户 ID |
| `sessionId` | String? | 会话 ID（可选） |
| `model` | String | 模型名称，如 `gpt-4o`、`claude-3-opus` |
| `promptTokens` | Int | 提示词 token 数量 |
| `completionTokens` | Int | 回复 token 数量 |
| `totalTokens` | Int | 总 token 数量 |
| `costUsd` | Decimal? | 美元成本 |
| `costCny` | Decimal? | 人民币成本 |
| `latencyMs` | Int? | 请求延迟（毫秒） |
| `endpoint` | String? | API 端点 |
| `metadata` | Json? | 额外元数据 |
| `createdAt` | DateTime | 创建时间 |

### AgentPitTokenQuota Model（可选，配额管理）

```prisma
model AgentPitTokenQuota {
  id          String   @id @default(cuid())
  userId      String   @unique @map("user_id")
  monthlyLimit Int     @default(100000) @map("monthly_limit")
  monthlyUsed  Int      @default(0) @map("monthly_used")
  resetAt     DateTime @map("reset_at")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@map("agentpit_token_quota")
}
```

---

## API 路由

### 1. Token 上报端点 `app/api/agentpit/tokens/route.ts`

实现 `POST /api/agentpit/tokens`：

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Token 成本计算（单位：美元）
const TOKEN_COSTS: Record<string, { prompt: number; completion: number }> = {
  'gpt-4o': { prompt: 5.0 / 1_000_000, completion: 15.0 / 1_000_000 },
  'gpt-4o-mini': { prompt: 0.15 / 1_000_000, completion: 0.60 / 1_000_000 },
  'claude-3-opus': { prompt: 15.0 / 1_000_000, completion: 75.0 / 1_000_000 },
  'claude-3-sonnet': { prompt: 3.0 / 1_000_000, completion: 15.0 / 1_000_000 },
  'claude-3-haiku': { prompt: 0.25 / 1_000_000, completion: 1.25 / 1_000_000 },
  'default': { prompt: 1.0 / 1_000_000, completion: 2.0 / 1_000_000 },
};

function calculateCost(model: string, promptTokens: number, completionTokens: number) {
  const costs = TOKEN_COSTS[model] || TOKEN_COSTS['default'];
  const usdCost = (promptTokens * costs.prompt) + (completionTokens * costs.completion);
  const cnyCost = usdCost * 7.2; // 假设 USD/CNY 汇率
  return { costUsd: parseFloat(usdCost.toFixed(6)), costCny: parseFloat(cnyCost.toFixed(6)) };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      sessionId,
      model,
      promptTokens,
      completionTokens,
      totalTokens,
      latencyMs,
      endpoint,
      metadata,
    } = body;

    // 参数验证
    if (!userId || !model || typeof promptTokens !== 'number' || typeof completionTokens !== 'number') {
      return NextResponse.json(
        { error: 'missing_required_fields' },
        { status: 400 }
      );
    }

    const actualTotal = totalTokens || (promptTokens + completionTokens);
    const { costUsd, costCny } = calculateCost(model, promptTokens, completionTokens);

    const record = await prisma.tokenUsage.create({
      data: {
        userId,
        sessionId: sessionId || null,
        model,
        promptTokens,
        completionTokens,
        totalTokens: actualTotal,
        costUsd,
        costCny,
        latencyMs: latencyMs || null,
        endpoint: endpoint || null,
        metadata: metadata || null,
      },
    });

    return NextResponse.json({
      success: true,
      id: record.id,
      costUsd,
      costCny,
    });
  } catch (error) {
    console.error('Token usage report error:', error);
    return NextResponse.json(
      { error: 'internal_server_error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/agentpit/tokens',
    method: 'POST',
    description: '上报 token 消耗记录',
  });
}
```

### 2. Token 统计端点 `app/api/agentpit/tokens/stats/route.ts`

实现 `GET /api/agentpit/tokens/stats`：

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('userId');
  const period = searchParams.get('period') || 'month'; // day, week, month, all

  if (!userId) {
    return NextResponse.json({ error: 'missing_userId' }, { status: 400 });
  }

  // 计算时间范围
  const now = new Date();
  let startDate: Date;

  switch (period) {
    case 'day':
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'all':
    default:
      startDate = new Date(0);
  }

  const [totalStats, modelBreakdown, dailyStats] = await Promise.all([
    // 总体统计
    prisma.tokenUsage.aggregate({
      where: { userId, createdAt: { gte: startDate } },
      _sum: { promptTokens: true, completionTokens: true, totalTokens: true },
      _count: true,
    }),

    // 按模型分类
    prisma.tokenUsage.groupBy({
      by: ['model'],
      where: { userId, createdAt: { gte: startDate } },
      _sum: { totalTokens: true, promptTokens: true, completionTokens: true },
    }),

    // 每日统计
    prisma.$queryRaw<Array<{ date: string; total: bigint; prompt: bigint; completion: bigint }>>`
      SELECT
        DATE(created_at) as date,
        SUM(total_tokens) as total,
        SUM(prompt_tokens) as prompt,
        SUM(completion_tokens) as completion
      FROM token_usage
      WHERE user_id = ${userId}
        AND created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `,
  ]);

  return NextResponse.json({
    period,
    total: {
      promptTokens: totalStats._sum.promptTokens || 0,
      completionTokens: totalStats._sum.completionTokens || 0,
      totalTokens: totalStats._sum.totalTokens || 0,
      requestCount: totalStats._count,
    },
    byModel: modelBreakdown.map((m) => ({
      model: m.model,
      totalTokens: m._sum.totalTokens || 0,
      promptTokens: m._sum.promptTokens || 0,
      completionTokens: m._sum.completionTokens || 0,
    })),
    daily: dailyStats.map((d) => ({
      date: d.date,
      totalTokens: Number(d.total),
      promptTokens: Number(d.prompt),
      completionTokens: Number(d.completion),
    })),
  });
}
```

### 3. 批量上报端点 `app/api/agentpit/tokens/batch/route.ts`（可选）

实现 `POST /api/agentpit/tokens/batch`：

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { records } = body;

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ error: 'invalid_records' }, { status: 400 });
    }

    if (records.length > 100) {
      return NextResponse.json({ error: 'batch_too_large' }, { status: 400 });
    }

    const created = await prisma.tokenUsage.createMany({
      data: records.map((r) => ({
        userId: r.userId,
        sessionId: r.sessionId || null,
        model: r.model,
        promptTokens: r.promptTokens,
        completionTokens: r.completionTokens,
        totalTokens: r.totalTokens || (r.promptTokens + r.completionTokens),
        costUsd: r.costUsd || null,
        costCny: r.costCny || null,
        latencyMs: r.latencyMs || null,
        endpoint: r.endpoint || null,
        metadata: r.metadata || null,
      })),
    });

    return NextResponse.json({ success: true, count: created.count });
  } catch (error) {
    console.error('Batch token report error:', error);
    return NextResponse.json({ error: 'internal_server_error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
```

---

## 前端集成示例

### 在 AI 请求中上报 Token

```typescript
// lib/token-reporter.ts
export async function reportTokenUsage(data: {
  userId: string;
  sessionId?: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  latencyMs?: number;
}) {
  try {
    await fetch('/api/agentpit/tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch (err) {
    console.error('Failed to report token usage:', err);
  }
}
```

### 在页面中展示 Token 统计

```typescript
// app/profile/tokens/page.tsx
'use client';

import { useEffect, useState } from 'react';

export default function TokenStatsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = 'current-user-id'; // 从 auth context 获取
    fetch(`/api/agentpit/tokens/stats?userId=${userId}&period=month`)
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>加载中...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Token 使用统计</h1>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded shadow">
          <div className="text-gray-500 text-sm">本月 Prompt Tokens</div>
          <div className="text-2xl font-bold">{stats?.total?.promptTokens?.toLocaleString()}</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="text-gray-500 text-sm">本月 Completion Tokens</div>
          <div className="text-2xl font-bold">{stats?.total?.completionTokens?.toLocaleString()}</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="text-gray-500 text-sm">本月总 Tokens</div>
          <div className="text-2xl font-bold">{stats?.total?.totalTokens?.toLocaleString()}</div>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-bold mb-4">按模型分布</h2>
        {stats?.byModel?.map((m: any) => (
          <div key={m.model} className="flex justify-between py-2 border-b last:border-0">
            <span>{m.model}</span>
            <span>{m.totalTokens.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 实施步骤

1. **更新 Prisma Schema**
   - 将 `TokenUsage` model 添加到 `prisma/schema.prisma`
   - 运行 `npx prisma generate`
   - 运行 `npx prisma db push`（开发）或生成迁移 `npx prisma migrate dev`

2. **创建 API 路由**
   - 创建 `app/api/agentpit/tokens/route.ts`
   - 创建 `app/api/agentpit/tokens/stats/route.ts`
   - （可选）创建 `app/api/agentpit/tokens/batch/route.ts`

3. **集成到现有代码**
   - 在 AI 请求的响应处理中添加 `reportTokenUsage` 调用

4. **创建统计页面**（可选）
   - 创建 `app/profile/tokens/page.tsx` 展示 Token 统计

---

## 报表端点 `app/api/agentpit/tokens/report/route.ts`（可选）

实现月度报表生成：

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('userId');
  const month = searchParams.get('month'); // 格式: 2026-04

  if (!userId || !month) {
    return NextResponse.json({ error: 'missing_parameters' }, { status: 400 });
  }

  const [year, monthNum] = month.split('-').map(Number);
  const startDate = new Date(year, monthNum - 1, 1);
  const endDate = new Date(year, monthNum, 0, 23, 59, 59);

  const records = await prisma.tokenUsage.findMany({
    where: { userId, createdAt: { gte: startDate, lte: endDate } },
    orderBy: { createdAt: 'asc' },
  });

  const totalCost = records.reduce((sum, r) => sum + (r.costUsd || 0), 0);

  return NextResponse.json({
    userId,
    month,
    totalRequests: records.length,
    totalTokens: records.reduce((sum, r) => sum + r.totalTokens, 0),
    totalCostUsd: parseFloat(totalCost.toFixed(6)),
    records: records.map((r) => ({
      date: r.createdAt.toISOString(),
      model: r.model,
      tokens: r.totalTokens,
      costUsd: r.costUsd,
    })),
  });
}
```

---

## 注意事项

1. **成本计算**：当前成本基于估算，实际成本请参考各 AI 提供商的定价
2. **批量上报**：建议在生产环境中使用批量上报以减少 API 调用
3. **数据保留**：定期清理或归档历史数据
4. **隐私合规**：确保 Token 使用数据的收集符合当地隐私法规
