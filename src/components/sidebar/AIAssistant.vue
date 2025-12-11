<template>
  <div class="ai-assistant-sidebar">
    <!-- 头部 -->
    <div class="sidebar-header">
      <h3>🤖 AI 助手</h3>
      <a-button size="mini" @click="handleClearChat" :disabled="messages.length === 0">
        清空
      </a-button>
    </div>

    <!-- 内容区 -->
    <div class="sidebar-content">
      <!-- 快捷操作按钮组 -->
      <div class="quick-actions">
        <a-button v-for="preset in AI_PRESETS" :key="preset.id" size="small"
          :disabled="preset.requiresSelection && !hasSelection" @click="handleQuickAction(preset.id)"
          :title="preset.description">
          {{ preset.icon }} {{ preset.label }}
        </a-button>
      </div>

      <!-- 消息列表 -->
      <div class="messages-container" ref="messagesRef">
        <div v-for="msg in messages" :key="msg.id" class="message-item"
          :class="[`message-${msg.role}`, { 'is-streaming': msg.isStreaming }]">
          <!-- 头像 -->
          <div class="message-avatar">
            <span v-if="msg.role === 'user'">👤</span>
            <span v-else-if="msg.role === 'assistant'">🤖</span>
            <span v-else>ℹ️</span>
          </div>

          <!-- 内容 -->
          <div class="message-content">
            <div class="message-text" v-html="formatMessage(msg.content)"></div>
            <div v-if="msg.error" class="message-error">
              ❌ {{ msg.error }}
            </div>
            <div class="message-time">{{ formatTime(msg.timestamp) }}</div>
          </div>
        </div>

        <!-- 加载状态 -->
        <div v-if="isLoading" class="loading-indicator">
          <a-spin />
          <span>AI 思考中...</span>
        </div>

        <!-- 空状态 -->
        <div v-if="messages.length === 0 && !isLoading" class="empty-state">
          <div class="empty-icon">💬</div>
          <p>向 AI 助手提问</p>
          <p class="empty-hint">支持润色、扩写、翻译等功能</p>
        </div>
      </div>

      <!-- 输入区 -->
      <div class="input-area">
        <a-textarea v-model="inputText" placeholder="向 AI 提问... (Ctrl+Enter 发送)" :auto-size="{ minRows: 2, maxRows: 4 }"
          :disabled="isLoading" @keydown="handleKeydown" />
        <div class="input-actions">
          <a-button-group>
            <a-button size="small" :disabled="isLoading" @click="useStreamMode = !useStreamMode"
              :type="useStreamMode ? 'primary' : 'outline'">
              {{ useStreamMode ? '流式' : '普通' }}
            </a-button>
            <a-button type="primary" size="small" :disabled="!inputText.trim() || isLoading" @click="handleSend">
              {{ isLoading ? '发送中...' : '发送' }}
            </a-button>
          </a-button-group>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch } from 'vue';
import type { Editor } from '@tiptap/vue-3';
import { useAIChat } from '@/composables/useAIChat';
import { AI_PRESETS } from '@/utils/aiPresets';

const props = defineProps<{
  editor: Editor;
}>();

// 使用AI聊天组合式函数
const {
  messages,
  isLoading,
  hasSelection,
  sendMessage,
  sendMessageStream,
  executeQuickAction,
  clearChat,
} = useAIChat(props.editor);

const inputText = ref('');
const messagesRef = ref<HTMLElement>();
const useStreamMode = ref(true); // 默认使用流式模式

// 发送消息
async function handleSend() {
  if (!inputText.value.trim()) return;

  const message = inputText.value;
  inputText.value = '';

  // 根据模式选择发送方式
  if (useStreamMode.value) {
    await sendMessageStream(message);
  } else {
    await sendMessage(message);
  }

  // 滚动到底部
  scrollToBottom();
}

// 快捷操作
async function handleQuickAction(actionId: string) {
  await executeQuickAction(
    actionId as 'polish' | 'expand' | 'summarize' | 'translate' | 'continue'
  );
  scrollToBottom();
}

// 清空对话
function handleClearChat() {
  clearChat();
}

// 键盘快捷键
function handleKeydown(e: KeyboardEvent) {
  if (e.ctrlKey && e.key === 'Enter') {
    e.preventDefault();
    handleSend();
  }
}

// 格式化消息内容(简单的换行处理,并过滤AI_COMMAND标记)
function formatMessage(content: string): string {
  // 移除 [AI_COMMAND: ...] 标记 (支持多行匹配)
  const filtered = content.replace(/\[AI_COMMAND:[^\]]*\]/gs, '');
  return filtered.replace(/\n/g, '<br>');
}

// 格式化时间
function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// 滚动到底部
function scrollToBottom() {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTo({
        top: messagesRef.value.scrollHeight,
        behavior: 'smooth',
      });
    }
  });
}

// 监听消息变化,自动滚动
watch(
  () => messages.value.length,
  () => {
    scrollToBottom();
  }
);
</script>

<style scoped>
.ai-assistant-sidebar {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-1);
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.sidebar-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.quick-actions {
  padding: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-fill-1);
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message-item {
  display: flex;
  color: black;
  gap: 12px;
  animation: slideIn 0.3s ease;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-fill-2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 18px;
}

.message-content {
  flex: 1;
  min-width: 0;
}

.message-text {
  padding: 12px;
  border-radius: 8px;
  background: var(--color-fill-2);
  word-wrap: break-word;
  line-height: 1.6;
  font-size: 14px;
}

.message-user .message-text {
  background: rgb(var(--primary-6));
  color: white;
}

.message-system .message-text {
  background: var(--color-fill-3);
  color: var(--color-text-3);
  font-style: italic;
  text-align: center;
}

.message-time {
  margin-top: 4px;
  font-size: 12px;
  color: var(--color-text-3);
}

.message-error {
  margin-top: 8px;
  padding: 8px;
  background: var(--color-danger-light-1);
  color: var(--color-danger-6);
  border-radius: 4px;
  font-size: 12px;
}

.is-streaming .message-text::after {
  content: '▊';
  animation: blink 1s infinite;
  margin-left: 2px;
}

.loading-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-text-3);
  font-size: 14px;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--color-text-3);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-hint {
  font-size: 12px;
  margin-top: 4px;
}

.input-area {
  padding: 16px;
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-1);
}

.input-actions {
  margin-top: 8px;
  display: flex;
  justify-content: flex-end;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes blink {

  0%,
  50% {
    opacity: 1;
  }

  51%,
  100% {
    opacity: 0;
  }
}

/* 滚动条样式 */
.messages-container::-webkit-scrollbar {
  width: 6px;
}

.messages-container::-webkit-scrollbar-track {
  background: transparent;
}

.messages-container::-webkit-scrollbar-thumb {
  background: var(--color-fill-3);
  border-radius: 3px;
}

.messages-container::-webkit-scrollbar-thumb:hover {
  background: var(--color-fill-4);
}
</style>
