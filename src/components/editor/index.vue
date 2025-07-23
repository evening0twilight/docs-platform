<template>
  <div class="editor-container">
    <!-- 面包屑导航 -->
    <div class="breadcrumb">
      <a-breadcrumb>
        <a-breadcrumb-item v-for="(item, index) in breadcrumb" :key="index">
          {{ item }}
        </a-breadcrumb-item>
      </a-breadcrumb>
    </div>

    <!-- Tiptap编辑器 -->
    <div class="editor-wrapper">
      <TiptapEditor :documentId="documentId" />
    </div>

    <!-- 保存按钮 -->
    <div class="editor-footer">
      <a-button type="primary" @click="handleSave">保存</a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import TiptapEditor from '@/components/editor/TiptapEditor.vue'

const route = useRoute()
const documentId = computed(() => route.params.id as string)

const breadcrumb = computed(() => {
  // 根据路由路径生成面包屑
  const path = route.path.split('/').filter(Boolean)
  return path.map(p => p.charAt(0).toUpperCase() + p.slice(1))
})

const handleSave = () => {
  // 保存逻辑
}
</script>

<style scoped>
.editor-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;
}

.breadcrumb {
  margin-bottom: 16px;
}

.editor-wrapper {
  flex: 1;
  overflow-y: auto;
  border: 1px solid #e5e6eb;
  border-radius: 4px;
  padding: 16px;
}

.editor-footer {
  display: flex;
  justify-content: flex-end;
  padding: 16px 0;
}
</style>