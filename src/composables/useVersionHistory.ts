import { ref, computed } from 'vue';
import {
  getDocumentVersions,
  getVersionDetail,
  restoreDocumentVersion,
} from '@/api/version';
import type {
  DocumentVersion,
  DocumentVersionDetail,
} from '@/types/version';
import { Message, Modal } from '@arco-design/web-vue';
import type { Editor } from '@tiptap/vue-3';

/**
 * 版本历史组合式函数
 */
export function useVersionHistory(documentId: number, editor: Editor | null) {
  const versions = ref<DocumentVersion[]>([]);
  const currentPage = ref(1);
  const pageSize = ref(20);
  const total = ref(0);
  const hasMore = ref(false);
  const loading = ref(false);
  const selectedVersion = ref<DocumentVersionDetail | null>(null);

  /**
   * 加载版本列表
   */
  async function loadVersions(page: number = 1) {
    loading.value = true;
    try {
      const response = await getDocumentVersions(documentId, page, pageSize.value);

      if (page === 1) {
        versions.value = response.versions;
      } else {
        versions.value.push(...response.versions);
      }

      currentPage.value = page;
      total.value = response.total;
      hasMore.value = response.hasMore;
    } catch (error: any) {
      console.error('加载版本列表失败:', error);
      Message.error('加载版本列表失败: ' + error.message);
    } finally {
      loading.value = false;
    }
  }

  /**
   * 加载更多版本
   */
  async function loadMore() {
    if (!hasMore.value || loading.value) return;
    await loadVersions(currentPage.value + 1);
  }

  /**
   * 查看版本详情
   */
  async function viewVersion(versionId: number) {
    loading.value = true;
    try {
      const detail = await getVersionDetail(documentId, versionId);
      selectedVersion.value = detail;
      return detail;
    } catch (error: any) {
      console.error('加载版本详情失败:', error);
      Message.error('加载版本详情失败: ' + error.message);
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 恢复版本
   */
  async function restoreVersion(versionId: number, versionNumber: number) {
    return new Promise<void>((resolve, reject) => {
      Modal.confirm({
        title: '确认恢复版本?',
        content: `确定要恢复到版本 ${versionNumber} 吗?当前内容将被替换。`,
        okText: '确认恢复',
        cancelText: '取消',
        onOk: async () => {
          try {
            loading.value = true;

            // 1. 调用恢复API
            await restoreDocumentVersion(documentId, { versionId });

            // 2. 获取恢复后的内容
            const detail = await getVersionDetail(documentId, versionId);

            // 3. 更新编辑器内容
            if (editor) {
              const content = JSON.parse(detail.content);
              editor.commands.setContent(content);
            }

            // 4. 重新加载版本列表
            await loadVersions(1);

            Message.success(`已恢复到版本 ${versionNumber}`);
            resolve();
          } catch (error: any) {
            console.error('恢复版本失败:', error);
            Message.error('恢复版本失败: ' + error.message);
            reject(error);
          } finally {
            loading.value = false;
          }
        },
        onCancel: () => {
          reject(new Error('用户取消'));
        },
      });
    });
  }

  /**
   * 刷新版本列表
   */
  async function refresh() {
    await loadVersions(1);
  }

  /**
   * 格式化文件大小
   */
  function formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  /**
   * 格式化时间(完整日期时间格式: 2025-06-12 12:00)
   */
  function formatTime(dateString: string): string {
    const date = new Date(dateString);
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }

  return {
    versions,
    total,
    hasMore,
    loading,
    selectedVersion,
    loadVersions,
    loadMore,
    viewVersion,
    restoreVersion,
    refresh,
    formatSize,
    formatTime,
  };
}
