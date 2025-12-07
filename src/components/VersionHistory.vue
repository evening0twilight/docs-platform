<template>
  <div class="version-history-panel">
    <!-- 头部 -->
    <div class="panel-header">
      <h3 class="text-black">📜 版本列表</h3>
      <div class="header-actions">
        <a-button size="mini" @click="handleRefresh" :loading="loading">
          <template #icon><icon-refresh /></template>
          刷新
        </a-button>
      </div>
    </div>

    <!-- 版本列表 -->
    <div class="panel-content">
      <a-spin :loading="loading && versions.length === 0" class="full-spinner">
        <a-empty v-if="!loading && versions.length === 0" description="暂无版本历史" />

        <div v-else class="version-list">
          <div v-for="version in versions" :key="version.id" class="version-item"
            :class="{ 'is-restore': version.isRestore }">
            <!-- 版本信息 -->
            <div class="version-info">
              <div class="version-header">
                <span class="version-number">版本 {{ version.versionNumber }}</span>
                <span v-if="version.isRestore" class="restore-badge">恢复</span>
                <span v-else-if="!version.isAutoSave" class="manual-badge">手动</span>
              </div>

              <div class="version-meta">
                <a-avatar :size="24" class="author-avatar">
                  <img v-if="version.author.avatar" :src="version.author.avatar" />
                  <span v-else>{{ version.author.username[0] }}</span>
                </a-avatar>
                <span class="author-name">{{ version.author.username }}</span>
                <span class="divider">·</span>
                <span class="version-time">{{ formatTime(version.createdAt) }}</span>
                <span class="divider">·</span>
                <span class="version-size">{{ formatSize(version.contentSize) }}</span>
              </div>

              <div v-if="version.changeDescription" class="version-description">
                {{ version.changeDescription }}
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="version-actions">
              <a-button size="small" @click="handleView(version)">
                查看
              </a-button>
              <a-button size="small" type="primary" @click="handleRestore(version.id, version.versionNumber)">
                恢复
              </a-button>
              <a-button size="small" status="danger" @click="handleDelete(version.id, version.versionNumber)">
                删除
              </a-button>
            </div>
          </div>

          <!-- 加载更多 -->
          <div v-if="hasMore" class="load-more">
            <a-button @click="handleLoadMore" :loading="loading">
              加载更多
            </a-button>
          </div>
        </div>
      </a-spin>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { IconRefresh } from '@arco-design/web-vue/es/icon';
import { Modal, Message } from '@arco-design/web-vue';
import { useVersionHistory } from '@/composables/useVersionHistory';
import { deleteDocumentVersion } from '@/api/version';
import type { Editor } from '@tiptap/vue-3';
import type { DocumentVersion } from '@/types/version';

const props = defineProps<{
  documentId: number;
  editor: Editor | null;
}>();

const emit = defineEmits<{
  viewVersion: [version: DocumentVersion]
}>();

const {
  versions,
  hasMore,
  loading,
  selectedVersion,
  loadVersions,
  loadMore,
  viewVersion,
  restoreVersion,
  refresh,
  formatSize,
  formatTime,
} = useVersionHistory(props.documentId, props.editor);

// 加载版本列表
onMounted(() => {
  loadVersions();
});

// 查看版本 - emit事件让父组件处理
async function handleView(version: DocumentVersion) {
  emit('viewVersion', version);
}

// 恢复版本
async function handleRestore(versionId: number, versionNumber: number) {
  await restoreVersion(versionId, versionNumber);
}

// 刷新列表
function handleRefresh() {
  refresh();
}

// 加载更多
function handleLoadMore() {
  loadMore();
}

// 删除版本
function handleDelete(versionId: number, versionNumber: number) {
  Modal.warning({
    title: '删除版本',
    content: `确定要删除版本 ${versionNumber} 吗？删除后将无法恢复!`,
    okText: '确认删除',
    cancelText: '取消',
    okButtonProps: { status: 'danger' },
    onOk: async () => {
      try {
        await deleteDocumentVersion(props.documentId, versionId);
        Message.success('版本已删除');
        refresh(); // 刷新列表
      } catch (error: any) {
        console.error('删除版本失败:', error);
        Message.error('删除失败: ' + error.message);
      }
    },
  });
}
</script>

<style scoped>
.version-history-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-1);
}

.panel-header {
  padding: 16px;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.version-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.version-item {
  padding: 16px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-bg-2);
  transition: all 0.3s;
}

.version-item:hover {
  border-color: rgb(var(--primary-6));
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.version-item.is-restore {
  border-left: 3px solid rgb(var(--success-6));
}

.version-info {
  margin-bottom: 12px;
}

.version-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.version-number {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-1);
}

.restore-badge,
.manual-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.restore-badge {
  background: rgb(var(--success-1));
  color: rgb(var(--success-6));
}

.manual-badge {
  background: rgb(var(--primary-1));
  color: rgb(var(--primary-6));
}

.version-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--color-text-3);
}

.author-avatar {
  flex-shrink: 0;
}

.divider {
  color: var(--color-text-4);
}

.version-description {
  margin-top: 8px;
  font-size: 13px;
  color: var(--color-text-2);
  font-style: italic;
}

.version-actions {
  display: flex;
  gap: 8px;
}

.load-more {
  text-align: center;
  margin-top: 16px;
}

.full-spinner {
  width: 100%;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.version-preview {
  padding: 16px;
}

.preview-header {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--color-border);
}

.preview-header h4 {
  margin: 0 0 8px 0;
  font-size: 18px;
}

.preview-header p {
  margin: 0;
  color: var(--color-text-3);
  font-size: 14px;
}

.preview-content {
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

.preview-editor {
  min-height: 400px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 16px;
  background: var(--color-bg-2);
}

.preview-editor :deep(.ProseMirror) {
  outline: none;
  min-height: 400px;
}

.preview-editor :deep(.ProseMirror p) {
  margin: 0.5rem 0;
  line-height: 1.6;
}

.preview-editor :deep(.ProseMirror h1),
.preview-editor :deep(.ProseMirror h2),
.preview-editor :deep(.ProseMirror h3) {
  margin-top: 1rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

/* 滚动条样式 */
.panel-content::-webkit-scrollbar,
.preview-content::-webkit-scrollbar {
  width: 6px;
}

.panel-content::-webkit-scrollbar-thumb,
.preview-content::-webkit-scrollbar-thumb {
  background: var(--color-fill-3);
  border-radius: 3px;
}
</style>
