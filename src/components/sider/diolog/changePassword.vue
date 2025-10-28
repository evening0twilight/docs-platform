<template>
  <teleport to="body">
    <a-modal 
      v-model:visible="visible" 
      :width="480" 
      :mask-closable="false" 
      :esc-to-close="false"
      :modal-class="'custom-password-modal'"
      @cancel="closeDialog"
    >
      <template #title>
        <div class="modal-title">
          <div class="title-icon">🔐</div>
          <span class="title-text">修改密码</span>
        </div>
      </template>

      <div class="password-form" @click.stop>
        <div class="form-item">
          <div class="input-label">
            <span class="label-icon">🔑</span>
            <span>当前密码</span>
          </div>
          <a-input-password 
            placeholder="请输入当前密码" 
            v-model="currentPassword"
            allow-clear
            class="custom-input"
          />
        </div>

        <div class="form-item">
          <div class="input-label">
            <span class="label-icon">✨</span>
            <span>新密码</span>
          </div>
          <a-input-password 
            placeholder="请输入新密码（至少6位）" 
            v-model="newPassword"
            allow-clear
            class="custom-input"
          />
          <div class="password-strength">
            <div class="strength-bar">
              <div class="strength-fill" :style="{ width: passwordStrength + '%', background: strengthColor }"></div>
            </div>
            <span class="strength-text" :style="{ color: strengthColor }">{{ strengthText }}</span>
          </div>
        </div>

        <div class="form-item">
          <div class="input-label">
            <span class="label-icon">✅</span>
            <span>确认新密码</span>
          </div>
          <a-input-password 
            placeholder="请再次输入新密码" 
            v-model="confirmPassword"
            allow-clear
            class="custom-input"
          />
        </div>
      </div>

      <template #footer>
        <div class="modal-footer">
          <button class="cancel-btn" @click="closeDialog">
            <span>取消</span>
          </button>
          <button class="confirm-btn" @click="handleChangePassword" :disabled="loading">
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
* @description 修改密码弹窗
*/
import { ref, reactive, toRefs, computed } from 'vue';
import { useRouter } from 'vue-router';
import { Message } from '@arco-design/web-vue';
import { useUserStore } from '@/store/user';
import { changePassword } from '@/api/user';

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
const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const loading = ref(false);

// 密码强度计算
const passwordStrength = computed(() => {
  const pwd = newPassword.value;
  if (!pwd) return 0;
  
  let strength = 0;
  // 长度
  if (pwd.length >= 6) strength += 25;
  if (pwd.length >= 8) strength += 25;
  // 包含数字
  if (/\d/.test(pwd)) strength += 25;
  // 包含字母
  if (/[a-zA-Z]/.test(pwd)) strength += 25;
  
  return strength;
});

const strengthColor = computed(() => {
  const strength = passwordStrength.value;
  if (strength < 25) return '#f53f3f';
  if (strength < 50) return '#ff7d00';
  if (strength < 75) return '#f7ba1e';
  return '#00b42a';
});

const strengthText = computed(() => {
  const strength = passwordStrength.value;
  if (strength === 0) return '';
  if (strength < 25) return '弱';
  if (strength < 50) return '一般';
  if (strength < 75) return '中等';
  return '强';
});

// 打开对话框
const openDialog = () => {
  visible.value = true;
  // 清空表单
  currentPassword.value = '';
  newPassword.value = '';
  confirmPassword.value = '';
};

// 修改密码
const handleChangePassword = async () => {
  try {
    // 验证表单
    if (!currentPassword.value.trim()) {
      Message.warning('请输入当前密码');
      return;
    }
    
    if (!newPassword.value.trim()) {
      Message.warning('请输入新密码');
      return;
    }
    
    if (newPassword.value.length < 6) {
      Message.warning('新密码长度至少为6位');
      return;
    }
    
    if (!confirmPassword.value.trim()) {
      Message.warning('请确认新密码');
      return;
    }
    
    if (newPassword.value !== confirmPassword.value) {
      Message.warning('两次输入的新密码不一致');
      return;
    }
    
    if (currentPassword.value === newPassword.value) {
      Message.warning('新密码不能与当前密码相同');
      return;
    }

    loading.value = true;
    
    // 调用API修改密码
    const response = await changePassword({
      currentPassword: currentPassword.value,
      newPassword: newPassword.value,
      confirmPassword: confirmPassword.value
    });

    Message.success(response.message || '密码修改成功，请重新登录');
    closeDialog();
    
    // 修改密码成功后，清除token并跳转到登录页
    setTimeout(() => {
      userStore.logout();
      router.push('/login');
    }, 1500); // 延迟1.5秒，让用户看到成功提示
    
    console.log('密码修改成功，即将跳转到登录页');
  } catch (error: any) {
    console.error('修改密码失败', error);
    const errorMessage = error?.response?.data?.message || error?.message || '修改密码失败，请稍后重试';
    Message.error(errorMessage);
  } finally {
    loading.value = false;
  }
};

// 关闭对话框
const closeDialog = () => {
  visible.value = false;
  // 清空表单
  currentPassword.value = '';
  newPassword.value = '';
  confirmPassword.value = '';
};

// 导出方法供外部调用
defineExpose({
  visible,
  openDialog,
  closeDialog
});

</script>

<style scoped>
/* 模态框标题 */
.modal-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 20px;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.title-icon {
  font-size: 24px;
  animation: shake 2s ease-in-out infinite;
}

@keyframes shake {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-10deg); }
  75% { transform: rotate(10deg); }
}

.title-text {
  letter-spacing: 0.5px;
}

/* 表单容器 */
.password-form {
  padding: 20px 0;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 表单项 */
.form-item {
  display: flex;
  flex-direction: column;
  gap: 10px;
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

/* 自定义输入框样式 */
.custom-input :deep(.arco-input-wrapper) {
  border: 2px solid #e5e6eb;
  border-radius: 10px;
  transition: all 0.3s ease;
  background: #f7f8fa;
}

.custom-input :deep(.arco-input-wrapper:hover) {
  border-color: #667eea;
  background: #fff;
}

.custom-input :deep(.arco-input-wrapper.arco-input-focus) {
  border-color: #667eea;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* 密码强度指示器 */
.password-strength {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 4px;
}

.strength-bar {
  flex: 1;
  height: 6px;
  background: #e5e6eb;
  border-radius: 3px;
  overflow: hidden;
  position: relative;
}

.strength-fill {
  height: 100%;
  border-radius: 3px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.strength-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { left: -100%; }
  100% { left: 100%; }
}

.strength-text {
  font-size: 12px;
  font-weight: 600;
  min-width: 40px;
  text-align: right;
}

/* 底部按钮 */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 20px;
  border-top: 1px solid #e5e6eb;
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
  outline: none;
  position: relative;
  overflow: hidden;
}

.cancel-btn {
  background: #f7f8fa;
  color: #4e5969;
}

.cancel-btn:hover {
  background: #e5e6eb;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.confirm-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  min-width: 120px;
}

.confirm-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.confirm-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.confirm-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s ease;
}

.confirm-btn:hover:not(:disabled)::before {
  left: 100%;
}

/* 全局模态框样式 */
:deep(.arco-modal) {
  border-radius: 16px !important;
  overflow: hidden;
}

:deep(.arco-modal-header) {
  padding: 24px 24px 16px !important;
  border-bottom: none !important;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05), rgba(118, 75, 162, 0.05));
}

:deep(.arco-modal-body) {
  padding: 0 24px !important;
}

:deep(.arco-modal-footer) {
  padding: 0 24px 24px !important;
  border-top: none !important;
}
</style>
