---
title: 部署手册
author: A2A Team
created: 2026-03-19
updated: 2026-03-19
version: v1.0.0
---

# 部署说明

## 部署目标环境

默认以生产环境为目标：Linux 服务器 + Docker Compose 运行 `src/mcp/server.ts` 编译产物。

环境划分：

- 开发（development）：本机 `ts-node` 运行，便于调试
- 测试（test）：端口与环境变量隔离，便于集成测试
- 生产（production）：`tsc` 编译 + Docker 镜像运行，稳定可复现

## 配置与依赖

- Node.js：开发/测试建议 20.x LTS，生产使用 Docker 镜像自带 Node 20
- 配置文件：复制 `.env.production.example` 为 `.env.production` 并填入实际值

目标服务器依赖：

- Docker Engine 24+
- Docker Compose v2

关键环境变量：

- `MCP_PORT`：对外监听端口（容器内也使用同一端口）
- `SECONDME_API_BASE`、`ZHIHU_API_BASE`：上游 API Base URL

## 部署方式

### 方式 A：Docker Compose（推荐）

在目标服务器上：

```bash
sudo mkdir -p /opt/a2a
sudo chown -R $USER:$USER /opt/a2a
cd /opt/a2a
git clone <your-repo-url> .
cp .env.production.example .env.production

chmod +x deploy/*.sh

docker compose --env-file .env.production up -d --build
```

验证：

```bash
curl -fsS http://127.0.0.1:${MCP_PORT:-3000}/healthz
docker compose logs -n 200 --no-log-prefix a2a-mcp
```

### 方式 B：手动脚本（Docker Compose 封装）

```bash
cd /opt/a2a
bash deploy/deploy.sh
bash deploy/check.sh HOST=127.0.0.1 PORT=${MCP_PORT:-3000}
```

回滚：

```bash
cd /opt/a2a
bash deploy/rollback.sh <tag>
```

## 外部可达性

开放安全组/防火墙端口 `MCP_PORT`，或在前置 Nginx/网关中仅放行需要的来源 IP。

