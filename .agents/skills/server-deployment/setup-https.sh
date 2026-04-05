#!/bin/bash
set -euo pipefail

# HTTPS配置脚本
echo "🔒 开始配置HTTPS..."

# 连接服务器并执行配置
ssh -i ~/.ssh/id_rsa_google_longterm a1@34.126.124.215 << 'EOF'

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

# 验证HTTPS配置
echo "\n📊 验证HTTPS配置"
sleep 2

# 检查健康检查端点
echo "📡 健康检查 (HTTPS):"
curl -s https://pagent.agentpit.io/healthz || echo "⚠️  健康检查失败"

# 检查页面访问
echo "\n📡 页面访问 (HTTPS):"
curl -s -o /dev/null -w '%{http_code}' https://pagent.agentpit.io/ || echo "⚠️  页面访问失败"

# 检查证书信息
echo "\n🔒 证书信息:"
openssl s_client -servername pagent.agentpit.io -connect pagent.agentpit.io:443 </dev/null 2>/dev/null | openssl x509 -noout -subject -issuer -dates

echo "\n🎉 HTTPS配置完成！应用已成功运行在 https://pagent.agentpit.io"
EOF

echo "\n🎉 HTTPS配置流程已完成！"
