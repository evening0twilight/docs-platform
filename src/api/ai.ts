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
  // request 实例 baseURL 已含 /api,故此处只写 /ai/*
  return http.post('/ai/chat', data);
}

/**
 * 快捷操作
 */
export async function quickAction(
  action: AIQuickActionRequest['action'],
  text: string
): Promise<AIResponse> {
  return http.post('/ai/quick-action', {
    action,
    text,
  });
}

// 流式接口的完整地址:复用 VITE_API_BASE_URL(形如 http://localhost:3000/api)
const AI_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

/**
 * 使用 Fetch + ReadableStream 实现流式请求(SSE)
 */
export async function* streamAIChat(
  data: AIChatRequest
): AsyncGenerator<string, void, unknown> {
  // 与全站一致使用 'token'(此前误用 'access_token' 会导致鉴权失败)
  const token =
    localStorage.getItem('token') || sessionStorage.getItem('token') || '';

  const response = await fetch(`${AI_BASE}/ai/chat-stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`AI 流式请求失败: HTTP ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('响应体不可读(ReadableStream 不可用)');
  }

  const decoder = new TextDecoder();
  // 缓冲区:SSE 数据块可能在任意字节处被切分,必须按行边界累积解析
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // 仅处理已完整成行的部分,残余留在 buffer 等待下次拼接
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trimEnd();
        if (!trimmed.startsWith('data:')) continue;
        const payload = trimmed.slice(5).trimStart(); // 去掉 "data:" 前缀
        if (!payload || payload === '[DONE]') {
          if (payload === '[DONE]') return;
          continue;
        }
        try {
          const parsed = JSON.parse(payload) as AIStreamChunk;
          if (parsed.done) return;
          if (parsed.chunk) yield parsed.chunk;
        } catch {
          // 非 JSON 的心跳/注释行,忽略
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
