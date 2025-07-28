<template>
  <teleport to='body'>
    <a-modal class="addDocsContainer" v-model:visible="visible" :width="800" :title="title">
      <div class="w-full h-full flex flex-col gap-[20px]">
        <!-- 名称输入 -->
        <div class="w-full h-[50px] flex items-center">
          <div class="w-[150px]">请输入{{ props.selected }}名称</div>
          <div class="flex-1">
            <a-input v-model:value="name" placeholder="请输入名称" />
          </div>
        </div>
        
        <!-- 树形目录选择 -->
        <div class="w-full flex flex-col gap-[10px]">
          <div class="text-sm font-medium">请选择{{ props.selected }}目录：</div>
          <div class="border border-gray-200 rounded-lg p-4 max-h-[400px] overflow-auto">
            <a-tree
              v-model:selected-keys="selectedKeys"
              :data="treeData"
              :load-data="loadData"
              :show-line="true"
              :block-node="true"
              @select="onDirectorySelect"
            >
              <template #title="{ title, isLeaf, loading }">
                <div class="flex items-center gap-2">
                  <icon-folder v-if="!isLeaf" />
                  <icon-file v-else />
                  <span>{{ title }}</span>
                  <a-spin v-if="loading" :size="12" />
                </div>
              </template>
            </a-tree>
          </div>
          <div v-if="selectedDirectoryPath" class="text-sm text-gray-500">
            已选择：{{ selectedDirectoryPath }}
          </div>
        </div>
      </div>
      
      <template #footer>
        <div class="flex justify-end gap-2">
          <a-button @click="closeDialog">取消</a-button>
          <a-button 
            type="primary" 
            @click="handleConfirm" 
            :disabled="!name || !selectedDirectory"
          >
            确定
          </a-button>
        </div>
      </template>
    </a-modal>
  </teleport>
</template>

<script setup lang="ts">
import { ref, reactive, toRefs, computed } from 'vue';
import { IconFolder, IconFile } from '@arco-design/web-vue/es/icon';

const props = defineProps<{
  selected: string;
  title?: string;
}>();

interface State {
  title: string;
  visible: boolean;
  name: string;
  selectedDirectory: string;
}

const state = reactive<State>({
  title: `添加${props.selected}`,
  visible: false,
  name: '',
  selectedDirectory: ''
});

const { title, visible, name, selectedDirectory } = toRefs(state);

const selectedKeys = ref<string[]>([]);
const treeData = ref<TreeNode[]>([]);

// 🎯 简单缓存实现
const cache = new Map<string, {
  data: DirectoryItem[];
  timestamp: number;
  expireTime: number;
}>();

const CACHE_EXPIRE_TIME = 5 * 60 * 1000; // 5分钟过期

// 获取缓存键
const getCacheKey = (parentId: string | null): string => {
  return parentId || 'root';
};

// 检查缓存是否有效
const isCacheValid = (cacheKey: string): boolean => {
  const cached = cache.get(cacheKey);
  if (!cached) return false;
  return Date.now() < cached.expireTime;
};

// 获取缓存数据
const getCachedData = (cacheKey: string): DirectoryItem[] | null => {
  if (!isCacheValid(cacheKey)) {
    cache.delete(cacheKey); // 清除过期缓存
    return null;
  }
  return cache.get(cacheKey)?.data || null;
};

// 设置缓存
const setCacheData = (cacheKey: string, data: DirectoryItem[]): void => {
  cache.set(cacheKey, {
    data: [...data], // 复制数组避免引用问题
    timestamp: Date.now(),
    expireTime: Date.now() + CACHE_EXPIRE_TIME
  });
};

// 模拟 API 数据
const getMockData = (parentId: string | null): DirectoryItem[] => {
  const mockData: { [key: string]: DirectoryItem[] } = {
    'root': [
      { id: '1', name: '项目文档', type: 'folder', parentId: null, path: '/项目文档', hasChildren: true },
      { id: '2', name: '技术文档', type: 'folder', parentId: null, path: '/技术文档', hasChildren: true },
      { id: '3', name: '用户手册', type: 'folder', parentId: null, path: '/用户手册', hasChildren: false }
    ],
    '1': [
      { id: '1-1', name: '需求文档', type: 'folder', parentId: '1', path: '/项目文档/需求文档', hasChildren: true },
      { id: '1-2', name: '设计文档', type: 'folder', parentId: '1', path: '/项目文档/设计文档', hasChildren: false }
    ],
    '2': [
      { id: '2-1', name: 'API文档', type: 'folder', parentId: '2', path: '/技术文档/API文档', hasChildren: false },
      { id: '2-2', name: '开发指南', type: 'folder', parentId: '2', path: '/技术文档/开发指南', hasChildren: false }
    ],
    '1-1': [
      { id: '1-1-1', name: '用户需求.md', type: 'file', parentId: '1-1', path: '/项目文档/需求文档/用户需求.md', hasChildren: false },
      { id: '1-1-2', name: '系统需求.md', type: 'file', parentId: '1-1', path: '/项目文档/需求文档/系统需求.md', hasChildren: false }
    ]
  };
  
  return mockData[parentId || 'root'] || [];
};

