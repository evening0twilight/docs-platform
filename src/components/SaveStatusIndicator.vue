<template>
  <div class="save-status-indicator" :class="`status-${status}`">
    <a-spin v-if="status === SaveStatus.SAVING" :size="14" />
    <icon-check-circle v-else-if="status === SaveStatus.SAVED" />
    <icon-exclamation-circle v-else-if="status === SaveStatus.ERROR" />
    <icon-clock-circle v-else />

    <span class="status-text">
      {{ statusText }}
    </span>

    <a-button v-if="status === SaveStatus.ERROR" size="mini" @click="handleRetry">
      重试
    </a-button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  IconCheckCircle,
  IconExclamationCircle,
  IconClockCircle,
} from '@arco-design/web-vue/es/icon';
import { SaveStatus, type SaveStatusType } from '@/composables/useAutoSave';

const props = defineProps<{
  status: SaveStatusType;
  lastSavedAt: Date | null;
}>();

const emit = defineEmits<{
  retry: [];
}>();

const statusText = computed(() => {
  switch (props.status) {
    case SaveStatus.SAVING:
      return '保存中...';
    case SaveStatus.SAVED:
      if (props.lastSavedAt) {
        return `已保存 于 ${formatTime(props.lastSavedAt)}`;
      }
      return '已保存';
    case SaveStatus.ERROR:
      return '保存失败';
    default:
      return '未保存';
  }
});

function formatTime(date: Date): string {
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function handleRetry() {
  emit('retry');
}
</script>

<style scoped>
.save-status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  transition: all 0.3s;
}

.status-idle {
  color: var(--color-text-3);
}

.status-saving {
  color: rgb(var(--primary-6));
  background: rgb(var(--primary-1));
}

.status-saved {
  color: rgb(var(--success-6));
  background: rgb(var(--success-1));
}

.status-error {
  color: rgb(var(--danger-6));
  background: rgb(var(--danger-1));
}

.status-text {
  white-space: nowrap;
}
</style>
