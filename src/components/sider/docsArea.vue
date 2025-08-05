<template>
  <div class="docsContainer w-full h-full flex flex-col">
    <!-- 搜索 -->
    <a-input-search v-model="searchValue" aria-placeholder="搜索文档" allow-clear @search="handleSearch" />
    <!-- 文档树 -->
    <a-tree ref="treeRef" v-model:expanded-keys="expandedKeys" v-model:selected-keys="selectedKeys" :data="treeData"
      :load-more="loadMore" :virtual-list-props="virtuallistProps" @expand="handleExpand" />
  </div>
</template>

<script setup lang="ts">
/**
* @description 
*/
import { ref, onMounted, reactive, toRefs, computed, watch } from 'vue';
import { getDocumentTree, searchDocuments, loadChildNodes } from '@/api/docs'


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

const handleSearch = (value: string) => {
  console.log(value);
};

const handleExpand = (keys: string[]) => {
  console.log('展开的节点：', keys);
};

// 初始假数据
const rawData = ref([
  { key: '1', title: '文档1', children: [{ key: '1-1', title: '子文档1-1' }, { key: '1-2', title: '子文档1-2' }] },
  { key: '2', title: '文档2', children: [{ key: '2-1', title: '子文档2-1' }] },
])

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