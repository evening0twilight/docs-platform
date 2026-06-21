<template>
  <div class="editorContainer w-full h-full flex overflow-hidden"
    :class="{ 'comment-mode': currentMode === EditorMode.COMMENT }">
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
              @close-all="handleCloseAll" @manual-save="handleManualSaveClick" />
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
        <AIAssistant v-if="editorModeStore.currentMode === EditorMode.AI_ASSISTANT" :editor="editor" />

        <!-- 评论列表 -->
        <CommentList v-else-if="editorModeStore.currentMode === EditorMode.COMMENT" :document-id="documentId"
          :editor="editor" />

        <!-- 协作用户 - 浮动在编辑器上方 -->
        <CollaborationUsers v-else-if="editorModeStore.currentMode === EditorMode.COLLABORATION"
          :users="collaboration?.onlineUsers.value || []" :is-connected="collaboration?.isConnected.value || false"
          :current-user-id="String(userStore.userInfo?.id || '')"
          :owner-id="String(documentData?.creatorId || documentData?.userId || '')" :document-id="documentId"
          :collaboration-enabled="documentData?.isCollaborationEnabled ?? false"
          @collaboration-toggled="handleCollaborationToggled" @permission-changed="handlePermissionChanged" />

        <!-- 历史版本 -->
        <HistoryTimeline v-else-if="editorModeStore.currentMode === EditorMode.HISTORY" :editor="editor" />
      </div>
    </div>

    <!-- 分享对话框 -->
    <ShareDialog ref="shareDialogRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, toRefs, onBeforeUnmount, watch, computed, nextTick } from 'vue';
import { useEditor, EditorContent } from '@tiptap/vue-3'
import { useRoute } from 'vue-router'
import { useTabsStore } from '@/store/tabs'
import { useEditorModeStore } from '@/store/editorMode'
import { EditorMode } from '@/store/editorMode'
import { useUserStore } from '@/store/user'
import { getDocument, saveDocumentContent } from '@/api/docs'
import { getVersionDetail } from '@/api/version'
import Highlight from '@tiptap/extension-highlight'
import Superscript from '@tiptap/extension-superscript'
import Subscript from '@tiptap/extension-subscript'
import Underline from '@tiptap/extension-underline'
import StarterKit from '@tiptap/starter-kit'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Image from '@tiptap/extension-image'
import { CollaborationCursor } from '@/extensions/CollaborationCursor'
import { CommentMark } from '@/extensions/CommentMark'
import { Slice, Fragment } from '@tiptap/pm/model'  //   导入ProseMirror类型
import { useYjsCollaboration } from '@/composables/useYjsCollaboration'
import { getYjsExtensions, generateUserColor } from '@/extensions/yjsExtensions'
import { yjsConfig } from '@/config/yjsConfig'
import ToolList from './editor/ToolList.vue';
import ModeSwitcher from './editor/ModeSwitcher.vue';
import EmptyState from './EmptyState.vue';
import OnlineUsers from './OnlineUsers.vue';
import ShareDialog from './sider/diolog/shareDialog.vue';
import AIAssistant from './sidebar/AIAssistant.vue';
import CommentList from './sidebar/CommentList.vue';
import CollaborationUsers from './sidebar/CollaborationUsers.vue';
import HistoryTimeline from './sidebar/HistoryTimeline.vue';
import VersionHistory from './VersionHistory.vue';
import VersionCompare from './VersionCompare.vue';
import { useCollaboration } from '@/composables/useCollaboration'
import { useAutoSave } from '@/composables/useAutoSave'
import { socketService } from '@/services/socket'  //   导入 socketService
import { Message } from '@arco-design/web-vue'
import type { DocumentVersion } from '@/types/version'
import '@/styles/collaboration.scss' //   导入协同光标样式

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

// 计算当前文档ID和版本ID
const documentId = computed(() => props.id || route.params.id as string)
const versionId = computed(() => route.params.versionId as string | undefined)
const isVersionPreview = computed(() => !!versionId.value)

