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
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <a-button @click="closeDialog">取消</a-button>
          <a-button type="primary" :disabled="!name || !selectedDirectory">
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


// 打开弹窗
const openDialog = () => {
  visible.value = true;
};

// 关闭弹窗
const closeDialog = () => {
  visible.value = false;
};

// 清除缓存（可选功能）

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