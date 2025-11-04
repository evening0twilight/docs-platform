<template>
  <teleport to='body'>
    <a-modal class="addDocsContainer" v-model:visible="visible" :width="800" :title="`添加${props.selected}`">
      <div class="w-full h-full flex flex-col gap-[20px]">
        <!-- 名称输入 -->
        <div class="w-full h-[50px] flex items-center">
          <div class="w-[150px]">请输入{{ props.selected }}名称</div>
          <div class="flex-1">
            <a-input v-model="name" placeholder="请输入名称" />
          </div>
        </div>

        <!-- 树形目录选择 -->
        <div>
          <div class="mb-2 text-sm text-gray-600">选择父级目录（可选）</div>
          <a-tree-select v-model:value="selectedDirectory" :data="treeData" :allow-search="true" :allow-clear="true"
            :load-more="loadMore" placeholder="请选择目录（不选择则为根目录）" style="width: 100%" :loading="loading"
            :disable-filter="true" @search="onSearch" @change="onDirectoryChange">
            <template #prefix="{ data }">
              <IconFolder v-if="data" />
            </template>
          </a-tree-select>
        </div>

        <!-- 选中路径显示 -->
        <div v-if="selectedPath" class="text-sm text-gray-500">
          选中路径: {{ selectedPath }}
        </div>

        <div>
          <div>描述：</div>
          <div><a-input v-model="description" placeholder="请输入描述" /></div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <a-button @click="closeDialog">取消</a-button>
          <a-button type="primary" :disabled="!name.trim() || creatingItem" :loading="creatingItem"
            @click="handleConfirm">
            {{ creatingItem ? '创建中...' : '确定' }}
          </a-button>
        </div>
      </template>
    </a-modal>
  </teleport>
</template>

<script setup lang="ts">
import { ref, reactive, toRefs, computed, onMounted } from 'vue';
import { IconFolder, IconFile } from '@arco-design/web-vue/es/icon';
import { Message } from '@arco-design/web-vue';
import { getDocumentTree, createDocument, createFolder, getFolderPath, getFolderContents } from '@/api/docs';

const props = defineProps<{
  selected: string;
  title?: string;
}>();

// 定义事件
const emit = defineEmits(['created']);

interface TreeNode {
  key: string;
  title: string;
  children?: TreeNode[];
  isLeaf?: boolean;
  parentId?: string | null;
}

interface State {
  title: string;
  visible: boolean;
  name: string;
  description: string;
  selectedDirectory: string;
  loading: boolean;
  creatingItem: boolean;
}

const state = reactive<State>({
  title: `添加${props.selected}`,
  visible: false,
  name: '',
  description: '',
  selectedDirectory: '',
  loading: false,
  creatingItem: false
});

const { title, visible, name, description, selectedDirectory, loading, creatingItem } = toRefs(state);

// 树形数据
const treeData = ref<TreeNode[]>([]);
const selectedKeys = ref<string[]>([]);
const searchKeyword = ref('');
const selectedPath = ref('');

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

    // 可以选择加载完整树结构或者只加载根级别
    // 选项1: 加载完整树结构（当前方式）
    const response = await getDocumentTree();
    console.log('获取到的文档树数据:', response);

    if (response && Array.isArray(response)) {
      treeData.value = formatTreeData(response);
    } else {
      console.error('文档树数据格式不正确:', response);
      treeData.value = [];
    }

  } catch (error) {
    console.error('加载目录树失败:', error);
    Message.error('加载目录树失败');
    treeData.value = []; // 确保在错误时有一个空数组
  } finally {
    loading.value = false;
  }
};

// 格式化树形数据
const formatTreeData = (data: any[]): TreeNode[] => {
  if (!Array.isArray(data)) {
    console.warn('formatTreeData接收到非数组数据:', data);
    return [];
  }

  return data
    .filter(item => {
      // 只保留文件夹类型的项目，过滤掉文档
      return item && item.itemType === 'folder';
    })
    .map(item => {
      if (!item || typeof item !== 'object') {
        console.warn('formatTreeData发现无效项:', item);
        return null;
      }

      return {
        key: item.id ? item.id.toString() : Math.random().toString(),
        title: item.name || '未知',
        isLeaf: false,
        parentId: item.parentId || null,
        children: item.children ? formatTreeData(item.children) : undefined
      };
    })
    .filter(Boolean) as TreeNode[];
};

// 动态加载子节点
const loadMore = async (node: TreeNode) => {
  try {
    console.log('动态加载节点:', node);
    if (node.isLeaf) return;

    const response = await getFolderContents(node.key);

    const children = formatTreeData(response.folders || []);

    node.children = children;

    console.log('加载子节点成功:', children);
  } catch (error) {
    console.error('加载子节点失败:', error);
    Message.error('加载子节点失败');
  }
};

// 搜索功能
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

// 确认创建
const handleConfirm = async () => {
  if (!name.value.trim()) {
    Message.warning('请输入名称');
    return;
  }

  try {
    creatingItem.value = true;

    let result;
    if (props.selected === '文档') {
      const docData = {
        title: name.value.trim(), // 文档使用 title 字段
        content: '', // 新文档默认内容为空
        description: description.value.trim(),
        type: "text",
        parentId: selectedDirectory.value ? parseInt(selectedDirectory.value) : null
      };
      result = await createDocument(docData);
    } else {
      const folderData = {
        name: name.value.trim(), // 文件夹使用 name 字段
        parentId: selectedDirectory.value ? parseInt(selectedDirectory.value) : null
      };
      result = await createFolder(folderData);
    }

    Message.success(`${props.selected}创建成功`);

    // 发射创建成功事件
    emit('created', result);

    // 关闭弹窗并重置数据
    closeDialog();

  } catch (error) {
    console.error('创建失败:', error);
    Message.error(`创建${props.selected}失败`);
  } finally {
    creatingItem.value = false;
  }
};

// 打开弹窗
const openDialog = async () => {
  visible.value = true;
  // 打开时加载根目录数据
  await loadRootData();
};

// 关闭弹窗
const closeDialog = () => {
  visible.value = false;
  // 重置表单数据
  name.value = '';
  description.value = '';
  selectedDirectory.value = '';
  searchKeyword.value = '';
  treeData.value = [];
};

// 组件挂载时的初始化
onMounted(() => {
  console.log('AddDocs组件已挂载');
});

defineExpose({
  visible,
  openDialog,
  closeDialog
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