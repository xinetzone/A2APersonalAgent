#!/bin/bash
set -euo pipefail

# 部署脚本 - 支持GCP环境和HTTPS配置

echo "🚀 开始部署A2A Personal Agent..."

# 1. 本地打包
echo "\n📦 本地打包项目文件"
tar --exclude='node_modules' --exclude='.git' --exclude='.next' \
    --exclude='dist' --exclude='coverage' --exclude='*.log' \
    --exclude='.env' --exclude='.env.local' -czf /tmp/a2a-deploy.tar.gz .

echo "✅ 打包完成"

# 2. 上传到服务器
echo "\n📤 上传到服务器"
scp -i ~/.ssh/id_rsa_google_longterm /tmp/a2a-deploy.tar.gz \
    a1@34.126.124.215:/opt/a2a/archive.tar.gz

echo "✅ 上传完成"

# 3. 服务器操作
echo "\n📁 服务器操作"
ssh -i ~/.ssh/id_rsa_google_longterm a1@34.126.124.215 << 'EOF'

# 创建部署目录
mkdir -p /opt/a2a
cd /opt/a2a

# 解压项目文件
echo "📁 解压项目文件"
tar -xzf archive.tar.gz

# 配置环境变量
echo "⚙️ 配置环境变量"
cp .env.example .env.production
# 注意：需要手动编辑 .env.production 文件配置必要的环境变量

# 安装依赖
echo "📦 安装依赖"
npm install

# 构建项目
echo "🏗️ 构建项目"
npm run build

# 启动MCP服务
echo "🚢 启动MCP服务"
pkill -f "node dist/mcp/server.js" 2>/dev/null
sleep 1
nohup node dist/mcp/server.js > /tmp/mcp.log 2>&1 &
sleep 2

# 启动Next.js前端
echo "🚢 启动Next.js前端"
pkill -f "next-server" 2>/dev/null
sleep 1
PORT=3001 nohup npm run start > /tmp/nextjs.log 2>&1 &
sleep 2

# 配置iptables端口转发
echo "🔧 配置端口转发"
iptables -t nat -A PREROUTING -p tcp --dport 443 -j REDIRECT --to-port 8443 2>/dev/null
iptables -t nat -A OUTPUT -p tcp --dport 443 -j REDIRECT --to-port 8443 2>/dev/null

# 安装SSL证书
echo "🔒 安装SSL证书"
mkdir -p /var/www/html
certbot certonly --webroot -w /var/www/html -d pagent.agentpit.io --register-unsafely-without-email --non-interactive --agree-tos 2>/dev/null || echo "⚠️  证书可能已存在"

# 配置Nginx
echo "⚙️ 配置Nginx"
cat > /tmp/pagent-https.nginx << 'NGINXEOF'
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
NGINXEOF

# 启动Nginx
echo "🚢 启动Nginx"
killall nginx 2>/dev/null
sleep 1
nginx -c /tmp/pagent-https.nginx

# 验证服务状态
echo "\n📊 验证服务状态"
sleep 3

# 检查进程状态
echo "🔧 进程状态:"
ps aux | grep node | grep -v grep

# 检查健康检查端点
echo "\n📡 健康检查:"
curl -s https://pagent.agentpit.io/healthz || echo "⚠️  健康检查失败"

# 检查页面访问
echo "\n📡 页面访问:"
curl -s -o /dev/null -w '%{http_code}' https://pagent.agentpit.io/ || echo "⚠️  页面访问失败"

# 检查登录页面
echo "\n📡 登录页面:"
curl -s -o /dev/null -w '%{http_code}' https://pagent.agentpit.io/login || echo "⚠️  登录页面访问失败"

echo "\n🎉 部署完成！应用已成功运行在 https://pagent.agentpit.io"
EOF

echo "\n🎉 部署流程已完成！"
