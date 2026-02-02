# AI API 配置指南

## 简介

vocab-app 支持使用任何兼容 OpenAI API 格式的 AI 服务来提供智能单词解析和句子分析功能。

## 配置方式

### 方式一：应用内配置（推荐）

1. 打开应用，搜索单词或句子
2. 点击 "🤖 AI 助手解析" 按钮
3. 在弹出的配置框中填写：
   - **API 端点**：AI 服务地址
   - **API Key**：您的 API 密钥
   - **模型**（可选）：使用的模型名称

配置会保存在浏览器的 localStorage 中。

### 方式二：环境变量配置（自部署）

1. 复制 `.env.example` 为 `.env.local`
2. 填写您的 API 信息

```bash
cp .env.example .env.local
```

## 支持 AI 服务商

### OpenAI 官方

| 配置项 | 值 |
|--------|-----|
| API 端点 | `https://api.openai.com/v1` |
| 模型 | `gpt-3.5-turbo` / `gpt-4` |
| 获取 Key | https://platform.openai.com/api-keys |

### 国内服务商

#### 通义千问（阿里云）

| 配置项 | 值 |
|--------|-----|
| API 端点 | `https://dashscope.aliyuncs.com/compatible-mode/v1` |
| 模型 | `qwen-plus` / `qwen-turbo` |
| 获取 Key | https://dashscope.aliyuncs.com/ |

#### DeepSeek

| 配置项 | 值 |
|--------|-----|
| API 端点 | `https://api.deepseek.com` |
| 模型 | `deepseek-chat` |
| 获取 Key | https://platform.deepseek.com/ |

#### Moonshot（月之暗面）

| 配置项 | 值 |
|--------|-----|
| API 端点 | `https://api.moonshot.cn/v1` |
| 模型 | `moonshot-v1-8k` / `moonshot-v1-32k` |
| 获取 Key | https://platform.moonshot.cn/ |

#### 智谱 AI（ChatGLM）

| 配置项 | 值 |
|--------|-----|
| API 端点 | `https://open.bigmodel.cn/api/paas/v4` |
| 模型 | `glm-4` / `glm-4-flash` |
| 获取 Key | https://open.bigmodel.cn/ |

### 其他兼容服务

任何支持 OpenAI API 格式的服务都可以使用，只需填写正确的端点地址即可。

## 常见问题

### Q: API Key 保存在哪里？

A: 配置保存在浏览器的 localStorage 中，仅在您的本地设备上，不会上传到服务器。

### Q: 可以更换 AI 服务吗？

A: 可以，随时点击 "🤖 AI 助手解析" 按钮重新配置即可。

### Q: 为什么请求超时？

A: 可能是网络问题或 API 服务不稳定，请检查：
1. API 端点地址是否正确
2. API Key 是否有效
3. 网络连接是否正常

### Q: 如何查看 Token 使用情况？

A: 目前应用仅显示 AI 返回的内容，Token 统计功能正在开发中。请登录您的 AI 服务商控制台查看详细使用情况。

## 安全提示

⚠️ **重要**：
- 不要将 `.env.local` 文件提交到 Git
- 不要分享您的 API Key
- 定期轮换 API Key
- 建议为应用设置单独的 API Key 并设置预算限制
