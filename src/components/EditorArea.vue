<template>
  <div class="editorContainer w-full h-full flex overflow-hidden">
    <!-- 主编辑区域 -->
    <div class="editor-main flex-1 flex flex-col overflow-hidden">
      <!-- 空状态：没有选择文档时显示 -->
      <EmptyState v-if="!documentId" />

      <!-- 加载状态 -->
      <div v-else-if="loading" class="loading-overlay">
        <a-spin :size="32" tip="加载文档中..." />
      </div>

      <!-- 编辑器内容 -->
      <template v-else>
        <!-- 文档信息栏 -->
        <div v-if="documentData" class="document-info">
          <div class="doc-title-section">
            <h3>{{ documentData.name }}</h3>
            <span v-if="isModified" class="modified-indicator">• 未保存</span>
            <span v-else class="saved-indicator">• 已保存</span>
          </div>

          <!-- 在线用户简要信息 -->
          <div v-if="collaboration" class="online-status">
            <span :class="['status-dot', collaboration.isConnected.value ? 'connected' : 'disconnected']"></span>
            <span class="status-text">
              {{ collaboration.isConnected.value ? `${collaboration.onlineUsers.value.length} 人在线` : '离线' }}
            </span>
          </div>
        </div>

        <!-- 工具栏容器 -->
        <div class="toolbar-container">
          <!-- 左侧:TipTap工具栏(可横向滚动) -->
          <div class="toolbar-tools">
            <ToolList v-if="editor" :editor="editor" />
          </div>

          <!-- 右侧:分享按钮(固定) -->
          <div class="toolbar-actions">
            <a-button type="primary" size="small" @click="openShareDialog" :disabled="!documentId">
              🔗 分享
            </a-button>
          </div>
        </div>

        <!-- 编辑器主体 -->
        <editor-content :editor="editor" class="w-full h-full text-black" />
      </template>
    </div>

    <!-- 在线用户侧边栏（仅在有在线用户时显示） -->
    <div v-if="collaboration && documentId && collaboration.onlineUsers.value.length > 0" class="online-users-sidebar"
      :class="{ collapsed: sidebarCollapsed }">
      <!-- 折叠按钮始终可见 -->
      <div class="sidebar-toggle" @click="sidebarCollapsed = !sidebarCollapsed"
        :title="sidebarCollapsed ? '展开在线用户' : '收起在线用户'">
        <span v-if="sidebarCollapsed">👥</span>
        <span v-else>▶</span>
      </div>
      <!-- 内容区域 -->
      <div v-show="!sidebarCollapsed" class="sidebar-content">
        <OnlineUsers :users="collaboration.onlineUsers.value" :is-connected="collaboration.isConnected.value" />
      </div>
    </div>

    <!-- 分享对话框 -->
    <ShareDialog ref="shareDialogRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, toRefs, onBeforeUnmount, watch, computed } from 'vue';
import { useEditor, EditorContent } from '@tiptap/vue-3'
import { useRoute } from 'vue-router'
import { useTabsStore } from '@/store/tabs'
import { getDocument, saveDocumentContent } from '@/api/docs'
import Highlight from '@tiptap/extension-highlight'
import Superscript from '@tiptap/extension-superscript'
import Subscript from '@tiptap/extension-subscript'
import Underline from '@tiptap/extension-underline'
import StarterKit from '@tiptap/starter-kit'
import ToolList from './editor/ToolList.vue';
import EmptyState from './EmptyState.vue';
import OnlineUsers from './OnlineUsers.vue';
import ShareDialog from './sider/diolog/shareDialog.vue';
import { useCollaboration } from '@/composables/useCollaboration'
import { socketService } from '@/services/socket'  // ⭐ 导入 socketService
import { Message } from '@arco-design/web-vue'

// 定义props（支持路由参数）
const props = defineProps<{
  id?: string
}>()

const route = useRoute()
const tabsStore = useTabsStore()

