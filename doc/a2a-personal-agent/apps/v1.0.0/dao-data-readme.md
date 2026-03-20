---
title: 道德经文本数据说明
author: A2A Team
created: 2026-03-19
updated: 2026-03-19
version: v1.0.0
---

# 道德经文本数据

默认读取 `data/mawangdui.json`。如果该文件不存在，则回退到内置示例摘句。

本仓库内置的 `data/mawangdui.json` 为“摘句库”（便于主题检索与生成建议），不是逐字全文。

## 数据格式

将权威整理的“帛书版道德经”摘句按以下 JSON 数组格式放入 `data/mawangdui.json`：

```json
[
  {
    "id": "mawangdui-001",
    "title": "（可选）标题/章名",
    "text": "正文摘句",
    "themes": ["无为", "不争", "知足"]
  }
]
```

也可通过环境变量 `DAO_TEXT_FILE` 指定任意绝对/相对路径。

