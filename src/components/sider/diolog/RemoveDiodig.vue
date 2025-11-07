<template>
  <teleport to="body">
    <a-modal class="move-dialog-container" v-model:visible="visible" :title="modalTitle" :width="600">
      <div class="w-full h-full flex flex-col gap-[20px]">
        <!-- 当前项信息 -->
        <div class="current-item-info">
          <icon-file v-if="currentItem?.type === 'document'" class="item-icon" />
          <icon-folder v-else class="item-icon folder" />
          <span class="item-name">{{ currentItem?.name }}</span>
        </div>

        <!-- 树形目录选择 -->
        <div>
          <div class="mb-2 text-sm font-medium text-gray-700">选择目标位置</div>
          <a-tree-select v-model:value="selectedDirectory" :data="treeData" :allow-search="true" :allow-clear="true"
            :load-more="loadMore" placeholder="请选择文件夹（留空表示移到根目录）" style="width: 100%" :loading="loading"
            :disable-filter="true" @search="onSearch" @change="onDirectoryChange">
            <template #prefix="{ data }">
              <IconFolder v-if="data" />
            </template>
          </a-tree-select>
        </div>

        <!-- 选中路径显示 -->
        <div v-if="selectedPath" class="selected-path">
          <icon-location /> 目标路径: {{ selectedPath }}
        </div>

        <!-- 提示信息 -->
        <div class="tip-text">
          <icon-info-circle /> 不能移动到自身或其子文件夹中
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <a-button @click="closeDialog">取消</a-button>
          <a-button type="primary" :loading="movingItem" @click="handleConfirm">
            {{ movingItem ? '移动中...' : '确定' }}
          </a-button>
        </div>
      </template>
    </a-modal>
  </teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { IconFolder, IconFile, IconLocation, IconInfoCircle } from '@arco-design/web-vue/es/icon';
import { Message } from '@arco-design/web-vue';
import { getDocumentTree, moveDocument, moveFolder, getFolderPath, getFolderContents } from '@/api/docs';

interface TreeNode {
  key: string;
  title: string;
  children?: TreeNode[];
  isLeaf?: boolean;
  parentId?: string | null;
}

interface MoveData {
  id: number;
  name: string;
  type: 'folder' | 'document';
}

// 定义事件
const emit = defineEmits(['success']);

const visible = ref(false);
const selectedDirectory = ref('');
const loading = ref(false);
const movingItem = ref(false);
const currentItem = ref<MoveData | null>(null);

// 树形数据
const treeData = ref<TreeNode[]>([]);
const searchKeyword = ref('');
const selectedPath = ref('');

const modalTitle = computed(() => {
  if (!currentItem.value) return '移动';
  return currentItem.value.type === 'folder' ? '移动文件夹' : '移动文档';
});

// 获取并更新选中路径
const updateSelectedPath = async (folderId: string) => {
  if (!folderId) {
    selectedPath.value = '';
    return;
  }

  try {
    const pathData = await getFolderPath(folderId);
    const pathNames = pathData.breadcrumbs.map(item => item.name);
    selectedPath.value = pathNames.join(' / ');
  } catch (error) {
    console.error('获取文件夹路径失败:', error);
    selectedPath.value = '路径获取失败';
  }
};

// 加载根目录数据
const loadRootData = async () => {
  try {
    loading.value = true;
    const response = await getDocumentTree();
    console.log('[移动弹窗] 获取到的文档树数据:', response);

    if (response && Array.isArray(response)) {
      // 格式化数据，排除当前要移动的项
      treeData.value = formatTreeData(response, currentItem.value?.id);
    } else {
      console.error('[移动弹窗] 文档树数据格式不正确:', response);
      treeData.value = [];
    }
  } catch (error) {
    console.error('[移动弹窗] 加载目录树失败:', error);
    Message.error('加载目录树失败');
    treeData.value = [];
  } finally {
    loading.value = false;
  }
};

// 格式化树形数据（复用 addDocs 的逻辑）
const formatTreeData = (data: any[], excludeId?: number): TreeNode[] => {
  if (!Array.isArray(data)) {
    console.warn('[移动弹窗] formatTreeData接收到非数组数据:', data);
    return [];
  }

  return data
    .filter(item => {
      // 只保留文件夹类型的项目，过滤掉文档
      if (!item || item.itemType !== 'folder') {
        return false;
      }
      // 排除当前要移动的项
      if (excludeId && item.id === excludeId) {
        console.log('[移动弹窗] 排除当前项:', item.name, item.id);
        return false;
      }
      return true;
    })
    .map(item => {
      if (!item || typeof item !== 'object') {
        console.warn('[移动弹窗] formatTreeData发现无效项:', item);
        return null;
      }

      return {
        key: item.id ? item.id.toString() : Math.random().toString(),
        title: item.name || '未知',
        isLeaf: false,
        parentId: item.parentId || null,
        children: item.children ? formatTreeData(item.children, excludeId) : undefined
      };
    })
    .filter(Boolean) as TreeNode[];
};

// 动态加载子节点（复用 addDocs 的逻辑）
const loadMore = async (node: TreeNode) => {
  try {
    console.log('[移动弹窗] 动态加载节点:', node);
    if (node.isLeaf) return;

    const response = await getFolderContents(node.key);
    console.log('[移动弹窗] 获取文件夹内容:', response);

    // 只加载文件夹，排除当前要移动的项
    const children = formatTreeData(response.folders || [], currentItem.value?.id);
    node.children = children;

    console.log('[移动弹窗] 加载子节点成功:', children);
  } catch (error) {
    console.error('[移动弹窗] 加载子节点失败:', error);
    Message.error('加载子节点失败');
  }
};

