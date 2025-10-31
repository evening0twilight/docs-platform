<template>
  <teleport to="body">
    <a-modal v-model:visible="visible" :width="480" :mask-closable="false" :esc-to-close="false"
      :modal-class="'custom-verify-modal'" @cancel="closeDialog">
      <template #title>
        <div class="modal-title">
          <div class="title-icon">🔐</div>
          <span class="title-text">验证当前邮箱</span>
        </div>
      </template>

      <div class="verify-form" @click.stop>
        <!-- 提示信息 -->
        <div class="info-notice">
          <div class="notice-icon">📧</div>
          <div class="notice-content">
            <p class="notice-title">安全验证</p>
            <p class="notice-text">为了确保是本人操作，我们将向您的邮箱发送验证码</p>
          </div>
        </div>

        <!-- 当前邮箱显示 -->
        <div class="email-display">
          <span class="label">当前邮箱：</span>
          <span class="email-text">{{ currentEmail }}</span>
        </div>

        <!-- 验证码输入 -->
        <div class="form-item">
          <div class="input-label">
            <span class="label-icon">🔢</span>
            <span>验证码</span>
            <span class="required-mark">*</span>
          </div>
          <div class="code-input-wrapper">
            <a-input placeholder="请输入6位验证码" v-model="verificationCode" allow-clear class="custom-input code-input"
              :max-length="6" :disabled="loading" @keyup.enter="handleVerify" />
            <button class="send-code-btn" @click="handleSendCode" :disabled="sendingCode || countdown > 0 || loading">
              <span v-if="countdown > 0">{{ countdown }}秒后重试</span>
              <span v-else-if="sendingCode">发送中...</span>
              <span v-else>{{ codeSent ? '重新发送' : '发送验证码' }}</span>
            </button>
          </div>
          <div v-if="codeSent" class="code-hint">
            <span class="hint-icon">💡</span>
            <span>验证码已发送至您的邮箱，10分钟内有效</span>
          </div>
        </div>

        <!-- 温馨提示 -->
        <div class="tips-section">
          <div class="tip-item">
            <span class="tip-icon">📌</span>
            <span>如果未收到验证码，请检查垃圾邮件箱</span>
          </div>
          <div class="tip-item">
            <span class="tip-icon">⏰</span>
            <span>验证码10分钟内有效，请尽快完成验证</span>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="modal-footer">
          <button class="cancel-btn" @click="closeDialog" :disabled="loading">
            <span>取消</span>
          </button>
          <button class="confirm-btn" @click="handleVerify" :disabled="loading">
            <span v-if="!loading">验证并继续</span>
            <span v-else>验证中...</span>
          </button>
        </div>
      </template>
    </a-modal>
  </teleport>
</template>

<script setup lang="ts">
/**
* @description 验证当前邮箱弹窗 - 验证当前邮箱所有权
*/
import { ref, reactive, toRefs, computed } from 'vue';
import { Message } from '@arco-design/web-vue';
import { useUserStore } from '@/store/user';
import { sendVerificationCode, verifyOldEmail } from '@/api/user';

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
const verificationCode = ref('');
const loading = ref(false);

// 验证码相关
const sendingCode = ref(false);
const codeSent = ref(false);
const countdown = ref(0);
let countdownTimer: ReturnType<typeof setInterval> | null = null;

// 当前邮箱
const currentEmail = computed(() => userStore.email || '未设置');

// 成功回调
let onVerifySuccess: (() => void) | null = null;

// 打开对话框
const openDialog = (successCallback?: () => void) => {
  if (!userStore.email) {
    Message.error('当前未绑定邮箱，无法进行此操作');
    return;
  }

  visible.value = true;
  onVerifySuccess = successCallback || null;
  resetForm();

  // 自动发送验证码
  setTimeout(() => {
    handleSendCode();
  }, 300);
};

