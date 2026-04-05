---
title: 生产部署报告 - GCP + Podman
author: A2A Team
created: 2026-04-05
updated: 2026-04-05
version: v1.0.0
---

# 生产部署报告 - GCP + Podman + Nginx

## 1. 部署概述

| 项目 | 值 |
|------|-----|
| 目标环境 | 生产（production） |
| 部署对象 | A2A Personal Agent MCP Server |
| 域名 | `pagent.agentpit.io` |
| 公网 IP | `34.126.124.215` |
| 对外端口 | 3000（通过 Nginx 反向代理） |
| 容器运行时 | Podman 4.3.1 |
| Web 服务器 | Nginx 1.22.1 |
| 部署路径 | `/opt/a2a` |

## 2. 服务端点

| 端点 | 地址 | 说明 |
|------|------|------|
| 健康检查 | `http://pagent.agentpit.io/healthz` | 返回 `{"status":"ok"}` |
| MCP 服务 | `http://pagent.agentpit.io/mcp` | 需要 Authorization header |
| 直连（内网） | `http://127.0.0.1:3000/healthz` | 服务器本地访问 |

## 3. 部署步骤记录

### 3.1 服务器环境准备

```bash
# 1. 安装 Podman
sudo apt-get update
sudo apt-get install -y podman podman-compose

# 2. 安装 Python pip（用于 podman-compose）
sudo apt-get install -y python3-pip

# 3. 安装 podman-compose
pip3 install podman-compose

# 4. 安装 Nginx
sudo apt-get install -y nginx certbot python3-certbot-nginx
```

### 3.2 项目文件上传

```bash
# 本地打包（排除 node_modules, .git, .next, dist 等）
tar --exclude='node_modules' --exclude='.git' --exclude='.next' \
    --exclude='dist' --exclude='coverage' --exclude='*.log' \
    --exclude='.env' --exclude='.env.local' -czf /tmp/a2a-deploy.tar.gz .

# 上传到服务器
scp -i ~/.ssh/id_rsa_google_longterm /tmp/a2a-deploy.tar.gz \
    a1@34.126.124.215:/opt/a2a/archive.tar.gz

# 服务器解压
ssh a1@34.126.124.215
cd /opt/a2a
tar -xzf archive.tar.gz
```

### 3.3 环境变量配置

创建 `/opt/a2a/.env.production`：

```bash
NODE_ENV=production
AGENT_ID=

MCP_PORT=3000

SECONDME_API_BASE=https://api.mindverse.com/gate/lab
ZHIHU_API_BASE=https://openapi.zhihu.com

SECONDME_CLIENT_ID=your_client_id
SECONDME_CLIENT_SECRET=your_client_secret

ZHIHU_API_KEY=
ZHIHU_SECRET_KEY=
```

### 3.4 构建镜像

```bash
cd /opt/a2a
export IMAGE_TAG=latest
export MCP_PORT=3000
podman-compose -f docker-compose.yml build
```

**修复记录：** 原 `Dockerfile` 缺少 `tsconfig.server.json` 的复制指令，已修正：

```diff
- COPY package.json package-lock.json tsconfig.json ./
+ COPY package.json package-lock.json tsconfig.json tsconfig.server.json ./
```

### 3.5 启动容器

```bash
cd /opt/a2a
podman run --restart=always \
    --name a2a-mcp \
    --env-file .env.production \
    -p 3000:3000 \
    localhost/a2a-mcp:latest
```

### 3.6 Nginx 反向代理配置

创建 `/etc/nginx/sites-available/pagent.agentpit.io`：

```nginx
server {
    listen 80;
    server_name pagent.agentpit.io;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    location /healthz {
        proxy_pass http://127.0.0.1:3000/healthz;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

启用站点：

```bash
sudo ln -sf /etc/nginx/sites-available/pagent.agentpit.io \
    /etc/nginx/sites-enabled/pagent.agentpit.io
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl start nginx
sudo systemctl enable nginx
```

## 4. 验证结果

```bash
# 健康检查
curl http://pagent.agentpit.io/healthz
# 返回: {"status":"ok"}

# MCP 端点（需要认证）
curl http://pagent.agentpit.io/mcp
# 返回: {"error":"Missing or invalid Authorization header"}
```

## 5. 日常运维

### 5.1 查看容器日志

```bash
ssh a1@34.126.124.215
podman logs a2a-mcp --tail 50
```

### 5.2 重启服务

```bash
# 重启容器
podman restart a2a-mcp

# 重载 Nginx
sudo nginx -s reload
```

### 5.3 更新部署

```bash
# 重新打包上传（见 3.2）
# 服务器上重新构建
cd /opt/a2a
podman-compose -f docker-compose.yml build

# 重启容器
podman restart a2a-mcp
```

### 5.4 回滚

```bash
# 查看历史镜像
podman images localhost/a2a-mcp

# 使用指定旧版本镜像启动
podman run --restart=always --name a2a-mcp \
    --env-file .env.production -p 3000:3000 \
    localhost/a2a-mcp:<旧TAG>
```

## 6. 注意事项

- Podman 4.3.1 版本不支持 `HEALTHCHECK` 指令，需使用 Podman 自身的健康检查机制
- Nginx reload 后会建立新的上游连接，无需重启 Nginx 进程
- 域名 `pagent.agentpit.io` 需提前在 DNS 服务商处配置 A 记录指向 `34.126.124.215`
- `.env.production` 文件包含敏感信息，已添加到 `.gitignore`

## 7. 文件变更摘要

| 文件 | 变更 |
|------|------|
| `Dockerfile` | 修复：添加 `tsconfig.server.json` 到 COPY 指令 |
| `doc/a2a-personal-agent/deployment/v1.0.0/deployment-gcp-podman.md` | 新增：本部署报告 |
