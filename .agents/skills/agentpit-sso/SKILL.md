---
name: agentpit-sso
description: 为 AgentPit 子应用生成 SSO 自动单点登录功能，包含后端 OAuth 端点、前端回调页和防循环机制
user-invocable: true
---

# AgentPit SSO 单点登录

为 AgentPit 子应用生成完整的 OAuth2 SSO 单点登录功能，包含后端 OAuth 端点、前端回调页、Token 管理和防循环重定向机制。

---

## OAuth2 配置参数

**来自用户提供的凭证：**

| 参数 | 值 |
|------|-----|
| Client ID | `[CLIENT_ID]` |
| Client Secret | `[CLIENT_SECRET]` |
| 登录按钮名称 | 用户自定义（默认：`使用 AgentPit 登录`）|

---

## 生成文件列表

本 Skill 生成以下文件：

```
app/api/auth/agentpit/callback/route.ts   # OAuth 回调端点
app/api/auth/agentpit/token/route.ts      # Token 交换端点
app/login/agentpit/page.tsx               # SSO 登录页（含登录按钮）
app/api/auth/agentpit/sso/route.ts        # SSO 状态查询端点
prisma/schema.prisma                       # 新增 AgentPitUser model（如不存在）
.env.local                                 # 更新 SSO 相关环境变量
```

---

## 后端 OAuth 端点

### 1. 回调端点 `app/api/auth/agentpit/callback/route.ts`

实现 `GET /api/auth/agentpit/callback`：

```typescript
import { NextRequest, NextResponse } from 'next/server';

const CLIENT_ID = process.env.AGENTPIT_CLIENT_ID || '[CLIENT_ID]';
const CLIENT_SECRET = process.env.AGENTPIT_CLIENT_SECRET || '[CLIENT_SECRET]';
const TOKEN_ENDPOINT = 'https://api.mindverse.com/gate/lab/api/oauth/token/code';
const USERINFO_ENDPOINT = 'https://api.mindverse.com/gate/lab/api/user/info';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // 处理 OAuth 错误
  if (error) {
    return NextResponse.redirect(new URL(`/login?error=${error}`, request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_code', request.url));
  }

  // 验证 state 防止 CSRF
  const savedState = request.cookies.get('oauth_state')?.value;
  if (state !== savedState) {
    return NextResponse.redirect(new URL('/login?error=invalid_state', request.url));
  }

  try {
    // 用授权码换 Token
    const tokenRes = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        redirect_uri: `${request.nextUrl.origin}/api/auth/agentpit/callback`,
      }),
    });

    if (!tokenRes.ok) {
      throw new Error('Token exchange failed');
    }

    const tokenData = await tokenRes.json();
    const { access_token, refresh_token, expires_in } = tokenData;

    // 获取用户信息
    const userInfoRes = await fetch(USERINFO_ENDPOINT, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!userInfoRes.ok) {
      throw new Error('Failed to fetch user info');
    }

    const userInfo = await userInfoRes.json();

    // 创建或更新数据库中的用户记录
    // TODO: Prisma 操作（见下方 Prisma Model）

    // 生成 session token
    const sessionToken = crypto.randomUUID();
    const sessionExpiry = Date.now() + (expires_in * 1000);

    // 设置 session cookie
    const response = NextResponse.redirect(new URL('/', request.url));
    response.cookies.set('agentpit_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: expires_in,
    });
    response.cookies.set('agentpit_user', JSON.stringify(userInfo), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: expires_in,
    });

    return response;
  } catch (err) {
    console.error('SSO callback error:', err);
    return NextResponse.redirect(new URL('/login?error=server_error', request.url));
  }
}
```

### 2. Token 交换端点 `app/api/auth/agentpit/token/route.ts`

实现 `POST /api/auth/agentpit/token`（用于refresh token 刷新）：

```typescript
import { NextRequest, NextResponse } from 'next/server';

const CLIENT_ID = process.env.AGENTPIT_CLIENT_ID || '[CLIENT_ID]';
const CLIENT_SECRET = process.env.AGENTPIT_CLIENT_SECRET || '[CLIENT_SECRET]';
const TOKEN_ENDPOINT = 'https://api.mindverse.com/gate/lab/api/oauth/token/code';
const REFRESH_ENDPOINT = 'https://api.mindverse.com/gate/lab/api/oauth/token/refresh';

export async function POST(request: NextRequest) {
  const { refresh_token, grant_type } = await request.json();

  if (!refresh_token) {
    return NextResponse.json({ error: 'missing_refresh_token' }, { status: 400 });
  }

  const endpoint = grant_type === 'refresh_token' ? REFRESH_ENDPOINT : TOKEN_ENDPOINT;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: grant_type || 'refresh_token',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        ...(grant_type === 'refresh_token' ? { refresh_token } : {}),
      }),
    });

    if (!res.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: 'token_refresh_failed' }, { status: 500 });
  }
}
```

### 3. SSO 状态端点 `app/api/auth/agentpit/sso/route.ts`

