<template>
  <div class="layoutContainer w-full h-full p-[20px] rounded-xl">
    <a-layout class="layout-demo">
      <a-layout-sider collapsible breakpoint="xl" hide-trigger :width="300">
        <Sidebar class="w-full h-full " />
      </a-layout-sider>
      <a-layout>
        <a-layout-header style="padding-left: 20px">
          Header
        </a-layout-header>
        <a-layout style="padding: 0 24px">
          <a-breadcrumb :style="{ margin: '16px 0' }">
            <a-breadcrumb-item>Home</a-breadcrumb-item>
            <a-breadcrumb-item>List</a-breadcrumb-item>
            <a-breadcrumb-item>App</a-breadcrumb-item>
          </a-breadcrumb>
          <a-layout-content>Content</a-layout-content>
          <a-layout-footer>Footer</a-layout-footer>
        </a-layout>
      </a-layout>
    </a-layout>
  </div>
</template>

<script setup lang="ts">
import { Message } from '@arco-design/web-vue';
import Sidebar from './Sidebar.vue';

</script>

<style scoped>
.layout-demo {
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
  height: 64px;
  line-height: 64px;
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