<template>
  <div 
    class="editorContainer w-full h-full flex overflow-hidden"
    :class="{ 'comment-mode': currentMode === EditorMode.COMMENT }"
  >
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
              {{
                collaboration.isConnected.value
                  ? (collaboration.onlineUsers.value.length === 1 ? '在线' : `${collaboration.onlineUsers.value.length} 人在线`)
                  : '离线'
              }}
            </span>
          </div>
        </div>

        <!-- 工具栏容器 -->
        <div class="toolbar-container">
          <!-- 左侧:TipTap工具栏(可横向滚动) -->
          <div class="toolbar-tools">
            <ToolList v-if="editor" :editor="editor" @upload-start="uploadLoading = true"
              @upload-end="uploadLoading = false" />
          </div>

          <!-- 中间:模式切换器 -->
          <div class="toolbar-mode">
            <ModeSwitcher :current-mode="editorModeStore.currentMode" :features="editorModeStore.documentFeatures"
              :online-users-count="collaboration?.onlineUsers.value.length || 0" :unread-comments-count="0"
              :is-document-owner="editorModeStore.permissions.isDocumentOwner" @switch-mode="handleModeSwitch"
              @enable-collaboration="handleEnableCollaboration" @disable-collaboration="handleDisableCollaboration"
              @close-all="handleCloseAll" />
          </div>

          <!-- 右侧:分享按钮(固定) -->
          <div class="toolbar-actions">
            <a-button type="primary" size="small" @click="openShareDialog" :disabled="!documentId">
              🔗 分享
            </a-button>
          </div>
        </div>

        <!-- 编辑器主体 -->
        <div class="editor-content-wrapper">
          <editor-content :editor="editor" class="w-full h-full text-black" />

          <!-- 上传 Loading 遮罩 -->
          <div v-if="uploadLoading" class="upload-loading-overlay">
            <div class="upload-loading-content">
              <a-spin :size="32" />
              <p class="upload-loading-text">图片上传中...</p>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- 动态侧边栏（根据模式显示不同内容） -->
    <div v-if="editorModeStore.sidebarVisible && documentId" class="feature-sidebar"
      :class="{ collapsed: sidebarCollapsed, 'collaboration-mode': editorModeStore.currentMode === EditorMode.COLLABORATION }"
      :style="sidebarCollapsed ? { top: sidebarDragPosition.y + 'px' } : {}">
      <!-- 折叠按钮 - 收起时显示对应图标 -->
      <div class="sidebar-toggle" @click="sidebarCollapsed = !sidebarCollapsed"
        @mousedown="sidebarCollapsed ? startDrag($event) : null" :title="sidebarCollapsed ? '展开' : '收起'"
        :class="{ draggable: sidebarCollapsed }">
        <span v-if="sidebarCollapsed">{{ getSidebarIcon() }}</span>
        <span v-else>▶</span>
      </div>

      <!-- 侧边栏内容 -->
      <div v-show="!sidebarCollapsed" class="sidebar-content">
        <!-- AI 助手 -->
        <AIAssistant v-if="editorModeStore.currentMode === EditorMode.AI_ASSISTANT" />

        <!-- 评论列表 -->
        <CommentList v-else-if="editorModeStore.currentMode === EditorMode.COMMENT" :document-id="documentId"
          :editor="editor" />

        <!-- 协作用户 - 浮动在编辑器上方 -->
        <CollaborationUsers v-else-if="editorModeStore.currentMode === EditorMode.COLLABORATION"
          :users="collaboration?.onlineUsers.value || []" :is-connected="collaboration?.isConnected.value || false"
          :current-user-id="String(userStore.userInfo?.id || '')"
          :owner-id="String(documentData?.creatorId || documentData?.userId || '')" 
          :document-id="documentId"
          :collaboration-enabled="documentData?.isCollaborationEnabled ?? false"
          @collaboration-toggled="handleCollaborationToggled" />

        <!-- 历史版本 -->
        <HistoryTimeline v-else-if="editorModeStore.currentMode === EditorMode.HISTORY" />
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
import { useEditorModeStore } from '@/store/editorMode'
import { EditorMode } from '@/store/editorMode'
import { useUserStore } from '@/store/user'
import { getDocument, saveDocumentContent } from '@/api/docs'
import Highlight from '@tiptap/extension-highlight'
import Superscript from '@tiptap/extension-superscript'
import Subscript from '@tiptap/extension-subscript'
import Underline from '@tiptap/extension-underline'
import StarterKit from '@tiptap/starter-kit'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Image from '@tiptap/extension-image'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import { CommentMark } from '@/extensions/CommentMark'
import ToolList from './editor/ToolList.vue';
import ModeSwitcher from './editor/ModeSwitcher.vue';
import EmptyState from './EmptyState.vue';
import OnlineUsers from './OnlineUsers.vue';
import ShareDialog from './sider/diolog/shareDialog.vue';
import AIAssistant from './sidebar/AIAssistant.vue';
import CommentList from './sidebar/CommentList.vue';
import CollaborationUsers from './sidebar/CollaborationUsers.vue';
import HistoryTimeline from './sidebar/HistoryTimeline.vue';
import { useCollaboration } from '@/composables/useCollaboration'
import { socketService } from '@/services/socket'  // ⭐ 导入 socketService
import { Message } from '@arco-design/web-vue'

