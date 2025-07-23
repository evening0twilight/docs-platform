<template>
  <div class="document-tree">
    <a-spin :loading="loading" style="width: 100%">
      <a-tree v-model:selected-keys="selectedKeys" v-model:expanded-keys="expandedKeys" :data="treeData"
        :field-names="fieldNames" :show-line="true" :block-node="true" @select="handleSelect">
        <template #title="nodeData">
          <div class="tree-node">
            <component :is="getIcon(nodeData.type)" class="node-icon" />
            <span class="node-title">{{ nodeData.title }}</span>
          </div>
        </template>

        <template #switcher-icon="nodeData">
          <icon-right v-if="!nodeData.expanded" />
          <icon-down v-else />
        </template>
      </a-tree>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getDocumentTree } from '@/api/document'
import type { TreeNodeData } from '@arco-design/web-vue/es/tree/interface'

interface TreeData {
  key: string
  title: string
  type: 'file' | 'folder'
  icon?: string
  children?: TreeData[]
  path: string
}

const router = useRouter()
const loading = ref(false)
const treeData = ref<TreeData[]>([])
const selectedKeys = ref<string[]>([])
const expandedKeys = ref<string[]>([])
const fieldNames = {
  key: 'key',
  title: 'title',
  children: 'children'
}

// 获取图标组件
const getIcon = (type: string) => {
  return type === 'folder' ? 'icon-folder' : 'icon-file'
}

// 加载文档树数据
const loadTreeData = async () => {
  try {
    loading.value = true
    const data = await getDocumentTree()
    treeData.value = transformTreeData(data)
    // 默认展开第一层
    if (treeData.value.length > 0) {
      expandedKeys.value = treeData.value.map(item => item.key)
    }
  } catch (error) {
    console.error('加载文档树失败:', error)
  } finally {
    loading.value = false
  }
}

// 转换API数据为树形结构
const transformTreeData = (data: any[]): TreeData[] => {
  return data.map(item => ({
    key: item.id,
    title: item.name,
    type: item.type,
    path: item.path,
    children: item.children ? transformTreeData(item.children) : undefined
  }))
}

// 处理节点选择
const handleSelect = (selectedKeys: string[], data: { selected?: boolean; selectedNodes: TreeNodeData[] }) => {
  if (data.selected && data.selectedNodes.length > 0) {
    const node = data.selectedNodes[0] as TreeData
    if (node.type === 'file') {
      router.push(`/document/${node.key}`)
    }
  }
}

onMounted(() => {
  loadTreeData()
})
</script>

<style scoped>
.document-tree {
  height: 100%;
  overflow-y: auto;
  padding: 8px 0;
}

.tree-node {
  display: flex;
  align-items: center;
  padding: 4px 0;
}

.node-icon {
  margin-right: 8px;
  font-size: 16px;
  color: var(--color-text-2);
}

.node-title {
  font-size: 14px;
}

:deep(.arco-tree-node-title) {
  padding-left: 4px;
}

:deep(.arco-tree-node-selected .node-title) {
  color: rgb(var(--primary-6));
}

:deep(.arco-tree-node-selected .node-icon) {
  color: rgb(var(--primary-6));
}
</style>