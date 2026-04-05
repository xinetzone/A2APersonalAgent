# A2A Personal Agent 生产环境部署文档

## 1. 环境准备

### 1.1 本地环境要求
- SSH 客户端
- Git
- 本地 SSH 密钥：`~/.ssh/id_rsa_google_longterm`

### 1.2 服务器环境要求
- Debian/Ubuntu 系统
- Podman 4.0+ 
- Podman Compose 1.0+ 
- 至少 2GB 内存
- 至少 20GB 存储空间
- 网络连接正常

## 2. 部署步骤

### 2.1 建立 SSH 连接
```bash
ssh -i ~/.ssh/id_rsa_google_longterm a1@34.126.124.215
```

### 2.2 服务器环境检查
```bash
# 检查 Podman 版本
podman --version

# 检查 Podman Compose 版本
podman-compose --version

# 检查网络连接
ping -c 3 google.com

# 检查存储空间
df -h
```

### 2.3 项目部署
1. **克隆项目代码**
   ```bash
   cd /opt
   git clone https://github.com/your-repo/a2a-personal-agent.git
   cd a2a-personal-agent
   ```

2. **配置环境变量**
   ```bash
   cp .env.example .env.production
   # 编辑 .env.production 文件，配置必要的环境变量
   nano .env.production
   ```

3. **构建和启动服务**
   ```bash
   # 构建项目
   npm install
   npm run build

   # 启动 Podman 容器
   podman-compose --env-file .env.production up -d
   ```

4. **验证服务状态**
   ```bash
   podman-compose ps
   podman-compose logs -f
   ```

## 3. 域名配置

### 3.1 DNS 记录配置
1. 登录域名管理平台（如阿里云、腾讯云等）
2. 添加 A 记录：
   - 主机记录：`pagent`
   - 记录类型：`A`
   - 记录值：`34.126.124.215`
   - TTL：默认值即可

### 3.2 域名解析验证
```bash
# 验证域名解析
dig pagent.agentpit.io

# 验证网站访问
curl -I http://pagent.agentpit.io
```

## 4. 功能测试

### 4.1 页面访问测试
- 首页：`http://pagent.agentpit.io`
- 钱包页面：`http://pagent.agentpit.io/wallet`
- 训练页面：`http://pagent.agentpit.io/training`
- 个人资料：`http://pagent.agentpit.io/profile`
- 话题页面：`http://pagent.agentpit.io/topic`
- 语录页面：`http://pagent.agentpit.io/quotes`
- 小镇页面：`http://pagent.agentpit.io/town`
- 圆桌页面：`http://pagent.agentpit.io/roundtable`
- 荒原页面：`http://pagent.agentpit.io/wasteland`
- 信用页面：`http://pagent.agentpit.io/credit`

### 4.2 API 调用测试
```bash
# 测试 MCP API
curl http://pagent.agentpit.io/api/mcp

# 测试用户信息 API
curl http://pagent.agentpit.io/api/secondme/user/info
```

### 4.3 数据交互测试
- 测试登录功能
- 测试钱包功能（功德系统）
- 测试训练功能
- 测试话题创建和参与
- 测试圆桌讨论

## 5. 常见问题处理

### 5.1 Podman 相关问题
- **Podman 未安装**：
  ```bash
  # 安装 Podman
  apt-get update
  apt-get install -y podman
  
  # 安装 Podman Compose
  apt-get install -y podman-compose
  ```

- **Podman 权限问题**：
  ```bash
  # Podman 不需要 root 权限，使用普通用户即可
  # 如需配置无根模式
  echo "user.max_user_namespaces=15000" >> /etc/sysctl.conf
  sysctl -p
  ```

### 5.2 网络问题
- **端口占用**：
  ```bash
  # 查看端口占用情况
  netstat -tulpn | grep 3000
  
  # 停止占用端口的进程
  kill -9 <PID>
  ```

- **防火墙配置**：
  ```bash
  # 开放端口
  ufw allow 3000
  ufw allow 80
  ufw allow 443
  ```

### 5.3 应用问题
- **服务启动失败**：
  ```bash
  # 查看日志
  podman-compose logs -f
  ```

- **环境变量配置错误**：
  ```bash
  # 检查环境变量
  cat .env.production
  ```

## 6. 部署结果

### 6.1 部署状态
- [ ] 服务器环境检查完成
- [ ] 项目代码部署完成
- [ ] 服务启动成功
- [ ] 域名解析配置完成
- [ ] 功能测试通过

### 6.2 访问信息
- 域名：`pagent.agentpit.io`
- IP 地址：`34.126.124.215`
- 端口：`80`（默认）

## 7. 维护指南

### 7.1 日常维护
- **查看日志**：`podman-compose logs -f`
- **重启服务**：`podman-compose restart`
- **更新代码**：
  ```bash
  git pull
  npm install
  npm run build
  podman-compose up -d --build
  ```

### 7.2 备份策略
- 定期备份 `.env.production` 文件
- 定期备份数据库数据
- 定期备份重要配置文件

### 7.3 故障排查
- 检查 Podman 容器状态
- 检查网络连接
- 检查环境变量配置
- 查看应用日志

## 8. 附录

### 8.1 环境变量参考
```
# 服务器配置
PORT=3000
MCP_PORT=3000

# 数据库配置
DATABASE_URL=your-database-url

# 认证配置
SECONDME_CLIENT_ID=your-client-id
SECONDME_CLIENT_SECRET=your-client-secret

# 其他配置
NODE_ENV=production
```

### 8.2 部署脚本
```bash
#!/usr/bin/env bash
set -euo pipefail

APP_DIR=${APP_DIR:-/opt/a2a-personal-agent}
BRANCH=${BRANCH:-main}
ENV_FILE=${ENV_FILE:-.env.production}

cd "$APP_DIR"

git fetch --all --prune
git checkout "$BRANCH"
git pull --ff-only

npm install
npm run build

podman-compose --env-file "$ENV_FILE" up -d

podman-compose ps
podman-compose logs -f --tail 50
```

### 8.3 测试脚本
```bash
#!/usr/bin/env bash

# 测试页面访问
echo "Testing page access..."
curl -I http://pagent.agentpit.io
curl -I http://pagent.agentpit.io/wallet
curl -I http://pagent.agentpit.io/training

# 测试 API 调用
echo "\nTesting API calls..."
curl http://pagent.agentpit.io/api/mcp

# 测试域名解析
echo "\nTesting domain resolution..."
dig pagent.agentpit.io
```