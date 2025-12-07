<template>
  <div class="version-compare-container">
    <!-- 版本选择器 -->
    <div class="compare-header">
      <div class="version-selector">
        <label>源版本:</label>
        <a-select v-model="sourceVersionId" placeholder="选择版本">
          <a-option v-for="version in versions" :key="version.id" :value="version.id">
            版本 {{ version.versionNumber }} - {{ formatTime(version.createdAt) }}
          </a-option>
        </a-select>
      </div>

      <icon-swap class="swap-icon" @click="swapVersions" />

      <div class="version-selector">
        <label>目标版本:</label>
        <a-select v-model="targetVersionId" placeholder="选择版本">
          <a-option v-for="version in versions" :key="version.id" :value="version.id">
            版本 {{ version.versionNumber }} - {{ formatTime(version.createdAt) }}
          </a-option>
        </a-select>
      </div>

      <a-button type="primary" :disabled="!sourceVersionId || !targetVersionId" :loading="comparing"
        @click="handleCompare">
        开始对比
      </a-button>
    </div>

    <!-- 对比统计 -->
    <div v-if="compareResult" class="compare-stats">
      <div class="stat-item additions">
        <icon-plus-circle />
        <span>{{ compareResult.stats.additions }} 个字符添加</span>
      </div>
      <div class="stat-item deletions">
        <icon-minus-circle />
        <span>{{ compareResult.stats.deletions }} 个字符删除</span>
      </div>
      <div class="stat-item unchanged">
        <icon-check-circle />
        <span>{{ compareResult.stats.unchanged }} 个字符未变化</span>
      </div>
    </div>

    <!-- 对比结果 -->
    <div v-if="compareResult" class="compare-result">
      <div class="diff-content">
        <span v-for="(diff, index) in compareResult.diffs" :key="index" :class="['diff-item', `diff-${diff.type}`]">
          {{ diff.text }}
        </span>
      </div>
    </div>

    <!-- 加载状态 -->
    <a-spin v-if="comparing" class="loading-spinner" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
  IconSwap,
  IconPlusCircle,
  IconMinusCircle,
  IconCheckCircle,
} from '@arco-design/web-vue/es/icon';
import { compareVersions } from '@/api/version';
import type { DocumentVersion, VersionCompareResult } from '@/types/version';

const props = defineProps<{
  documentId: number;
  versions: DocumentVersion[];
}>();

const sourceVersionId = ref<number>();
const targetVersionId = ref<number>();
const comparing = ref(false);
const compareResult = ref<VersionCompareResult | null>(null);

// 交换版本
function swapVersions() {
  const temp = sourceVersionId.value;
  sourceVersionId.value = targetVersionId.value;
  targetVersionId.value = temp;
}

// 执行对比
async function handleCompare() {
  if (!sourceVersionId.value || !targetVersionId.value) return;

  comparing.value = true;
  try {
    compareResult.value = await compareVersions(
      props.documentId,
      sourceVersionId.value,
      targetVersionId.value,
    );
  } catch (error: any) {
    console.error('对比版本失败:', error);
  } finally {
    comparing.value = false;
  }
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleString('zh-CN');
}
</script>

<style scoped>
.version-compare-container {
  padding: 24px;
}

.compare-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.version-selector {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.swap-icon {
  font-size: 20px;
  cursor: pointer;
  color: var(--color-text-3);
  transition: all 0.3s;
}

.swap-icon:hover {
  color: rgb(var(--primary-6));
  transform: rotate(180deg);
}

.compare-stats {
  display: flex;
  gap: 24px;
  padding: 16px;
  background: var(--color-fill-1);
  border-radius: 8px;
  margin-bottom: 24px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.stat-item.additions {
  color: rgb(var(--success-6));
}

.stat-item.deletions {
  color: rgb(var(--danger-6));
}

.stat-item.unchanged {
  color: var(--color-text-3);
}

.compare-result {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 16px;
  background: var(--color-bg-2);
  max-height: 600px;
  overflow-y: auto;
}

.diff-content {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 14px;
  line-height: 1.8;
  white-space: pre-wrap;
  word-break: break-word;
}

.diff-item {
  display: inline;
}

.diff-insert {
  background: rgba(var(--success-6), 0.15);
  color: rgb(var(--success-6));
  text-decoration: underline;
}

.diff-delete {
  background: rgba(var(--danger-6), 0.15);
  color: rgb(var(--danger-6));
  text-decoration: line-through;
}

.loading-spinner {
  display: flex;
  justify-content: center;
  padding: 40px;
}
</style>
