---
title: 项目概览
author: A2A Team
created: 2026-03-19
updated: 2026-03-19
version: v1.0.0
---

# 项目概览

## 目标

基于 SecondMe 平台能力（Profile、Key Memory、Discover、Plaza）与 A2A 协议，构建可运行的个人智能代理系统，支持：

- 长期记忆存储与检索
- 用户偏好学习
- 同频用户匹配
- MCP 工具化对外能力输出

## 技术栈

- Node.js / TypeScript
- Next.js（Web UI）
- MCP（HTTP + JSON-RPC）

## 代码结构（高层）

- `src/`：Agent 核心、A2A 协议、SecondMe/知乎 API 客户端、MCP Server
- `app/`：Next.js App Router（Web UI 与 API Route）
- `deploy/`：部署脚本
- `data/`：道德经摘句数据

