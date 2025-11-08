<template>
  <div class="history-timeline-sidebar">
    <div class="sidebar-header">
      <h3>🕐 历史版本</h3>
      <p class="subtitle">开发中...</p>
    </div>

    <div class="sidebar-content">
      <!-- 版本时间线 -->
      <a-timeline>
        <a-timeline-item label="刚刚">
          <div class="version-item">
            <div class="version-header">
              <span class="version-number">v1</span>
              <span class="version-author">当前版本</span>
            </div>
            <div class="version-summary">
              正在编辑中...
            </div>
          </div>
        </a-timeline-item>

        <a-timeline-item label="示例" :line-type="'dashed'">
          <div class="version-item disabled">
            <div class="version-header">
              <span class="version-number">v0</span>
              <span class="version-author">历史版本</span>
            </div>
            <div class="version-summary">
              版本历史功能开发中...
            </div>
            <div class="version-actions">
              <a-button size="small" disabled>预览</a-button>
              <a-button size="small" disabled>对比</a-button>
              <a-button size="small" type="primary" disabled>恢复</a-button>
            </div>
          </div>
        </a-timeline-item>
      </a-timeline>
    </div>
  </div>
</template>

<script setup lang="ts">
// 历史版本功能框架，待实现
</script>

<style scoped>
.history-timeline-sidebar {
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
}

.version-item {
  padding: 12px;
  background: var(--color-fill-2);
  border-radius: 4px;
  transition: all 0.2s;
}

.version-item:hover:not(.disabled) {
  background: var(--color-fill-3);
}

.version-item.disabled {
  opacity: 0.6;
}

.version-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.version-number {
  padding: 2px 8px;
  background: var(--color-primary-light-1);
  color: var(--color-primary);
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.version-author {
  font-size: 13px;
  color: var(--color-text-2);
}

.version-summary {
  font-size: 13px;
  color: var(--color-text-3);
  margin-bottom: 8px;
  line-height: 1.6;
}

.version-actions {
  display: flex;
  gap: 8px;
}
</style>
