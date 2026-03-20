---
title: 开发检查清单
author: A2A Team
created: 2026-03-19
updated: 2026-03-19
version: v1.0.0
---

# A2A Personal Agent 连接平台 - 检查清单

## 开发环境检查

### 必选项 (必须完成才能继续)

- [ ] **Node.js 18+ 已安装**
  - 命令: `node --version`
  - 预期: v18.x.x 或更高

- [ ] **npm 或 yarn 已安装**
  - 命令: `npm --version` 或 `yarn --version`

- [ ] **TypeScript 已安装**
  - 命令: `npx tsc --version`
  - 预期: 5.x.x

- [ ] **项目目录已创建**
  - 文件: `spec.md`, `tasks.md` 已存在

### SecondMe API 检查

- [ ] **OAuth 认证端点可访问**
  - URL: `https://app.mindos.com/gate/in/rest/third-party-agent/v1/auth/token/code`
  - 方法: POST

- [ ] **Profile API 可访问**
  - URL: `https://app.mindos.com/gate/in/rest/third-party-agent/v1/profile`
  - 方法: GET
  - 需要: Bearer Token

- [ ] **Key Memory API 可访问**
  - URL: `https://app.mindos.com/gate/in/rest/third-party-agent/v1/memories/key`
  - 方法: POST/GET/DELETE
  - 需要: Bearer Token

- [ ] **Discover API 可访问**
  - URL: `https://app.mindos.com/gate/in/rest/third-party-agent/v1/discover/users`
  - 方法: GET
  - 需要: Bearer Token

### 知乎 API 检查

- [ ] **知乎开发者凭证已获取**
  - app_key: 已配置
  - app_secret: 已配置

- [ ] **签名算法已实现**
  - HMAC-SHA256
  - Base64 编码

- [ ] **圈子接口可访问**
  - URL: `https://openapi.zhihu.com/openapi/ring/detail`
  - 方法: GET

---

## 代码实现检查

### 模块 1: SecondMe API 集成

- [ ] **auth.ts - 认证模块**
  - [ ] OAuth2 code exchange 实现
  - [ ] Token 存储与读取
  - [ ] Token 刷新机制

- [ ] **profile.ts - 资料模块**
  - [ ] GET profile 实现
  - [ ] PUT profile 实现
  - [ ] 字段验证

- [ ] **memory.ts - 记忆模块**
  - [ ] POST memories/key (单条)
  - [ ] POST memories/key/batch (批量)
  - [ ] GET memories/key/search
  - [ ] PUT memories/key/{id}
  - [ ] DELETE memories/key/{id}

- [ ] **plaza.ts - Plaza 模块**
  - [ ] GET plaza/access
  - [ ] POST plaza/invitation/redeem
  - [ ] POST plaza/posts
  - [ ] GET plaza/feed

- [ ] **discover.ts - 发现模块**
  - [ ] GET discover/users
  - [ ] 分页处理
  - [ ] 错误处理

### 模块 2: A2A Protocol

- [ ] **message.ts - 消息格式**
  - [ ] JSON Schema 定义
  - [ ] 消息类型定义
  - [ ] 编解码函数

- [ ] **registry.ts - Agent 注册表**
  - [ ] 注册接口
  - [ ] 查询接口
  - [ ] 能力存储

- [ ] **router.ts - 消息路由**
  - [ ] 路由规则
  - [ ] 消息转发
  - [ ] 错误处理

---

## 测试检查

### 单元测试

- [ ] **SecondMe API 测试**
  - [ ] 认证流程测试
  - [ ] Profile API 测试
  - [ ] Memory API 测试

- [ ] **A2A Protocol 测试**
  - [ ] 消息编解码测试
  - [ ] 路由测试

- [ ] **匹配算法测试**
  - [ ] 相似度计算测试
  - [ ] Top-K 检索测试

---

## 部署检查

- [ ] **环境变量已配置**
- [ ] **构建脚本已验证**（`npm run build` 成功）
- [ ] **启动脚本已测试**

