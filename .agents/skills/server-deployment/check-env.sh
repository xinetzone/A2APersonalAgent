#!/bin/bash
set -euo pipefail

# 环境检查脚本
echo "🔍 正在检查服务器环境..."

# 连接服务器并执行检查
ssh -i ~/.ssh/id_rsa_google_longterm a1@34.126.124.215 << 'EOF'

# 检查Podman版本
echo "\n✅ 检查 Podman 版本..."
podman --version || (echo "❌ Podman 未安装" && exit 1)

# 检查Podman Compose版本
echo "✅ 检查 Podman Compose 版本..."
podman-compose --version || (echo "❌ Podman Compose 未安装" && exit 1)

# 检查Node.js版本
echo "✅ 检查 Node.js 版本..."
node --version || (echo "❌ Node.js 未安装" && exit 1)

# 检查Nginx版本
echo "✅ 检查 Nginx 版本..."
nginx -v 2>&1 || (echo "❌ Nginx 未安装" && exit 1)

# 检查网络连接
echo "✅ 检查网络连接..."
ping -c 3 google.com || (echo "⚠️  网络连接可能存在问题" && exit 1)

# 检查存储空间
echo "✅ 检查存储空间..."
df -h

# 检查项目目录
echo "✅ 检查项目目录..."
mkdir -p /opt/a2a
ls -la /opt/a2a

echo "\n🎉 环境检查通过，满足部署要求！"
EOF

echo "\n🎉 环境检查完成！"