// 计算当前文档ID
const documentId = computed(() => props.id || route.params.id as string)

// 响应式状态
const loading = ref(false)
const documentData = ref<any>(null)
const isModified = ref(false)
const isRemoteUpdate = ref(false) // 标记是否为远程更新,避免循环发送
const sidebarCollapsed = ref(false) // 侧边栏折叠状态
const shareDialogRef = ref<InstanceType<typeof ShareDialog>>() // 分享对话框ref

interface State {
  // editor: any
}

const state = reactive<State>({
  // editor: null
});

const {
  // editor
} = toRefs(state);

// ====== WebSocket 协作功能 ======

// 应用远程编辑到编辑器
const applyRemoteEdit = (edit: any) => {
  if (!editor.value || isRemoteUpdate.value) return

  try {
    isRemoteUpdate.value = true // 标记为远程更新

    const { type, content, position } = edit

    switch (type) {
      case 'replace':
        // 完全替换内容（简单场景）
        editor.value.commands.setContent(content)
        break

      case 'insert':
        // TODO: 实现精确位置插入（需要位置计算）
        console.log('[Editor] 插入操作暂未实现精确位置')
        break

      case 'delete':
        // TODO: 实现精确位置删除
        console.log('[Editor] 删除操作暂未实现精确位置')
        break

      default:
        console.warn('[Editor] 未知的编辑类型:', type)
    }
  } catch (error) {
    console.error('[Editor] 应用远程编辑失败:', error)
  } finally {
    isRemoteUpdate.value = false
  }
}

// ⭐ 在有 documentId 时初始化协作功能
let collaboration: ReturnType<typeof useCollaboration> | null = null
let onlineUsers = ref([])
let isConnected = ref(false)

// ⭐ 监听 documentId 变化，动态加入/离开文档房间
watch(documentId, (newId, oldId) => {
  console.log('[EditorArea] documentId 变化:', { oldId, newId })

  // 如果有旧文档，先离开
  if (oldId && collaboration) {
    console.log('[EditorArea] 离开旧文档:', oldId)
    socketService.leaveDocument(oldId)
  }

  // 如果有新文档，加入
  if (newId) {
    console.log('[EditorArea] 准备加入新文档:', newId)

    // 初始化协作功能（如果还没初始化）
    if (!collaboration) {
      collaboration = useCollaboration({
        documentId: newId,

        // 接收远程编辑
        onRemoteEdit: (edit) => {
          console.log('[Editor] 收到远程编辑:', edit)
          applyRemoteEdit(edit)
        },

        // 接收远程光标（可选，暂时只打印日志）
        onRemoteCursor: (cursor) => {
          console.log('[Editor] 远程光标:', cursor)
        },

        // 接收选区变化（可选）
        onRemoteSelection: (selection) => {
          console.log('[Editor] 远程选区:', selection)
        },

        // 接收输入状态
        onUserTyping: (typing) => {
          if (typing.isTyping) {
            console.log(`[Editor] ${typing.username} 正在输入...`)
          }
        },
      })

      onlineUsers = collaboration.onlineUsers
      isConnected = collaboration.isConnected
    } else {
      // 已经初始化过，直接加入新文档
      socketService.joinDocument(newId)
    }
  }
}, { immediate: true })  // ⭐ immediate: true 确保首次加载时就执行

// 广播编辑操作（节流，避免过于频繁）
let broadcastTimer: number | null = null
const broadcastEdit = () => {
  if (!collaboration || !editor.value || !documentId.value) return

  // 节流：300ms 内只发送一次
  if (broadcastTimer) {
    clearTimeout(broadcastTimer)
  }

  broadcastTimer = setTimeout(() => {
    const content = editor.value?.getHTML()
    if (!content || !collaboration || !documentId.value) return

    collaboration.sendEdit({
      documentId: documentId.value,
      type: 'replace', // 简单模式：完全替换内容
      content: content,
      position: { line: 0, column: 0 },
      timestamp: Date.now(),
    })
  }, 300)
}

