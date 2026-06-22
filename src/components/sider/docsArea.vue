<template>
  <div class="docsContainer w-full flex flex-col">
    <!-- 加载状态 -->
    <div v-if="loading" class="flex justify-center items-center p-4">
      <a-spin tip="加载中..." />
    </div>

    <!-- 文档树 -->
    <a-tree v-else-if="treeData.length > 0" ref="treeRef" v-model:expanded-keys="expandedKeys"
      v-model:selected-keys="selectedKeys" :data="treeData" :load-more="loadMore" @expand="handleExpand"
      @select="handleNodeSelect">
      <!-- 自定义树节点图标 -->
      <template #icon="{ node }">
        <img v-if="node.type === 'folder'" :src="folderIcon" class="tree-icon" alt="文件夹" />
        <img v-else :src="documentIcon" class="tree-icon" alt="文档" />
      </template>

      <!-- 自定义树节点内容 -->
      <template #title="nodeData">
        <div class="tree-node-content" :class="{ 'is-pinned': nodeData?.isPinned }">
          <span class="node-title" :title="nodeData?.title || nodeData?.name || '未命名'">
            {{ nodeData?.title || nodeData?.name || '未命名' }}
          </span>
          <div class="node-actions">
            <!-- 置顶按钮 -->
            <a-button type="text" size="mini" class="action-btn pin-btn" :class="{ 'pinned': nodeData?.isPinned }"
              :loading="pinningNodes.has(nodeData?.key)" :disabled="pinningNodes.has(nodeData?.key)"
              @click.stop="handlePinToggle(nodeData)" :title="nodeData?.isPinned ? '取消置顶' : '置顶'">
              📌
            </a-button>

            <!-- 更多操作下拉菜单 -->
            <a-dropdown trigger="hover" position="br">
              <a-button type="text" size="mini" class="action-btn more-btn" @click.stop>
                ⋯
              </a-button>
              <template #content>
                <a-doption @click="handleRename(nodeData)">
                  <icon-edit /> 重命名
                </a-doption>
                <a-doption @click="handleMove(nodeData)">
                  <icon-folder /> 移动到
                </a-doption>
                <a-doption @click="handleDelete(nodeData)" class="danger-option">
                  <icon-delete /> 删除
                </a-doption>
              </template>
            </a-dropdown>
          </div>
        </div>
      </template>
    </a-tree>

    <!-- 空状态 -->
    <div v-else class="flex flex-col items-center justify-center p-8 text-gray-500">
      <div class="text-lg mb-2">暂无文档</div>
      <div class="text-sm">请先创建一些文档</div>
    </div>

    <!-- 重命名弹窗 -->
    <RenameDiodig ref="renameDialogRef" @success="fetchDocuments" />

    <!-- 移动弹窗 -->
    <RemoveDiodig ref="moveDialogRef" @success="fetchDocuments" />
  </div>
</template>

<script setup lang="ts">
/**
* @description 
*/
import { ref, onMounted, reactive, toRefs, computed, watch } from 'vue';
import { getDocumentTree, searchDocuments, loadChildNodes, transformToTreeData, toggleDocumentPin, deleteDocument } from '@/api/docs'
import { Modal, Message } from '@arco-design/web-vue';
import { IconEdit, IconFolder, IconDelete } from '@arco-design/web-vue/es/icon';
// 导入图标
import folderIcon from '@/assets/文件夹.svg';
import documentIcon from '@/assets/文章.svg';
// 导入弹窗组件
import RenameDiodig from './diolog/RenameDiodig.vue';
import RemoveDiodig from './diolog/RemoveDiodig.vue';

// 定义组件发射的事件
const emit = defineEmits<{
  'document-click': [doc: any]
}>();


interface State {
  searchValue: string
  expandedKeys: string[]
  selectedKeys: string[]
}

const state = reactive<State>({
  searchValue: '',
  expandedKeys: [],
  selectedKeys: [],
});

const {
  searchValue,
  expandedKeys,
  selectedKeys,
} = toRefs(state);

