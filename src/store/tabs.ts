// tabs状态
import { defineStore } from 'pinia'
import type { RouteLocationNormalized } from 'vue-router'

interface TabItem {
  name: string
  path: string
  title: string
}

export const useTabsStore = defineStore('tabs', {
  state: () => ({
    tabs: [] as TabItem[],
    activeTab: '' as string
  }),
  actions: {
    addTab(route: RouteLocationNormalized) {
      if (route.meta.hideTab) return
      
      const existingTab = this.tabs.find(tab => tab.path === route.path)
      if (!existingTab) {
        this.tabs.push({
          name: route.name as string,
          path: route.path,
          title: route.meta.title as string || ''
        })
      }
      this.activeTab = route.path
    },
    removeTab(path: string) {
      this.tabs = this.tabs.filter(tab => tab.path !== path)
    },
    setActiveTab(path: string) {
      this.activeTab = path
    }
  }
})