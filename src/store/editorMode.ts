import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { Message } from '@arco-design/web-vue'

/**
 * 编辑器模式常量
 */
export const EditorMode = {
  NORMAL: 'normal',              // 正常编辑模式（默认）
  COLLABORATION: 'collaboration', // 协同编辑模式
  AI_ASSISTANT: 'ai',            // AI 助手模式
  COMMENT: 'comment',            // 评论模式
  HISTORY: 'history',            // 历史版本模式
  READ_ONLY: 'readonly'          // 只读模式（查看）
} as const

export type EditorMode = typeof EditorMode[keyof typeof EditorMode]

/**
 * 文档功能配置
 */
export interface DocumentFeatures {
  collaborationEnabled: boolean    // 文档是否启用协同
  aiEnabled: boolean               // 文档是否启用 AI
  commentEnabled: boolean          // 文档是否启用评论
  historyEnabled: boolean          // 文档是否启用历史
}

/**
 * 权限信息
 */
export interface Permissions {
  isDocumentOwner: boolean         // 是否文档所有者
  canEdit: boolean                 // 是否可编辑
  canComment: boolean              // 是否可评论
  hasAIAccess: boolean             // 是否有 AI 权限
}

/**
 * 侧边栏内容类型
 */
export type SidebarContentType = 'users' | 'ai' | 'comments' | 'history' | null

/**
 * 编辑器模式状态管理
 */
