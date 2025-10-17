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
      <!-- 自定义树节点图标和内容 -->
      <template #icon="{ node }">
        <img v-if="node.type === 'folder'" :src="folderIcon" class="tree-icon" alt="文件夹" />
        <img v-else :src="documentIcon" class="tree-icon" alt="文档" />
      </template>
    </a-tree>

    <!-- 空状态 -->
    <div v-else class="flex flex-col items-center justify-center p-8 text-gray-500">
      <div class="text-lg mb-2">暂无文档</div>
      <div class="text-sm">请先创建一些文档</div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
* @description 
*/
import { ref, onMounted, reactive, toRefs, computed, watch } from 'vue';
import { getDocumentTree, searchDocuments, loadChildNodes, transformToTreeData } from '@/api/docs'
// 导入图标
import folderIcon from '@/assets/文件夹.svg';
import documentIcon from '@/assets/文章.svg';

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

    // 通过API获取完整的文档信息
    try {
      const { getDocument } = await import('@/api/docs');
      const document = await getDocument(nodeKey);

      console.log('选中文档:', document);

      // 发射文档点击事件
      emit('document-click', document);
    } catch (error) {
      console.error('获取文档信息失败:', error);

      // 如果API调用失败，使用Tree节点的基本信息
      const fallbackDoc = {
        id: nodeKey,
        name: selectedNode.title,
        itemType: selectedNode.type === 'folder' ? 'folder' : 'document'
      };

      emit('document-click', fallbackDoc);
    }
  }
};

// 初始数据和状态
const rawData = ref<any[]>([])
const loading = ref(false)

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
    } else {
      console.log('文档树为空')
      rawData.value = []
    }
  } catch (error) {
    console.error('获取文档树失败:', error)
    rawData.value = []
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
    // 得加上错误提示
    console.log(error);
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
}

// 暴露方法给父组件使用
defineExpose({
  refresh: fetchDocuments,
  fetchDocuments,
  search: handleSearch,
  resetSearch
});

</script>

<style scoped>
/* 树节点图标样式 */
.tree-icon {
  width: 18px !important;
  height: 18px !important;
  margin-right: 6px;
  vertical-align: middle;
  flex-shrink: 0;
  object-fit: contain;
}

/* 确保树节点内容对齐 */
:deep(.arco-tree-node-title) {
  display: flex;
  align-items: center;
}
</style>