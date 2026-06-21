<template>
  <div class="tab-bar" v-if="tabs.length > 0">
    <div class="tabs-container">
      <div v-for="(tab, index) in tabs" :key="tab.id" class="tab" :class="{ active: activeTabId === tab.id }"
        @click="switchTab(tab.id)" :title="tab.title">
        <span class="tab-title">{{ tab.title }}</span>
        <span v-if="tab.isModified" class="modified-indicator">•</span>
        <button class="close-btn" @click.stop="closeTab(tab.id)" :title="`关闭 ${tab.title}`">
          ×
        </button>
      </div>
    </div>
  </div>

  <!-- 当没有标签时显示的调试信息 -->
  <div v-else class="no-tabs-debug" style="padding: 8px; color: #666; font-size: 14px;">
    暂无标签页 (点击左侧文档来打开标签)
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useTabsStore } from '@/store/tabs'
import { useRouter } from 'vue-router'

const tabsStore = useTabsStore()
const router = useRouter()

// 从store获取数据
const tabs = computed(() => tabsStore.tabs)
const activeTabId = computed(() => tabsStore.activeTabId)

console.log('🏷️ TabBar组件已挂载')
console.log('📊 当前标签数量:', tabs.value.length)
console.log('📋 标签列表:', tabs.value)

// 监听tabs变化
watch(tabs, (newTabs) => {
  console.log('🔄 TabBar: 标签列表更新:', newTabs)
}, { deep: true })

// 切换标签
const switchTab = (tabId: string) => {
  tabsStore.switchTab(tabId)
  const tab = tabs.value.find(t => t.id === tabId)
  if (tab) {
    router.push(tab.route)
  }
}

// 关闭标签
const closeTab = (tabId: string) => {
  const tab = tabs.value.find(t => t.id === tabId)

  // 如果有未保存的修改，弹出确认对话框
  if (tab?.isModified) {
    if (!confirm(`文档 "${tab.title}" 有未保存的修改，确定要关闭吗？`)) {
      return
    }
  }

  tabsStore.closeTab(tabId)

  // 如果关闭后没有标签了，跳转到工作台首页
  if (tabsStore.tabsCount === 0) {
    router.push('/workspace')
  } else if (tabsStore.activeTabId) {
    // 跳转到新的活动标签
    const activeTab = tabsStore.activeTab
    if (activeTab) {
      router.push(activeTab.route)
    }
  }
}

</script>

<style scoped>
.tab-bar {
  height: 100%;
  display: flex;
  align-items: center;
}

.tabs-container {
  display: flex;
  align-items: center;
  height: 100%;
  overflow-x: auto;
  gap: 4px;
}

.tab {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: #f3f4f7;
  border: 1px solid var(--c-border);
  border-radius: 8px 8px 0 0;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 120px;
  max-width: 200px;
  position: relative;
  height: 36px;
  gap: 6px;
}

.tab:hover {
  background: #e9ecef;
}

.tab.active {
  background: white;
  border-bottom: 2px solid #4f46e5;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.tab-title {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 14px;
  color: #333;
}

.modified-indicator {
  color: #ff4d4f;
  font-weight: bold;
  font-size: 16px;
  line-height: 1;
}

.close-btn {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.1);
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: all 0.2s;
  flex-shrink: 0;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.2);
  color: #333;
}

/* 滚动条样式 */
.tabs-container::-webkit-scrollbar {
  height: 4px;
}

.tabs-container::-webkit-scrollbar-track {
  background: transparent;
}

.tabs-container::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 2px;
}

.tabs-container::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style>