export const useEditorModeStore = defineStore('editorMode', () => {
  // ========== 状态 ==========
  
  // 当前激活的模式
  const currentMode = ref<EditorMode>(EditorMode.NORMAL)
  
  // 文档功能配置
  const documentFeatures = ref<DocumentFeatures>({
    collaborationEnabled: false,
    aiEnabled: false,
    commentEnabled: true,
    historyEnabled: true,
  })
  
  // 权限信息
  const permissions = ref<Permissions>({
    isDocumentOwner: false,
    canEdit: true,
    canComment: true,
    hasAIAccess: false,
  })
  
  // UI 状态
  const sidebarVisible = ref(false)
  const sidebarContent = ref<SidebarContentType>(null)
  
  // 是否正在切换模式
  const isSwitching = ref(false)
  
  // ========== 计算属性 ==========
  
  // 侧边栏标题
  const sidebarTitle = computed(() => {
    const titles: Record<EditorMode, string> = {
      [EditorMode.NORMAL]: '',
      [EditorMode.COLLABORATION]: '在线用户',
      [EditorMode.AI_ASSISTANT]: 'AI 助手',
      [EditorMode.COMMENT]: '评论',
      [EditorMode.HISTORY]: '历史版本',
      [EditorMode.READ_ONLY]: '',
    }
    return titles[currentMode.value] || ''
  })
  
  // ========== 方法 ==========
  
  /**
   * 检查是否可以启用某个模式
   */
  const canEnableMode = (mode: EditorMode): boolean => {
    switch (mode) {
      case EditorMode.COLLABORATION:
        // 协同编辑需要是文档所有者才能启动
        return permissions.value.isDocumentOwner
        
      case EditorMode.AI_ASSISTANT:
        // AI 助手需要有 AI 权限
        return permissions.value.hasAIAccess
        
      case EditorMode.COMMENT:
        // 评论需要有评论权限
        return permissions.value.canComment
        
      case EditorMode.HISTORY:
        // 历史版本所有人都可以查看
        return true
        
      case EditorMode.NORMAL:
        // 正常模式需要编辑权限
        return permissions.value.canEdit
        
      case EditorMode.READ_ONLY:
        // 只读模式任何人都可以
        return true
        
      default:
        return false
    }
  }
  
  /**
   * 切换模式
   */
  const switchMode = async (newMode: EditorMode, skipConfirm = false): Promise<boolean> => {
    // 如果已经在目标模式，直接返回
    if (currentMode.value === newMode) {
      // 如果侧边栏已关闭，重新打开
      if (!sidebarVisible.value && newMode !== EditorMode.NORMAL) {
        sidebarVisible.value = true
      }
      return true
    }
    
    // 检查权限
    if (!canEnableMode(newMode)) {
      const messages: Record<EditorMode, string> = {
        [EditorMode.COLLABORATION]: '只有文档所有者可以使用协同编辑',
        [EditorMode.AI_ASSISTANT]: '您没有 AI 助手权限',
        [EditorMode.COMMENT]: '您没有评论权限',
        [EditorMode.HISTORY]: '您没有查看历史权限',
        [EditorMode.NORMAL]: '您没有编辑权限',
        [EditorMode.READ_ONLY]: '',
      }
      Message.error(messages[newMode] || '您没有权限使用此功能')
      return false
    }
    
    // 防止重复切换
    if (isSwitching.value) {
      return false
    }
    
    try {
      isSwitching.value = true
      
      // 记录旧模式用于提示
      const oldMode = currentMode.value
      
      // 更新模式
      currentMode.value = newMode
      
      // 更新侧边栏
      updateSidebar(newMode)
      
      // 显示切换提示
      showModeSwitchMessage(oldMode, newMode)
      
      console.log(`[EditorMode] 切换到模式: ${newMode}`)
      
      return true
    } catch (error) {
      console.error('[EditorMode] 切换模式失败:', error)
      Message.error('切换模式失败')
      return false
    } finally {
      isSwitching.value = false
    }
  }
  
  /**
   * 显示模式切换提示
   */
  const showModeSwitchMessage = (oldMode: EditorMode, newMode: EditorMode) => {
    const modeNames: Record<EditorMode, string> = {
      [EditorMode.NORMAL]: '正常编辑',
      [EditorMode.COLLABORATION]: '协同编辑',
      [EditorMode.AI_ASSISTANT]: 'AI 助手',
      [EditorMode.COMMENT]: '评论',
      [EditorMode.HISTORY]: '历史版本',
      [EditorMode.READ_ONLY]: '只读模式',
    }
    
    const oldModeName = modeNames[oldMode]
    const newModeName = modeNames[newMode]
    
    if (oldMode !== EditorMode.NORMAL && newMode !== EditorMode.NORMAL) {
      Message.info(`${oldModeName}功能已关闭，${newModeName}功能已打开`)
    } else if (newMode === EditorMode.NORMAL) {
      Message.success(`${oldModeName}功能已关闭`)
    } else {
      Message.success(`${newModeName}功能已打开`)
    }
  }
  
  /**
   * 关闭所有功能 - 回到正常编辑模式
   */
  const closeAllFeatures = () => {
    if (currentMode.value === EditorMode.NORMAL) {
      Message.info('当前已是正常编辑模式')
      return
    }
    
    const oldMode = currentMode.value
    currentMode.value = EditorMode.NORMAL
    sidebarVisible.value = false
    sidebarContent.value = null
    
    const modeNames: Record<EditorMode, string> = {
      [EditorMode.NORMAL]: '正常编辑',
      [EditorMode.COLLABORATION]: '协同编辑',
      [EditorMode.AI_ASSISTANT]: 'AI 助手',
      [EditorMode.COMMENT]: '评论',
      [EditorMode.HISTORY]: '历史版本',
      [EditorMode.READ_ONLY]: '只读模式',
    }
    
    Message.success(`已关闭所有功能（${modeNames[oldMode]}）`)
  }
  
  /**
   * 更新侧边栏
   */
  const updateSidebar = (mode: EditorMode) => {
    switch (mode) {
      case EditorMode.COLLABORATION:
        sidebarContent.value = 'users'
        sidebarVisible.value = true
        break
        
      case EditorMode.AI_ASSISTANT:
        sidebarContent.value = 'ai'
        sidebarVisible.value = true
        break
        
      case EditorMode.COMMENT:
        sidebarContent.value = 'comments'
        sidebarVisible.value = true
        break
        
      case EditorMode.HISTORY:
        sidebarContent.value = 'history'
        sidebarVisible.value = true
        break
        
      case EditorMode.NORMAL:
      case EditorMode.READ_ONLY:
        sidebarContent.value = null
        sidebarVisible.value = false
        break
    }
  }
  
  /**
   * 关闭侧边栏
   */
  const closeSidebar = () => {
    sidebarVisible.value = false
    // 切换回普通模式
    if (currentMode.value !== EditorMode.NORMAL && currentMode.value !== EditorMode.READ_ONLY) {
      currentMode.value = EditorMode.NORMAL
      sidebarContent.value = null
    }
  }
  
  /**
   * 设置文档功能配置
   */
  const setDocumentFeatures = (features: Partial<DocumentFeatures>) => {
    documentFeatures.value = {
      ...documentFeatures.value,
      ...features,
    }
  }
  
  /**
   * 设置权限
   */
  const setPermissions = (perms: Partial<Permissions>) => {
    permissions.value = {
      ...permissions.value,
      ...perms,
    }
  }
  
  /**
   * 重置状态
   */
  const reset = () => {
    currentMode.value = EditorMode.NORMAL
    documentFeatures.value = {
      collaborationEnabled: false,
      aiEnabled: false,
      commentEnabled: true,
      historyEnabled: true,
    }
    permissions.value = {
      isDocumentOwner: false,
      canEdit: true,
      canComment: true,
      hasAIAccess: false,
    }
    sidebarVisible.value = false
    sidebarContent.value = null
    isSwitching.value = false
  }
  
  return {
    // 状态
    currentMode,
    documentFeatures,
    permissions,
    sidebarVisible,
    sidebarContent,
    isSwitching,
    
    // 计算属性
    sidebarTitle,
    
    // 方法
    canEnableMode,
    switchMode,
    updateSidebar,
    closeSidebar,
    setDocumentFeatures,
    setPermissions,
    reset,
    closeAllFeatures, // 新增: 关闭所有功能
  }
})
