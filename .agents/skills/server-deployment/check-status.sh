#!/bin/bash
set -euo pipefail

# 服务状态检查脚本
echo "📋 服务状态监控"

# 连接服务器并执行检查
ssh -i ~/.ssh/id_rsa_google_longterm a1@34.126.124.215 << 'EOF'

# 检查进程状态
echo "\n🔧 进程状态:"
ps aux | grep node | grep -v grep

# 检查Nginx进程
echo "\n🔧 Nginx 状态:"
ps aux | grep nginx | grep -v grep

# 查看MCP服务日志
echo "\n📄 MCP 服务日志:"
tail -n 20 /tmp/mcp.log

# 查看Next.js日志
echo "\n📄 Next.js 日志:"
tail -n 20 /tmp/nextjs.log

# 检查健康检查端点
echo "\n📡 健康检查:"
curl -s https://pagent.agentpit.io/healthz || echo "⚠️  健康检查失败"

# 检查页面访问
echo "\n📡 页面访问:"
curl -s -o /dev/null -w '%{http_code}' https://pagent.agentpit.io/ || echo "⚠️  页面访问失败"

# 检查登录页面
echo "\n📡 登录页面:"
curl -s -o /dev/null -w '%{http_code}' https://pagent.agentpit.io/login || echo "⚠️  登录页面访问失败"

# 检查API端点
echo "\n📡 API 端点:"
curl -s -o /dev/null -w '%{http_code}' https://pagent.agentpit.io/api/mcp || echo "⚠️  API 端点访问失败"

# 检查系统资源
echo "\n💾 系统资源:"
top -b -n 1 | head -n 20

# 检查磁盘空间
echo "\n💾 磁盘空间:"
df -h

# 检查网络连接
echo "\n🌐 网络连接:"
ping -c 3 google.com || echo "⚠️  网络连接可能存在问题"

echo "\n🎉 服务状态检查完成！"
EOF

echo "\n🎉 状态监控完成！"
