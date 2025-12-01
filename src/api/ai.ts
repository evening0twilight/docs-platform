import { http } from '@/utils/request';

// ========== 类型定义 ==========

export interface AIContext {
  selectedText?: string;
  cursorPosition?: number;
  documentContent?: string;
  hasSelection?: boolean;
}

export interface AIChatRequest {
  message: string;
  context?: AIContext;
}

export interface AIQuickActionRequest {
  action: 'polish' | 'expand' | 'summarize' | 'translate' | 'continue';
  text: string;
}

export interface AIResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
}

export interface AIStreamChunk {
  chunk?: string;
  done?: boolean;
}

// ========== API 函数 ==========

/**
 * 发送AI聊天请求(非流式)
 */
export async function sendAIChat(data: AIChatRequest): Promise<AIResponse> {
  return http.post('/api/ai/chat', data);
}

/**
 * 快捷操作
 */
export async function quickAction(
  action: AIQuickActionRequest['action'],
  text: string
): Promise<AIResponse> {
  return http.post('/api/ai/quick-action', {
    action,
    text,
  });
}

/**
 * 创建SSE流式连接
 */
export function createAIChatStream(data: AIChatRequest): EventSource {
  // 构建查询参数
  const params = new URLSearchParams({
    message: data.message,
    context: JSON.stringify(data.context || {}),
  });

  // 获取token
  const token = localStorage.getItem('access_token');

  // 创建EventSource连接
  const url = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/ai/chat-stream?${params.toString()}`;

  const eventSource = new EventSource(url, {
    // 注意: EventSource不支持自定义headers,需要通过查询参数传token或使用其他方案
    // 这里使用fetch + ReadableStream的方式代替
  } as any);

  return eventSource;
}

/**
 * 使用Fetch实现流式请求(推荐方式)
 */
export async function* streamAIChat(
  data: AIChatRequest
): AsyncGenerator<string, void, unknown> {
  const token = localStorage.getItem('access_token');

  const response = await fetch(
    `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/ai/chat-stream`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Response body is not readable');
  }

  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      // 解码数据块
      const chunk = decoder.decode(value, { stream: true });

      // 处理SSE格式的数据
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6); // 移除 "data: " 前缀
          try {
            const parsed = JSON.parse(data) as AIStreamChunk;
            if (parsed.done) {
              return;
            }
            if (parsed.chunk) {
              yield parsed.chunk;
            }
          } catch (e) {
            // 忽略解析错误
            console.warn('Failed to parse SSE data:', data);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
