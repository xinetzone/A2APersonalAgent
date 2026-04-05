---
name: server-deployment
description: 服务器操作与部署技能，用于A2A Personal Agent的生产环境部署、管理和维护，支持GCP环境和HTTPS配置
user-invocable: true
---

# 服务器操作与部署技能

## 概述

本技能提供A2A Personal Agent的服务器操作与部署功能，基于GCP生产环境部署文档的最佳实践，包含GCP环境配置、Podman容器化部署、HTTPS配置、服务状态监控、故障排查和版本更新等核心功能。

## 服务器信息

| 项目 | 值 |
|------|-----|
| 公网 IP | 34.126.124.215 |
| SSH | `ssh -i ~/.ssh/id_rsa_google_longterm a1@34.126.124.215` |
| 项目路径 | `/opt/a2a` |
| 用户 | a1 |
| 域名 | pagent.agentpit.io |

## 服务架构

```
公网 (HTTPS 443 / HTTP 80)
    │
    ├── iptables REDIRECT 443 → 8443
    │
    └── Nginx (80 / 8443)
            │
            ├── 80 → 307 redirect to HTTPS
            │
            └── 8443 (SSL) → reverse proxy
                    │
                    ├── /api/mcp  → MCP (3000)
                    ├── /mcp      → MCP (3000)
                    ├── /api/agentpit → MCP (3000)
                    ├── /healthz  → MCP (3000/healthz)
                    └── /*        → Next.js (3001)
```

## 功能模块

### 1. 服务器环境配置

**功能描述**：检查和配置GCP服务器环境，确保满足部署要求。

**使用示例**：
```
/server-deployment environment check
/server-deployment environment setup
```

**操作流程**：
1. 检查Podman和Podman Compose版本
2. 检查Node.js版本
3. 检查Nginx版本
4. 检查网络连接
5. 检查存储空间
6. 安装必要的依赖

**命令实现**：
```bash
# 检查环境
podman --version
podman-compose --version
node --version
nginx -v
ping -c 3 google.com
df -h

# 安装依赖
apt-get update
apt-get install -y podman podman-compose python3-pip
pip3 install podman-compose
apt-get install -y nginx certbot python3-certbot-nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
```

### 2. 应用程序部署流程

**功能描述**：执行完整的应用部署流程，包括代码上传、环境配置和服务启动。

**使用示例**：
```
/server-deployment deploy
/server-deployment deploy --branch main
```

**操作流程**：
1. 本地打包项目文件
2. 上传到服务器
3. 配置环境变量
4. 构建项目
5. 启动MCP服务和Next.js前端
6. 配置Nginx和HTTPS
7. 验证服务状态

**命令实现**：
```bash
# 本地打包
tar --exclude='node_modules' --exclude='.git' --exclude='.next' \
    --exclude='dist' --exclude='coverage' --exclude='*.log' \
    --exclude='.env' --exclude='.env.local' -czf /tmp/a2a-deploy.tar.gz .

# 上传到服务器
scp -i ~/.ssh/id_rsa_google_longterm /tmp/a2a-deploy.tar.gz \
    a1@34.126.124.215:/opt/a2a/archive.tar.gz

# 服务器解压
cd /opt/a2a
tar -xzf archive.tar.gz

# 配置环境变量
cp .env.example .env.production
# 编辑 .env.production 文件

# 构建项目
npm install
npm run build

# 启动MCP服务
nohup node dist/mcp/server.js > /tmp/mcp.log 2>&1 &

# 启动Next.js前端
PORT=3001 nohup npm run start > /tmp/nextjs.log 2>&1 &
```

### 3. HTTPS配置

**功能描述**：配置HTTPS证书和Nginx反向代理。

**使用示例**：
```
/server-deployment https setup
/server-deployment https renew
```

**操作流程**：
1. 配置iptables端口转发
2. 安装SSL证书
3. 配置Nginx
4. 重启Nginx服务

