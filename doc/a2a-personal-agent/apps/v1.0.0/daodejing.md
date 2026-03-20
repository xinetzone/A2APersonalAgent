---
title: 帛书版道德经指导人生（SecondMe 应用）
author: A2A Team
created: 2026-03-19
updated: 2026-03-19
version: v1.0.0
---

# 帛书版道德经指导人生

本应用以本仓库内置的 MCP Server 作为对外服务形态，通过 `tools/list` / `tools/call` 暴露工具，让 SecondMe 在对话中调用“今日箴言/主题指导/保存为记忆”等能力。

## 1. 能力概览

### 1.1 工具列表

- `dao_daily_guidance`：今日箴言（支持 `date/topic/mood`）
- `dao_topic_guidance`：按主题生成指导（支持 `topic/context/mood`）
- `dao_quotes_list`：列出摘句（支持 `theme/limit`）
- `dao_save_daily_guidance_memory`：把今日箴言写入 SecondMe Key Memory（支持 `visibility`）

> MCP 侧会强制要求 `Authorization: Bearer <token>`；其中 `dao_*` 生成类工具不依赖上游 API，但保存记忆需要调用 SecondMe Key Memory 接口。

## 2. 文本来源（帛书版）

默认会尝试读取 `data/mawangdui.json`，若不存在则回退到内置示例摘句。

推荐做法：将权威整理的帛书版摘句整理成 JSON 数组，放到 `data/mawangdui.json`，或通过环境变量 `DAO_TEXT_FILE` 指定路径。

格式示例见：[道德经摘句数据格式](dao-data.md)。

## 3. 部署与运行

### 3.1 本地运行（开发）

```bash
npm ci
npm run build

MCP_PORT=3000 node dist/mcp/server.js
```

健康检查：

```bash
curl -fsS http://localhost:3000/healthz
```

### 3.2 生产运行（Docker Compose）

按 [部署手册](../../deployment/v1.0.0/deployment.md) 部署即可。

## 4. 调用示例（JSON-RPC）

### 4.1 tools/list

```json
{"jsonrpc":"2.0","id":1,"method":"tools/list"}
```

### 4.2 今日箴言

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "dao_daily_guidance",
    "arguments": { "topic": "焦虑", "mood": "烦躁" }
  }
}
```

### 4.3 保存为记忆

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "dao_save_daily_guidance_memory",
    "arguments": { "topic": "关系", "visibility": 1 }
  }
}
```
