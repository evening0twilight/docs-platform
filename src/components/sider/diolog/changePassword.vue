<template>
  <teleport to="body">
    <a-modal 
      v-model:visible="visible" 
      :width="600" 
      title="修改密码" 
      :mask-closable="false" 
      :esc-to-close="false"
      @cancel="closeDialog"
    >
      <div class="w-full h-full flex flex-col gap-[20px]" @click.stop>
        <div>
          <div class="mb-2 text-sm text-gray-600">当前密码</div>
          <a-input-password 
            placeholder="请输入当前密码" 
            v-model="currentPassword"
            allow-clear
          />
        </div>
        <div>
          <div class="mb-2 text-sm text-gray-600">新密码</div>
          <a-input-password 
            placeholder="请输入新密码（至少6位）" 
            v-model="newPassword"
            allow-clear
          />
        </div>
        <div>
          <div class="mb-2 text-sm text-gray-600">确认新密码</div>
          <a-input-password 
            placeholder="请再次输入新密码" 
            v-model="confirmPassword"
            allow-clear
          />
        </div>
      </div>

      <!-- 添加底部按钮 -->
      <template #footer>
        <div class="flex justify-end gap-2">
          <a-button @click="closeDialog" type="outline">取消</a-button>
          <a-button @click="handleChangePassword" type="primary" :loading="loading">确认修改</a-button>
        </div>
      </template>
    </a-modal>
  </teleport>
</template>

<script setup lang="ts">
/**
* @description 修改密码弹窗
*/
import { ref, reactive, toRefs } from 'vue';
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
</style>
