<template>
  <teleport to="body">
    <a-modal v-model:visible="visible" :width="520" :mask-closable="false" :esc-to-close="false"
      :modal-class="'custom-email-modal'" @cancel="closeDialog">
      <template #title>
        <div class="modal-title">
          <div class="title-icon">📧</div>
          <span class="title-text">修改邮箱</span>
        </div>
      </template>

      <div class="email-form" @click.stop>
        <!-- 安全提示 -->
        <div class="security-notice">
          <div class="notice-icon">⚠️</div>
          <div class="notice-content">
            <p class="notice-title">重要提示</p>
            <p class="notice-text">邮箱是您的登录账号，修改成功后将自动退出登录，请使用新邮箱重新登录</p>
          </div>
        </div>

        <!-- 当前邮箱显示 -->
        <div class="current-email-display">
          <span class="label">当前邮箱：</span>
          <span class="email-text">{{ currentEmail }}</span>
        </div>

        <!-- 新邮箱 -->
        <div class="form-item">
          <div class="input-label">
            <span class="label-icon">✉️</span>
            <span>新邮箱地址</span>
            <span class="required-mark">*</span>
          </div>
          <a-input placeholder="请输入新的邮箱地址" v-model="newEmail" allow-clear class="custom-input" :disabled="loading" />
        </div>

        <!-- 新邮箱验证码 -->
        <div class="form-item">
          <div class="input-label">
            <span class="label-icon">🔢</span>
            <span>新邮箱验证码</span>
            <span class="required-mark">*</span>
          </div>
          <div class="code-input-wrapper">
            <a-input placeholder="请输入6位验证码" v-model="verificationCode" allow-clear class="custom-input code-input"
              :max-length="6" :disabled="loading" />
            <button class="send-code-btn" @click="handleSendCode"
              :disabled="sendingCode || countdown > 0 || !newEmail || loading">
              <span v-if="countdown > 0">{{ countdown }}秒后重试</span>
              <span v-else-if="sendingCode">发送中...</span>
              <span v-else>{{ codeSent ? '重新发送' : '发送验证码' }}</span>
            </button>
          </div>
          <div v-if="codeSent" class="code-hint">
            <span class="hint-icon">💡</span>
            <span>验证码已发送至新邮箱，10分钟内有效</span>
          </div>
        </div>

        <!-- 提示信息 -->
        <div class="tips-section">
          <div class="tip-item">
            <span class="tip-icon">📌</span>
            <span>修改成功后，系统将向旧邮箱发送变更通知</span>
          </div>
          <div class="tip-item">
            <span class="tip-icon">⏰</span>
            <span>邮箱修改成功后24小时内不能再次修改</span>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="modal-footer">
          <button class="cancel-btn" @click="closeDialog" :disabled="loading">
            <span>取消</span>
          </button>
          <button class="confirm-btn" @click="handleChangeEmail" :disabled="loading">
            <span v-if="!loading">确认修改</span>
            <span v-else>修改中...</span>
          </button>
        </div>
      </template>
    </a-modal>
  </teleport>
</template>

<script setup lang="ts">
/**
* @description 修改邮箱弹窗
*/
import { ref, reactive, toRefs, computed } from 'vue';
import { useRouter } from 'vue-router';
import { Message } from '@arco-design/web-vue';
import { useUserStore } from '@/store/user';
import { changeEmail, sendVerificationCode, getUserInfo } from '@/api/user';

const router = useRouter();
const userStore = useUserStore();

interface State {
  visible: boolean;
}

const state = reactive<State>({
  visible: false
});

const {
  visible
} = toRefs(state);

// 表单数据
const newEmail = ref('');
const verificationCode = ref(''); // 新邮箱验证码
const loading = ref(false);

// 验证码相关
const sendingCode = ref(false);
const codeSent = ref(false);
const countdown = ref(0);
let countdownTimer: ReturnType<typeof setInterval> | null = null;

// 当前邮箱
const currentEmail = computed(() => userStore.email || '未设置');

// 打开对话框
const openDialog = () => {
  visible.value = true;
  resetForm();
};

// 关闭对话框
const closeDialog = () => {
  if (loading.value) {
    Message.warning('操作进行中，请稍候...');
    return;
  }
  visible.value = false;
  resetForm();
};

