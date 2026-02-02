import { NextRequest, NextResponse } from 'next/server';
import { buildChatRequest } from '@/lib/ai';
import { AIChatRequest, AIChatResponse } from '@/types';

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

    // 调用外部 AI API
    const response = await fetch(`${body.config.endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${body.config.apiKey}`,
      },
      body: JSON.stringify(chatBody),
      signal: AbortSignal.timeout(15000), // 15秒超时
    });

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

  } catch (error) {
    // 处理超时错误
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'AI 请求超时 (15秒)' },
        { status: 408 }
      );
    }

    console.error('AI API error:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}
