# MCP 工具 API 文档

## 概述

A2A Personal Agent MCP Server 提供了一套基于 JSON-RPC 2.0 的工具接口。

**基础URL**: `http://localhost:3000/mcp`

**认证方式**: Bearer Token (必须使用 Authorization Header)

## 认证

所有需要认证的工具调用必须在请求头中包含:

```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

## 工具列表

### get_profile

获取当前登录用户的Profile信息。

**参数**: 无

**示例**:
```bash
curl -X POST "http://localhost:3000/mcp" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "get_profile"
    }
  }'
```

**响应**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [{
      "type": "text",
      "text": "{\"name\": \"张三\", \"avatar\": \"...\", ...}"
    }]
  }
}
```

---

### search_memories

搜索用户的记忆内容。

**参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| keyword | string | 是 | 搜索关键词，1-100字符 |
| pageNo | number | 否 | 页码，默认1 |
| pageSize | number | 否 | 每页数量，默认20，最大100 |

**示例**:
```bash
curl -X POST "http://localhost:3000/mcp" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "search_memories",
      "arguments": {"keyword": "道德经", "pageNo": 1, "pageSize": 10}
    }
  }'
```

---

### create_memory

创建新的记忆。

**参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| content | string | 是 | 记忆内容，1-10000字符 |
| visibility | number | 否 | 可见性，1私有，2公开，默认1 |

**示例**:
```bash
curl -X POST "http://localhost:3000/mcp" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "create_memory",
      "arguments": {"content": "这是一条重要的记忆", "visibility": 1}
    }
  }'
```

---

### discover_users

发现同频用户。

**参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| pageNo | number | 否 | 页码，默认1 |
| pageSize | number | 否 | 每页数量，默认20，最大100 |
| circleType | string | 否 | 圈子类型 |

---

### get_matching_score

获取与指定用户的匹配分数。

**参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| targetUsername | string | 是 | 目标用户名 |

---

### dao_daily_guidance

生成一条"道德经（帛书版）"风格的今日箴言与行动建议。

**参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| date | string | 否 | 日期（YYYY-MM-DD），默认今天 |
| topic | string | 否 | 主题/困惑，如"焦虑""关系""工作" |
| mood | string | 否 | 情绪，如"低落""烦躁""平静" |

**示例**:
```bash
curl -X POST "http://localhost:3000/mcp" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "dao_daily_guidance",
      "arguments": {"topic": "工作", "mood": "焦虑"}
    }
  }'
```

---

### dao_topic_guidance

按主题生成"道德经（帛书版）"风格的指导与反思问题。

**参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| topic | string | 是 | 主题/困惑 |
| context | string | 否 | 上下文补充 |
| mood | string | 否 | 情绪 |

---

### dao_quotes_list

列出可用的帛书版道德经摘句。

**参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| theme | string | 否 | 按主题过滤，如"无为""知足""柔弱" |
| limit | number | 否 | 返回条数，默认20，最大100 |

---

### dao_save_daily_guidance_memory

将"今日箴言"保存为 SecondMe Key Memory。

**参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| date | string | 否 | 日期（YYYY-MM-DD），默认今天 |
| topic | string | 否 | 主题 |
| mood | string | 否 | 情绪 |
| visibility | number | 否 | 可见性，1私有，2公开，默认1 |

---

## 错误码

| code | 说明 |
|------|------|
| -32700 | Parse error - 无效的JSON |
| -32600 | Invalid Request - 请求格式错误 |
| -32602 | Invalid Params - 参数无效 |
| -32603 | Internal error - 服务器内部错误 |

## 错误响应示例

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32602,
    "message": "keyword: 关键词不能为空"
  }
}
```
