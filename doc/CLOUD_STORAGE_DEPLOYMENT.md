# Vercel 云存储部署指南

本文档说明如何为 A2A Personal Agent 项目配置和使用 Vercel 云存储解决方案。

## 目录

- [概述](#概述)
- [支持的云存储提供商](#支持的云存储提供商)
- [环境变量配置](#环境变量配置)
- [Vercel KV 部署步骤](#vercel-kv-部署步骤)
- [Vercel Postgres 部署步骤](#vercel-postgres-部署步骤)
- [存储适配层架构](#存储适配层架构)
- [数据迁移指南](#数据迁移指南)
- [故障排除](#故障排除)
- [性能优化建议](#性能优化建议)

## 概述

项目支持三种存储后端：

| 存储类型 | 用途 | 适用场景 |
|---------|------|---------|
| FileStorage | 本地文件系统 | 开发环境 |
| Vercel KV | Redis 兼容键值存储 | 生产环境（推荐） |
| Vercel Postgres | PostgreSQL 数据库 | 复杂查询场景 |

## 支持的云存储提供商

### Vercel KV

Vercel KV 是一个 Redis 兼容的键值数据库，提供：
- 持久化存储
- 毫秒级读取延迟
- 自动扩展
- 全球复制

### Vercel Postgres

Vercel Postgres 是一个全托管的 PostgreSQL 数据库，提供：
- 强一致性保证
- SQL 查询能力
- 复杂数据结构支持
- 更好的数据关系建模

## 环境变量配置

### Vercel KV 配置

在 Vercel 项目设置中添加以下环境变量：

```bash
# 存储提供者类型
STORAGE_PROVIDER=kv

# Vercel KV 连接信息（ 二选一）
KV_URL=https://xxx.kv.vercel-storage.com
KV_HTTP_API_TOKEN=xxxxxxxxxxxx

# 或使用 Premium API
KV_REST_API_URL=https://xxx.kv.vercel-storage.com
KV_PREMIUM_API_TOKEN=xxxxxxxxxxxx
```

### Vercel Postgres 配置

```bash
# 存储提供者类型
STORAGE_PROVIDER=postgres

# Postgres 连接字符串
POSTGRES_CONNECTION_STRING=postgresql://user:password@host:5432/dbname
POSTGRES_MAX_CONNECTIONS=10
```

### 开发环境配置

创建 `.env.local` 文件：

```bash
# 开发环境使用文件存储（默认）
STORAGE_PROVIDER=file

# 如需使用云存储
STORAGE_PROVIDER=kv
KV_URL=https://your-project.kv.vercel-storage.com
KV_HTTP_API_TOKEN=your-token
```

## Vercel KV 部署步骤

### 1. 创建 Vercel KV 数据库

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 进入您的项目
3. 点击 **Storage** 标签
4. 选择 **Create KV Database**
5. 输入数据库名称（如 `moral-life-storage`）
6. 选择数据保留期限
7. 点击 **Create**

### 2. 获取连接信息

创建完成后，在 Storage 详情页面获取：

- **REST API URL**: `https://xxx.kv.vercel-storage.com`
- **API Token**: 点击 **Create API Token** 生成

### 3. 配置环境变量

在 Vercel 项目设置中配置：

```bash
STORAGE_PROVIDER=kv
KV_URL=<REST_API_URL>
KV_HTTP_API_TOKEN=<API_TOKEN>
```

### 4. 重新部署

配置完环境变量后，重新部署您的项目使配置生效。

## Vercel Postgres 部署步骤

### 1. 创建 Vercel Postgres 数据库

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 进入您的项目
3. 点击 **Storage** 标签
4. 选择 **Create Postgres Database**
5. 输入数据库名称
6. 选择区域（建议选择靠近用户的区域）
7. 点击 **Create**

### 2. 获取连接字符串

在 Storage 详情页面的 **Connection** 选项卡中获取连接字符串：

```bash
postgresql://user:password@host:5432/dbname?sslmode=require
```

### 3. 配置环境变量

```bash
STORAGE_PROVIDER=postgres
POSTGRES_CONNECTION_STRING=<YOUR_CONNECTION_STRING>
POSTGRES_MAX_CONNECTIONS=10
```

### 4. 数据库初始化

系统会自动创建 `storage` 表。表结构如下：

```sql
CREATE TABLE storage (
  key VARCHAR(255) PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_storage_updated_at ON storage(updated_at);
```

## 存储适配层架构

### 架构图

```
┌─────────────────────────────────────────────────────────┐
│                    Application Layer                     │
├─────────────────────────────────────────────────────────┤
│                   Storage Interface                      │
│  ┌─────────────────────────────────────────────────┐   │
│  │          StorageManager (Factory)                 │   │
│  └─────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│                  Cloud Adapters                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  FileStorage │  │  VercelKV   │  │  VercelPG   │  │
│  │  (Local FS)  │  │  (Redis)    │  │  (Postgres) │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
├─────────────────────────────────────────────────────────┤
│                     Vercel Infrastructure                │
└─────────────────────────────────────────────────────────┘
```

### 核心接口

```typescript
interface StorageAdapter<T = unknown> {
  get(key: string): Promise<T | undefined>;
  set(key: string, value: T): Promise<void>;
  has(key: string): Promise<boolean>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
  keys(): Promise<string[]>;
}

interface CloudStorageAdapter<T> extends StorageAdapter<T> {
  readonly provider: 'kv' | 'postgres';
  isReady(): boolean;
  close(): Promise<void>;
  getMetrics(): StorageMetrics;
}
```

### 命名空间隔离

系统使用命名空间隔离不同类型的数据：

| 命名空间 | 用途 |
|---------|------|
| `companion-sessions:*` | 共修伙伴会话数据 |
| `moral-credit:*` | 道德信誉档案 |
| `moral-wallet:*` | 道德钱包数据 |
| `world-state:*` | 虚拟世界状态 |

## 数据迁移指南

### 从文件存储迁移到 Vercel KV

1. **导出本地数据**

```bash
# 数据存储在 ~/.openclaw/data/ 目录
ls ~/.openclaw/data/
# moral-life-data.json
```

2. **转换数据格式**

```bash
# 将 JSON 文件转换为 KV 格式
# 手动或使用脚本批量导入
```

3. **验证迁移**

```bash
# 使用 Vercel CLI 检查
vercel env pull .env.development.local
```

### 从文件存储迁移到 Vercel Postgres

1. **导出本地数据**

```bash
# 同样导出本地 JSON 文件
```

2. **执行迁移脚本**

Postgres adapter 会自动创建表，但需要手动迁移数据：

```sql
-- 批量插入示例
INSERT INTO storage (key, value)
VALUES
  ('companion-sessions:user1:daoist-brother', '{"session": "data"}'),
  ('moral-credit:user1', '{"profile": "data"}')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
```

## 故障排除

### 常见问题

#### 1. 存储连接失败

**症状**: `StorageConnectionError`

**解决方案**:
- 检查环境变量是否正确配置
- 确认 API Token 没有过期
- 验证网络连接

#### 2. 数据读取返回 undefined

**症状**: `StorageReadError`

**解决方案**:
- 检查 key 是否存在
- 验证数据格式是否为有效的 JSON
- 查看 Vercel KV/Postgres 仪表板确认数据已写入

#### 3. 性能问题

**症状**: 读取延迟高

**解决方案**:
- 启用连接池（Postgres）
- 使用批量操作替代多次单条操作
- 考虑添加本地缓存层

### 日志查看

查看 Vercel Functions 日志：

```bash
vercel logs <project-name>
```

或通过 Vercel Dashboard 的 **Functions** 标签查看实时日志。

## 性能优化建议

### Vercel KV

1. **批量操作**: 使用 `mget`/`mset` 替代多次单条操作
2. **Pipeline**: 将多个命令打包发送
3. **Key 设计**: 使用短 key 减少网络开销

```typescript
// 推荐
const values = await kv.mget('key1', 'key2', 'key3');

// 不推荐
const v1 = await kv.get('key1');
const v2 = await kv.get('key2');
const v3 = await kv.get('key3');
```

### Vercel Postgres

1. **连接池**: 合理设置 `POSTGRES_MAX_CONNECTIONS`
2. **索引优化**: 为常用查询添加索引
3. **查询优化**: 避免 SELECT *

```typescript
// 推荐：只查询需要的字段
SELECT key, value FROM storage WHERE key LIKE 'moral-credit:%';

// 不推荐：查询所有字段
SELECT * FROM storage;
```

### 缓存策略

在高并发场景下，考虑添加应用层缓存：

```typescript
import { TimedCache } from '@/utils/cache';

const cache = new TimedCache<string>(60000); // 60秒 TTL

async function getWithCache(key: string) {
  const cached = cache.get(key);
  if (cached) return cached;

  const value = await storage.get(key);
  if (value) cache.set(key, value);
  return value;
}
```

## 安全注意事项

### 环境变量保护

- **永远不要** 将 API Token 提交到版本控制
- 使用 Vercel 的加密环境变量
- 生产环境使用不同的 Token

### 数据安全

- Vercel KV 提供静态加密
- Vercel Postgres 支持 SSL 连接
- 敏感数据考虑额外的加密层

### 访问控制

- 定期轮换 API Token
- 使用最小权限原则创建 Token
- 监控异常访问模式

## 测试

### 本地测试云存储

使用 Vercel CLI 在本地模拟云存储：

```bash
# 拉取环境变量
vercel env pull .env.local

# 运行测试
npm test

# 或运行特定测试
npm test -- --testPathPattern="storage"
```

### 集成测试

```bash
# 运行集成测试
npm run test:integration

# 查看测试覆盖率
npm run test:coverage
```

## 参考资源

- [Vercel KV 文档](https://vercel.com/docs/storage/vercel-kv)
- [Vercel Postgres 文档](https://vercel.com/docs/storage/vercel-postgres)
- [@vercel/kv npm 包](https://www.npmjs.com/package/@vercel/kv)
- [@neondatabase/serverless npm 包](https://www.npmjs.com/package/@neondatabase/serverless)
