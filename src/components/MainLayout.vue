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
        <a-layout class="h-full w-full content-layout">
        <!-- <a-layout style="padding: 0 24px" class="h-full w-full">
          <a-breadcrumb :style="{ margin: '4px 0' }">
            <a-breadcrumb-item v-for="item in breadcrumbItems" :key="item.id">
              {{ item.name }}
            </a-breadcrumb-item>
          </a-breadcrumb> -->
          <a-layout-content class="w-full h-full">
            <router-view v-slot="{ Component, route }">
              <keep-alive>
                <component :is="Component" :key="route.params.id || route.name" />
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
import { onMounted, computed, ref, watch } from 'vue'
import { Message } from '@arco-design/web-vue';
import { useRouter, useRoute } from 'vue-router'
import { useTabsStore } from '@/store/tabs'
import { useUserStore } from '@/store/user'
import { getFolderPath, getDocumentPath } from '@/api/docs'
import Sidebar from './Sidebar.vue';
import TabBar from './editor/TabBar.vue'
import Footer from './sider/Footer.vue'

const router = useRouter()
const route = useRoute()
const tabsStore = useTabsStore()
const userStore = useUserStore()

// 面包屑数据
const breadcrumbItems = ref<Array<{ id: string | number, name: string }>>([])

// 获取文档路径面包屑
const updateBreadcrumb = async () => {
  try {
    console.log('更新面包屑，当前活动标签:', tabsStore.activeTab)

    // 如果当前有活动的文档标签
    const activeTab = tabsStore.activeTab
    if (activeTab && activeTab.type === 'document') {
      console.log('找到活动文档标签:', activeTab)

      // 获取文档的完整路径
      const docId = activeTab.id
      console.log('获取文档路径, docId:', docId)

      try {
        const pathData = await getDocumentPath(docId)
        console.log('获取到文档路径数据:', pathData)

        // 检查API响应是否成功
        if (pathData && pathData.breadcrumbs && Array.isArray(pathData.breadcrumbs)) {
          // 构建面包屑，显示完整路径：根目录 > 文件夹1 > 文件夹2 > 文档名
          // const folderPath = pathData.breadcrumbs.slice(1) // 去掉根目录
          const folderPath = pathData.breadcrumbs
          const items = [
            ...folderPath.map(item => ({ id: item.id, name: item.name })),
            { id: docId, name: activeTab.title }
          ]
          console.log('构建的面包屑项:', items)
          breadcrumbItems.value = items
        } else {
          console.log('API返回的数据格式不正确，只显示文档名')
          // 如果API响应格式不正确，只显示文档名
          breadcrumbItems.value = [{ id: docId, name: activeTab.title }]
        }
      } catch (apiError) {
        console.error('getDocumentPath API调用失败:', apiError)
        // API调用失败时，只显示文档名
        breadcrumbItems.value = [{ id: activeTab.id, name: activeTab.title }]
      }
    } else {
      console.log('没有活动文档或类型不匹配')
      // 没有活动文档时清空面包屑
      breadcrumbItems.value = []
    }
  } catch (error) {
    console.error('获取面包屑路径失败:', error)
    breadcrumbItems.value = []
  }
}

// 监听活动标签变化
watch(() => tabsStore.activeTabId, () => {
  updateBreadcrumb()
}, { immediate: true })

// 组件挂载时检查token和修复标签路由
onMounted(() => {
  // 检查token是否存在
  const token = localStorage.getItem('token') || sessionStorage.getItem('token')
  if (!token && !userStore.hasToken) {
    console.warn('MainLayout: 未找到token，跳转到登录页')
    Message.warning('请先登录')
    router.push('/login')
    return
  }

  // 修复可能存在的错误标签路由
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
  overflow: hidden;
  /* 防止内容溢出 */
  height: 100%;
}

/* 确保内容布局正确计算高度 */
.content-layout {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0 24px;
  /* 移到这里，避免影响高度计算 */
}

.content-layout :deep(.arco-layout-content) {
  flex: 1;
  /* 占据剩余空间 */
  min-height: 0;
  /* 允许flex子元素缩小 */
  overflow: hidden;
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