const handleSearch = async (value: string) => {
  // 更新搜索值
  searchValue.value = value;

  if (!value.trim()) {
    // 如果搜索为空，重新获取所有文档
    await fetchDocuments()
    // 清空展开的节点
    expandedKeys.value = [];
    return
  }

  try {
    loading.value = true
    console.log('搜索关键词:', value)

    // 先获取完整的文档树
    const allDocuments = await getDocumentTree()
    console.log('完整文档树:', allDocuments)

    // 将完整树数据转换格式
    const fullTreeData = allDocuments.map(transformToTreeData)
    console.log('转换后的完整树数据:', fullTreeData)

    // 使用本地过滤来保持完整的层次结构
    rawData.value = fullTreeData

    // 搜索完成后，自动展开所有包含搜索结果的父节点路径
    setTimeout(() => {
      const keysToExpand = findParentKeysForMatches(fullTreeData, value);
      console.log('搜索关键词:', value);
      console.log('搜索结果数据:', fullTreeData);
      console.log('需要展开的节点keys:', keysToExpand);
      expandedKeys.value = keysToExpand;
      console.log('当前展开的节点:', expandedKeys.value);
    }, 200); // 增加等待时间，确保树组件完全渲染
  } catch (error) {
    console.error('搜索失败:', error)
    // 如果搜索API失败，使用本地过滤
    try {
      const tree = await getDocumentTree()
      const flatData = flattenTree(tree.map(transformToTreeData))
      rawData.value = flatData.filter(item => item.title.includes(value))

      // 本地过滤后也要展开匹配节点的父路径
      setTimeout(() => {
        const keysToExpand = findParentKeysForMatches(rawData.value, value);
        console.log('本地过滤结果数据:', rawData.value);
        console.log('本地过滤需要展开的节点keys:', keysToExpand);
        expandedKeys.value = keysToExpand;
      }, 200);

    } catch (filterError) {
      console.error('本地过滤也失败:', filterError)
      rawData.value = []
      expandedKeys.value = [];
    }
  } finally {
    loading.value = false
  }
};

// 重置搜索
const resetSearch = async () => {
  searchValue.value = '';
  expandedKeys.value = []; // 重置展开状态
  await fetchDocuments();
};

const handleExpand = (keys: string[]) => {
  console.log('展开的节点：', keys);
};

// 处理节点选择事件
const handleNodeSelect = async (selectedKeys: string[], info: any) => {
  console.log('选择的节点:', selectedKeys, info);

  if (selectedKeys.length > 0) {
    const nodeKey = selectedKeys[0];
    const selectedNode = info.node;

    // 只发射树节点已有的基本信息(id/name/itemType)——下游(打开标签/路由)仅需这些;
    // 文档全文由 EditorArea 打开时单独获取,这里无需再 getDocument 拉一份全文(避免双重请求)。
    emit('document-click', {
      id: nodeKey,
      name: selectedNode.title,
      itemType: selectedNode.type === 'folder' ? 'folder' : 'document',
    });
  }
};

// 初始数据和状态
const rawData = ref<any[]>([])
const loading = ref(false)

// 记录正在置顶操作的节点
const pinningNodes = ref<Set<string>>(new Set());

// 获取文档树数据
const fetchDocuments = async () => {
  try {
    loading.value = true
    console.log('正在获取文档树...')

    const tree = await getDocumentTree()
    console.log('获取到的文档树数据:', tree)

    if (Array.isArray(tree) && tree.length > 0) {
      // 将API返回的树数据转换为组件需要的格式
      rawData.value = tree.map(transformToTreeData)
      // console.log('获取到的文档树数据:', treeData.value)
    } else {
      console.log('文档树为空')
      rawData.value = []
    }
  } catch (error) {
    console.error('获取文档树失败:', error)
    rawData.value = []
    // 给出明确错误提示,避免加载失败被误显示为"暂无文档"的空状态
    Message.error('加载文档列表失败,请稍后重试')
  } finally {
    loading.value = false
  }
}

// 组件挂载时获取数据
onMounted(() => {
  console.log('docsArea组件已挂载，开始获取数据')
  fetchDocuments()
})

// 虚拟列表配置
const virtuallistProps = {
  // 移除固定高度，让树组件自适应内容高度
  threshold: 100, // 触发虚拟化的节点数量
  isStaticItemHeight: false, // 动态高度节点
};

const loadMore = async (node) => {
  try {
    const children = await loadChildNodes(node.key);
    node.children = children;
    return children;
  }
  catch (error) {
    console.error('展开子目录失败:', error);
    Message.error('展开文件夹失败,请稍后重试');
    return [];
  }
}