**命令实现**：
```bash
# 配置iptables端口转发
iptables -t nat -A PREROUTING -p tcp --dport 443 -j REDIRECT --to-port 8443
iptables -t nat -A OUTPUT -p tcp --dport 443 -j REDIRECT --to-port 8443

# 安装SSL证书
certbot certonly --webroot -w /var/www/html -d pagent.agentpit.io --register-unsafely-without-email --non-interactive --agree-tos

# 配置Nginx
cat > /tmp/pagent-https.nginx << 'EOF'
events {
    worker_connections 1024;
}
http {
    server {
        listen 80;
        server_name pagent.agentpit.io;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 8443 ssl http2;
        server_name pagent.agentpit.io;

        ssl_certificate /etc/letsencrypt/live/pagent.agentpit.io/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/pagent.agentpit.io/privkey.pem;

        ssl_protocols TLSv1.2 TLSv1.3;
        add_header Strict-Transport-Security "max-age=63072000" always;

        location / {
            proxy_pass http://127.0.0.1:3001;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /api/mcp { proxy_pass http://127.0.0.1:3000; }
        location /mcp     { proxy_pass http://127.0.0.1:3000; }
        location /api/agentpit { proxy_pass http://127.0.0.1:3000; }
        location /healthz { proxy_pass http://127.0.0.1:3000/healthz; }
    }
}
EOF

# 启动Nginx
killall nginx 2>/dev/null
sleep 1
nginx -c /tmp/pagent-https.nginx
```

### 4. 服务状态监控

**功能描述**：监控服务运行状态，检查容器健康和服务可用性。

**使用示例**：
```
/server-deployment status
/server-deployment monitor
```

**操作流程**：
1. 检查进程状态
2. 检查服务日志
3. 验证API端点可用性
4. 监控系统资源使用情况

**命令实现**：
```bash
# 检查进程状态
ps aux | grep node | grep -v grep

# 查看日志
cat /tmp/mcp.log
cat /tmp/nextjs.log

# 验证API
curl https://pagent.agentpit.io/healthz
curl -Ik https://pagent.agentpit.io/api/auth/agentpit/login

# 监控系统资源
top -b -n 1
```

### 5. 故障排查与恢复

**功能描述**：诊断和解决常见部署问题，提供故障恢复方案。

**使用示例**：
```
/server-deployment troubleshoot
/server-deployment fix network
```

**操作流程**：
1. 识别常见问题（Podman问题、网络问题、应用问题）
2. 提供针对性的解决方案
3. 执行修复操作
4. 验证修复结果

**命令实现**：
```bash
# Podman问题
apt-get install -y podman podman-compose

# 网络问题
netstat -tulpn | grep 3000
ufw allow 3000
ufw allow 80
ufw allow 443

# 应用问题
cat /tmp/mcp.log
cat /tmp/nextjs.log
cat .env.production

# 重启服务
pkill -f "node dist/mcp/server.js"
nohup node dist/mcp/server.js > /tmp/mcp.log 2>&1 &
pkill -f "next-server"
PORT=3001 nohup npm run start > /tmp/nextjs.log 2>&1 &
```

### 6. 版本更新管理

**功能描述**：管理应用版本更新，包括代码拉取、构建和部署。

**使用示例**：
```
/server-deployment update
/server-deployment update --branch develop
```

**操作流程**：
1. 本地打包最新代码
2. 上传到服务器
3. 安装依赖
4. 构建项目
5. 重启服务
6. 验证更新结果

**命令实现**：
```bash
# 本地打包
tar --exclude='node_modules' --exclude='.git' --exclude='.next' \
    --exclude='dist' --exclude='coverage' --exclude='*.log' \
    --exclude='.env' --exclude='.env.local' -czf /tmp/a2a-deploy.tar.gz .

# 上传到服务器
scp -i ~/.ssh/id_rsa_google_longterm /tmp/a2a-deploy.tar.gz \
    a1@34.126.124.215:/opt/a2a/archive.tar.gz

# 服务器解压
cd /opt/a2a
tar -xzf archive.tar.gz

# 构建和重启
npm install
npm run build
pkill -f "node dist/mcp/server.js"
nohup node dist/mcp/server.js > /tmp/mcp.log 2>&1 &
pkill -f "next-server"
PORT=3001 nohup npm run start > /tmp/nextjs.log 2>&1 &

# 验证状态
curl https://pagent.agentpit.io/healthz
```

### 7. 容器化部署（Podman）

**功能描述**：使用Podman容器化部署MCP服务。

**使用示例**：
```
/server-deployment container build
/server-deployment container start
```

**操作流程**：
1. 构建Podman镜像
2. 启动容器
3. 配置容器网络
4. 验证容器状态

