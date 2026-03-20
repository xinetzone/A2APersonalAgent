---
title: 技术规范（Spec）
author: A2A Team
created: 2026-03-19
updated: 2026-03-19
version: v1.0.0
---

# A2A Personal Agent 连接平台 - 技术规范

> 本文档从仓库根目录 `spec.md` 迁移并纳入集中式文档库。

## 1. 项目概述

### 1.1 项目名称
**A2A Personal Agent 连接平台** (代号: A2A-Connect)

### 1.2 项目目标
基于 SecondMe 平台的 A2A (Agent-to-Agent) 交互协议，重构互联网用户连接模式，构建具备长期记忆存储与检索、用户偏好学习、同频用户精准匹配功能的 personal agent 系统。

### 1.3 核心技术栈
- **A2A 协议**: Agent-to-Agent 通信协议
- **SecondMe API**: 用户认证、个人资料、Key Memory、Plaza、Discover
- **知乎 API**: 社交实验场景数据接口
- **记忆系统**: 长期记忆存储与语义检索
- **偏好引擎**: 用户行为分析与画像构建
- **匹配算法**: 基于向量相似度的同频用户匹配

---

## 2. 系统架构

### 2.1 核心模块

#### 2.1.1 Personal Agent 模块
- **身份管理**: 基于 SecondMe 的用户身份认证与代理
- **记忆存储**: 利用 SecondMe Key Memory API 实现长期记忆
- **偏好学习**: 持续学习用户行为模式与偏好
- **自主决策**: 基于记忆和偏好进行智能决策

#### 2.1.2 A2A Protocol 模块
- **Agent 注册与发现**: 注册自身能力，发现其他 Agent
- **通信协议**: 支持同步/异步消息、任务委托
- **能力协商**: Agent 间能力匹配与交互协商

#### 2.1.3 Match Agent 模块
- **用户画像构建**: 聚合用户记忆与偏好生成向量画像
- **相似度计算**: 基于向量检索的同频用户匹配
- **匹配结果优化**: 多维度权重调整与排序

#### 2.1.4 Memory Module
- **短期记忆**: 当前会话上下文
- **长期记忆**: SecondMe Key Memory 持久化存储
- **记忆检索**: 语义化的记忆检索能力

#### 2.1.5 Preference Engine
- **行为追踪**: 记录用户交互行为
- **模式识别**: 挖掘用户兴趣模式
- **画像更新**: 动态更新用户偏好画像

---

## 3. A2A 通信协议规范

### 3.1 消息格式

```json
{
  "protocol_version": "1.0",
  "message_id": "uuid",
  "timestamp": "ISO8601",
  "sender": {
    "agent_id": "string",
    "capabilities": ["memory", "matching", "content"]
  },
  "receiver": {
    "agent_id": "string"
  },
  "message_type": "request|response|notification|error",
  "action": {
    "type": "discover|profile_exchange|match_request|match_response|message",
    "parameters": {}
  },
  "payload": {},
  "context": {
    "conversation_id": "uuid",
    "reply_to": "message_id"
  }
}
```

### 3.2 Agent 能力定义

| Capability | 描述 | 核心接口 |
|------------|------|----------|
| memory | 记忆存储与检索 | Key Memory API |
| profile | 用户画像管理 | Profile API |
| matching | 同频用户匹配 | Match Engine |
| content | 内容生成与理解 | LLM APIs |
| communication | Agent 间通信 | A2A Protocol |

---

## 4. 数据模型

### 4.1 用户画像向量

```javascript
{
  "user_id": "string",
  "vector": [0.1, 0.2, ...],
  "dimensions": {
    "interest_tags": ["科技", "音乐", "旅行"],
    "personality_traits": ["外向", "理性"],
    "interaction_patterns": ["主动", "频繁"]
  },
  "updated_at": "timestamp"
}
```

### 4.2 记忆结构

```javascript
{
  "memory_id": "string",
  "user_id": "string",
  "content": "string",
  "type": "preference|experience|knowledge|relationship",
  "embedding": [0.1, 0.2, ...],
  "visibility": 1,
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

---

## 5. API 接口规范

### 5.1 SecondMe 平台 API

| 接口 | 方法 | 描述 |
|------|------|------|
| `/auth/token/code` | POST | 获取访问令牌 |
| `/profile` | GET/PUT | 用户资料管理 |
| `/memories/key` | POST/GET/DELETE | Key Memory 操作 |
| `/discover/users` | GET | 发现同频用户 |
| `/plaza/feed` | GET | Plaza 内容流 |