// 响应式状态
const loading = ref(false)
const uploadLoading = ref(false) // 图片上传 loading
const documentData = ref<any>(null)
const isModified = ref(false)
const isRemoteUpdate = ref(false) // 标记是否为远程更新,避免循环发送
const sidebarCollapsed = ref(false) // 侧边栏折叠状态
const shareDialogRef = ref<InstanceType<typeof ShareDialog>>() // 分享对话框ref
const userColor = ref<string>('#9b59b6') // 当前用户光标颜色

// Yjs协同编辑(如果启用)
const useYjs = yjsConfig.enabled
let yjsCollaboration: ReturnType<typeof useYjsCollaboration> | null = null

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

// 编辑队列：处理连续快速到达的编辑操作
const editQueue: any[] = []
let isProcessingQueue = false

// 处理编辑队列
const processEditQueue = async () => {
  if (isProcessingQueue || editQueue.length === 0) return

  isProcessingQueue = true

  while (editQueue.length > 0) {
    const edit = editQueue.shift()
    await applyRemoteEditImmediate(edit)
    // 短暂延迟，让编辑器渲染完成
    await new Promise(resolve => setTimeout(resolve, 10))
  }

  isProcessingQueue = false
}

// 应用远程编辑到编辑器（立即执行版本）
const applyRemoteEditImmediate = (edit: any) => {
  console.log('[EditorArea] 📝 准备应用远程编辑:', edit)

  if (!editor.value) {
    console.warn('[EditorArea] ⚠️ editor未初始化')
    return
  }

  try {
    isApplyingRemoteEdit.value = true // 标记为远程更新
    console.log('[EditorArea] 🔒 已设置isApplyingRemoteEdit标志')

    const { type, content, from, to, openStart, openEnd } = edit

    switch (type) {
      case 'insert':
        // 精确位置插入
        if (typeof from === 'number' && content) {
          console.log(`[EditorArea] 📝 执行插入: 位置${from}, 内容:`, content, `openStart=${openStart}, openEnd=${openEnd}`)

          //   关键修复：使用ProseMirror的Slice正确插入
          const view = editor.value.view
          const state = view.state
          const tr = state.tr
          const schema = state.schema

          //   检测是否为单纯的换行操作（回车键）
          //   特征: 2个paragraph节点,openStart=1, openEnd=1
          const isEnterKey = Array.isArray(content) &&
            content.length === 2 &&
            content[0].type === 'paragraph' &&
            content[1].type === 'paragraph' &&
            openStart === 1 &&
            openEnd === 1

          if (isEnterKey) {
            // 换行操作：直接分割当前段落
            console.log('[EditorArea] 🔄 检测到回车换行，使用splitBlock')
            const resolvedPos = state.doc.resolve(from)

            // 使用split而不是插入节点
            tr.split(from, 1)  // 1表示分割深度
            view.dispatch(tr)
            console.log('[EditorArea] ✅ 换行完成')
          } else {
            //   处理数组或单个节点
            let nodes: any[]
            if (Array.isArray(content)) {
              nodes = content.map((nodeJSON: any) => schema.nodeFromJSON(nodeJSON))
              console.log(`[EditorArea] 📝 解析${nodes.length}个节点:`, nodes)
            } else {
              nodes = [schema.nodeFromJSON(content)]
              console.log(`[EditorArea] 📝 解析1个节点:`, nodes)
            }

            //   创建Fragment和Slice - 使用正确的openStart/openEnd
            const fragment = Fragment.from(nodes)
            const slice = new Slice(fragment, openStart || 0, openEnd || 0)

            console.log(`[EditorArea] 📝 创建Slice: size=${slice.size}, openStart=${slice.openStart}, openEnd=${slice.openEnd}`)

            // 使用replace插入slice
            tr.replace(from, from, slice)
            view.dispatch(tr)

            console.log('[EditorArea] ✅ 插入完成')
          }
        } else {
          console.warn('[Editor] insert 操作缺少必要参数:', edit)
        }
        break

      case 'delete':
        // 精确位置删除
        if (typeof from === 'number' && typeof to === 'number') {
          console.log(`[EditorArea] 🗑️ 执行删除: ${from} -> ${to}`)
          editor.value.commands.deleteRange({ from, to })
          console.log('[EditorArea] ✅ 删除完成')
        } else {
          console.warn('[Editor] delete 操作缺少必要参数:', edit)
        }
        break

      case 'replace':
        // 替换指定范围的内容
        if (typeof from === 'number' && typeof to === 'number' && content) {
          console.log(`[EditorArea] 🔄 执行替换: ${from} -> ${to}, 内容:`, content)

          //   关键修复：使用ProseMirror的原生API替换内容
          const view = editor.value.view
          const state = view.state
          const tr = state.tr
          const schema = state.schema

          //   处理数组或单个节点
          let nodes: any[]
          if (Array.isArray(content)) {
            nodes = content.map((nodeJSON: any) => schema.nodeFromJSON(nodeJSON))
            console.log(`[EditorArea] 🔄 解析${nodes.length}个节点:`, nodes)
          } else {
            nodes = [schema.nodeFromJSON(content)]
            console.log(`[EditorArea] 🔄 解析1个节点:`, nodes)
          }

          // 使用replaceWith替换range
          tr.replaceWith(from, to, nodes)
          view.dispatch(tr)

          console.log('[EditorArea] ✅ 替换完成')
        } else if (content) {
          // 如果没有范围，完全替换（兼容旧版）
          console.warn('[Editor] 使用完全替换模式（不推荐，可能导致光标冲突）')
          editor.value.commands.setContent(content)
        }
        break

      default:
        console.warn('[Editor] 未知的编辑类型:', type)
    }

    console.log('[EditorArea] 📄 应用后文档内容长度:', editor.value.state.doc.content.size)
  } catch (error) {
    console.error('[Editor] 应用远程编辑失败:', error, edit)
  } finally {
    isApplyingRemoteEdit.value = false
    console.log('[EditorArea] 🔓 已解除isApplyingRemoteEdit标志')
  }
}

