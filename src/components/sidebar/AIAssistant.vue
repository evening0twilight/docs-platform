<template>
  <div class="ai-assistant-sidebar">
    <div class="sidebar-header">
      <h3>🤖 AI 助手</h3>
      <p class="subtitle">开发中...</p>
    </div>

    <div class="sidebar-content">
      <!-- 快捷操作 -->
      <div class="ai-actions">
        <a-button long disabled>✨ 润色文本</a-button>
        <a-button long disabled>📝 扩写内容</a-button>
        <a-button long disabled>📋 生成摘要</a-button>
        <a-button long disabled>🌐 翻译</a-button>
      </div>

      <!-- 对话框 -->
      <div class="ai-chat">
        <div class="messages">
          <div class="message system">
            AI 助手功能开发中，敬请期待...
          </div>
        </div>

        <a-textarea placeholder="向 AI 提问..." disabled :auto-size="{ minRows: 3, maxRows: 5 }" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// AI 助手功能框架，待实现
</script>

<style scoped>
.ai-assistant-sidebar {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid var(--color-border);
}

.sidebar-header h3 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 500;
}

.subtitle {
  margin: 0;
  font-size: 12px;
  color: var(--color-text-3);
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ai-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ai-chat {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.messages {
  flex: 1;
  padding: 12px;
  background: var(--color-fill-2);
  border-radius: 4px;
  min-height: 200px;
}

.message {
  padding: 8px 12px;
  border-radius: 4px;
  background: var(--color-bg-2);
  color: var(--color-text-2);
  font-size: 14px;
}

.message.system {
  text-align: center;
  font-style: italic;
}
</style>