**命令实现**：
```bash
# 构建镜像
cd /opt/a2a
export IMAGE_TAG=latest
export MCP_PORT=3000
podman-compose -f docker-compose.yml build

# 启动容器
podman run --restart=always \
    --name a2a-mcp \
    --env-file .env.production \
    -p 3000:3000 \
    localhost/a2a-mcp:latest

# 查看容器状态
podman ps
podman logs a2a-mcp
```

## 功能测试

**功能描述**：执行应用功能测试，确保所有页面和API正常工作。

**使用示例**：
```
/server-deployment test
/server-deployment test api
```

**操作流程**：
1. 测试健康检查端点
2. 测试OAuth登录端点
3. 测试所有页面
4. 测试API调用

**命令实现**：
```bash
# 健康检查
curl https://pagent.agentpit.io/healthz

# OAuth 登录端点
curl -Ik https://pagent.agentpit.io/api/auth/agentpit/login

# 所有页面
curl -s -o /dev/null -w '%{http_code}' https://pagent.agentpit.io/           # 200
curl -s -o /dev/null -w '%{http_code}' https://pagent.agentpit.io/login      # 200
curl -s -o /dev/null -w '%{http_code}' https://pagent.agentpit.io/login/agentpit  # 200

# 测试API调用
curl https://pagent.agentpit.io/api/mcp
```

## 维护指南

**功能描述**：提供日常维护操作指南。

**使用示例**：
```
/server-deployment maintenance logs
/server-deployment maintenance restart
```

**操作流程**：
1. 查看日志
2. 重启服务
3. 执行备份
4. 故障排查

**命令实现**：
```bash
# 查看日志
cat /tmp/mcp.log
cat /tmp/nextjs.log

# 重启服务
pkill -f "node dist/mcp/server.js"
nohup node dist/mcp/server.js > /tmp/mcp.log 2>&1 &
pkill -f "next-server"
PORT=3001 nohup npm run start > /tmp/nextjs.log 2>&1 &

# 重启Nginx
killall nginx 2>/dev/null
sleep 1
nginx -c /tmp/pagent-https.nginx

# 备份
cp .env.production .env.production.backup
```

## 安全注意事项

1. **环境变量保护**：不要将包含敏感信息的环境变量文件提交到版本控制系统
2. **SSH密钥管理**：使用安全的SSH密钥管理策略，定期更换密钥
3. **权限控制**：使用最小权限原则配置服务器访问权限
4. **防火墙配置**：只开放必要的端口，限制访问来源
5. **定期更新**：定期更新系统和依赖包，修复安全漏洞
6. **SSL证书管理**：定期更新SSL证书，确保HTTPS连接安全

## 部署脚本使用说明

### 可用脚本

| 脚本名称 | 功能描述 | 使用方法 |
|---------|---------|--------|
| `deploy.sh` | 完整部署流程 | `./deploy.sh` |
| `check-env.sh` | 环境检查 | `./check-env.sh` |
| `check-status.sh` | 服务状态检查 | `./check-status.sh` |
| `update.sh` | 版本更新 | `./update.sh` |
| `setup-https.sh` | HTTPS配置 | `./setup-https.sh` |

### 脚本使用步骤

1. **设置脚本执行权限**
   ```bash
   chmod +x *.sh
   ```

2. **环境检查**
   ```bash
   ./check-env.sh
   ```

3. **完整部署**
   ```bash
   ./deploy.sh
   ```

4. **服务状态检查**
   ```bash
   ./check-status.sh
   ```

5. **版本更新**
   ```bash
   ./update.sh
   ```

6. **HTTPS配置**
   ```bash
   ./setup-https.sh
   ```

## 输入输出示例

### 示例1：环境检查
**输入**：
```
/server-deployment environment check
```

**输出**：
```
🔍 正在检查服务器环境...

✅ Podman版本: podman version 4.3.1
✅ Podman Compose版本: podman-compose version 1.0.3
✅ Node.js版本: v20.15.0
✅ Nginx版本: nginx version: nginx/1.22.1
✅ 网络连接正常: google.com 响应正常
✅ 存储空间充足: 可用空间 50GB/100GB

🎉 环境检查通过，满足部署要求！
```

### 示例2：部署应用
**输入**：
```
/server-deployment deploy
```

