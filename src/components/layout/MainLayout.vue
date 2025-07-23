<template>
  <div class="main-layout">
    <div class="left-sidebar">
      <!-- Logo和用户信息 -->
      <div class="logo-area">
        <span class="logo-text">编辑</span>
        <a-dropdown trigger="hover" position="br">
          <a-avatar :size="32" :style="{ backgroundColor: '#3370ff' }">
            {{ userStore.username?.charAt(0) }}
          </a-avatar>
          <template #content>
            <a-doption @click="showUserProfile">个人信息</a-doption>
            <a-doption @click="handleLogout">退出登录</a-doption>
          </template>
        </a-dropdown>
      </div>

      <!-- 搜索和添加 -->
      <div class="search-add-area">
        <a-input-search placeholder="搜索文档" />
        <a-dropdown trigger="click" position="right">
          <a-button type="text" class="add-button">
            <template #icon>
              <icon-plus />
            </template>
          </a-button>
          <template #content>
            <a-doption @click="showAddDocumentModal">添加文档</a-doption>
            <a-doption @click="showAddFolderModal">添加文件夹</a-doption>
          </template>
        </a-dropdown>
      </div>

      <!-- 文档树 -->
      <div class="document-tree">
        <DocumentTree />
      </div>

      <!-- 历史记录 -->
      <div class="history-area">
        <a-button type="text" @click="showHistoryModal">
          <template #icon>
            <icon-history />
          </template>
          <span>历史记录</span>
        </a-button>
      </div>
    </div>

    <div class="right-content">
      <router-view v-slot="{ Component }">
        <keep-alive :include="cachedViews">
          <component :is="Component" :key="$route.fullPath" />
        </keep-alive>
      </router-view>
    </div>

    <!-- 用户信息弹窗 -->
    <UserProfileModal v-if="userProfileVisible" />

    <!-- 添加文档弹窗 -->
    <AddDocumentModal v-if="addDocumentVisible" />

    <!-- 添加文件夹弹窗 -->
    <AddFolderModal v-if="addFolderVisible" />

    <!-- 历史记录弹窗 -->
    <HistoryModal v-if="historyVisible" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useTabsStore } from '@/store/tabs'
import { useUserStore } from '@/store/user'
import DocumentTree from './DocumentTree.vue'
import UserProfileModal from './UserProfileModal.vue'
import AddDocumentModal from './AddDocumentModal.vue'
import AddFolderModal from './AddFolderModal.vue'
import HistoryModal from './HistoryModal.vue'

const route = useRoute()
const tabsStore = useTabsStore()
const userStore = useUserStore()

const cachedViews = computed(() => {
  return tabsStore.tabs.map(tab => tab.name)
})

// 初始化添加当前路由到tabs
tabsStore.addTab(route)

// 其他方法实现...
</script>

<style scoped>
.main-layout {
  display: flex;
  height: 100vh;
}

.left-sidebar {
  width: 200px;
  background-color: #f7f8fa;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e5e6eb;
}

.right-content {
  flex: 1;
  overflow: hidden;
}

.logo-area {
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-bottom: 1px solid #e5e6eb;
}

.search-add-area {
  padding: 12px;
  border-bottom: 1px solid #e5e6eb;
}

.document-tree {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.history-area {
  padding: 12px;
  border-top: 1px solid #e5e6eb;
}
</style>