---
title: 运行指导手册
author: A2A Team
created: 2026-03-19
updated: 2026-03-19
version: v1.0.0
---

# A2A Personal Agent 运行指导手册

> 本文档从仓库根目录 `RUNNING_GUIDE.md` 迁移并纳入集中式文档库。

## 一、运行环境要求

### 1.1 基础环境

| 组件 | 最低版本 | 推荐版本 | 检查命令 |
|------|---------|---------|---------|
| Node.js | 18.0.0 | 20.x LTS | `node --version` |
| npm | 9.0.0 | 10.x | `npm --version` |
| TypeScript | 5.0.0 | 5.3+ | `npx tsc --version` |
| Git | 2.0.0 | 最新版 | `git --version` |

### 1.2 操作系统支持

| 操作系统 | 支持状态 | 备注 |
|---------|---------|------|
| Windows 10/11 | ✅ 完全支持 | 推荐使用 PowerShell 7+ |
| macOS 12+ | ✅ 完全支持 | - |
| Ubuntu 20.04+ | ✅ 完全支持 | - |

### 1.3 网络要求

- 需要能够访问 SecondMe 平台（`https://secondme.ai`）
- 需要能够访问知乎 API（可选，用于知乎集成功能）

## 二、安装与配置

### 2.1 安装依赖

```bash
npm install
```

### 2.2 配置环境变量

参考 `.env.example`。

## 三、运行

### 3.1 MCP Server（推荐）

```bash
MCP_PORT=3000 node dist/mcp/server.js
```

健康检查：

```bash
curl -fsS http://localhost:3000/healthz
```