// 应用远程编辑（队列版本）
const applyRemoteEdit = (edit: any) => {
  console.log('[EditorArea] 📥 加入编辑队列:', edit)
  editQueue.push(edit)
  processEditQueue()
}

//   更新远程光标
const updateRemoteCursor = (data: any) => {
  console.log('[EditorArea] 📍 收到远程光标更新:', data)
  console.log('[EditorArea] 📍 position详情: line=', data.position?.line, 'column=', data.position?.column)

  if (!editor.value) {
    console.warn('[EditorArea] ⚠️ editor未初始化,无法更新光标')
    return
  }

  try {
    console.log('[EditorArea] 📍 通过transaction meta更新光标')
    console.log('[EditorArea] 📍 传递给Plugin的position:', JSON.stringify(data.position))

    //   创建transaction并设置meta来传递光标数据
    const tr = editor.value.state.tr
    tr.setMeta('updateRemoteCursor', {
      action: 'set',
      userId: data.userId,
      username: data.username,
      color: data.color,
      position: data.position,
    })

    editor.value.view.dispatch(tr)
    console.log('[EditorArea] ✅ 已派发光标更新transaction')
  } catch (error) {
    console.error('[Editor] 更新远程光标失败:', error)
  }
}

//   移除远程光标
const removeRemoteCursor = (userId: string) => {
  console.log('[EditorArea] 📍 移除远程光标:', userId)

  if (!editor.value) return

  try {
    const tr = editor.value.state.tr
    tr.setMeta('updateRemoteCursor', {
      action: 'delete',
      userId: userId,
    })

    editor.value.view.dispatch(tr)
    console.log('[EditorArea] ✅ 已派发光标删除transaction')
  } catch (error) {
    console.error('[Editor] 移除远程光标失败:', error)
  }
}

//   在有 documentId 时初始化协作功能
let collaboration: ReturnType<typeof useCollaboration> | null = null
let onlineUsers = ref([])
let isConnected = ref(false)

// 监听socket认证成功,获取用户颜色
watch(() => socketService.currentUser.value, (user) => {
  if (user && user.color) {
    userColor.value = user.color
    console.log('[EditorArea] 用户颜色已更新:', user.color)
  }
})