// 创建编辑器实例
const editor = useEditor({
  content: '',
  extensions: [
    StarterKit.configure({
      // 确保所有功能都启用
      bulletList: {
        HTMLAttributes: {
          class: 'bullet-list',
        },
      },
      orderedList: {
        HTMLAttributes: {
          class: 'ordered-list',
        },
      },
      listItem: {
        HTMLAttributes: {
          class: 'list-item',
        },
      },
      codeBlock: {
        HTMLAttributes: {
          class: 'code-block',
        },
      },
      paragraph: {
        HTMLAttributes: {
          class: 'paragraph',
        },
      },
      heading: {
        levels: [1, 2, 3, 4, 5, 6],
      },
    }),
    Underline.configure({
      HTMLAttributes: {
        class: 'my-custom-class',
      },
    }),
    Highlight.configure({
      multicolor: true,
      HTMLAttributes: {
        class: 'highlight',
      },
    }),
    Subscript,
    Superscript
  ],
  editable: true,
  injectCSS: false,
  onUpdate: ({ editor }) => {
    // 内容变化时的处理
    handleContentChange()

    // 如果不是远程更新，则广播编辑操作
    if (!isRemoteUpdate.value && collaboration && documentId.value) {
      broadcastEdit()
    }
  },
  onSelectionUpdate: ({ editor }) => {
    // 选区变化时强制更新（触发工具栏响应式更新）
    // Vue 会自动检测到 editor 的状态变化

    // 广播光标位置（可选，需要转换为行列位置）
    if (collaboration && editor && documentId.value) {
      // TODO: 实现光标位置计算和广播
      // const position = calculateCursorPosition(editor)
      // collaboration.sendCursor(position)
    }
  }
})

// 获取文档数据
const fetchDocument = async () => {
  if (!documentId.value || !editor.value || loading.value) return

  // 防止重复请求同一个文档
  if (documentData.value && documentData.value.id.toString() === documentId.value) {
    console.log('文档已加载，跳过重复请求:', documentId.value)
    return
  }

  try {
    loading.value = true
    console.log('加载文档:', documentId.value)

    const doc = await getDocument(documentId.value)
    documentData.value = doc

    // 设置编辑器内容
    editor.value.commands.setContent(doc.content || '')

    // 根据权限设置编辑器是否可编辑
    const permission = (doc as any).permission
    const isEditable = permission === 'owner' || permission === 'editor'
    editor.value.setEditable(isEditable)

    // 如果是只读权限，提示用户
    if (!isEditable && permission === 'viewer') {
      Message.info('您只有查看权限，无法编辑此文档')
    }

    // 更新标签标题
    tabsStore.updateTabTitle(documentId.value, doc.name)

    // 重置修改状态
    isModified.value = false
    tabsStore.markModified(documentId.value, false)

    console.log('文档加载成功:', doc)
  } catch (error) {
    console.error('获取文档失败:', error)
  } finally {
    loading.value = false
  }
}

// 处理内容变化
const handleContentChange = () => {
  if (!editor.value || !documentData.value) return

  const currentContent = editor.value.getHTML()
  const originalContent = documentData.value.content || ''
  const modified = currentContent !== originalContent

  if (modified !== isModified.value) {
    isModified.value = modified
    tabsStore.markModified(documentId.value, modified)
  }

  // 自动保存（延迟2秒）
  clearTimeout(autoSaveTimer)
  autoSaveTimer = setTimeout(() => {
    if (isModified.value) {
      autoSave()
    }
  }, 2000)
}

// 自动保存
let autoSaveTimer: number | null = null
const autoSave = async () => {
  if (!editor.value || !documentId.value) return

  try {
    const content = editor.value.getHTML()
    await saveDocumentContent(documentId.value, content)

    // 更新原始内容
    if (documentData.value) {
      documentData.value.content = content
    }

    // 重置修改状态
    isModified.value = false
    tabsStore.markModified(documentId.value, false)

    console.log('自动保存成功')
  } catch (error) {
    console.error('自动保存失败:', error)
  }
}

