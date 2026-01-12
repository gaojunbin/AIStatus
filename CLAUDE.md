# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI API 健康监控系统，实时监控多个 AI 服务端点的可用性和延迟。纯 Node.js 实现，无外部依赖。

## Commands

```bash
npm start              # 启动服务器 (默认端口 3000)
PORT=8080 npm start    # 指定端口启动

# Docker 部署
docker compose up -d   # 后台启动 (端口 14582)
docker compose logs -f # 查看日志
```

## Architecture

**后端 (Node.js, 无依赖)**
```
server.js                      HTTP 服务器
├── GET /api/status            返回所有端点状态 (JSON)
├── POST /api/proxy            CORS 代理转发请求
└── 静态文件服务               index.html, css/, js/

lib/health-checker.js          HealthChecker 类
├── checkEndpoint()            单端点检查 (HEAD ping + POST API 验证)
├── checkAll()                 遍历检查所有端点
└── saveHistory()              持久化到 data/history.json
```

**前端 (原生 JS, ES Modules)**
```
js/app.js                      App 类: 10秒轮询 /api/status
js/components/status-card.js   状态卡片: 延迟指标 + 历史条形图
```

## Data Flow

1. `HealthChecker` 按 `checkInterval` 周期运行，对每个端点执行:
   - HEAD 请求 → `pingLatency`
   - POST 请求 (带 payload) → `chatLatency` + `verified`
2. 结果存入 `this.status` Map 和 `data/history.json`
3. 前端轮询 `/api/status` 获取数据并更新 UI

## Key Patterns

**全局配置** (`config/endpoints.json`):
```json
{
  "title": "API Status Monitor",
  "checkInterval": 60000,
  "historyPoints": 60,
  "endpoints": [...]
}
```

**端点配置**:
```json
{
  "id": "unique-id",
  "name": "Display Name",
  "provider": "Anthropic|OpenAI|Google",
  "model": "model-name",
  "icon": "anthropic|openai|google",
  "url": "https://api.example.com/endpoint",
  "apiKey": "your-api-key",
  "healthCheck": {
    "type": "chat|responses",
    "payload": { /* provider-specific request body */ }
  }
}
```

**Provider 认证处理** (`lib/health-checker.js:93-103`):
- `anthropic.com` → `x-api-key` + `anthropic-version: 2023-06-01`
- `googleapis.com` → `x-goog-api-key`
- 其他 (包括代理) → `Authorization: Bearer`

**状态判定逻辑**:
- `operational`: API 返回 2xx
- `down`: API 返回非 2xx 或超时
- `unknown`: 初始状态或无 apiKey
- 延迟 > 5000ms 时显示 "Slow" 警告

## File Structure

```
config/endpoints.json    端点配置 (需手动添加 apiKey)
data/history.json        历史数据持久化 (自动生成)
```
