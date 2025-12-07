<template>
  <div class="history-timeline-sidebar">
    <div class="sidebar-header">
      <h3 class="text-black">🕐 历史版本</h3>
      <a-alert type="warning" :closable="false" style="margin-top: 12px;">
        除每天自动最后一次自动保存的和手动保存的版本，其他均不作为历史版本进行保存。望您及时保存重要版本。
      </a-alert>
    </div>

    <div class="sidebar-content">
      <VersionHistory v-if="documentId && editor" :document-id="Number(documentId)" :editor="editor"
        @view-version="handleViewVersion" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Editor } from '@tiptap/vue-3'
import type { DocumentVersion } from '@/types/version'
import VersionHistory from '../VersionHistory.vue'
import { useTabsStore } from '@/store/tabs'

const props = defineProps<{
  editor: Editor | null
}>()

const route = useRoute()
const router = useRouter()
const tabsStore = useTabsStore()
const documentId = computed(() => route.params.id as string)

// 处理查看版本
function handleViewVersion(version: DocumentVersion) {
  const currentDocId = route.params.id as string

  // 获取当前文档名称
  const currentTab = tabsStore.tabs.find(t => t.id === currentDocId)
  const docName = currentTab?.title || '文档'

  // 生成版本预览ID和标题
  const versionId = `${currentDocId}-v${version.versionNumber}`
  const versionTitle = `${docName} - 版本${version.versionNumber}`

  // 添加版本预览标签
  tabsStore.addTab({
    id: versionId,
    title: versionTitle,
    route: `/workspace/document/${currentDocId}/version/${version.id}`,
    isModified: false,
  })

  // 跳转到版本预览路由
  router.push(`/workspace/document/${currentDocId}/version/${version.id}`)
}
</script>

<style scoped>
.history-timeline-sidebar {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid var(--color-border);
}

.sidebar-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.sidebar-content {
  flex: 1;
  overflow: hidden;
}
</style>
