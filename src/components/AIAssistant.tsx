'use client';

import { useState } from 'react';
import { useWordStore } from '@/store/useWordStore';
import { AIConfigModal } from './AIConfigModal';
import { AIChatResponse } from '@/types';

interface AIAssistantProps {
  query: string;
  type: 'word' | 'sentence';
}

export function AIAssistant({ query, type }: AIAssistantProps) {
  const { getAIConfig } = useWordStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [content, setContent] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [showConfigModal, setShowConfigModal] = useState(false);

  const handleQuery = async () => {
    const config = getAIConfig();
    if (!config || !config.apiKey) {
      setShowConfigModal(true);
      return;
    }

    setIsLoading(true);
    setError('');
    setContent('');

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          type,
          config,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '请求失败');
      }

      const data: AIChatResponse = await response.json();
      setContent(data.content);
      setIsExpanded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setIsLoading(false);
    }
  };

  // 渲染 Markdown 内容
  const renderContent = () => {
    if (!content) return null;

    // 简单的 Markdown 渲染（生产环境建议使用 react-markdown）
    const html = content
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2 text-gray-800 dark:text-gray-100">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-4 mb-2 text-gray-800 dark:text-gray-100">$1</h2>')
      .replace(/^- (.*$)/gim, '<li class="ml-4 text-gray-700 dark:text-gray-300">$1</li>')
      .replace(/\n/g, '<br />');

    return (
      <div
        className="prose prose-sm dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  };

  return (
    <>
      <div className="mt-4">
        {!isExpanded ? (
          <button
            onClick={handleQuery}
            disabled={isLoading}
            className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="animate-spin">⏳</span>
                思考中...
              </>
            ) : (
              <>
                <span>🤖</span>
                AI 助手解析
              </>
            )}
          </button>
        ) : (
          <div className="border border-purple-200 dark:border-purple-800 rounded-xl overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-3 flex items-center justify-between">
              <span className="text-white font-medium">🤖 AI 助手解析</span>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-white/80 hover:text-white"
              >
                收起 ▼
              </button>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-950/20">
              {renderContent()}
              <button
                onClick={handleQuery}
                disabled={isLoading}
                className="mt-4 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {isLoading ? '重新生成中...' : '🔄 重新生成'}
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
            <button
              onClick={() => setShowConfigModal(true)}
              className="mt-2 text-sm text-red-600 dark:text-red-400 underline"
            >
              配置 AI
            </button>
          </div>
        )}
      </div>

      <AIConfigModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        onSave={() => {
          setShowConfigModal(false);
          handleQuery();
        }}
      />
    </>
  );
}
