import { ref, watch, computed, onUnmounted } from 'vue';
import type { Ref, ComputedRef } from 'vue';
import { saveDocumentVersion } from '@/api/version';
import { saveDocumentContent } from '@/api/docs';
import type { SaveVersionRequest } from '@/types/version';
import { Message } from '@arco-design/web-vue';

/**
 * 保存状态常量
 */
export const SaveStatus = {
  IDLE: 'idle',        // 空闲
  SAVING: 'saving',    // 保存中
  SAVED: 'saved',      // 已保存
  ERROR: 'error',      // 保存失败
} as const;

export type SaveStatusType = typeof SaveStatus[keyof typeof SaveStatus];

/**
 * 自动保存组合式函数
 */
export function useAutoSave(
  documentId: Ref<string | number | undefined>,
  content: ComputedRef<any>,
  isModified: ComputedRef<boolean>,
) {
  const saveStatus = ref<SaveStatusType>(SaveStatus.IDLE);
  const lastSavedAt = ref<Date | null>(null);
  const isSaving = ref(false);

  /**
   * 保存文档内容 (仅保存,不创建版本)
   */
  async function saveContent() {
    if (!documentId.value || isSaving.value || !content.value) return;

    try {
      isSaving.value = true;
      saveStatus.value = SaveStatus.SAVING;

      const contentString = JSON.stringify(content.value);
      await saveDocumentContent(String(documentId.value), contentString);

      saveStatus.value = SaveStatus.SAVED;
      lastSavedAt.value = new Date();

      setTimeout(() => {
        if (saveStatus.value === SaveStatus.SAVED) {
          saveStatus.value = SaveStatus.IDLE;
        }
      }, 3000);
    } catch (error: any) {
      console.error('保存失败:', error);
      saveStatus.value = SaveStatus.ERROR;
      Message.error('保存失败: ' + (error.message || '未知错误'));
    } finally {
      isSaving.value = false;
    }
  }

  /**
   * 手动保存并创建版本
   */
  async function saveVersion(changeDescription: string = '手动保存') {
    if (!documentId.value || isSaving.value || !content.value) return;

    try {
      isSaving.value = true;
      saveStatus.value = SaveStatus.SAVING;

      const contentString = JSON.stringify(content.value);

      // 1. 保存文档内容
      await saveDocumentContent(String(documentId.value), contentString);

      // 2. 创建版本快照
      const requestData: SaveVersionRequest = {
        content: contentString,
        isAutoSave: false,
        changeDescription,
      };

      await saveDocumentVersion(Number(documentId.value), requestData);

      saveStatus.value = SaveStatus.SAVED;
      lastSavedAt.value = new Date();
      Message.success('版本保存成功');

      setTimeout(() => {
        if (saveStatus.value === SaveStatus.SAVED) {
          saveStatus.value = SaveStatus.IDLE;
        }
      }, 3000);
    } catch (error: any) {
      console.error('保存版本失败:', error);
      saveStatus.value = SaveStatus.ERROR;
      Message.error('保存版本失败: ' + (error.message || '未知错误'));
    } finally {
      isSaving.value = false;
    }
  }

  // 防抖保存函数 (3秒)
  let saveTimer: number | null = null;
  const debouncedSave = () => {
    if (saveTimer) {
      clearTimeout(saveTimer);
    }
    saveTimer = setTimeout(async () => {
      await saveContent(); // 只保存内容,不创建版本
    }, 3000) as unknown as number;
  };

  /**
   * 监听内容变化
   */
  const stopWatch = watch(
    () => content.value,
    (newContent) => {
      if (isModified.value && newContent) {
        debouncedSave();
      }
    },
    { deep: true }
  );

  /**
   * 手动保存版本
   */
  async function manualSave() {
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
    }
    await saveVersion('手动保存');
    return true; // 返回成功标记
  }

  /**
   * 清理
   */
  onUnmounted(() => {
    stopWatch();
    if (saveTimer) {
      clearTimeout(saveTimer);
    }
  });

  return {
    saveStatus: computed(() => saveStatus.value),
    lastSavedAt: computed(() => lastSavedAt.value),
    isSaving: computed(() => isSaving.value),
    manualSave,
  };
}
