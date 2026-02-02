import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.OPENAI_API_KEY;
  const endpoint = process.env.OPENAI_ENDPOINT;
  const model = process.env.OPENAI_MODEL;

  if (!apiKey || !endpoint) {
    return NextResponse.json(
      { error: 'No environment configuration found' },
      { status: 404 }
    );
  }

  const config = {
    apiKey,
    endpoint,
    model: model || 'gpt-3.5-turbo',
    provider: 'custom' as const,
  };

  return NextResponse.json(config);
}