// 定义props（支持路由参数）
const props = defineProps<{
  id?: string
}>()

const route = useRoute()
const tabsStore = useTabsStore()
const editorModeStore = useEditorModeStore()
const userStore = useUserStore()

// 获取当前模式
const currentMode = computed(() => editorModeStore.currentMode)

// 计算当前文档ID
const documentId = computed(() => props.id || route.params.id as string)

// 响应式状态
const loading = ref(false)
const uploadLoading = ref(false) // 图片上传 loading
const documentData = ref<any>(null)
const isModified = ref(false)
const isRemoteUpdate = ref(false) // 标记是否为远程更新,避免循环发送
const sidebarCollapsed = ref(false) // 侧边栏折叠状态
const shareDialogRef = ref<InstanceType<typeof ShareDialog>>() // 分享对话框ref
const userColor = ref<string>('#9b59b6') // 当前用户光标颜色

// 侧边栏拖动相关
const sidebarDragPosition = ref({ y: 100 }) // 侧边栏垂直位置
const isDragging = ref(false)

// 开始拖动
const startDrag = (e: MouseEvent) => {
  if (!sidebarCollapsed.value) return

  isDragging.value = true
  const startY = e.clientY
  const startTop = sidebarDragPosition.value.y

  const handleMouseMove = (moveEvent: MouseEvent) => {
    if (!isDragging.value) return

    const deltaY = moveEvent.clientY - startY
    const newTop = startTop + deltaY

    // 限制在可视范围内
    const maxTop = window.innerHeight - 100
    sidebarDragPosition.value.y = Math.max(50, Math.min(newTop, maxTop))
  }

  const handleMouseUp = () => {
    isDragging.value = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

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

// 标记：是否正在应用远程编辑（防止死循环）
const isApplyingRemoteEdit = ref(false)

// 应用远程编辑到编辑器
const applyRemoteEdit = (edit: any) => {
  if (!editor.value || isApplyingRemoteEdit.value) return

  try {
    isApplyingRemoteEdit.value = true // 标记为远程更新

    const { type, content, from, to } = edit

    switch (type) {
      case 'insert':
        // 精确位置插入
        if (typeof from === 'number' && content) {
          // content 可能是 JSON 格式或 HTML 字符串
          const insertContent = typeof content === 'string' ? content : content
          editor.value.commands.insertContentAt(from, insertContent)
        } else {
          console.warn('[Editor] insert 操作缺少必要参数:', edit)
        }
        break

      case 'delete':
        // 精确位置删除
        if (typeof from === 'number' && typeof to === 'number') {
          editor.value.commands.deleteRange({ from, to })
        } else {
          console.warn('[Editor] delete 操作缺少必要参数:', edit)
        }
        break

      case 'replace':
        // 替换指定范围的内容
        if (typeof from === 'number' && typeof to === 'number' && content) {
          const replaceContent = typeof content === 'string' ? content : content
          editor.value
            .chain()
            .deleteRange({ from, to })
            .insertContentAt(from, replaceContent)
            .run()
        } else if (content) {
          // 如果没有范围，完全替换（兼容旧版）
          console.warn('[Editor] 使用完全替换模式（不推荐，可能导致光标冲突）')
          editor.value.commands.setContent(content)
        }
        break

      default:
        console.warn('[Editor] 未知的编辑类型:', type)
    }
  } catch (error) {
    console.error('[Editor] 应用远程编辑失败:', error, edit)
  } finally {
    // 延迟解除标记，确保事件处理完成
    setTimeout(() => {
      isApplyingRemoteEdit.value = false
    }, 50)
  }
}

// ⭐ 在有 documentId 时初始化协作功能
let collaboration: ReturnType<typeof useCollaboration> | null = null
let onlineUsers = ref([])
let isConnected = ref(false)

// 监听socket认证成功,获取用户颜色
watch(() => socketService.currentUser.value, (user) => {
  if (user && user.color) {
    userColor.value = user.color
    console.log('[EditorArea] 用户颜色已更新:', user.color)
    
    // 更新编辑器中的用户信息
    if (editor.value) {
      editor.value.commands.updateUser({
        name: userStore.userInfo?.name || '匿名用户',
        color: user.color,
      })
    }
  }
})

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

// 广播编辑操作（使用 TipTap transaction 获取增量更新）
const broadcastEdit = (transaction: any) => {
  if (!collaboration || !editor.value || !documentId.value) return
  if (isApplyingRemoteEdit.value) return // 如果正在应用远程编辑，不广播

  // 分析 transaction 中的步骤
  const { steps } = transaction

  if (!steps || steps.length === 0) return

  // 遍历所有步骤，发送增量编辑
  steps.forEach((step: any) => {
    const stepJSON = step.toJSON()

    // 根据步骤类型发送不同的编辑操作
    if (stepJSON.stepType === 'replace') {
      const { from, to } = stepJSON
      const slice = step.slice

      // 如果有内容插入
      if (slice && slice.content && slice.content.size > 0) {
        const content = slice.content.toJSON()

        if (from === to) {
          // 纯插入
          collaboration.sendEdit({
            documentId: documentId.value,
            type: 'insert',
            from,
            content,
            timestamp: Date.now(),
          })
        } else {
          // 替换（先删除，再插入）
          collaboration.sendEdit({
            documentId: documentId.value,
            type: 'replace',
            from,
            to,
            content,
            timestamp: Date.now(),
          })
        }
      } else if (from < to) {
        // 纯删除
        collaboration.sendEdit({
          documentId: documentId.value,
          type: 'delete',
          from,
          to,
          timestamp: Date.now(),
        })
      }
    }
  })
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
    Underline, // StarterKit不包含Underline,需要单独添加
    Highlight.configure({
      multicolor: true,
      HTMLAttributes: {
        class: 'highlight',
      },
    }),
    Subscript,
    Superscript,
    TaskList.configure({
      HTMLAttributes: {
        class: 'task-list',
      },
    }),
    TaskItem.configure({
      HTMLAttributes: {
        class: 'task-item',
      },
      nested: true,
    }),
    Image.configure({
      inline: false,
      allowBase64: false,
      HTMLAttributes: {
        class: 'editor-image',
      },
    }),
    CommentMark, // 添加评论标记扩展
  ],
  editable: true,
  injectCSS: false,
  onUpdate: ({ editor, transaction }) => {
    // 内容变化时的处理
    handleContentChange()

    // 如果不是远程更新，则广播编辑操作
    if (!isApplyingRemoteEdit.value && collaboration && documentId.value) {
      broadcastEdit(transaction)
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

    // 根据权限和协同开关状态设置编辑器是否可编辑
    const permission = (doc as any).permission
    const isCollaborationEnabled = (doc as any).isCollaborationEnabled
    
    // 判断可编辑性:
    // 1. Owner总是可编辑
    // 2. 非Owner且协同未开启: 只读
    // 3. 非Owner且协同已开启: 根据permission判断(editor可编辑,viewer只读)
    let isEditable = false
    if (permission === 'owner') {
      isEditable = true
    } else if (!isCollaborationEnabled) {
      // 协同未开启,所有非owner用户只读
      isEditable = false
    } else {
      // 协同已开启,根据permission判断
      isEditable = permission === 'editor'
    }
    
    editor.value.setEditable(isEditable)

    // ⭐ 更新编辑器模式 store 的权限信息
    const currentUserId = userStore.userInfo?.id || ''
    // 优先使用 creatorId，其次使用 userId
    const ownerId = (doc as any).creatorId || (doc as any).userId || ''
    // 判断是否是文档所有者：通过 permission 字段或 userId 比较
    const isOwner = permission === 'owner' || String(currentUserId) === String(ownerId)
    editorModeStore.permissions.isDocumentOwner = isOwner
    editorModeStore.permissions.canEdit = isEditable
    editorModeStore.permissions.canComment = isEditable || permission === 'viewer'
    editorModeStore.permissions.hasAIAccess = true // 假设所有用户都有AI访问权限

    console.log('[EditorArea] 权限更新:', {
      permission,
      isCollaborationEnabled,
      isEditable,
      ...editorModeStore.permissions
    })

    // 提示用户权限状态
    if (!isEditable && permission === 'viewer') {
      if (!isCollaborationEnabled) {
        Message.info('文档协同编辑未开启,您只能查看')
      } else {
        Message.info('您只有查看权限,无法编辑此文档')
      }
    } else if (!isEditable && permission === 'editor' && !isCollaborationEnabled) {
      Message.warning('文档协同编辑已关闭,您暂时只能查看')
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

// ====== 模式切换相关方法 ======
// 处理模式切换
const handleModeSwitch = (mode: EditorMode) => {
  console.log('[EditorArea] 切换到模式:', mode)
  editorModeStore.switchMode(mode)
}

// 关闭所有功能
const handleCloseAll = () => {
  console.log('[EditorArea] 关闭所有功能')
  editorModeStore.closeAllFeatures()
}

// 启用协作
const handleEnableCollaboration = async () => {
  console.log('[EditorArea] 启用协作')
  try {
    // 更新文档特性状态
    editorModeStore.documentFeatures.collaborationEnabled = true

    // 加入文档房间（如果还未加入）
    if (documentId.value && !collaboration) {
      // 初始化协作将在 watch documentId 中自动处理
      console.log('[EditorArea] 等待协作初始化...')
    }

    // 切换到协作模式
    editorModeStore.switchMode(EditorMode.COLLABORATION)
    Message.success('已启用协作模式')
  } catch (error) {
    console.error('[EditorArea] 启用协作失败:', error)
    Message.error('启用协作失败')
  }
}

// 禁用协作
const handleDisableCollaboration = () => {
  console.log('[EditorArea] 禁用协作')
  try {
    // 更新文档特性状态
    editorModeStore.documentFeatures.collaborationEnabled = false

    // 离开文档房间
    if (documentId.value) {
      socketService.leaveDocument(documentId.value)
    }

    // 切换回普通模式
    editorModeStore.switchMode(EditorMode.NORMAL)
    Message.success('已退出协作模式')
  } catch (error) {
    console.error('[EditorArea] 禁用协作失败:', error)
    Message.error('退出协作失败')
  }
}

// 处理协同开关切换
const handleCollaborationToggled = async (enabled: boolean) => {
  console.log('[EditorArea] 协同开关切换:', enabled)
  
  // 重新加载文档信息以获取最新状态
  if (documentId.value) {
    try {
      const doc = await getDocument(documentId.value)
      documentData.value = doc
      
      const permission = (doc as any).permission
      const isCollaborationEnabled = enabled
      
      // 判断可编辑性(与fetchDocument中逻辑一致)
      let isEditable = false
      if (permission === 'owner') {
        isEditable = true
      } else if (!isCollaborationEnabled) {
        isEditable = false
      } else {
        isEditable = permission === 'editor'
      }
      
      editor.value?.setEditable(isEditable)
      
      // 更新store权限信息
      editorModeStore.permissions.canEdit = isEditable
      
      // 提示用户
      if (!isEditable && permission === 'editor' && !isCollaborationEnabled) {
        Message.warning('协同编辑已关闭,您暂时只能查看')
      } else if (isEditable && permission === 'editor' && isCollaborationEnabled) {
        Message.success('协同编辑已开启,您可以编辑文档')
      }
    } catch (error) {
      console.error('[EditorArea] 重新加载文档失败:', error)
    }
  }
}

// 获取侧边栏图标
const getSidebarIcon = () => {
  switch (editorModeStore.currentMode) {
    case EditorMode.AI_ASSISTANT:
      return '🤖'
    case EditorMode.COMMENT:
      return '💬'
    case EditorMode.COLLABORATION:
      return '👥'
    case EditorMode.HISTORY:
      return '🕐'
    default:
      return '📋'
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
  
  // 监听协同状态变化
  socketService.onCollaborationToggle((data) => {
    console.log('[EditorArea] 收到协同状态变化通知:', data)
    
    // 如果是当前文档
    if (String(data.documentId) === String(documentId.value)) {
      handleCollaborationToggled(data.enabled)
    }
  })

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
  overflow-x: auto; /* 添加滚动 */
}

/* 左侧工具区域 - 保持原有大小,可横向滚动 */
.toolbar-tools {
  flex: 0 0 auto; /* 不伸缩 */
  display: flex;
  align-items: center;
  white-space: nowrap; /* 防止换行 */
  overflow: visible; /* 允许内容显示 */
  min-width: min-content; /* 至少容纳内容 */
}

/* 中间模式切换区域 */
.toolbar-mode {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  padding: 0 12px;
  border-left: 1px solid #dcdfe6;
  border-right: 1px solid #dcdfe6;
}

/* 右侧操作区域 - 固定位置 */
.toolbar-actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding-left: 12px;
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

/* 功能侧边栏（AI、评论、协作、历史） */
.feature-sidebar {
  width: 320px;
  position: relative;
  transition: all 0.3s ease;
  background: #fff;
  border-left: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.05);
}

/* 协作模式 - 浮动在编辑器上方 */
.feature-sidebar.collaboration-mode {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 300px;
  z-index: 100;
  box-shadow: -4px 0 16px rgba(0, 0, 0, 0.1);
  pointer-events: all;
}

.feature-sidebar.collaboration-mode.collapsed {
  width: 56px;
  height: 56px;
  bottom: auto;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  border: 1px solid var(--color-border);
}

.feature-sidebar.collapsed {
  width: 56px;
  height: 56px;
  position: absolute;
  right: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  border: 1px solid var(--color-border);
}

.feature-sidebar .sidebar-content {
  flex: 1;
  overflow: hidden;
}

.feature-sidebar .sidebar-toggle {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 32px;
  height: 60px;
  background: var(--color-fill-2);
  border: 1px solid var(--color-border);
  border-left: none;
  border-radius: 0 6px 6px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 16px;
  z-index: 20;
  transition: all 0.2s ease;
}

/* 协作模式的折叠按钮 - 调整大小 */
.feature-sidebar.collaboration-mode .sidebar-toggle {
  width: 28px;
  height: 48px;
  font-size: 14px;
}

.feature-sidebar.collapsed .sidebar-toggle {
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  border: none;
  border-radius: 8px;
  background: var(--color-fill-2);
  font-size: 24px;
  transform: none;
}

.feature-sidebar.collapsed .sidebar-toggle.draggable {
  cursor: move;
}

.feature-sidebar.collapsed .sidebar-toggle.draggable:active {
  cursor: grabbing;
}

.feature-sidebar.collaboration-mode.collapsed .sidebar-toggle {
  left: 0;
  font-size: 24px;
  border-radius: 8px;
}

.feature-sidebar .sidebar-toggle:hover {
  background: var(--color-fill-3);
}

.feature-sidebar:not(.collapsed) .sidebar-toggle:hover {
  transform: translateY(-50%) scale(1.05);
}

/* 在线用户侧边栏（保留旧的，兼容现有功能） */
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

/* 任务列表样式 */
.editorContainer :deep(.ProseMirror ul[data-type="taskList"]),
.editorContainer :deep(.ProseMirror .task-list) {
  list-style: none;
  padding-left: 0;
  margin: 0.5rem 0;
}

.editorContainer :deep(.ProseMirror li[data-type="taskItem"]),
.editorContainer :deep(.ProseMirror .task-item) {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin: 0.25rem 0;
}

.editorContainer :deep(.ProseMirror li[data-type="taskItem"] > label),
.editorContainer :deep(.ProseMirror .task-item > label) {
  flex-shrink: 0;
  margin-top: 0.8rem;
  user-select: none;
}

.editorContainer :deep(.ProseMirror li[data-type="taskItem"] > label input[type="checkbox"]),
.editorContainer :deep(.ProseMirror .task-item > label input[type="checkbox"]) {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #1890ff;
}

.editorContainer :deep(.ProseMirror li[data-type="taskItem"] > div),
.editorContainer :deep(.ProseMirror .task-item > div) {
  flex: 1;
  min-width: 0;
}

.editorContainer :deep(.ProseMirror li[data-type="taskItem"][data-checked="true"] > div),
.editorContainer :deep(.ProseMirror .task-item[data-checked="true"] > div) {
  text-decoration: line-through;
  color: #999;
}

/* 图片样式 */
.editorContainer :deep(.ProseMirror img),
.editorContainer :deep(.ProseMirror .editor-image) {
  max-width: 80%;
  /* 限制宽度为编辑区的80%，避免占满整行 */
  max-height: 400px;
  /* 限制高度为400px，避免占用太多垂直空间 */
  height: auto;
  width: auto;
  /* 保持图片比例 */
  display: block;
  margin: 1rem auto;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  object-fit: contain;
  /* 确保图片完整显示，不变形 */
}

.editorContainer :deep(.ProseMirror img:hover),
.editorContainer :deep(.ProseMirror .editor-image:hover) {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transform: scale(1.02);
}

/* 确保图片独占一行 */
.editorContainer :deep(.ProseMirror p:has(img)) {
  display: block;
  text-align: center;
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

/* 评论高亮样式 - 只在评论模式下显示 */
.editorContainer.comment-mode :deep(.ProseMirror .comment-highlight) {
  background-color: rgba(var(--warning-6), 0.2);
  border-bottom: 2px solid rgb(var(--warning-6));
  cursor: pointer;
  transition: all 0.2s;
  padding: 2px 0;
}

.editorContainer.comment-mode :deep(.ProseMirror .comment-highlight:hover) {
  background-color: rgba(var(--warning-6), 0.3);
}

/* 非评论模式下隐藏高亮效果 */
.editorContainer:not(.comment-mode) :deep(.ProseMirror .comment-highlight) {
  background-color: transparent;
  border-bottom: none;
  cursor: text;
}

/* 评论高亮闪烁动画 */
.editorContainer.comment-mode :deep(.ProseMirror .comment-highlight-flash) {
  animation: comment-flash 2s ease-in-out;
}

@keyframes comment-flash {

  0%,
  100% {
    background-color: rgba(var(--warning-6), 0.2);
  }

  50% {
    background-color: rgba(var(--warning-6), 0.6);
  }
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

/* 编辑器内容包裹器 - 用于定位上传遮罩 */
.editor-content-wrapper {
  position: relative;
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 上传 Loading 遮罩层 */
.upload-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}

.upload-loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.upload-loading-text {
  margin: 0;
  font-size: 14px;
  color: #666;
  font-weight: 500;
}
</style>