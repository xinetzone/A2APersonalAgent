# 故障排查指南

## 常见问题

### 1. 登录失败 "token_exchange_failed"

**症状**: OAuth回调后显示登录失败

**可能原因**:
- `SECONDME_CLIENT_ID` 或 `SECONDME_CLIENT_SECRET` 配置错误
- OAuth回调地址不匹配
- 授权码已过期

**排查步骤**:

1. 检查环境变量
```bash
echo $SECONDME_CLIENT_ID
echo $SECONDME_CLIENT_SECRET
```

2. 验证回调地址
   - 登录 SecondMe 开发者平台
   - 检查应用配置中的回调地址
   - 确保与 `getRedirectUri()` 返回值一致

3. 查看服务器日志
```bash
tail -f logs/app.log | grep "token_exchange"
```

### 2. MCP服务无响应

**症状**: API请求一直pending

**排查步骤**:

1. 检查服务是否运行
```bash
curl http://localhost:3000/healthz
```

2. 检查端口占用
```bash
lsof -i :3000
```

3. 查看进程日志

### 3. 记忆同步失败

**症状**: `saveGuidanceAsMemory` 返回错误

**可能原因**:
- Token权限不足
- 内容长度超限（最大10000字符）
- 网络连接问题

**解决方案**:
1. 确认Token具有 `memories:write` 权限
2. 减少保存内容长度
3. 检查网络连接

### 4. 认证头缺失错误

**症状**: 返回 `Missing or invalid Authorization header`

**原因**: 使用了旧的URL参数方式传递token

**解决方案**:
请使用Authorization Header方式:
```bash
curl -X POST "http://localhost:3000/mcp" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_profile"}}'
```

### 5. 输入验证失败

**症状**: 返回 `ValidationError`

**常见原因**:
- 关键词为空或超过100字符
- 日期格式不正确（应为YYYY-MM-DD）
- 内容超过10000字符

## 调试模式

启用详细日志：

```bash
LOG_LEVEL=debug npm run dev:mcp
```

## 联系支持

如问题无法解决，请联系：
- GitHub Issues: https://github.com/xxx/a2a-personal-agent/issues
