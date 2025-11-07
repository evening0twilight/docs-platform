import { ref } from 'vue';
import { Message } from '@arco-design/web-vue';

/**
 * 异步操作状态管理 Composable
 * 用于统一处理后端请求的 loading、error、success 状态
 * 
 * @example
 * // 基本用法
 * const { loading, execute } = useAsyncState();
 * 
 * const handleUpload = async () => {
 *   await execute(async () => {
 *     const result = await uploadImage(file);
 *     return result;
 *   }, {
 *     successMsg: '上传成功',
 *     errorMsg: '上传失败'
 *   });
 * };
 * 
 * // 在模板中使用
 * <button :disabled="loading">{{ loading ? '上传中...' : '上传' }}</button>
 */

interface ExecuteOptions {
  /** 成功提示消息，不传则不显示 */
  successMsg?: string;
  /** 错误提示消息，不传则使用后端返回的错误信息 */
  errorMsg?: string;
  /** 是否自动显示错误提示，默认 true */
  showError?: boolean;
  /** 是否自动显示成功提示，默认 false */
  showSuccess?: boolean;
}

export function useAsyncState() {
  const loading = ref(false);
  const error = ref<Error | null>(null);

  /**
   * 执行异步操作
   * @param asyncFn 异步函数
   * @param options 配置选项
   * @returns 异步函数的返回值
   */
  const execute = async <T>(
    asyncFn: () => Promise<T>,
    options: ExecuteOptions = {}
  ): Promise<T | undefined> => {
    const {
      successMsg,
      errorMsg,
      showError = true,
      showSuccess = !!successMsg, // 如果传了 successMsg 则默认显示
    } = options;

    loading.value = true;
    error.value = null;

    try {
      const result = await asyncFn();

      // 显示成功提示
      if (showSuccess && successMsg) {
        Message.success(successMsg);
      }

      return result;
    } catch (err: any) {
      error.value = err;

      // 显示错误提示
      if (showError) {
        const message = errorMsg || err.message || err.response?.data?.message || '操作失败';
        Message.error(message);
      }

      // 重新抛出错误，让调用方可以继续处理
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 重置状态
   */
  const reset = () => {
    loading.value = false;
    error.value = null;
  };

  return {
    loading,
    error,
    execute,
    reset,
  };
}

/**
 * 创建局部的异步状态管理（不共享状态）
 * 用于组件内部多个独立的异步操作
 * 
 * @example
 * const uploadState = useAsyncState();
 * const deleteState = useAsyncState();
 * 
 * <button :disabled="uploadState.loading.value">上传</button>
 * <button :disabled="deleteState.loading.value">删除</button>
 */
export const createAsyncState = useAsyncState;
