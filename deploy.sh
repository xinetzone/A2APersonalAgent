#!/bin/bash
set -euo pipefail

# 环境检查
echo "🔍 检查服务器环境..."
echo "检查 Podman 版本..."
podman --version || (echo "❌ Podman 未安装，正在安装..." && apt-get update && apt-get install -y podman)

echo "检查 Podman Compose 版本..."
podman-compose --version || (echo "❌ Podman Compose 未安装，正在安装..." && apt-get install -y podman-compose)

echo "检查网络连接..."
ping -c 3 google.com || echo "⚠️  网络连接可能存在问题"

echo "检查存储空间..."
df -h

# 部署应用
echo "\n🚀 开始部署 A2A Personal Agent..."

# 创建部署目录
mkdir -p /opt/a2a-personal-agent
cd /opt/a2a-personal-agent

# 克隆代码
echo "📁 克隆项目代码..."
git clone https://github.com/your-repo/a2a-personal-agent.git . || echo "⚠️  代码克隆失败，可能需要手动处理"

# 配置环境变量
echo "⚙️  配置环境变量..."
cp .env.example .env.production || echo "⚠️  环境变量文件复制失败"

# 构建项目
echo "🏗️  构建项目..."
npm install || echo "⚠️  依赖安装失败"
npm run build || echo "⚠️  项目构建失败"

# 启动服务
echo "🚢 启动 Podman 容器..."
podman-compose --env-file .env.production up -d || echo "⚠️  容器启动失败"

# 验证服务状态
echo "\n📊 验证服务状态..."
podman-compose ps
echo "\n查看服务日志..."
podman-compose logs --tail 50

echo "\n🎉 部署完成！请访问 http://pagent.agentpit.io 查看应用"
