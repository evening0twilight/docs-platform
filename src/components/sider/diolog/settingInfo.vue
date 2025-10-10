<template>
  <teleport to="body">
    <a-modal v-model:visible="visible" :width="800" title="个人信息" :mask-closable="false" :esc-to-close="false"
      @cancel="closeDialog">
      <div class="w-full h-full flex flex-col gap-[20px]" @click.stop>
        <div>
          <div class="mb-2 text-sm text-gray-600">用户名</div>
          <a-input placeholder="请输入用户名" v-model="username" allow-clear></a-input>
        </div>
        <div>
          <div class="mb-2 text-sm text-gray-600">邮箱</div>
          <a-input placeholder="请输入邮箱" v-model="email" allow-clear></a-input>
        </div>
        <div>
          <a-divider :margin="0" />
          <div class="mt-4">
            <a-button type="text" @click="openChangePasswordDialog" class="text-blue-500">
              <template #icon>
                <icon-lock />
              </template>
              修改密码
            </a-button>
          </div>
        </div>
      </div>

      <!-- 添加底部按钮 -->
      <template #footer>
        <div class="flex justify-end gap-2">
          <a-button @click="closeDialog" type="outline">取消</a-button>
          <a-button @click="saveUserInfo" type="primary" :loading="loading">保存</a-button>
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
import { IconLock } from '@arco-design/web-vue/es/icon';
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

// 修改密码弹窗ref
const changePasswordRef = ref<InstanceType<typeof ChangePassword>>();

// 打开对话框时从store加载用户信息
const openDialog = () => {
  visible.value = true;
  // 从store加载用户信息
  username.value = userStore.name || '';
  email.value = userStore.email || '';
  console.log('加载用户信息:', username.value, email.value);
};

// 打开修改密码弹窗
const openChangePasswordDialog = () => {
  changePasswordRef.value?.openDialog();
};

// 更新用户信息
const saveUserInfo = async () => {
  try {
    if (!username.value.trim()) {
      Message.warning('用户名不能为空');
      return;
    }

    // 验证邮箱格式
    if (email.value && !isValidEmail(email.value)) {
      Message.warning('请输入有效的邮箱地址');
      return;
    }

    loading.value = true;

    // 调用API更新用户信息，使用正确的字段名
    const updatedUser = await updateUserInfo({
      username: username.value,
      email: email.value
    });

    // 更新store中的用户信息
    userStore.setUser({
      name: username.value,
      email: email.value
    });

    userInfo.value = updatedUser;
    Message.success('用户信息更新成功');
    closeDialog();
    console.log('用户信息更新成功');
  } catch (error: any) {
    console.error('更新用户信息失败', error);
    const errorMessage = error?.response?.data?.message || error?.message || '更新用户信息失败，请稍后重试';
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
};

// 导出方法供外部调用
defineExpose({
  visible,
  openDialog,
  closeDialog
});

</script>

<style scoped></style>