**输出**：
```
🚀 开始部署A2A Personal Agent...

📦 本地打包项目文件
✅ 打包完成

📤 上传到服务器
✅ 上传完成

📁 解压项目文件
✅ 解压完成

⚙️ 配置环境变量
✅ 环境变量配置完成

🏗️ 构建项目
✅ 项目构建完成

🚢 启动MCP服务
✅ MCP服务启动成功

🚢 启动Next.js前端
✅ Next.js前端启动成功

🔒 配置HTTPS
✅ SSL证书安装完成
✅ Nginx配置完成
✅ 端口转发配置完成

📊 服务状态验证
✅ 健康检查正常: {"status":"ok"}
✅ 页面访问正常: 200 OK
✅ API调用正常: 200 OK

🎉 部署完成！应用已成功运行在 https://pagent.agentpit.io
```

### 示例3：状态监控
**输入**：
```
/server-deployment status
```

**输出**：
```
📋 服务状态监控

🔧 进程状态:
PID  USER  COMMAND
389997 a1    node dist/mcp/server.js (MCP, port 3000)
392582 a1    next-server (Next.js, port 3001)

📡 API状态:
✅ 健康检查: {"status":"ok"}
✅ 主页访问: 200 OK
✅ 登录页面: 200 OK

💾 系统资源:
CPU: 10% 内存: 2GB/4GB 磁盘: 20GB/100GB

🎉 服务运行状态良好！
```

### 示例4：版本更新
**输入**：
```
/server-deployment update
```

**输出**：
```
🔄 开始更新A2A Personal Agent...

📦 本地打包最新代码
✅ 打包完成

📤 上传到服务器
✅ 上传完成

📁 解压项目文件
✅ 解压完成

📦 安装依赖
✅ 依赖安装完成

🏗️ 构建项目
✅ 项目构建完成

🚢 重启MCP服务
✅ MCP服务重启成功

🚢 重启Next.js前端
✅ Next.js前端重启成功

📊 验证服务状态
✅ 健康检查正常: {"status":"ok"}
✅ 页面访问正常: 200 OK

🎉 更新完成！应用已成功更新并运行在 https://pagent.agentpit.io
```

### 示例5：HTTPS配置
**输入**：
```
/server-deployment https setup
```

**输出**：
```
🔒 开始配置HTTPS...

🔧 配置端口转发
✅ 端口转发配置完成

🔒 安装SSL证书
✅ SSL证书安装完成

⚙️ 配置Nginx
✅ Nginx配置完成

🚢 启动Nginx
✅ Nginx启动成功

📊 验证HTTPS配置
✅ 健康检查 (HTTPS): {"status":"ok"}
✅ 页面访问 (HTTPS): 200 OK

🔒 证书信息:
subject=CN = pagent.agentpit.io
issuer=CN = Let's Encrypt Authority X3
notBefore=Apr  5 00:00:00 2026 GMT
notAfter=Jul  4 23:59:59 2026 GMT

🎉 HTTPS配置完成！应用已成功运行在 https://pagent.agentpit.io
```

## 错误处理

1. **Podman安装失败**：检查系统包管理器状态，尝试手动安装
2. **网络连接问题**：检查网络配置，确认防火墙规则
3. **环境变量配置错误**：检查.env.production文件，确保所有必要变量都已设置
4. **服务启动失败**：查看服务日志，识别具体错误原因
5. **域名解析问题**：检查DNS配置，确认A记录设置正确
6. **SSL证书问题**：检查certbot配置，确保域名正确指向服务器IP
7. **端口转发问题**：检查iptables配置，确保443端口正确转发到8443

## 最佳实践

1. **自动化部署**：使用提供的部署脚本实现自动化部署
2. **定期备份**：定期备份环境变量和数据库数据
3. **监控告警**：设置服务监控和告警机制
4. **版本管理**：使用Git分支管理不同环境的代码
5. **文档更新**：定期更新部署文档，记录变更历史
6. **SSL证书管理**：设置自动续期机制，确保证书不会过期
7. **安全加固**：定期更新系统和依赖，修复安全漏洞

## 技术要求

- **服务器系统**：Debian/Ubuntu
- **Podman**：4.0+
- **Node.js**：20.x
- **Nginx**：1.22.1+
- **内存**：至少2GB
- **存储空间**：至少20GB
- **网络**：稳定的网络连接
- **权限**：具有sudo权限的用户
- **域名**：已配置DNS A记录指向服务器IP

本技能基于A2A Personal Agent GCP生产环境部署文档的最佳实践，提供了完整的服务器操作与部署功能，确保应用能够安全、稳定地运行在生产环境中。