// 带缓存的数据获取函数
const fetchDirectoryData = async (parentId: string | null = null): Promise<DirectoryItem[]> => {
  const cacheKey = getCacheKey(parentId);
  
  // 先检查缓存
  const cachedData = getCachedData(cacheKey);
  if (cachedData) {
    console.log(`✅ 缓存命中: ${cacheKey}`);
    return cachedData;
  }
  
  try {
    console.log(`🌐 从服务器加载: ${cacheKey}`);
    
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 这里替换为你的实际 API 调用
    // const response = await fetch(`/api/directories?parentId=${parentId || 'root'}`);
    // if (!response.ok) throw new Error('Failed to fetch directory data');
    // const result = await response.json();
    // const data = result.data || [];
    
    // 目前使用模拟数据
    const data = getMockData(parentId);
    
    // 存入缓存
    setCacheData(cacheKey, data);
    
    return data;
  } catch (error) {
    console.error('获取目录数据失败:', error);
    // 出错时也可以使用模拟数据
    const fallbackData = getMockData(parentId);
    setCacheData(cacheKey, fallbackData);
    return fallbackData;
  }
};

// 将 API 数据转换为树节点
const convertToTreeNode = (item: DirectoryItem): TreeNode => ({
  key: item.id,
  title: item.name,
  isLeaf: !item.hasChildren,
  path: item.path,
  children: item.hasChildren ? [] : undefined
});

// 动态加载数据
const loadData = async (node?: TreeNode): Promise<void> => {
  try {
    const parentId = node ? node.key : null;
    
    if (node) {
      node.loading = true;
    }
    
    // 使用缓存的数据获取
    const directoryItems = await fetchDirectoryData(parentId);
    const childNodes = directoryItems.map(convertToTreeNode);
    
    if (node) {
      node.children = childNodes;
      node.loading = false;
    } else {
      treeData.value = childNodes;
    }
  } catch (error) {
    console.error('加载目录数据失败:', error);
    if (node) {
      node.loading = false;
    }
  }
};

// 计算选中目录的完整路径
const selectedDirectoryPath = computed(() => {
  if (!selectedDirectory.value) return '';
  
  const findNodePath = (nodes: TreeNode[], key: string): string => {
    for (const node of nodes) {
      if (node.key === key) {
        return node.path || node.title;
      }
      if (node.children) {
        const childPath = findNodePath(node.children, key);
        if (childPath) return childPath;
      }
    }
    return '';
  };
  
  return findNodePath(treeData.value, selectedDirectory.value);
});

// 处理目录选择
const onDirectorySelect = (selectedKeysValue: string[]) => {
  if (selectedKeysValue.length > 0) {
    selectedDirectory.value = selectedKeysValue[0];
  } else {
    selectedDirectory.value = '';
  }
};

// 确认创建
const handleConfirm = () => {
  console.log('创建文档:', {
    name: name.value,
    type: props.selected,
    directory: selectedDirectory.value,
    path: selectedDirectoryPath.value
  });
  closeDialog();
};

// 打开弹窗
const openDialog = async () => {
  visible.value = true;
  await loadData(); // 加载根目录
};

// 关闭弹窗
const closeDialog = () => {
  visible.value = false;
  name.value = '';
  selectedDirectory.value = '';
  selectedKeys.value = [];
  treeData.value = [];
};

// 清除缓存（可选功能）
const clearCache = (parentId?: string | null) => {
  if (parentId !== undefined) {
    const cacheKey = getCacheKey(parentId);
    cache.delete(cacheKey);
    console.log(`🗑️ 清除缓存: ${cacheKey}`);
  } else {
    cache.clear();
    console.log('🗑️ 清除所有缓存');
  }
};

defineExpose({
  visible,
  openDialog,
  closeDialog,
  clearCache
});
</script>

<style scoped>
.addDocsContainer :deep(.arco-tree-node-title) {
  display: flex;
  align-items: center;
  gap: 4px;
}

.addDocsContainer :deep(.arco-tree-node-selected .arco-tree-node-title) {
  background-color: #e6f7ff;
  border-radius: 4px;
}
</style>