实现 `GET /api/auth/agentpit/sso`：

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const session = request.cookies.get('agentpit_session')?.value;
  const userStr = request.cookies.get('agentpit_user')?.value;

  if (!session || !userStr) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  try {
    const user = JSON.parse(userStr);
    return NextResponse.json({ authenticated: true, user });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
```

---

## 前端登录页 `app/login/agentpit/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const CLIENT_ID = process.env.NEXT_PUBLIC_AGENTPIT_CLIENT_ID || '[CLIENT_ID]';
const OAUTH_URL = 'https://go.second.me/oauth/';

export default function AgentPitLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buttonLabel = process.env.NEXT_PUBLIC_AGENTPIT_LOGIN_BUTTON || '使用 AgentPit 登录';

  const handleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      const state = crypto.randomUUID();

      // 保存 state 到 cookie 用于回调验证
      document.cookie = `oauth_state=${state}; path=/; max-age=600; SameSite=Lax`;

      const redirectUri = `${window.location.origin}/api/auth/agentpit/callback`;
      const params = new URLSearchParams({
        client_id: CLIENT_ID,
        redirect_uri: redirectUri,
        response_type: 'code',
        state,
      });

      window.location.href = `${OAUTH_URL}?${params.toString()}`;
    } catch (err) {
      setError('启动登录失败，请重试');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">AgentPit 单点登录</h1>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '跳转中...' : buttonLabel}
        </button>

        <p className="text-center text-gray-500 text-sm mt-4">
          点击上方按钮即表示你同意 AgentPit 服务条款
        </p>
      </div>
    </div>
  );
}
```

---

## 防循环重定向机制

### 问题场景

SSO 登录流程中存在多种循环重定向风险：

1. **回调页 → 登录页 → 回调页 → ...**
2. **已有有效 session 的用户访问回调页**
3. **Token 刷新失败导致重复刷新**

### 解决方案

在回调端点加入防循环逻辑：

```typescript
// 在 GET handler 开头加入
export async function GET(request: NextRequest) {
  // 1. 检查是否已有有效 session（避免已登录用户重复授权）
  const existingSession = request.cookies.get('agentpit_session')?.value;
  if (existingSession) {
    // 已有有效 session，直接跳转首页，不走授权流程
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 2. 检查是否在短时间内（30秒）曾访问过回调页（防快速重复）
  const callbackTimestamp = request.cookies.get('callback_timestamp')?.value;
  const now = Date.now();
  if (callbackTimestamp && now - parseInt(callbackTimestamp) < 30000) {
    return NextResponse.redirect(new URL('/login?error=callback_repeated', request.url));
  }

  // 3. 设置回调时间戳
  const response = NextResponse.redirect(new URL('/', request.url));
  response.cookies.set('callback_timestamp', now.toString(), {
    path: '/',
    maxAge: 60,
    sameSite: 'lax',
  });

  // ... 后续正常流程
}
```

---

## Prisma Model（新增到 `prisma/schema.prisma`）

如果项目使用 Prisma，在 schema 中添加：

```prisma
model AgentPitUser {
  id            String   @id @default(cuid())
  openid        String   @unique
  nickname      String?
  avatar        String?
  accessToken   String?
  refreshToken  String?
  tokenExpiry   DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@map("agentpit_users")
}
```

**注意：** 将 `@db.Text` 用于 `accessToken` 和 `refreshToken` 字段以支持长字符串。

---

## 环境变量（追加到 `.env.local`）

```bash
# AgentPit SSO
AGENTPIT_CLIENT_ID=[CLIENT_ID]
AGENTPIT_CLIENT_SECRET=[CLIENT_SECRET]
NEXT_PUBLIC_AGENTPIT_CLIENT_ID=[CLIENT_ID]
NEXT_PUBLIC_AGENTPIT_LOGIN_BUTTON=使用 AgentPit 登录
```

---

## 实现步骤

1. **创建目录结构**
   - `app/api/auth/agentpit/callback/`
   - `app/api/auth/agentpit/token/`
   - `app/api/auth/agentpit/sso/`
   - `app/login/agentpit/`

2. **生成后端端点**（按上方代码模板）

3. **生成前端登录页**（按上方代码模板）

4. **更新 Prisma Schema**（如有使用 Prisma）

5. **更新 `.env.local`**（追加环境变量）

6. **更新 `app/login/page.tsx`**：添加 AgentPit 登录按钮链接到 `/login/agentpit`

7. **更新 `.gitignore`**：确保 `.env.local` 被忽略

---

## 登录按钮自定义

如果用户提供了自定义按钮名称，替换以下位置的值：

| 文件 | 变量/文案 | 环境变量 |
|------|----------|---------|
| `app/login/agentpit/page.tsx` | `buttonLabel` | `NEXT_PUBLIC_AGENTPIT_LOGIN_BUTTON` |
| `.env.local` | `NEXT_PUBLIC_AGENTPIT_LOGIN_BUTTON` | - |

---

## 错误处理

| error 参数 | 说明 | 用户看到的提示 |
|-----------|------|--------------|
| `missing_code` | 回调缺少授权码 | 授权失败，请重试 |
| `invalid_state` | State 验证失败（CSRF）| 安全验证失败，请重试 |
| `server_error` | 服务器内部错误 | 服务异常，请稍后重试 |
| `callback_repeated` | 回调请求过于频繁 | 请求过于频繁，请稍后重试 |
