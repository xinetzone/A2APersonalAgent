# GCP + Podman + Nginx + HTTPS 部署文档

> 日期：2026-04-05
> 域名：pagent.agentpit.io
> 服务器：34.126.124.215
> 架构：Nginx (SSL) → Next.js (3001) + MCP (3000)

---

## 一、服务器信息

| 项目 | 值 |
|------|-----|
| 公网 IP | 34.126.124.215 |
| SSH | `ssh -i ~/.ssh/id_rsa_google_longterm a1@34.126.124.215` |
| 项目路径 | `/opt/a2a` |
| 用户 | a1 |

---

## 二、服务架构

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

---

## 三、已安装组件

### 3.1 Podman 4.3.1

```bash
# 安装
curl -L https://github.com/containers/podman/releases/download/v4.3.1/podman-remote-static.tar.gz -o podman.tar.gz
tar -xzf podman.tar.gz
sudo cp podman-remote-static/* /usr/local/bin/
podman --version

# 注意：Podman 4.3.1 不支持 Dockerfile HEALTHCHECK 指令
```

### 3.2 Node.js 20.x

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt-get install -y nodejs
node --version  # v20.x
npm --version
```

### 3.3 Nginx 1.22.1

```bash
sudo apt-get install nginx  # 已安装
/usr/sbin/nginx -v
```

---

## 四、服务启动方式

### MCP 服务（直接 Node 进程，非容器）

```bash
cd /opt/a2a
nohup node dist/mcp/server.js > /tmp/mcp.log 2>&1 &
# PID: 389997，监听 3000
```

### Next.js 前端

```bash
cd /opt/a2a
npm run build:web  # 构建（需要 .env.production）
PORT=3001 nohup npm run start > /tmp/nextjs.log 2>&1 &
# PID: 392582，监听 3001
```

---

## 五、Nginx 配置

### 5.1 配置文件

Nginx 配置通过 `/tmp/pagent-https.nginx` 加载（不是 sites-available）。

**关键配置片段：**

```nginx
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
```

### 5.2 启动 Nginx

```bash
sudo killall nginx 2>/dev/null
sleep 1
sudo /usr/sbin/nginx -c /tmp/pagent-https.nginx
```

### 5.3 SSL 证书（Let's Encrypt）

```bash
# Certbot 已安装
sudo certbot certonly --webroot -w /var/www/html -d pagent.agentpit.io --register-unsafely-without-email --non-interactive --agree-tos

# 证书位置
/etc/letsencrypt/live/pagent.agentpit.io/
├── cert.pem
├── chain.pem
├── fullchain.pem
└── privkey.pem

# 证书续期（自动）
sudo certbot renew --dry-run
```

---

## 六、iptables 端口转发

GCP 服务器 443 端口被基础设施占用，Nginx 监听 8443，使用 iptables 转发：

```bash
sudo iptables -t nat -A PREROUTING -p tcp --dport 443 -j REDIRECT --to-port 8443
sudo iptables -t nat -A OUTPUT -p tcp --dport 443 -j REDIRECT --to-port 8443
```

---

## 七、关键问题与解决方案

| 问题 | 解决方案 |
|------|---------|
| Podman 4.3.1 不支持 HEALTHCHECK | 放弃容器，直接用 `node dist/mcp/server.js` 运行 MCP |
| 443 端口被 GCP 占用 | iptables 做 443→8443 端口转发，Nginx 监听 8443 |
| OAuth redirect_uri 使用内网地址 | 添加 `PUBLIC_HOST` 环境变量，检测 localhost/127.0.0.1 时强制使用 `pagent.agentpit.io` |
| OAuth redirect_uri 协议为 http | 修复 `getRedirectUri()`，无论本地还是公网都使用 `https://` |
| SSH heredoc 中文乱码 | 使用 Node.js base64 编码传输脚本 |
| Next.js 旧进程占用旧构建 | `kill -9` 杀掉旧进程后重新启动 |

---

## 八、验证命令

```bash
# 健康检查
curl https://pagent.agentpit.io/healthz
# {"status":"ok"}

# OAuth 登录端点
curl -Ik https://pagent.agentpit.io/api/auth/agentpit/login
# HTTP/2 307 + Location: https://go.second.me/oauth/?...redirect_uri=https://pagent.agentpit.io/...

# 所有页面
curl -s -o /dev/null -w '%{http_code}' https://pagent.agentpit.io/           # 200
curl -s -o /dev/null -w '%{http_code}' https://pagent.agentpit.io/login      # 200
curl -s -o /dev/null -w '%{http_code}' https://pagent.agentpit.io/login/agentpit  # 200

# 查看进程
ps aux | grep node | grep -v grep
# 389997: node dist/mcp/server.js (MCP, port 3000)
# 392582: next-server (Next.js, port 3001)
```

---

## 九、相关文件

| 文件 | 说明 |
|------|------|
| `/opt/a2a/` | 项目根目录 |
| `/opt/a2a/.env.production` | 生产环境变量（含 AgentPit OAuth 凭证） |
| `/opt/a2a/dist/` | 后端编译产物 |
| `/tmp/pagent-https.nginx` | Nginx HTTPS 配置 |
| `/tmp/mcp.log` | MCP 服务日志 |
| `/tmp/nextjs5.log` | Next.js 日志 |
| `/tmp/build5.log` | Next.js 构建日志 |
| `/var/www/html/.well-known/acme-challenge/` | Let's Encrypt 验证目录 |
| `/etc/letsencrypt/live/pagent.agentpit.io/` | SSL 证书 |

---

## 十、SSO 登录流程

1. 用户访问 `https://pagent.agentpit.io/login/agentpit`
2. 点击登录按钮 → GET `/api/auth/agentpit/login`
3. 307 重定向到 `https://go.second.me/oauth/?client_id=...&redirect_uri=https://pagent.agentpit.io/api/auth/agentpit/callback&response_type=code&state=...`
4. 用户在 SecondMe 授权 → 回调到 `/api/auth/agentpit/callback?code=...&state=...`
5. 后端用 code 换取 token，fetch 用户信息，写入 localStorage，跳转 `/profile?login=agentpit_success`