//   监听 documentId 变化，动态加入/离开文档房间
watch(documentId, (newId, oldId) => {
  console.log('[EditorArea] documentId 变化:', { oldId, newId })

  if (useYjs) {
    // Yjs模式: 初始化或切换文档
    if (oldId && yjsCollaboration) {
      console.log('[Yjs] 离开旧文档:', oldId)
      yjsCollaboration.destroyYjs()
    }

    if (newId && editor.value) {
      console.log('[Yjs] 加入新文档:', newId)
      const userInfo = {
        id: Number(userStore.userInfo?.id) || 0,
        username: userStore.userInfo?.name || '未知用户',
        color: generateUserColor(Number(userStore.userInfo?.id) || 0),
      }

      yjsCollaboration = useYjsCollaboration(documentId, userInfo)
      yjsCollaboration.initYjs(editor.value)

      // 动态添加Yjs扩展
      if (yjsCollaboration.ydoc.value && yjsCollaboration.provider.value) {
        const yjsExts = getYjsExtensions(
          yjsCollaboration.ydoc.value,
          yjsCollaboration.provider.value,
          userInfo
        )
        yjsExts.forEach(ext => editor.value?.registerPlugin(ext as any))
      }

      isConnected = yjsCollaboration.isConnected
      onlineUsers = yjsCollaboration.onlineUsers
    }
  } else {
    // Socket.IO模式: 使用原有逻辑
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

          //   接收远程光标
          onRemoteCursor: (data) => {
            console.log('[Editor] 远程光标:', data)
            updateRemoteCursor(data)
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

          //   接收用户离开
          onUserLeft: (data) => {
            console.log('[Editor] 用户离开:', data)
            removeRemoteCursor(data.userId)
          },
        })

        onlineUsers = collaboration.onlineUsers
        isConnected = collaboration.isConnected
      } else {
        // 已经初始化过，直接加入新文档
        socketService.joinDocument(newId)
      }
    }
  }
}, { immediate: true })  //   immediate: true 确保首次加载时就执行

