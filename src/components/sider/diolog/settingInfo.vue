<template>
  <teleport to="body">
    <a-modal v-model:visible="visible" :width="560" :mask-closable="false" :esc-to-close="false" @cancel="closeDialog">
      <template #title>
        <div class="modal-title">
          <div class="title-icon">👤</div>
          <span class="title-text">个人信息</span>
        </div>
      </template>

      <div class="user-info-container" @click.stop>
        <!-- 用户头像 -->
        <div class="avatar-section">
          <div class="avatar-wrapper">
            <a-avatar
              :imageUrl="userStore.avatar || 'https://p1-arco.byteimg.com/tos-cn-i-uwbnlip3yd/3ee5f13fb09879ecb5185e440cef6eb9123.png~tplv-uwbnlip3yd-webp.webp'"
              :size="80" class="user-avatar" />
            <div class="avatar-badge">
              <span>✨</span>
            </div>
          </div>
        </div>

        <!-- 用户名 -->
        <div class="info-item">
          <div class="info-header">
            <span class="info-label">
              <span class="label-icon">👨‍💼</span>
              <span>用户名</span>
            </span>
            <button v-if="!isEditingUsername" class="edit-btn" @click="startEditUsername">
              <span>✏️ 编辑</span>
            </button>
          </div>
          <div class="info-content">
            <div v-if="!isEditingUsername" class="info-display">
              {{ username || '未设置' }}
            </div>
            <div v-else class="info-edit">
              <a-input v-model="username" placeholder="请输入用户名" allow-clear class="custom-input" />
              <div class="edit-actions">
                <button class="action-btn cancel" @click="cancelEditUsername">取消</button>
                <button class="action-btn save" @click="saveUsername">保存</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 邮箱 -->
        <div class="info-item">
          <div class="info-header">
            <span class="info-label">
              <span class="label-icon">📧</span>
              <span>邮箱</span>
            </span>
            <button v-if="!isEditingEmail" class="edit-btn" @click="startEditEmail">
              <span>✏️ 编辑</span>
            </button>
          </div>
          <div class="info-content">
            <div v-if="!isEditingEmail" class="info-display">
              {{ email || '未设置' }}
            </div>
            <div v-else class="info-edit">
              <a-input v-model="email" placeholder="请输入邮箱" allow-clear class="custom-input" />
              <div class="edit-actions">
                <button class="action-btn cancel" @click="cancelEditEmail">取消</button>
                <button class="action-btn save" @click="saveEmail">保存</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 分割线 -->
        <div class="divider-line"></div>

        <!-- 修改密码按钮 -->
        <div class="password-section">
          <button class="password-btn" @click="openChangePasswordDialog">
            <span class="btn-icon">🔐</span>
            <span class="btn-text">修改密码</span>
            <span class="btn-arrow">→</span>
          </button>
        </div>
      </div>

      <template #footer>
        <div class="modal-footer">
          <button class="close-btn" @click="closeDialog">
            <span>关闭</span>
          </button>
        </div>
      </template>
    </a-modal>

    <!-- 修改密码弹窗 -->
    <ChangePassword ref="changePasswordRef" />
  </teleport>
</template>

<script setup lang="ts">
/**
* @description 用户信息编辑
*/
import { ref, onMounted, reactive, toRefs, watch } from 'vue';
import { Message } from '@arco-design/web-vue';
import { useUserStore } from '@/store/user';
import { getUserInfo, updateUserInfo } from '@/api/user';
import type { UserInfo } from '@/components/type';
import ChangePassword from './changePassword.vue';

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

// 用户信息
const userInfo = ref<UserInfo | null>(null);
const username = ref('');
const email = ref('');
const loading = ref(false);

// 编辑状态
const isEditingUsername = ref(false);
const isEditingEmail = ref(false);

// 保存原始值，用于取消时恢复
const originalUsername = ref('');
const originalEmail = ref('');

// 修改密码弹窗ref
const changePasswordRef = ref<InstanceType<typeof ChangePassword>>();

// 打开对话框时从store加载用户信息
const openDialog = () => {
  visible.value = true;
  // 从store加载用户信息
  username.value = userStore.name || '';
  email.value = userStore.email || '';
  originalUsername.value = username.value;
  originalEmail.value = email.value;
  // 重置编辑状态
  isEditingUsername.value = false;
  isEditingEmail.value = false;
  console.log('加载用户信息:', username.value, email.value);
};

// 打开修改密码弹窗
const openChangePasswordDialog = () => {
  changePasswordRef.value?.openDialog();
};

// 开始编辑用户名
const startEditUsername = () => {
  originalUsername.value = username.value;
  isEditingUsername.value = true;
};

// 取消编辑用户名
const cancelEditUsername = () => {
  username.value = originalUsername.value;
  isEditingUsername.value = false;
};

