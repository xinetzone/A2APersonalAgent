# GitHub 代码提交指南

## 提交步骤

### 1. 检查更改
```bash
# 查看已修改的文件
git status

# 查看具体更改内容
git diff
```

### 2. 暂存更改
```bash
# 暂存所有更改
git add .

# 或暂存特定文件
git add doc/a2a-personal-agent/deployment/v1.0.0/deployment-production.md
git add doc/a2a-personal-agent/deployment/v1.0.0/git-commit-guide.md
```

### 3. 提交更改
```bash
git commit -m "feat: 完成 A2A Personal Agent 生产环境部署"
```

### 4. 推送更改
```bash
git push origin main
```

## 提交信息规范

### 提交信息格式
```
<类型>: <描述>

<详细描述>

<可选的关联信息>
```

### 类型说明
- **feat**: 新功能
- **fix**: 修复 bug
- **docs**: 文档更改
- **style**: 代码格式调整
- **refactor**: 代码重构
- **test**: 测试相关
- **chore**: 构建或依赖更新

### 示例提交信息
```
feat: 完成 A2A Personal Agent 生产环境部署

- 编写了详细的部署文档
- 提供了域名解析配置指南
- 制定了功能测试计划
- 包含了常见问题处理方案

相关任务: #部署任务
```

## 注意事项

1. **不要提交敏感信息**：确保不提交 `.env` 文件、密钥文件等敏感信息
2. **提交前测试**：确保所有更改不会破坏现有功能
3. **保持提交原子性**：每个提交应该只包含一个逻辑更改
4. **编写清晰的提交信息**：便于后续代码审查和版本回溯
5. **定期推送**：避免本地更改积累过多

## 常见问题处理

### 推送失败
```bash
# 先拉取最新代码
git pull --rebase origin main

# 解决冲突后重新推送
git push origin main
```

### 提交错误
```bash
# 修正最后一次提交
git commit --amend

# 推送修正后的提交
git push origin main --force
```

### 分支管理
```bash
# 创建新分支
git checkout -b deployment-v1

# 切换分支
git checkout main

# 合并分支
git merge deployment-v1
```