// 搜索过滤后的树数据
const treeData = computed(() => {
  if (!searchValue.value) {
    return rawData.value;
  }
  return filterTree(rawData.value, searchValue.value);
})

// 树节点过滤算法
const filterTree = (nodes, keyword) => {
  return nodes.filter(node => {
    // 当前节点匹配
    const isMatch = node.title.includes(keyword)
    // 递归过滤子节点
    if (node.children) {
      node.children = filterTree(node.children, keyword);
      return isMatch || node.children.length > 0;
    }
    return isMatch;
  })
}

// 将树形结构展平为一维数组
const flattenTree = (nodes) => {
  const result = [];
  const traverse = (nodeList) => {
    nodeList.forEach(node => {
      result.push(node);
      if (node.children) {
        traverse(node.children);
      }
    });
  };
  traverse(nodes);
  return result;
}

// 查找包含匹配节点的所有父节点路径
const findParentKeysForMatches = (nodes: any[], keyword: string): string[] => {
  const parentKeys = new Set<string>();

  // 递归函数，返回当前节点路径上是否包含匹配项
  const traverseNode = (node: any, parentPath: string[] = []): boolean => {
    const currentPath = [...parentPath, node.key];
    let hasMatchInSubtree = false;

    // 检查当前节点是否匹配 - 修复：使用正确的字段名
    if (node.title && node.title.includes(keyword)) {
      hasMatchInSubtree = true;
      console.log(`匹配节点: ${node.title}, key: ${node.key}, 父路径:`, parentPath);
      // 将当前路径上的所有父节点添加到展开列表
      parentPath.forEach(parentKey => parentKeys.add(parentKey));
    }

    // 递归检查子节点
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach((child: any) => {
        if (traverseNode(child, currentPath)) {
          hasMatchInSubtree = true;
        }
      });
    }

    // 如果子树中有匹配项，展开当前节点
    if (hasMatchInSubtree && node.children && node.children.length > 0) {
      console.log(`展开父节点: ${node.title}, key: ${node.key}`);
      parentKeys.add(node.key);
    }

    return hasMatchInSubtree;
  };

  // 遍历所有根节点
  nodes.forEach(node => traverseNode(node));

  console.log('最终展开的节点keys:', Array.from(parentKeys));
  return Array.from(parentKeys);
};

const fetchChildren = async (parentKey) => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve([
        { key: `${parentKey}-1`, title: `子文档${parentKey}-1` },
        { key: `${parentKey}-2`, title: `子文档${parentKey}-2` },
      ]);
    }, 1000);
  })
};

// 处理置顶切换
const handlePinToggle = async (node: any) => {
  try {
    const docId = parseInt(node.key);

    // 防止重复点击
    if (pinningNodes.value.has(node.key)) {
      return;
    }

    // sortOrder < 0 表示已置顶，>= 0 表示未置顶
    const isCurrentlyPinned = (node.sortOrder !== undefined && node.sortOrder < 0) || node.isPinned;

    console.log('[置顶] 准备置顶文档:', {
      docId,
      node,
      title: node.title,
      key: node.key,
      isPinned: node.isPinned,
      sortOrder: node.sortOrder,
      isCurrentlyPinned,
      willSetTo: !isCurrentlyPinned
    });

    // 添加到加载集合
    pinningNodes.value.add(node.key);

    // 如果当前是置顶状态，传 false 取消置顶
    // 如果当前未置顶，传 true 进行置顶
    const result = await toggleDocumentPin(docId, !isCurrentlyPinned);
    console.log('[置顶] 置顶成功:', result);

    Message.success(isCurrentlyPinned ? '已取消置顶' : '已置顶');
    // 刷新文档树
    await fetchDocuments();
  } catch (error: any) {
    console.error('[置顶] 置顶操作失败:', error);
    // 显示具体的错误信息
    const errorMessage = error?.message || '操作失败，请重试';
    Message.error(errorMessage);
  } finally {
    // 从加载集合移除
    pinningNodes.value.delete(node.key);
  }
};

// 弹窗组件引用
const renameDialogRef = ref();
const moveDialogRef = ref();

// 处理重命名
const handleRename = (node: any) => {
  const itemType = node.type === 'folder' ? 'folder' : 'document';
  renameDialogRef.value?.openDialog({
    id: parseInt(node.key),
    name: node.title,
    type: itemType
  });
};