// 重置表单
const resetForm = () => {
  // oldEmailCode 不重置，因为是从父组件传入的
  newEmail.value = '';
  verificationCode.value = '';
  loading.value = false;
  sendingCode.value = false;
  codeSent.value = false;
  countdown.value = 0;
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
};

// 表单验证
const validateForm = (): boolean => {
  if (!newEmail.value) {
    Message.warning('请输入新邮箱地址');
    return false;
  }

  // 邮箱格式验证
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(newEmail.value)) {
    Message.warning('请输入有效的邮箱地址');
    return false;
  }

  // 检查是否与当前邮箱相同
  if (newEmail.value === currentEmail.value) {
    Message.warning('新邮箱不能与当前邮箱相同');
    return false;
  }

  if (!verificationCode.value) {
    Message.warning('请输入验证码');
    return false;
  }

  if (verificationCode.value.length !== 6) {
    Message.warning('验证码为6位数字');
    return false;
  }

  return true;
};

// 发送验证码
const handleSendCode = async () => {
  if (!newEmail.value) {
    Message.warning('请先输入新邮箱地址');
    return;
  }

  // 邮箱格式验证
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(newEmail.value)) {
    Message.warning('请输入有效的邮箱地址');
    return;
  }

  // 检查是否与当前邮箱相同
  if (newEmail.value === currentEmail.value) {
    Message.warning('新邮箱不能与当前邮箱相同');
    return;
  }

  try {
    sendingCode.value = true;

    await sendVerificationCode({
      email: newEmail.value,
      type: 'change_email'
    });

    Message.success('验证码已发送，请查收邮件');
    codeSent.value = true;

    // 开始倒计时 (60秒)
    countdown.value = 60;
    countdownTimer = setInterval(() => {
      countdown.value--;
      if (countdown.value <= 0) {
        if (countdownTimer) {
          clearInterval(countdownTimer);
          countdownTimer = null;
        }
      }
    }, 1000);

  } catch (error: any) {
    console.error('发送验证码失败:', error);

    // 处理特定错误
    if (error?.response?.status === 429) {
      Message.error('发送频率过高，请稍后再试');
    } else if (error?.response?.status === 503) {
      Message.error('邮件发送配额已用尽，请稍后再试');
    } else {
      const errorMessage = error?.response?.data?.message || error?.message || '发送验证码失败，请稍后重试';
      Message.error(errorMessage);
    }
  } finally {
    sendingCode.value = false;
  }
};

// 修改邮箱
const handleChangeEmail = async () => {
  if (!validateForm()) {
    return;
  }

  try {
    loading.value = true;
    Message.info('正在修改邮箱...');

    // 调用修改邮箱接口
    const response = await changeEmail({
      newEmail: newEmail.value,
      newEmailCode: verificationCode.value
    });

    console.log('邮箱修改响应:', response);

    Message.success('邮箱修改成功！已向旧邮箱发送通知，请使用新邮箱重新登录');
    console.log('邮箱修改成功');

    // 关闭对话框
    closeDialog();

    // 延迟1.5秒后退出登录
    setTimeout(() => {
      // 调用 logout 清除所有用户信息
      userStore.logout();

      // 跳转到登录页
      router.push('/login');

      Message.info('请使用新邮箱登录');
    }, 1500);

  } catch (error: any) {
    console.error('修改邮箱失败:', error);

    const status = error?.response?.status;
    const errorData = error?.response?.data;
    const message = errorData?.message || '';

    // 处理特定错误
    if (status === 400) {
      // 各种 400 错误
      if (message.includes('请先验证当前邮箱')) {
        Message.error('请先验证当前邮箱');
        closeDialog(); // 关闭当前对话框，让用户重新开始
      } else if (message.includes('当前邮箱验证已过期')) {
        Message.error('当前邮箱验证已过期（超过10分钟），请重新验证');
        closeDialog(); // 关闭当前对话框
      } else if (message.includes('新邮箱验证码')) {
        Message.error(message || '新邮箱验证码错误或已过期');
      } else if (message.includes('尝试次数')) {
        Message.error('验证码尝试次数已达上限，请重新获取验证码');
      } else if (message.includes('相同')) {
        Message.error('新邮箱不能与当前邮箱相同');
      } else {
        Message.error(message || '请求参数错误');
      }
    } else if (status === 401) {
      Message.error('登录已过期，请重新登录');
      setTimeout(() => {
        userStore.logout();
        router.push('/login');
      }, 1500);
    } else if (status === 409) {
      Message.error(message || '该邮箱已被其他用户使用');
    } else if (status === 429) {
      Message.error(message || '邮箱修改过于频繁，请稍后再试');
    } else {
      const errorMessage = message || error?.message || '修改邮箱失败，请稍后重试';
      Message.error(errorMessage);
    }
  } finally {
    loading.value = false;
  }
};