// 广播编辑操作（仅Socket.IO模式使用）
const broadcastEdit = (transaction: any) => {
  if (useYjs) return // Yjs自动同步,不需要手动广播

  if (!collaboration || !editor.value || !documentId.value) {
    console.log('[broadcastEdit] 跳过: collaboration=', !!collaboration, 'editor=', !!editor.value, 'documentId=', documentId.value)
    return
  }
  if (isApplyingRemoteEdit.value) {
    console.log('[broadcastEdit] 跳过: 正在应用远程编辑')
    return // 如果正在应用远程编辑，不广播
  }

  // 分析 transaction 中的步骤
  const { steps } = transaction

  if (!steps || steps.length === 0) {
    console.log('[broadcastEdit] 跳过: 没有steps')
    return
  }

  console.log('[broadcastEdit] 📤 准备广播 ', steps.length, ' 个编辑步骤')

  // 遍历所有步骤，发送增量编辑
  steps.forEach((step: any, index: number) => {
    const stepJSON = step.toJSON()
    console.log(`[broadcastEdit] 步骤 ${index}: stepType=${stepJSON.stepType}, from=${stepJSON.from}, to=${stepJSON.to}`)
    console.log(`[broadcastEdit] 步骤 ${index} 完整信息:`, stepJSON)
    console.log(`[broadcastEdit] 步骤 ${index} slice内容:`, step.slice)

    // 根据步骤类型发送不同的编辑操作
    if (stepJSON.stepType === 'replace') {
      const { from, to } = stepJSON
      const slice = step.slice

      console.log(`[broadcastEdit] slice.content.size=`, slice?.content?.size)
      console.log(`[broadcastEdit] slice.content=`, slice?.content)

      // 如果有内容插入
      if (slice && slice.content && slice.content.size > 0) {
        const content = slice.content.toJSON()

        if (from === to) {
          // 纯插入
          console.log(`[broadcastEdit] 📤 发送插入: pos=${from}, content=`, content, `openStart=${slice.openStart}, openEnd=${slice.openEnd}`)
          collaboration.sendEdit({
            documentId: documentId.value,
            type: 'insert',
            from,
            content,
            openStart: slice.openStart,
            openEnd: slice.openEnd,
            timestamp: Date.now(),
          })
        } else {
          // 替换（先删除，再插入）
          console.log(`[broadcastEdit] 📤 发送替换: from=${from}, to=${to}, content=`, content, `openStart=${slice.openStart}, openEnd=${slice.openEnd}`)
          collaboration.sendEdit({
            documentId: documentId.value,
            type: 'replace',
            from,
            to,
            content,
            openStart: slice.openStart,
            openEnd: slice.openEnd,
            timestamp: Date.now(),
          })
        }
      } else if (from < to) {
        // 纯删除
        console.log(`[broadcastEdit] 📤 发送删除: from=${from}, to=${to}`)
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
    // 使用Yjs协同光标或传统协同光标
    ...(useYjs ? [] : [CollaborationCursor]),
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

    //   广播光标位置(使用防抖)
    if (collaboration && editor && documentId.value && !isApplyingRemoteEdit.value) {
      const position = calculateCursorPosition(editor)
      if (position) {
        debouncedSendCursor(position)
      }
    }
  }
})

// 初始化自动保存功能
const {
  saveStatus,
  lastSavedAt,
  manualSave: handleManualSave,
} = useAutoSave(
  documentId,
  computed(() => editor.value?.getJSON()),
  computed(() => isModified.value),
)

//   辅助函数: 计算光标的行列位置
const calculateCursorPosition = (editor: any): { line: number; column: number } | null => {
  try {
    const { from } = editor.state.selection
    const doc = editor.state.doc

    let line = 0
    let column = 0
    let found = false

    console.log(`[calculateCursorPosition] 开始计算: from=${from}`)

    // 遍历文档找到光标所在的块级节点
    doc.descendants((node: any, pos: number) => {
      if (found) return false

      if (node.isBlock && node.type.name !== 'doc') {
        const nodeEnd = pos + node.nodeSize

        console.log(`[calculateCursorPosition] 检查块: line=${line}, pos=${pos}, nodeSize=${node.nodeSize}, nodeEnd=${nodeEnd}, content.size=${node.content.size}, type=${node.type.name}`)

        // 检查光标是否在当前块内
        if (from >= pos && from <= nodeEnd) {
          // 找到了！计算列号（相对于块内容开始位置）
          column = from - pos - 1 // -1 因为要跳过节点开始标记
          if (column < 0) column = 0 // 防止负数
          found = true
          console.log(`[calculateCursorPosition] ✅ 找到: from=${from} - pos=${pos} - 1 = column=${column}`)
          console.log(`[calculateCursorPosition] 结果: line=${line}, column=${column}`)
          console.log(`[calculateCursorPosition] 节点内容: "${node.textContent}", 长度: ${node.content.size}`)
          return false
        }

        // 如果还没找到，说明光标在后面的行
        line++
      }

      return true
    })

    if (!found) {
      console.warn('[calculateCursorPosition] ⚠️ 未找到光标所在块')
      return null
    }

    return { line, column }
  } catch (error) {
    console.error('[calculateCursorPosition] 计算失败:', error)
    return null
  }
}

//   防抖函数: 限制光标更新频率
let cursorUpdateTimer: number | null = null
const debouncedSendCursor = (position: { line: number; column: number }) => {
  if (cursorUpdateTimer) {
    clearTimeout(cursorUpdateTimer)
  }

  cursorUpdateTimer = setTimeout(() => {
    if (collaboration) {
      collaboration.sendCursor(position)
    }
  }, 150) as unknown as number // 150ms防抖
}

// 恢复评论高亮标记
const restoreCommentHighlights = async () => {
  if (!documentId.value || !editor.value) return

  try {
    console.log('[restoreCommentHighlights] 开始加载评论...')

    // 动态导入getComments API
    const { getComments } = await import('@/api/comments')
    const res = await getComments(documentId.value) as any

    if (!res || !Array.isArray(res)) {
      console.log('[restoreCommentHighlights] 无评论数据')
      return
    }

    console.log(`[restoreCommentHighlights] 加载到 ${res.length} 条评论`)

    // 为每条评论恢复高亮标记
    res.forEach((comment: any) => {
      const commentId = String(comment.id)
      const startPos = comment.startPos
      const endPos = comment.endPos

      if (typeof startPos === 'number' && typeof endPos === 'number' && startPos < endPos) {
        // 验证位置是否有效
        const docSize = editor.value.state.doc.content.size
        if (startPos >= 0 && endPos <= docSize) {
          editor.value.chain()
            .setTextSelection({ from: startPos, to: endPos })
            .setCommentMark({
              commentId,
              userId: String(comment.userId),
              timestamp: new Date(comment.createdAt).getTime()
            })
            .run()

          console.log(`[restoreCommentHighlights] ✅ 恢复评论 ${commentId} 高亮: ${startPos}-${endPos}`)
        } else {
          console.warn(`[restoreCommentHighlights] ⚠️ 评论 ${commentId} 位置超出文档范围: ${startPos}-${endPos}, 文档大小: ${docSize}`)
        }
      }
    })

    console.log('[restoreCommentHighlights] 评论高亮恢复完成')
  } catch (error) {
    console.warn('[restoreCommentHighlights] 加载评论失败（可能评论功能未启用）:', error)
    // 不抛出错误，避免影响文档加载
  }
}

// 加载版本内容
const fetchVersionContent = async () => {
  if (!versionId.value || !documentId.value || !editor.value) return

  try {
    loading.value = true
    console.log('加载版本内容:', versionId.value)

    // 获取版本详情
    const versionDetail = await getVersionDetail(Number(documentId.value), Number(versionId.value))

    // 解析版本内容
    let editorContent = versionDetail.content || ''
    if (typeof editorContent === 'string' && editorContent.startsWith('{')) {
      try {
        editorContent = JSON.parse(editorContent)
        console.log('[fetchVersionContent] 版本内容已解析')
      } catch (e) {
        console.warn('[fetchVersionContent] JSON解析失败,使用原始字符串:', e)
      }
    }

    // 设置编辑器为只读模式
    editor.value.setEditable(false)

    // 设置内容
    editor.value.commands.setContent(editorContent)

    console.log('[fetchVersionContent] 版本内容已加载')
  } catch (error) {
    console.error('加载版本失败:', error)
    Message.error('加载版本失败')
  } finally {
    loading.value = false
  }
}

// 获取文档数据
const fetchDocument = async () => {
  if (!documentId.value || !editor.value || loading.value) return

  // 如果是版本预览,加载版本内容
  if (isVersionPreview.value && versionId.value) {
    await fetchVersionContent()
    return
  }

  try {
    loading.value = true
    console.log('[fetchDocument] 加载正常文档:', documentId.value)

    const doc = await getDocument(documentId.value)
    documentData.value = doc

    console.log('[fetchDocument] 📄 获取到的文档内容:', doc.content?.substring(0, 200))
    console.log('[fetchDocument] 📄 文档内容长度:', doc.content?.length)

    // 处理文档内容格式
    let editorContent = doc.content || ''

    // 如果content是JSON字符串,需要解析
    if (typeof editorContent === 'string' && editorContent.startsWith('{')) {
      try {
        editorContent = JSON.parse(editorContent)
        console.log('[fetchDocument] 📄 内容已从JSON字符串解析为对象')
      } catch (e) {
        console.warn('[fetchDocument] ⚠️  JSON解析失败,使用原始字符串:', e)
      }
    }

    //   设置编辑器内容时禁用广播（防止加载时触发协同更新）
    isApplyingRemoteEdit.value = true
    console.log('[fetchDocument] 🔒 设置isApplyingRemoteEdit=true，准备加载内容')
    editor.value.commands.setContent(editorContent)
    console.log('[fetchDocument] ✅ 内容已加载，文档大小:', editor.value.state.doc.content.size)
    console.log('[fetchDocument] 📄 编辑器HTML长度:', editor.value.getHTML().length)

    // 打印文档结构
    let structureLog = '[fetchDocument] 📐 文档结构:\n'
    editor.value.state.doc.descendants((node: any, pos: number) => {
      if (node.isBlock && node.type.name !== 'doc') {
        structureLog += `  pos=${pos}, size=${node.nodeSize}, content="${node.textContent?.substring(0, 50)}"\n`
      }
    })
    console.log(structureLog)

    // 延迟解除标记
    setTimeout(() => {
      isApplyingRemoteEdit.value = false
      console.log('[fetchDocument] 🔓 解除isApplyingRemoteEdit标志')
    }, 100)

    // ⭐ 加载评论并恢复高亮标记
    await restoreCommentHighlights()

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

    //   更新编辑器模式 store 的权限信息
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
  // 只读用户(无写权限)不标记修改/不自动保存:
  // 协同时接收远端编辑会改变内容,但不应触发保存(否则被权限拦截弹"更新失败")
  if (!editor.value.isEditable) return

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

// 手动保存 (调用useAutoSave的manualSave)
const handleManualSaveClick = async () => {
  if (!editor.value || !documentId.value) return

  try {
    await handleManualSave()

    // 重新加载文档内容(确保显示最新保存的内容)
    await fetchDocument()

    // 如果在历史模式,需要刷新版本列表(通过key强制刷新组件)
    if (editorModeStore.currentMode === EditorMode.HISTORY) {
      // 切换到其他模式再切换回来,触发组件重新挂载
      const currentMode = editorModeStore.currentMode
      editorModeStore.switchMode(EditorMode.NORMAL)
      await nextTick()
      editorModeStore.switchMode(currentMode)
    }
  } catch (error) {
    console.error('手动保存失败:', error)
  }
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

// 处理权限变更
const handlePermissionChanged = async (userId: string, permission: string) => {
  console.log('[EditorArea] 权限变更:', userId, permission)

  // 重新加载文档信息
  if (documentId.value) {
    try {
      const doc = await getDocument(documentId.value)
      documentData.value = doc

      // 如果是当前用户的权限被修改,需要更新编辑器状态
      if (String(userStore.userInfo?.id) === userId) {
        const isCollaborationEnabled = doc.isCollaborationEnabled ?? false
        const userPermission = (doc as any).permission

        let isEditable = false
        if (userPermission === 'owner') {
          isEditable = true
        } else if (!isCollaborationEnabled) {
          isEditable = false
        } else {
          isEditable = permission === 'editor'
        }

        editor.value?.setEditable(isEditable)
        editorModeStore.permissions.canEdit = isEditable

        if (isEditable) {
          Message.success('您的权限已更新为可编辑')
        } else {
          Message.warning('您的权限已更新为只读')
        }
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

// 监听版本预览状态变化
watch([isVersionPreview, versionId], ([isPreview, newVersionId], [wasPreview]) => {
  console.log('[EditorArea] 版本预览状态变化:', { isPreview, newVersionId, wasPreview })

  if (editor.value && documentId.value) {
    if (isPreview && newVersionId) {
      // 切换到版本预览
      console.log('[EditorArea] 加载版本预览:', newVersionId)
      fetchDocument()
    } else if (wasPreview && !isPreview) {
      // 从版本预览切换回正常文档
      console.log('[EditorArea] 从版本预览返回正常文档')
      fetchDocument()
    }
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

  // 监听版本恢复事件
  const handleRestoreVersion = (event: CustomEvent) => {
    if (editor.value && event.detail?.content) {
      console.log('[EditorArea] 收到版本恢复事件，更新内容')

      // 标记为远程更新，防止触发自动保存
      isApplyingRemoteEdit.value = true

      editor.value.commands.setContent(event.detail.content)

      // 重置修改状态
      isModified.value = false
      if (documentId.value) {
        tabsStore.markModified(documentId.value, false)
      }

      // 延迟恢复标志
      setTimeout(() => {
        isApplyingRemoteEdit.value = false
      }, 100)
    }
  }

  // 添加事件监听器
  window.addEventListener('manual-save-request', handleGlobalSave)
  window.addEventListener('restore-version', handleRestoreVersion as EventListener)

  // 监听协同状态变化(捕获注销函数,卸载时清理,避免 socket 单例上残留回调)
  const unsubCollabToggle = socketService.onCollaborationToggle((data) => {
    if (import.meta.env.DEV) console.log('[EditorArea] 收到协同状态变化通知:', data)

    // 如果是当前文档
    if (String(data.documentId) === String(documentId.value)) {
      handleCollaborationToggled(data.enabled)
    }
  })

  //   监听权限更新
  const unsubPermissionUpdate = socketService.onPermissionUpdate((data) => {
    if (import.meta.env.DEV) console.log('[EditorArea] 收到权限更新通知:', data)

    // 如果是当前用户且是当前文档
    if (String(data.userId) === String(userStore.userInfo?.id) &&
      String(data.documentId) === String(documentId.value)) {

      // 立即更新编辑器状态
      const newPermission = data.role
      const isCollaborationEnabled = documentData.value?.isCollaborationEnabled ?? false

      let isEditable = false
      if (newPermission === 'owner') {
        isEditable = true
      } else if (!isCollaborationEnabled) {
        isEditable = false
      } else {
        isEditable = newPermission === 'editor'
      }

      editor.value?.setEditable(isEditable)
      editorModeStore.permissions.canEdit = isEditable

      // 提示用户
      if (isEditable) {
        Message.success('您的权限已更新为可编辑')
      } else {
        Message.warning('您的权限已更新为只读')
      }
    }
  })

  // 添加全局快捷键: Ctrl+J 打开AI助手
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'j') {
      e.preventDefault()
      if (documentId.value) {
        editorModeStore.switchMode(EditorMode.AI_ASSISTANT)
      }
    }
  }
  window.addEventListener('keydown', handleKeyDown)

  // 组件卸载时移除监听器
  onBeforeUnmount(() => {
    window.removeEventListener('manual-save-request', handleGlobalSave)
    window.removeEventListener('restore-version', handleRestoreVersion as EventListener)
    window.removeEventListener('keydown', handleKeyDown)
    // 注销 socket 单例上的订阅,避免组件卸载后回调残留
    unsubCollabToggle()
    unsubPermissionUpdate()
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
  border-bottom: 1px solid var(--c-border);
  background: #fff;
  /* height: 50px; */
  min-height: 50px;
  flex-shrink: 0;
  gap: 8px;
  padding-right: 12px;
  position: relative;
  z-index: 10;
  overflow-x: auto;
  /* 添加滚动 */
}

/* 左侧工具区域 - 保持原有大小,可横向滚动 */
.toolbar-tools {
  flex: 0 0 auto;
  /* 不伸缩 */
  display: flex;
  align-items: center;
  white-space: nowrap;
  /* 防止换行 */
  overflow: visible;
  /* 允许内容显示 */
  min-width: min-content;
  /* 至少容纳内容 */
}

/* 中间模式切换区域 */
.toolbar-mode {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  padding: 0 12px;
  border-left: 1px solid var(--c-border);
  border-right: 1px solid var(--c-border);
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
  max-width: 800px;
  height: 100%;
  border: none;
  display: block;
  box-sizing: border-box;
  overflow-y: auto;
  overflow-x: hidden;
  text-align: left !important;
  margin: 0 auto !important;
  padding: 40px 32px 96px 32px !important;
  font-size: 16px;
  line-height: 1.8;
  color: #2b303b;
  outline: none;
}

.editorContainer :deep(.ProseMirror:focus) {
  outline: none;
}

/* 标题与正文排版 */
.editorContainer :deep(.ProseMirror h1) {
  font-size: 30px;
  font-weight: 700;
  line-height: 1.3;
  margin: 0.2em 0 0.5em;
  color: #15181f;
}

.editorContainer :deep(.ProseMirror h2) {
  font-size: 23px;
  font-weight: 700;
  line-height: 1.35;
  margin: 1em 0 0.4em;
  color: #15181f;
}

.editorContainer :deep(.ProseMirror h3) {
  font-size: 19px;
  font-weight: 600;
  margin: 0.9em 0 0.3em;
  color: #15181f;
}

.editorContainer :deep(.ProseMirror p) {
  margin: 0.55em 0;
}

.editorContainer :deep(.ProseMirror > *:first-child) {
  margin-top: 0;
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
  accent-color: #4f46e5;
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
/* 图片样式 - 左对齐 */
.editorContainer :deep(.ProseMirror p img) {
  display: inline-block;
  max-width: 100%;
  height: auto;
}

/* 段落样式 */
.editorContainer :deep(.ProseMirror p),
.editorContainer :deep(.ProseMirror .paragraph) {
  margin: 0.5rem 0;
  line-height: 1.6;
  text-align: left;
  /* 明确指定左对齐 */
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
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  margin: 14px 18px 18px;
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