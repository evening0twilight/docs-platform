<template>
  <div class="empty-state-container">
    <div class="empty-state-content">
      <!-- 图标区域 -->
      <div class="icon-container">
        <svg class="document-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" stroke="currentColor"
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          <polyline points="14,2 14,8 20,8" stroke="currentColor" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round" />
        </svg>
      </div>

      <!-- 文本区域 -->
      <div class="text-container">
        <h3 class="title">请选择文档</h3>
        <p class="description">从左侧文档树中选择一个文档开始编辑</p>
      </div>

      <!-- 可选的操作建议 -->
      <div class="action-hints">
        <div class="hint-item">
          <span class="hint-icon">📄</span>
          <span>点击文档名称打开</span>
        </div>
        <div class="hint-item">
          <span class="hint-icon">➕</span>
          <span>使用左侧 + 按钮创建新文档</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 这里可以添加动画逻辑和其他交互
import { onMounted } from 'vue'

onMounted(() => {
  console.log('EmptyState组件已挂载')
  // 这里可以添加进入动画
})
</script>

<style scoped>
.empty-state-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f9fafb;
  min-height: 400px;
}

.empty-state-content {
  text-align: center;
  max-width: 400px;
  padding: 2rem;
  animation: slideInFromBottom 0.8s ease-out;
}

.icon-container {
  margin-bottom: 1.5rem;
  animation: float 3s ease-in-out infinite;
}

.document-icon {
  width: 4rem;
  height: 4rem;
  margin: 0 auto;
  color: #9ca3af;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
}

.text-container {
  margin-bottom: 2rem;
}

.title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
  animation: fadeInUp 0.6s ease-out;
}

.description {
  color: #6b7280;
  font-size: 1rem;
  animation: fadeInUp 0.6s ease-out 0.2s both;
}

.action-hints {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  animation: fadeInUp 0.6s ease-out 0.4s both;
}

.hint-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #9ca3af;
  transition: color 0.3s ease;
}

.hint-item:hover {
  color: #4b5563;
}

.hint-icon {
  font-size: 1.125rem;
}

/* 动画定义 */
@keyframes float {

  0%,
  100% {
    transform: translateY(0px);
  }

  50% {
    transform: translateY(-10px);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInFromBottom {
  from {
    opacity: 0;
    transform: translateY(50px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>