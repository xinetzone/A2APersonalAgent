---
title: 部署报告与回滚方案
author: A2A Team
created: 2026-03-19
updated: 2026-03-19
version: v1.0.0
---

# 部署报告与回滚方案

## 1. 部署目标与范围

- 目标环境：生产（production）
- 部署对象：A2A Personal Agent MCP Server（HTTP）
- 对外端口：`MCP_PORT`（默认 3000）
- 核心接口：
  - 健康检查：`GET /healthz`（无需鉴权）
  - MCP：`POST /mcp`（需要 `Authorization: Bearer <token>`）

## 2. 变更内容

- 新增 `/healthz` 健康检查接口，便于容器/负载均衡探活
- 支持通过环境变量覆盖 `SECONDME_API_BASE`、`ZHIHU_API_BASE`
- 新增生产启动脚本：`npm run start:mcp:prod`
- 新增容器化与部署资产：`Dockerfile`、`docker-compose.yml`、`deploy/*.sh`
- 新增配置模板：`.env.example`、`.env.production.example`、`.env.test.example`
- 新增 CI/CD 模板：`.github/workflows/deploy.yml`

## 3. 本地验证结果（可复现）

- `tools/list` 能返回 MCP 工具列表
- `GET /healthz` 可用
- 未携带 `Authorization` 访问 `/mcp`：返回 401

## 4. 生产部署步骤（Docker Compose）

见 [部署手册](deployment.md)。

## 5. 回滚方案

### 5.1 基于镜像标签回滚（推荐）

部署脚本会记录最后一次成功的镜像标签到 `deploy/.last_successful`。

回滚到指定标签：

```bash
cd /opt/a2a
bash deploy/rollback.sh <tag>
```

回滚到最近一次成功记录：

```bash
cd /opt/a2a
bash deploy/rollback.sh
```

### 5.2 基于 Git 提交回滚（备选）

```bash
cd /opt/a2a
git checkout <good-commit>
docker compose --env-file .env.production up -d --build
```

## 6. 风险与缓解

- 端口暴露风险：建议限制来源 IP 或在网关层做鉴权与限流
- 上游 API 波动：建议在生产环境增加请求超时、重试与熔断策略（当前代码未覆盖）