// 关闭对话框
const closeDialog = () => {
  if (loading.value) {
    Message.warning('操作进行中，请稍候...');
    return;
  }
  visible.value = false;
  resetForm();
  onVerifySuccess = null;
};

// 重置表单
const resetForm = () => {
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

// 发送验证码
const handleSendCode = async () => {
  if (!currentEmail.value || currentEmail.value === '未设置') {
    Message.error('当前未绑定邮箱');
    return;
  }

  try {
    sendingCode.value = true;

    await sendVerificationCode({
      email: currentEmail.value,
      type: 'change_email'  // 使用统一的 change_email 类型
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

// 验证并继续（调用后端验证接口）
const handleVerify = async () => {
  if (!verificationCode.value) {
    Message.warning('请输入验证码');
    return;
  }

  if (verificationCode.value.length !== 6) {
    Message.warning('验证码为6位数字');
    return;
  }

  if (!currentEmail.value || currentEmail.value === '未设置') {
    Message.error('当前未绑定邮箱');
    return;
  }

  try {
    loading.value = true;

    // 调用后端验证接口（需要传递 email 和 code）
    const response = await verifyOldEmail({
      email: currentEmail.value,
      code: verificationCode.value
    });

    console.log('当前邮箱验证成功:', response);
    Message.success('当前邮箱验证通过，请继续输入新邮箱');

    // 关闭对话框
    visible.value = false;

    // 调用成功回调
    if (onVerifySuccess) {
      setTimeout(() => {
        onVerifySuccess?.();
      }, 300);
    }

    resetForm();

  } catch (error: any) {
    console.error('验证失败:', error);

    const status = error?.response?.status;
    const errorData = error?.response?.data;
    const message = errorData?.message || '';

    // 处理特定错误
    if (status === 400) {
      // 验证码错误、已过期、邮箱不一致等
      if (message.includes('还剩')) {
        // 显示剩余尝试次数
        Message.error(message);
      } else if (message.includes('过期')) {
        Message.error('验证码已过期，请重新获取');
      } else if (message.includes('邮箱') && message.includes('不一致')) {
        Message.error('提交的邮箱与当前绑定邮箱不一致');
      } else {
        Message.error(message || '验证码错误');
      }
    } else if (status === 429) {
      // 冷却期限制
      Message.error(message || '邮箱修改过于频繁，请稍后再试');
    } else if (status === 401) {
      Message.error('登录已过期，请重新登录');
    } else {
      const errorMessage = message || error?.message || '验证失败，请稍后重试';
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
  color: #1d2129;
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

.verify-form {
  padding: 20px 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 提示信息 */
.info-notice {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  border-radius: 12px;
  border-left: 4px solid #2196f3;
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
  color: #1565c0;
  margin-bottom: 4px;
}

.notice-text {
  font-size: 13px;
  color: #1976d2;
  line-height: 1.5;
  margin: 0;
}

/* 邮箱显示 */
.email-display {
  padding: 12px 16px;
  background: #f7f8fa;
  border-radius: 8px;
  font-size: 14px;
  color: #4e5969;
}

.label {
  font-weight: 500;
  color: #86909c;
  margin-right: 8px;
}

.email-text {
  font-weight: 600;
  color: #1d2129;
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
  color: #4e5969;
}

.label-icon {
  font-size: 16px;
}

.required-mark {
  color: #f53f3f;
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
    border: 2px solid #e5e6eb;
    transition: all 0.3s ease;

    &:hover {
      border-color: #165dff;
    }

    &:focus {
      border-color: #165dff;
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
    box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
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
  background: #f7f8fa;
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
  color: #4e5969;
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
  background: #f2f3f5;
  color: #4e5969;

  &:hover:not(:disabled) {
    background: #e5e6eb;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
}

.confirm-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
  }

  &:disabled {
    background: linear-gradient(135deg, #c9cdd4 0%, #a0a5b0 100%);
    cursor: not-allowed;
    opacity: 0.6;
  }
}
</style>
