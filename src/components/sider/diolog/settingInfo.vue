<template>
  <div class="">
    <a-modal v-model:visible="visible" :width="800" title="个人信息">
      <div class="w-full h-full flex flex-col gap-[20px]">
        <div>
          <a-input placeholder="请输入用户名" v-model="username"></a-input>
        </div>
        <div>
          <a-input placeholder="请输入邮箱" v-model="email"></a-input>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
/**
* @description 用户信息编辑
*/
import { ref, onMounted, reactive, toRefs } from 'vue';
import { getUserInfo, updateUserInfo } from '@/api/user';
import type { UserInfo } from '@/components/type';

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

// 获取用户信息
// const fetchUserInfo = async () => {
//   try {
//     userInfo.value = await getUserInfo();
//     username.value = userInfo.value.name;
//     email.value = userInfo.value.email;
//   } catch (error) {
//     console.error('获取用户信息失败', error);
//   }
// };

// 更新用户信息
const saveUserInfo = async () => {
  try {
    const updatedUser = await updateUserInfo({
      name: username.value,
      email: email.value
    });
    userInfo.value = updatedUser;
    console.log('用户信息更新成功');
  } catch (error) {
    console.error('更新用户信息失败', error);
  }
};

// 打开对话框时获取最新用户信息
const openDialog = () => {
  visible.value = true;
  // fetchUserInfo();
};

// 导出方法供外部调用
defineExpose({
  visible,
  openDialog
});

</script>

<style scoped></style>