// 保存用户名
const saveUsername = async () => {
  try {
    if (!username.value.trim()) {
      Message.warning('用户名不能为空');
      return;
    }

    loading.value = true;

    // 调用API更新用户信息
    await updateUserInfo({
      username: username.value,
      email: email.value
    });

    // 更新store中的用户信息
    userStore.setUser({
      name: username.value,
      email: email.value
    });

    originalUsername.value = username.value;
    isEditingUsername.value = false;
    Message.success('用户名更新成功');
    console.log('用户名更新成功');
  } catch (error: any) {
    console.error('更新用户名失败', error);
    const errorMessage = error?.response?.data?.message || error?.message || '更新用户名失败，请稍后重试';
    Message.error(errorMessage);
  } finally {
    loading.value = false;
  }
};

// 开始编辑邮箱
const startEditEmail = () => {
  originalEmail.value = email.value;
  isEditingEmail.value = true;
};

// 取消编辑邮箱
const cancelEditEmail = () => {
  email.value = originalEmail.value;
  isEditingEmail.value = false;
};

// 保存邮箱
const saveEmail = async () => {
  try {
    // 验证邮箱格式
    if (email.value && !isValidEmail(email.value)) {
      Message.warning('请输入有效的邮箱地址');
      return;
    }

    loading.value = true;

    // 调用API更新用户信息
    await updateUserInfo({
      username: username.value,
      email: email.value
    });

    // 更新store中的用户信息
    userStore.setUser({
      name: username.value,
      email: email.value
    });

    originalEmail.value = email.value;
    isEditingEmail.value = false;
    Message.success('邮箱更新成功');
    console.log('邮箱更新成功');
  } catch (error: any) {
    console.error('更新邮箱失败', error);
    const errorMessage = error?.response?.data?.message || error?.message || '更新邮箱失败，请稍后重试';
    Message.error(errorMessage);
  } finally {
    loading.value = false;
  }
};

// 邮箱验证函数
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// 关闭对话框
const closeDialog = () => {
  visible.value = false;
  // 重置编辑状态
  isEditingUsername.value = false;
  isEditingEmail.value = false;
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
}

.title-text {
  letter-spacing: 0.5px;
}

/* 容器 */
.user-info-container {
  padding: 20px 0;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 头像区域 */
.avatar-section {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.avatar-wrapper {
  position: relative;
  display: inline-block;
}

.user-avatar {
  border: 4px solid #fff;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
}

.avatar-badge {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 28px;
  height: 28px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid #fff;
  font-size: 14px;
  animation: bounce 2s ease-in-out infinite;
}

@keyframes bounce {

  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-5px);
  }
}

/* 信息项 */
.info-item {
  background: #f7f8fa;
  border-radius: 12px;
  padding: 16px;
  transition: all 0.3s ease;
}

.info-item:hover {
  background: #f2f3f5;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.info-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #4e5969;
}

.label-icon {
  font-size: 18px;
}

.edit-btn {
  padding: 6px 16px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.edit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

/* 显示内容 */
.info-display {
  font-size: 16px;
  color: #1d2129;
  padding: 8px 12px;
  background: white;
  border-radius: 8px;
  min-height: 40px;
  display: flex;
  align-items: center;
}

/* 编辑区域 */
.info-edit {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.custom-input :deep(.arco-input-wrapper) {
  border: 2px solid #e5e6eb;
  border-radius: 8px;
  transition: all 0.3s ease;
  background: white;
}

.custom-input :deep(.arco-input-wrapper:hover) {
  border-color: #667eea;
}

.custom-input :deep(.arco-input-wrapper.arco-input-focus) {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.action-btn {
  padding: 8px 20px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.3s ease;
}

.action-btn.cancel {
  background: #e5e6eb;
  color: #4e5969;
}

.action-btn.cancel:hover {
  background: #c9cdd4;
}

.action-btn.save {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.action-btn.save:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

/* 分割线 */
.divider-line {
  height: 1px;
  background: linear-gradient(90deg, transparent, #e5e6eb, transparent);
  margin: 8px 0;
}

/* 修改密码区域 */
.password-section {
  margin-top: 8px;
}

.password-btn {
  width: 100%;
  padding: 14px 20px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.08), rgba(118, 75, 162, 0.08));
  border: 2px solid transparent;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.password-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent);
  transition: left 0.5s ease;
}

.password-btn:hover::before {
  left: 100%;
}

.password-btn:hover {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.15), rgba(118, 75, 162, 0.15));
  border-color: #667eea;
  transform: translateX(4px);
}

.btn-icon {
  font-size: 20px;
}

.btn-text {
  flex: 1;
  font-size: 15px;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-align: left;
}

.btn-arrow {
  font-size: 18px;
  font-weight: bold;
  color: #667eea;
  opacity: 0;
  transform: translateX(-10px);
  transition: all 0.3s ease;
}

.password-btn:hover .btn-arrow {
  opacity: 1;
  transform: translateX(0);
}

/* 底部按钮 */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 20px;
  border-top: 1px solid #e5e6eb;
}

.close-btn {
  padding: 10px 32px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.close-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
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
<style scoped></style>