// 手动保存方法
const manualSave = async () => {
  if (!editor.value || !documentId.value) {
    throw new Error('编辑器或文档ID未准备好')
  }

  try {
    const content = editor.value.getHTML()
    await saveDocumentContent(documentId.value, content)

    // 更新原始内容
    if (documentData.value) {
      documentData.value.content = content
    }

    // 重置修改状态
    isModified.value = false
    tabsStore.markModified(documentId.value, false)

    console.log('手动保存成功')
    return true
  } catch (error) {
    console.error('手动保存失败:', error)
    throw error
  }
}

// 打开分享对话框
const openShareDialog = () => {
  if (!documentId.value) {
    Message.warning('请先选择要分享的文档')
    return
  }

  if (shareDialogRef.value && typeof shareDialogRef.value.openDialog === 'function') {
    // 传递当前文档ID
    shareDialogRef.value.openDialog(documentId.value)
  } else {
    console.warn('分享对话框未准备好')
  }
}

// 监听文档ID变化
watch(() => documentId.value, (newId, oldId) => {
  if (newId && newId !== oldId && editor.value) {
    console.log('文档ID变化，重新加载:', newId)
    fetchDocument()
  }
})

// 组件挂载后初始化
onMounted(() => {
  // 等待编辑器初始化完成后加载文档
  const checkEditor = () => {
    if (editor.value && documentId.value) {
      console.log('编辑器已准备，加载文档:', documentId.value)
      fetchDocument()
    } else if (!editor.value) {
      // 只有编辑器未初始化时才继续等待
      setTimeout(checkEditor, 100)
    }
    // 如果没有documentId，不做任何操作
  }
  checkEditor()

  // 监听全局保存事件
  const handleGlobalSave = () => {
    if (documentId.value && isModified.value) {
      manualSave().catch(error => {
        console.error('全局保存失败:', error)
      })
    }
  }

  // 添加事件监听器
  window.addEventListener('manual-save-request', handleGlobalSave)

  // 组件卸载时移除监听器
  onBeforeUnmount(() => {
    window.removeEventListener('manual-save-request', handleGlobalSave)
  })
})

// 组件卸载前清理
onBeforeUnmount(() => {
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer)
  }

  // 如果有未保存的修改，进行最后一次保存
  if (isModified.value) {
    autoSave()
  }
})

</script>

<style scoped>
/* 工具栏容器 - flex布局 */
.toolbar-container {
  display: flex;
  align-items: center;
  border-bottom: 2px solid #dcdfe6;
  background: #fff;
  height: 50px;
  min-height: 50px;
  flex-shrink: 0;
  gap: 8px;
  padding-right: 12px;
  position: relative;
  z-index: 10;
}

/* 左侧工具区域 - 可横向滚动 */
.toolbar-tools {
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;
  min-width: 0;
  /* 允许flex子项收缩 */

  /* 隐藏滚动条但保留滚动功能 */
  scrollbar-width: thin;
  scrollbar-color: #dcdfe6 transparent;
}

.toolbar-tools::-webkit-scrollbar {
  height: 4px;
}

.toolbar-tools::-webkit-scrollbar-track {
  background: transparent;
}

.toolbar-tools::-webkit-scrollbar-thumb {
  background: #dcdfe6;
  border-radius: 2px;
}

.toolbar-tools::-webkit-scrollbar-thumb:hover {
  background: #c0c4cc;
}

/* 右侧操作区域 - 固定位置 */
.toolbar-actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding-left: 12px;
  border-left: 1px solid #dcdfe6;
}

.editorContainer {
  width: 100%;
  height: 100%;
  display: flex;
  position: relative;
  overflow: hidden;
}

.editor-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.8);
  z-index: 10;
}