// 搜索功能（复用 addDocs 的逻辑）
const onSearch = async (keyword: string) => {
  searchKeyword.value = keyword;

  if (!keyword.trim()) {
    // 如果搜索关键词为空，重新加载根数据
    await loadRootData();
    return;
  }

  try {
    loading.value = true;

    // 获取完整树结构
    const response = await getDocumentTree();
    const fullTree = formatTreeData(response);

    // 客户端搜索过滤
    const filterTreeNodes = (nodes: TreeNode[], keyword: string): TreeNode[] => {
      const filtered: TreeNode[] = [];

      for (const node of nodes) {
        const matchesKeyword = node.title.toLowerCase().includes(keyword.toLowerCase());
        const filteredChildren = node.children ? filterTreeNodes(node.children, keyword) : [];

        if (matchesKeyword || filteredChildren.length > 0) {
          filtered.push({
            ...node,
            children: filteredChildren.length > 0 ? filteredChildren : node.children
          });
        }
      }

      return filtered;
    };

    treeData.value = filterTreeNodes(fullTree, keyword);
    console.log('11111111', treeData.value);
  } catch (error) {
    console.error('搜索失败:', error);
    Message.error('搜索失败');
  } finally {
    loading.value = false;
  }
};

// 目录选择变化
const onDirectoryChange = async (value: string) => {
  selectedDirectory.value = value;
  console.log('选中目录:', value);

  // 异步获取路径信息
  if (value) {
    await updateSelectedPath(value);
    console.log('选中路径:', selectedPath.value);
  } else {
    selectedPath.value = '';
  }
};

// 确认移动
const handleConfirm = async () => {
  try {
    movingItem.value = true;
    const targetFolderId = selectedDirectory.value ? parseInt(selectedDirectory.value) : null;

    // 根据类型调用不同的 API
    if (currentItem.value!.type === 'folder') {
      await moveFolder(currentItem.value!.id, targetFolderId);
    } else {
      await moveDocument(currentItem.value!.id, targetFolderId);
    }
    
    Message.success('移动成功');
    emit('success');
    closeDialog();
  } catch (error: any) {
    console.error('[移动弹窗] 移动失败:', error);
    const errorMessage = error?.message || '移动失败，请重试';
    Message.error(errorMessage);
  } finally {
    movingItem.value = false;
  }
};

// 打开弹窗
const openDialog = async (data: MoveData) => {
  currentItem.value = data;
  selectedDirectory.value = '';
  selectedPath.value = '';
  searchKeyword.value = '';
  visible.value = true;

  // 打开时加载根目录数据
  await loadRootData();
};

// 关闭弹窗
const closeDialog = () => {
  visible.value = false;
  selectedDirectory.value = '';
  selectedPath.value = '';
  searchKeyword.value = '';
  treeData.value = [];
  currentItem.value = null;
};

defineExpose({
  visible,
  openDialog,
  closeDialog
});
</script>

<style scoped>
.current-item-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
  border-radius: 8px;
}

.item-icon {
  font-size: 20px;
  color: #f5576c;
}

.item-icon.folder {
  color: #f5a623;
}

.item-name {
  font-size: 15px;
  font-weight: 500;
  color: #1d2129;
}

.selected-path {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #4e5969;
  padding: 10px 14px;
  background: #f2f3f5;
  border-radius: 6px;
  border-left: 3px solid #f5576c;
}

.tip-text {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #86909c;
  padding: 8px 12px;
  background: #fff7e6;
  border-radius: 6px;
  border-left: 3px solid #ff7d00;
}

/* 复用 addDocs 的样式 */
.move-dialog-container :deep(.arco-modal) {
  border-radius: 12px;
  overflow: hidden;
}

.move-dialog-container :deep(.arco-modal-header) {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  padding: 20px 24px;
  border-bottom: none;
}

.move-dialog-container :deep(.arco-modal-title) {
  color: white;
  font-size: 18px;
  font-weight: 600;
}

.move-dialog-container :deep(.arco-modal-close-icon) {
  color: white;
}

.move-dialog-container :deep(.arco-modal-body) {
  padding: 24px;
}

.move-dialog-container :deep(.arco-tree-select) {
  border-radius: 8px;
}

.move-dialog-container :deep(.arco-select-view) {
  border-radius: 8px;
  border: 1px solid #e5e6eb;
  transition: all 0.3s;
}

.move-dialog-container :deep(.arco-select-view:hover) {
  border-color: #f5576c;
}

.move-dialog-container :deep(.arco-select-focused .arco-select-view) {
  border-color: #f5576c;
  box-shadow: 0 0 0 3px rgba(245, 87, 108, 0.1);
}

.move-dialog-container :deep(.arco-tree-node-title) {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.move-dialog-container :deep(.arco-tree-node-selected .arco-tree-node-title) {
  background-color: rgba(245, 87, 108, 0.1);
}

.move-dialog-container :deep(.arco-tree-node-title:hover) {
  background-color: #f2f3f5;
}

.move-dialog-container :deep(.arco-modal-footer) {
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
}

.move-dialog-container :deep(.arco-btn-primary) {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  border: none;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s;
}

.move-dialog-container :deep(.arco-btn-primary:hover:not(:disabled)) {
  background: linear-gradient(135deg, #e082ea 0%, #e4465b 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(245, 87, 108, 0.3);
}

.move-dialog-container :deep(.arco-btn-primary:disabled) {
  background: #c9cdd4;
  cursor: not-allowed;
}

.move-dialog-container :deep(.arco-btn-secondary) {
  border-radius: 8px;
  transition: all 0.3s;
}

.move-dialog-container :deep(.arco-btn-secondary:hover) {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>
