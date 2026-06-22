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
  // 内容获取器:仅在真正落盘那一刻调用一次(取代每按键都重算的 deep-watch 计算属性),
  // 避免每次 ProseMirror 事务都跑全文 getJSON 序列化 + 深度遍历整棵 JSON 树。
  getContent: () => any,
  isModified: ComputedRef<boolean>,
  // 轻量变更信号:每次编辑自增,只用于触发防抖保存(浅监听,无 deep)。
  changeSignal: Ref<number>,
) {
  const saveStatus = ref<SaveStatusType>(SaveStatus.IDLE);
  const lastSavedAt = ref<Date | null>(null);
  const isSaving = ref(false);

  /**
   * 保存文档内容 (仅保存,不创建版本)
   */
  async function saveContent() {
    if (!documentId.value || isSaving.value) return;
    const data = getContent(); // 落盘时才取一次全文
    if (!data) return;

    try {
      isSaving.value = true;
      saveStatus.value = SaveStatus.SAVING;

      const contentString = JSON.stringify(data);
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
    if (!documentId.value || isSaving.value) return;
    const data = getContent();
    if (!data) return;

    try {
      isSaving.value = true;
      saveStatus.value = SaveStatus.SAVING;

      const contentString = JSON.stringify(data);

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
   * 监听轻量变更信号(每次编辑自增)触发防抖保存——浅监听,不做 deep 遍历。
   */
  const stopWatch = watch(changeSignal, () => {
    if (isModified.value) {
      debouncedSave();
    }
  });

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