// 处理移动
const handleMove = (node: any) => {
  const itemType = node.type === 'folder' ? 'folder' : 'document';
  moveDialogRef.value?.openDialog({
    id: parseInt(node.key),
    name: node.title,
    type: itemType
  });
};

// 处理删除
const handleDelete = async (node: any) => {
  const itemType = node.type === 'folder' ? '文件夹' : '文档';
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除${itemType}"${node.title}"吗？此操作不可恢复。`,
    okText: '确认删除',
    cancelText: '取消',
    okButtonProps: {
      status: 'danger'
    },
    onOk: async () => {
      try {
        const docId = parseInt(node.key);
        await deleteDocument(docId);
        Message.success('删除成功');
        await fetchDocuments();
      } catch (error: any) {
        console.error('删除失败:', error);
        const errorMessage = error?.message || '删除失败，请重试';
        Message.error(errorMessage);
      }
    }
  });
};

// 暴露方法给父组件使用
defineExpose({
  refresh: fetchDocuments,
  fetchDocuments,
  search: handleSearch,
  resetSearch
});

</script>

<style scoped>
/* 文档树容器 */
.docsContainer {
  overflow-x: hidden;
  /* 隐藏横向滚动条 */
  overflow-y: auto;
  /* 保留纵向滚动 */
}

/* 树节点图标样式 */
.tree-icon {
  width: 18px !important;
  height: 18px !important;
  margin-right: 6px;
  vertical-align: middle;
  flex-shrink: 0;
  object-fit: contain;
}

/* 确保树节点内容对齐和选中态占满一行 */
:deep(.arco-tree-node-title) {
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 100%;
  flex: 1;
  overflow: hidden;
}

:deep(.arco-tree-node-title-text) {
  flex: 1;
  overflow: hidden;
  min-width: 0;
}

/* 确保整个树组件不会横向滚动 */
:deep(.arco-tree) {
  overflow-x: hidden;
}

:deep(.arco-tree-node) {
  max-width: 100%;
  overflow: hidden;
}

/* 选中态样式优化 */
:deep(.arco-tree-node-selected) {
  width: 100%;
}

:deep(.arco-tree-node-selected .arco-tree-node-title) {
  width: 100%;
}

/* 树节点内容容器 */
.tree-node-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 100%;
  /* 防止超出容器 */
  padding: 2px 4px;
  border-radius: 4px;
  transition: background-color 0.2s;
  overflow: hidden;
  /* 防止内容溢出 */
}

/* 置顶文档样式 */
.tree-node-content.is-pinned {
  background-color: rgba(59, 130, 246, 0.08);
}

.tree-node-content:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.tree-node-content.is-pinned:hover {
  background-color: rgba(59, 130, 246, 0.12);
}

/* 节点标题 */
.node-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  /* 确保 flex 子项可以正确收缩 */
  max-width: 100%;
  /* 限制最大宽度 */
  color: var(--color-text-1);
  font-size: 14px;
  word-break: break-all;
  /* 如果需要换行时从单词中间断开 */
}

/* 操作按钮容器 */
.node-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  opacity: 0;
  flex-shrink: 0;
  /* 防止操作按钮被压缩 */
  transition: opacity 0.2s;
}

.tree-node-content:hover .node-actions {
  opacity: 1;
}

/* 操作按钮基础样式 */
.action-btn {
  padding: 2px 6px !important;
  min-width: 24px !important;
  height: 24px !important;
  font-size: 14px;
  border: none !important;
  background: transparent !important;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(0, 0, 0, 0.06) !important;
}

/* 置顶按钮 */
.pin-btn {
  filter: grayscale(100%);
  opacity: 0.5;
}

.pin-btn.pinned {
  filter: grayscale(0%);
  opacity: 1;
}

.pin-btn:hover {
  transform: scale(1.1);
}

/* 更多按钮 */
.more-btn {
  font-weight: bold;
}

/* 下拉菜单危险项 */
:deep(.danger-option) {
  color: rgb(var(--danger-6));
}

:deep(.danger-option:hover) {
  background-color: rgb(var(--danger-1));
  color: rgb(var(--danger-6));
}

/* 移动文档对话框样式 */
:deep(.move-document-modal) {
  #tree-select-container {
    min-height: 40px;
  }

  #folder-select {
    font-size: 14px;
    cursor: pointer;
  }

  #folder-select option {
    padding: 8px;
  }
}
</style>