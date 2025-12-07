import { defineStore } from 'pinia'

interface Tab {
  id: string
  title: string
  type: 'document' | 'folder'
  route: string
  isActive: boolean
  isModified: boolean
  content?: any
}

export const useTabsStore = defineStore('tabs', {
  state: () => ({
    tabs: [] as Tab[],
    activeTabId: null as string | null
  }),

  getters: {
    activeTab: (state) => state.tabs.find(tab => tab.id === state.activeTabId),
    tabsCount: (state) => state.tabs.length,
    hasModifiedTabs: (state) => state.tabs.some(tab => tab.isModified)
  },

  actions: {
    // 打开新标签
    openTab(doc: { id: number | string, name: string, itemType: 'document' | 'folder' }) {
      const docId = doc.id.toString()
      const existingTab = this.tabs.find(tab => tab.id === docId)
      
      if (existingTab) {
        // 如果标签已存在，直接激活
        this.activeTabId = docId
      } else {
        // 创建新标签
        const newTab: Tab = {
          id: docId,
          title: doc.name,
          type: doc.itemType === 'folder' ? 'folder' : 'document',
          route: `/workspace/document/${docId}`,
          isActive: false,
          isModified: false
        }
        
        this.tabs.push(newTab)
        this.activeTabId = docId
      }
    },

    // 添加自定义标签(用于版本预览等)
    addTab(tab: { id: string, title: string, route: string, isModified?: boolean, type?: 'document' | 'folder' }) {
      const existingTab = this.tabs.find(t => t.id === tab.id)
      
      if (existingTab) {
        // 如果标签已存在，直接激活
        this.activeTabId = tab.id
      } else {
        // 创建新标签
        const newTab: Tab = {
          id: tab.id,
          title: tab.title,
          type: tab.type || 'document',
          route: tab.route,
          isActive: false,
          isModified: tab.isModified || false
        }
        
        this.tabs.push(newTab)
        this.activeTabId = tab.id
      }
    },

    // 关闭标签
    closeTab(tabId: string) {
      const index = this.tabs.findIndex(tab => tab.id === tabId)
      if (index > -1) {
        this.tabs.splice(index, 1)
        
        // 如果关闭的是当前活动标签，需要切换到其他标签
        if (this.activeTabId === tabId) {
          if (this.tabs.length > 0) {
            const newActiveIndex = Math.min(index, this.tabs.length - 1)
            this.activeTabId = this.tabs[newActiveIndex]?.id || null
          } else {
            this.activeTabId = null
          }
        }
      }
    },

    // 关闭所有标签
    closeAllTabs() {
      this.tabs = []
      this.activeTabId = null
    },

    // 关闭其他标签
    closeOtherTabs(keepTabId: string) {
      this.tabs = this.tabs.filter(tab => tab.id === keepTabId)
      this.activeTabId = keepTabId
    },

    // 切换标签
    switchTab(tabId: string) {
      const tab = this.tabs.find(t => t.id === tabId)
      if (tab) {
        this.activeTabId = tabId
      }
    },

    // 标记文档已修改
    markModified(tabId: string, isModified: boolean) {
      const tab = this.tabs.find(t => t.id === tabId)
      if (tab) {
        tab.isModified = isModified
      }
    },

    // 更新标签标题
    updateTabTitle(tabId: string, newTitle: string) {
      const tab = this.tabs.find(t => t.id === tabId)
      if (tab) {
        tab.title = newTitle
      }
    },

    // 获取标签索引
    getTabIndex(tabId: string): number {
      return this.tabs.findIndex(tab => tab.id === tabId)
    },

    // 修复所有标签的路由（用于调试和修复）
    fixAllTabRoutes() {
      console.log('🔧 修复所有标签路由...')
      this.tabs.forEach(tab => {
        const correctRoute = `/workspace/document/${tab.id}`
        if (tab.route !== correctRoute) {
          console.log(`🔧 修复标签 ${tab.title}: ${tab.route} → ${correctRoute}`)
          tab.route = correctRoute
        }
      })
    }
  }
})