.document-info {
  padding: 8px 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.doc-title-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.document-info h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.modified-indicator {
  color: #ef4444;
  font-weight: 500;
  font-size: 14px;
}

.saved-indicator {
  color: #10b981;
  font-weight: 500;
  font-size: 14px;
}

.online-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #6b7280;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  transition: background-color 0.3s;
}

.status-dot.connected {
  background-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
}

.status-dot.disconnected {
  background-color: #ef4444;
}

/* 在线用户侧边栏 */
.online-users-sidebar {
  width: 280px;
  position: relative;
  transition: width 0.3s ease;
  background: #fff;
  border-left: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
}

.online-users-sidebar.collapsed {
  width: 40px;
}

.sidebar-content {
  flex: 1;
  overflow: hidden;
}

.sidebar-toggle {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 32px;
  height: 60px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-left: none;
  border-radius: 0 6px 6px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
  color: #6b7280;
  z-index: 20;
  transition: all 0.2s ease;
  box-shadow: 2px 0 4px rgba(0, 0, 0, 0.05);
}

.online-users-sidebar.collapsed .sidebar-toggle {
  left: 8px;
}

.sidebar-toggle:hover {
  background: #e5e7eb;
  color: #374151;
  transform: translateY(-50%) scale(1.05);
}

.editorContainer :deep(.ProseMirror) {
  width: 100%;
  height: calc(100vh - 212px);
  border: 1px black solid;
  border-radius: 10px;
  display: block;
  box-sizing: border-box;
  overflow-y: auto;
  /* 编辑器内容可滚动 */
  overflow-x: hidden;
  /* 隐藏横向滚动 */
  align-items: flex-start !important;
  justify-content: flex-start !important;
  text-align: left !important;
  margin: 0 !important;
  padding: 10px 5px 10px 5px !important;
}

/* 列表样式 */
.editorContainer :deep(.ProseMirror ul),
.editorContainer :deep(.ProseMirror .bullet-list) {
  list-style-type: disc;
  padding-left: 1.5rem;
  margin: 0.5rem 0;
}

.editorContainer :deep(.ProseMirror ol),
.editorContainer :deep(.ProseMirror .ordered-list) {
  list-style-type: decimal;
  padding-left: 1.5rem;
  margin: 0.5rem 0;
}

.editorContainer :deep(.ProseMirror li),
.editorContainer :deep(.ProseMirror .list-item) {
  margin: 0.25rem 0;
}

.editorContainer :deep(.ProseMirror li p) {
  margin: 0;
}

/* 段落样式 */
.editorContainer :deep(.ProseMirror p),
.editorContainer :deep(.ProseMirror .paragraph) {
  margin: 0.5rem 0;
  line-height: 1.6;
}

/* 代码块样式 */
.editorContainer :deep(.ProseMirror pre),
.editorContainer :deep(.ProseMirror .code-block) {
  background: #f5f5f5;
  color: #333;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  margin: 0.5rem 0;
  overflow-x: auto;
}

.editorContainer :deep(.ProseMirror pre code) {
  background: none;
  padding: 0;
  font-size: 0.875rem;
  line-height: 1.5;
}

/* 高亮样式 */
.editorContainer :deep(.ProseMirror mark),
.editorContainer :deep(.ProseMirror .highlight) {
  background-color: #fef08a;
  color: inherit;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
}

/* 标题样式 */
.editorContainer :deep(.ProseMirror h1) {
  font-size: 2rem;
  font-weight: bold;
  margin: 1rem 0 0.5rem;
}

.editorContainer :deep(.ProseMirror h2) {
  font-size: 1.5rem;
  font-weight: bold;
  margin: 0.875rem 0 0.5rem;
}

.editorContainer :deep(.ProseMirror h3) {
  font-size: 1.25rem;
  font-weight: bold;
  margin: 0.75rem 0 0.5rem;
}

/* 确保编辑器获得焦点时有正确的样式 */
.editorContainer :deep(.ProseMirror:focus) {
  outline: none;
}
</style>