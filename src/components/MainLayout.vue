<template>
  <div class="layoutContainer w-full h-full p-[20px] rounded-xl overflow-hidden">
    <a-layout class="layout-demo">
      <a-layout-sider collapsible breakpoint="xl" hide-trigger :width="300" class="h-full">
        <Sidebar class="w-full h-full" @document-click="handleDocumentClick" />
      </a-layout-sider>
      <a-layout class="w-full h-full">
        <a-layout-header style="padding-left: 20px" class="h-[36px] w-full">
          <TabBar />
        </a-layout-header>
        <a-layout style="padding: 0 24px" class="h-full w-full">
          <a-breadcrumb :style="{ margin: '4px 0' }">
            <a-breadcrumb-item>Home</a-breadcrumb-item>
            <a-breadcrumb-item>List</a-breadcrumb-item>
            <a-breadcrumb-item>App</a-breadcrumb-item>
          </a-breadcrumb>
          <a-layout-content class="w-full h-full">
            <router-view v-slot="{ Component, route }">
              <keep-alive>
                <component 
                  :is="Component" 
                  :key="route.params.id || route.name"
                />
              </keep-alive>
            </router-view>
          </a-layout-content>
          <a-layout-footer>
            <Footer />
          </a-layout-footer>
        </a-layout>
      </a-layout>
    </a-layout>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { Message } from '@arco-design/web-vue';
import { useRouter } from 'vue-router'
import { useTabsStore } from '@/store/tabs'
import Sidebar from './Sidebar.vue';
import TabBar from './editor/TabBar.vue'
import Footer from './sider/Footer.vue'

const router = useRouter()
const tabsStore = useTabsStore()

// 组件挂载时修复可能存在的错误标签路由
onMounted(() => {
  tabsStore.fixAllTabRoutes()
})

// 处理文档点击事件
const handleDocumentClick = (doc: any) => {
  console.log('点击文档:', doc)
  
  // 只有文档类型才打开标签页
  if (doc.itemType === 'document') {
    tabsStore.openTab(doc)
    router.push(`/workspace/document/${doc.id}`)
  }
}

const handleLogout = () => {
  localStorage.removeItem('token')
  sessionStorage.removeItem('token')
  Message.success('已退出登录')
  router.push('/login')
}

</script>

<style scoped>
.layout-demo {
  width: 100%;
  height: 100%;
  background: var(--color-fill-2);
  border: 1px solid var(--color-border);
}

.layout-demo :deep(.arco-layout-sider) .logo {
  height: 32px;
  margin: 12px 8px;
  background: rgba(255, 255, 255, 0.2);
}

.layout-demo :deep(.arco-layout-sider-light) .logo {
  background: var(--color-fill-2);
}

.layout-demo :deep(.arco-layout-header) {
  /* height: 64px; */
  /* line-height: 64px; */
  background: var(--color-bg-3);
}

.layout-demo :deep(.arco-layout-footer) {
  height: 48px;
  color: var(--color-text-2);
  font-weight: 400;
  font-size: 14px;
  line-height: 48px;
}

.layout-demo :deep(.arco-layout-content) {
  color: var(--color-text-2);
  font-weight: 400;
  font-size: 14px;
  background: var(--color-bg-3);
}

.layout-demo :deep(.arco-layout-footer),
.layout-demo :deep(.arco-layout-content) {
  display: flex;
  flex-direction: column;
  justify-content: center;
  color: var(--color-white);
  font-size: 16px;
  font-stretch: condensed;
  text-align: center;
}

.layout-demo :deep(.arco-layout-sider) {
  overflow: hidden !important;
}

.layout-demo :deep(.arco-layout-sider-children) {
  height: 100%;
  overflow: hidden;
}
</style>