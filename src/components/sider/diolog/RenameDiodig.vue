<template>
  <div class="rename-dialog">
    <a-modal v-model:visible="visible" :title="modalTitle" width="480px" @cancel="handleCancel"
      @before-ok="handleBeforeOk" :ok-loading="loading" unmount-on-close>
      <div class="modal-content">
        <div class="form-item">
          <label class="form-label">
            <span class="label-text">名称</span>
            <span class="label-required">*</span>
          </label>
          <a-input v-model="form.name" placeholder="请输入新名称" :max-length="50" show-word-limit allow-clear
            @press-enter="handleBeforeOk" />
        </div>
        <div v-if="itemType" class="tip-text">
          <icon-info-circle /> {{ itemType === 'folder' ? '文件夹' : '文档' }}名称不能为空
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { Message } from '@arco-design/web-vue';
import { IconInfoCircle } from '@arco-design/web-vue/es/icon';
import { renameDocument, renameFolder } from '@/api/docs';

interface RenameData {
  id: number;
  name: string;
  type: 'folder' | 'document';
}

const visible = ref(false);
const loading = ref(false);
const form = reactive({
  name: ''
});

const currentItem = ref<RenameData | null>(null);

const modalTitle = computed(() => {
  if (!currentItem.value) return '重命名';
  return currentItem.value.type === 'folder' ? '重命名文件夹' : '重命名文档';
});

const itemType = computed(() => currentItem.value?.type);

const emit = defineEmits(['success']);

// 打开弹窗
const openDialog = (data: RenameData) => {
  currentItem.value = data;
  form.name = data.name;
  visible.value = true;
};

// 确认重命名
const handleBeforeOk = async (done: (closed: boolean) => void) => {
  const newName = form.name.trim();

  if (!newName) {
    Message.warning('名称不能为空');
    done(false);
    return;
  }

  if (newName === currentItem.value?.name) {
    Message.info('名称未改变');
    done(true);
    return;
  }

  try {
    loading.value = true;
    
    // 根据类型调用不同的 API
    if (currentItem.value!.type === 'folder') {
      await renameFolder(currentItem.value!.id, newName);
    } else {
      await renameDocument(currentItem.value!.id, newName);
    }
    
    Message.success('重命名成功');
    emit('success');
    done(true);
  } catch (error: any) {
    console.error('重命名失败:', error);
    Message.error(error?.message || '重命名失败，请重试');
    done(false);
  } finally {
    loading.value = false;
  }
};

// 取消
const handleCancel = () => {
  visible.value = false;
  form.name = '';
  currentItem.value = null;
};

defineExpose({
  openDialog
});
</script>

<style scoped>
.rename-dialog :deep(.arco-modal) {
  border-radius: 12px;
  overflow: hidden;
}

.rename-dialog :deep(.arco-modal-header) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px 24px;
  border-bottom: none;
}

.rename-dialog :deep(.arco-modal-title) {
  color: white;
  font-size: 18px;
  font-weight: 600;
}

.rename-dialog :deep(.arco-modal-close-icon) {
  color: white;
}

.rename-dialog :deep(.arco-modal-body) {
  padding: 24px;
}

.modal-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 500;
  color: #1d2129;
}

.label-text {
  color: #4e5969;
}

.label-required {
  color: #f53f3f;
}

.tip-text {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #86909c;
  padding: 8px 12px;
  background: #f7f8fa;
  border-radius: 6px;
}

.rename-dialog :deep(.arco-input) {
  border-radius: 8px;
  border: 1px solid #e5e6eb;
  transition: all 0.3s;
}

.rename-dialog :deep(.arco-input:hover) {
  border-color: #667eea;
}

.rename-dialog :deep(.arco-input:focus) {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.rename-dialog :deep(.arco-modal-footer) {
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
}

.rename-dialog :deep(.arco-btn-primary) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  font-weight: 500;
}

.rename-dialog :deep(.arco-btn-primary:hover) {
  background: linear-gradient(135deg, #5568d3 0%, #65408b 100%);
}
</style>