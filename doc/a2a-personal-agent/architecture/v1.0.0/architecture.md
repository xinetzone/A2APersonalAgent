---
title: 架构概览
author: A2A Team
created: 2026-03-19
updated: 2026-03-19
version: v1.0.0
---

# 架构概览

## 运行形态

- Web UI：Next.js（`app/`）
- Agent 核心：TypeScript（`src/agent/`、`src/memory/`、`src/matching/`）
- 对外工具：MCP Server（`src/mcp/server.ts`）

## 主要数据流

1. MCP 客户端调用 `/mcp` → 触发 `tools/call`
2. 生成类工具（`dao_*`）读取 `data/mawangdui.json`（可配置 `DAO_TEXT_FILE`）
3. 保存类工具调用 SecondMe Key Memory API 写入记忆

## 关键边界

- 上游 API Base URL 可通过环境变量覆盖：`SECONDME_API_BASE`、`ZHIHU_API_BASE`
- MCP Server 对外仅提供 `GET /healthz` 无鉴权，其余 `/mcp` 需要 `Bearer` Token

