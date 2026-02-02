import { NextResponse } from 'next/server';

export async function GET() {
  // 从服务端环境变量读取配置
  const apiKey = process.env.OPENAI_API_KEY;
  const endpoint = process.env.OPENAI_ENDPOINT;
  const model = process.env.OPENAI_MODEL;

  // 只有当所有必需的环境变量都存在时才返回配置
  if (!apiKey || !endpoint) {
    return NextResponse.json(
      { config: null, hasEnvConfig: false },
      { status: 200 }
    );
  }

  const config = {
    apiKey: '[ENV_CONFIGURED]',
    endpoint: endpoint.includes('/chat/completions') ? endpoint : endpoint,
    model: model || 'gpt-3.5-turbo',
    provider: 'custom' as const,
  };

  // 返回配置但不暴露完整的 apiKey（只返回前缀用于验证）
  return NextResponse.json({
    config,
    hasEnvConfig: true,
  });
}
