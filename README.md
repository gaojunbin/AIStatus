# AI API Health Monitor

实时监控多个 AI 服务端点的可用性和延迟。

## 快速开始

1. **配置端点** - 编辑 `config/endpoints.json`，添加要监控的 API：

```json
{
  "checkInterval": 60000,
  "historyPoints": 60,
  "endpoints": [
    {
      "id": "claude",
      "name": "Claude",
      "provider": "Anthropic",
      "model": "claude-3",
      "icon": "anthropic",
      "url": "https://api.anthropic.com/v1/messages",
      "apiKey": "your-api-key",
      "healthCheck": {
        "type": "chat",
        "payload": {
          "model": "claude-3-sonnet-20240229",
          "messages": [{"role": "user", "content": "ping"}],
          "max_tokens": 1
        }
      }
    }
  ]
}
```

2. **启动服务**

```bash
npm start
```

3. **访问监控页面** - 打开 http://localhost:3000

## 配置说明

| 字段 | 说明 |
|------|------|
| `checkInterval` | 检查间隔（毫秒） |
| `historyPoints` | 保留的历史数据点数 |
| `icon` | 图标类型：`anthropic` / `openai` / `google` |
| `healthCheck.type` | API 类型：`chat` 或 `responses` |

## 环境变量

```bash
PORT=8080 npm start  # 自定义端口，默认 3000
```
