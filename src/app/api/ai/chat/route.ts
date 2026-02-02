import { NextRequest, NextResponse } from 'next/server';
import { buildChatRequest } from '@/lib/ai';
import { AIChatRequest, AIChatResponse } from '@/types';

// 兼容的超时控制器
function timeoutPromise(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      const error = new Error('Request timeout');
      error.name = 'AbortError';
      reject(error);
    }, ms);
  });
}

// 智能处理 API 端点
function getApiEndpoint(endpoint: string): string {
  // 如果端点已经包含 /chat/completions，直接使用
  if (endpoint.includes('/chat/completions')) {
    return endpoint;
  }
  // 否则拼接标准路径
  return `${endpoint}/chat/completions`;
}

export async function POST(request: NextRequest) {
  try {
    const body: AIChatRequest = await request.json();

    // 验证请求体
    if (!body.query || !body.config?.apiKey || !body.config?.endpoint) {
      return NextResponse.json(
        { error: '缺少必要参数: query, config.apiKey, config.endpoint' },
        { status: 400 }
      );
    }

    // 构建请求体
    const chatBody = buildChatRequest(body);

    // 获取正确的 API 端点
    const apiEndpoint = getApiEndpoint(body.config.endpoint);

    // 带超时的 fetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      // 调用外部 AI API
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${body.config.apiKey}`,
        },
        body: JSON.stringify(chatBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return NextResponse.json(
          { error: errorData.error?.message || 'AI API 请求失败' },
          { status: response.status }
        );
      }

      const data = await response.json();

      // 返回标准化的响应
      const result: AIChatResponse = {
        content: data.choices[0]?.message?.content || '',
        usage: data.usage ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
        } : undefined,
      };

      return NextResponse.json(result);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if ((fetchError as Error).name === 'AbortError') {
        return NextResponse.json(
          { error: 'AI 请求超时 (15秒)' },
          { status: 408 }
        );
      }
      throw fetchError;
    }

  } catch (error) {
    console.error('AI API error:', error);
    const message = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json(
      { error: `服务器内部错误: ${message}` },
      { status: 500 }
    );
  }
}
