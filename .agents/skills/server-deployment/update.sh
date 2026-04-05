#!/bin/bash
set -euo pipefail

# 版本更新脚本
echo "🔄 开始更新A2A Personal Agent..."

# 1. 本地打包
echo "\n📦 本地打包最新代码"
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

# 进入项目目录
cd /opt/a2a

# 解压项目文件
echo "📁 解压项目文件"
tar -xzf archive.tar.gz

# 安装依赖
echo "📦 安装依赖"
npm install

# 构建项目
echo "🏗️ 构建项目"
npm run build

# 重启MCP服务
echo "🚢 重启MCP服务"
pkill -f "node dist/mcp/server.js" 2>/dev/null
sleep 1
nohup node dist/mcp/server.js > /tmp/mcp.log 2>&1 &
sleep 2

# 重启Next.js前端
echo "🚢 重启Next.js前端"
pkill -f "next-server" 2>/dev/null
sleep 1
PORT=3001 nohup npm run start > /tmp/nextjs.log 2>&1 &
sleep 2

# 验证服务状态
echo "\n📊 验证服务状态"
sleep 3

# 检查健康检查端点
echo "📡 健康检查:"
curl -s https://pagent.agentpit.io/healthz || echo "⚠️  健康检查失败"

# 检查页面访问
echo "\n📡 页面访问:"
curl -s -o /dev/null -w '%{http_code}' https://pagent.agentpit.io/ || echo "⚠️  页面访问失败"

echo "\n🎉 更新完成！应用已成功更新并运行在 https://pagent.agentpit.io"
EOF

echo "\n🎉 版本更新流程已完成！"
