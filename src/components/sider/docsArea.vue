<template>
  <div class="docsContainer w-full h-full flex flex-col">
    <!-- 搜索 -->
    <a-input-search v-model="searchValue" aria-placeholder="搜索文档" allow-clear @search="handleSearch"
      :loading="loading" />

    <!-- 加载状态 -->
    <div v-if="loading" class="flex justify-center items-center p-4">
      <a-spin tip="加载中..." />
    </div>

    <!-- 文档树 -->
    <a-tree v-else-if="treeData.length > 0" ref="treeRef" v-model:expanded-keys="expandedKeys"
      v-model:selected-keys="selectedKeys" :data="treeData" :load-more="loadMore" :virtual-list-props="virtuallistProps"
      @expand="handleExpand" @select="handleNodeSelect" />

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
  if (!value.trim()) {
    // 如果搜索为空，重新获取所有文档
    await fetchDocuments()
    return
  }

  try {
    loading.value = true
    console.log('搜索关键词:', value)
    const searchResults = await searchDocuments(value)
    console.log('搜索结果:', searchResults)
    rawData.value = searchResults
  } catch (error) {
    console.error('搜索失败:', error)
    // 如果搜索API失败，使用本地过滤
    try {
      const tree = await getDocumentTree()
      const flatData = flattenTree(tree.map(transformToTreeData))
      rawData.value = flatData.filter(item => item.title.includes(value))
    } catch (filterError) {
      console.error('本地过滤也失败:', filterError)
      rawData.value = []
    }
  } finally {
    loading.value = false
  }
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
  height: 300, // 高度
  hreshold: 100, // 触发虚拟化的节点数量
  itStaticItemHeight: false, // 动态高度节点
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


// 搜索时自动展开匹配节点
watch(searchValue, (val) => {
  if (val) {
    expandedKeys.value = findMatchedKeys(rawData.value, val);
  }
})

// 查找匹配节点的key路径
const findMatchedKeys = (nodes, keyword) => {
  const keys = [];
  nodes.forEach(node => {
    if (node.title.includes(keyword)) {
      keys.push(node.key);
    }
    if (node.children) {
      keys.push(...findMatchedKeys(node.children, keyword));
    }
  })
  return keys;
}

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

</script>

<style scoped></style>