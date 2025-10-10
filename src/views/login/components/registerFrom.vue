<template>
  <div>
    <!-- 注册表单弹窗 -->
    <a-modal v-model:visible="visible" title="用户注册" :width="500" @cancel="handleCancel" :footer="false">
      <a-form :model="form" layout="vertical" @submit="handleRegister">
        <a-form-item field="email" label="邮箱" :rules="[
          { required: true, message: '请输入邮箱' },
          { type: 'email', message: '请输入有效的邮箱地址' }
        ]">
          <a-input v-model="form.email" placeholder="请输入邮箱" allow-clear />
        </a-form-item>

        <a-form-item field="username" label="用户名" :rules="[
          { required: true, message: '请输入用户名' },
          { minLength: 3, message: '用户名至少3个字符' }
        ]">
          <a-input v-model="form.username" placeholder="请输入用户名" allow-clear />
        </a-form-item>

        <a-form-item field="password" label="密码" :rules="[
          { required: true, message: '请输入密码' },
          { minLength: 6, message: '密码至少6个字符' }
        ]">
          <a-input-password v-model="form.password" placeholder="请输入密码（至少6位）" allow-clear />
        </a-form-item>

        <a-form-item field="confirmPassword" label="确认密码" :rules="[
          { required: true, message: '请确认密码' },
          {
            validator: (value, cb) => {
              if (value !== form.password) {
                cb('两次输入的密码不一致')
              } else {
                cb()
              }
            }
          }
        ]">
          <a-input-password v-model="form.confirmPassword" placeholder="请再次输入密码" allow-clear />
        </a-form-item>

        <a-form-item>
          <div class="flex gap-2 w-full">
            <a-button type="outline" @click="handleCancel" class="flex-1">取消</a-button>
            <a-button type="primary" html-type="submit" :loading="loading" class="flex-1">注册</a-button>
          </div>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 注册成功后的确认弹窗 -->
    <a-modal v-model:visible="enterVisible" :width="400">
      <template #title>
        注册成功
      </template>
      <div class="py-4">
        <p class="text-center text-lg">是否立即登录？</p>
      </div>
      <template #footer>
        <a-button @click="handleCancelLogin" type="outline">稍后登录</a-button>
        <a-button @click="handleDirectLogin" type="primary">立即登录</a-button>
      </template>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
/**
* @description 用户注册组件
*/
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { registerUser } from '@/api/user';
import { useUserStore } from '@/store/user';
import { Message } from '@arco-design/web-vue';

const router = useRouter();
const userStore = useUserStore();

const visible = ref(false);
const enterVisible = ref(false);
const loading = ref(false);

// 保存注册返回的token信息
let registerResponse: any = null;

const form = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  email: ''
});

// 注册处理函数
const handleRegister = async () => {
  // 验证密码是否一致
  if (form.password !== form.confirmPassword) {
    Message.warning('两次输入的密码不一致');
    return;
  }

  // 验证用户名长度
  if (form.username.length < 3) {
    Message.warning('用户名至少3个字符');
    return;
  }

  // 验证密码长度
  if (form.password.length < 6) {
    Message.warning('密码至少6个字符');
    return;
  }

  try {
    loading.value = true;

    const data = {
      username: form.username,
      password: form.password,
      email: form.email
    };

    const res = await registerUser(data);
    console.log('注册响应:', res);

    // 保存注册返回的token信息
    registerResponse = res;

    Message.success('注册成功');
    visible.value = false;

    // 显示是否直接登录的确认弹窗
    enterVisible.value = true;
  } catch (error: any) {
    console.error('注册失败:', error);
    const errorMessage = error?.response?.data?.message || error?.message || '注册失败，请稍后重试';
    Message.error(errorMessage);
  } finally {
    loading.value = false;
  }
};

// 直接登录
const handleDirectLogin = () => {
  if (registerResponse) {
    // 保存token到store
    if (registerResponse.access_token) {
      userStore.setToken(registerResponse.access_token);

      // 设置用户信息
      if (registerResponse.user) {
        userStore.setUser({
          name: registerResponse.user.name || form.username,
          email: registerResponse.user.email || form.email,
          avatar: registerResponse.user.avatar || '',
          isLoggedIn: true
        });
      } else {
        userStore.setUser({
          name: form.username,
          email: form.email,
          avatar: '',
          isLoggedIn: true
        });
      }

      Message.success('登录成功');
      enterVisible.value = false;

      // 跳转到工作台
      router.push('/workspace');
    }
  }
};

// 稍后登录（返回登录页）
const handleCancelLogin = () => {
  enterVisible.value = false;
  Message.info('请使用您的账号密码登录');
  // 清空表单
  resetForm();
};

// 打开注册弹窗
const handleOpen = () => {
  visible.value = true;
  resetForm();
};

// 关闭注册弹窗
const handleCancel = () => {
  visible.value = false;
  resetForm();
};

// 重置表单
const resetForm = () => {
  form.username = '';
  form.password = '';
  form.confirmPassword = '';
  form.email = '';
};

// 暴露方法给父组件调用
defineExpose({
  handleOpen,
  handleCancel
});
</script>

<style scoped></style>