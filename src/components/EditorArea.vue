<template>
  <div class="editorContainer w-full h-full flex flex-col overflow-hidden">
    <!-- 空状态：没有选择文档时显示 -->
    <EmptyState v-if="!documentId" />

    <!-- 加载状态 -->
    <div v-else-if="loading" class="loading-overlay">
      <a-spin :size="32" tip="加载文档中..." />
    </div>

    <!-- 编辑器内容 -->
    <template v-else>
      <!-- 文档信息栏（可选） -->
      <div v-if="documentData" class="document-info">
        <h3>{{ documentData.name }}</h3>
        <span v-if="isModified" class="modified-indicator">• 未保存</span>
        <span v-else class="saved-indicator">• 已保存</span>
      </div>

      <!-- 工具栏 -->
      <ToolList v-if="editor" :editor="editor" />

      <!-- 编辑器主体 -->
      <editor-content :editor="editor" class="w-full h-full text-black" />
    </template>
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

interface State {
  // editor: any
}

const state = reactive<State>({
  // editor: null
});

const {
  // editor
} = toRefs(state);

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
.editorContainer {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
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
  padding: 6px 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  gap: 16px;
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

.editorContainer :deep(.ProseMirror) {
  width: 100%;
  height: calc(100vh - 240px);
  border: 1px black solid;
  border-radius: 10px;
  display: block;
  box-sizing: border-box;
  overflow-y: hidden;
  align-items: flex-start !important;
  justify-content: flex-start !important;
  text-align: left !important;
  margin: 0 !important;
  padding: 10px 5px 10px 5px !important;
  overflow: auto;
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