// 暴露方法给父组件
defineExpose({
  openDialog
});
</script>

<style scoped lang="scss">
.modal-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 18px;
  font-weight: 600;
  color: var(--c-text);
}

.title-icon {
  font-size: 24px;
  animation: bounce 2s ease-in-out infinite;
}

@keyframes bounce {

  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-3px);
  }
}

.email-form {
  padding: 20px 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 安全提示 */
.security-notice {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: var(--c-primary-soft);
  border-radius: 12px;
  border-left: 4px solid var(--c-warn);
}

.notice-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.notice-content {
  flex: 1;
}

.notice-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--c-warn);
  margin-bottom: 4px;
}

.notice-text {
  font-size: 13px;
  color: var(--c-warn);
  line-height: 1.5;
  margin: 0;
}

/* 当前邮箱显示 */
.current-email-display {
  padding: 12px 16px;
  background: var(--c-bg);
  border-radius: 8px;
  font-size: 14px;
  color: var(--c-text-2);
}

.label {
  font-weight: 500;
  color: var(--c-text-3);
  margin-right: 8px;
}

.email-text {
  font-weight: 600;
  color: var(--c-text);
}

/* 表单项 */
.form-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--c-text-2);
}

.label-icon {
  font-size: 16px;
}

.required-mark {
  color: var(--c-danger);
  margin-left: -4px;
}

.code-input-wrapper {
  width: 100%;
  font-size: 14px;

  :deep(.arco-input-wrapper) {
    padding-left: 0 !important;
    padding-right: 0 !important;
  }

  :deep(.arco-input-wrapper:focus-within),
  :deep(.arco-input-wrapper.arco-input-focus) {
    border-color: transparent !important;
  }

  :deep(.arco-input) {
    border-radius: 8px;
    border: 2px solid var(--c-border);
    transition: all 0.3s ease;

    &:hover {
      border-color: var(--c-primary);
    }

    &:focus {
      border-color: var(--c-primary);
      box-shadow: 0 0 0 3px rgba(22, 93, 255, 0.1);
    }
  }

  :deep(.arco-input-password) {
    border-radius: 8px;
    border: 2px solid var(--c-border);
    transition: all 0.3s ease;

    &:hover {
      border-color: var(--c-primary);
    }

    &:focus-within {
      border-color: var(--c-primary);
      box-shadow: 0 0 0 3px rgba(22, 93, 255, 0.1);
    }
  }
}

/* 验证码输入 */
.code-input-wrapper {
  display: flex;
  gap: 12px;
  align-items: center;
}

.code-input {
  flex: 1;
}

.send-code-btn {
  flex-shrink: 0;
  padding: 0 20px;
  height: 40px;
  background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(79, 70, 229, 0.3);
  }

  &:disabled {
    background: linear-gradient(135deg, #c9cdd4 0%, #a0a5b0 100%);
    cursor: not-allowed;
    opacity: 0.6;
  }
}

.code-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #e8f4ff;
  border-radius: 6px;
  font-size: 12px;
  color: #0e6eb8;
}

.hint-icon {
  font-size: 14px;
}

/* 提示信息 */
.tips-section {
  padding: 16px;
  background: var(--c-bg);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tip-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
  color: var(--c-text-2);
  line-height: 1.6;
}

.tip-icon {
  font-size: 14px;
  flex-shrink: 0;
  margin-top: 2px;
}

/* 底部按钮 */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 8px;
}

.cancel-btn,
.confirm-btn {
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.cancel-btn {
  background: var(--c-bg);
  color: var(--c-text-2);

  &:hover:not(:disabled) {
    background: var(--c-border);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
}

.confirm-btn {
  background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
  color: white;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(79, 70, 229, 0.3);
  }

  &:disabled {
    background: linear-gradient(135deg, #c9cdd4 0%, #a0a5b0 100%);
    cursor: not-allowed;
    opacity: 0.6;
  }
}
</style>
