<template>
  <div class="w-[300px] h-[170px] rounded-xl bg-[#FFFFE0] flex flex-col p-4 userContainer gap-4tiuanzhey ">
    <div class="flex items-center ">
      <!-- 使用条件判断显示用户头像 -->
      <a-avatar
        :imageUrl="userInfo.avatar || 'https://p1-arco.byteimg.com/tos-cn-i-uwbnlip3yd/3ee5f13fb09879ecb5185e440cef6eb9123.png~tplv-uwbnlip3yd-webp.webp'"
        :size="30" class="mr-3" />
      <div>
        <p class="">{{ userInfo.name }}</p>
        <p class="text-gray-400 text-sm">{{ userInfo.email }}</p>
      </div>
    </div>
    <a-divider :size="1" :margin="8" />
    <!-- 根据power显示不同权限信息 -->
    <!-- <p class="text-gray-300 text-xs mt-2">
      权限级别: {{ userInfo.power === 1 ? '普通用户' : userInfo.power === 2 ? '高级用户' : '管理员' }}
    </p> -->
    <div class="flex flex-col justify-between items-start p-2 w-full buttonContainer gap-2">
      <div class="flex justify-start items-center w-full gap-2 h-[30px] rounded-lg p-2 buttonArea">
        <div>
          <a-avatar :imageUrl=PersonSvg :size="20" />
        </div>
        <div class="flex justify-center items-center cursor-pointer" @click="openUserInfoDialog">
          个人信息
        </div>
      </div>
      <div class="flex justify-start items-center w-full gap-2 h-[30px] rounded-lg p-2 buttonArea" @click="handleLogout">
        <div>
          <a-avatar :imageUrl=LogoutSvg :size="20" />
        </div>
        <div class="flex justify-center items-center text-red-500 cursor-pointer">
          退出登录
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Modal, Message } from '@arco-design/web-vue';
import { useUserStore } from '@/store/user';
import { logoutUser } from '@/api/user';
import type { UserInfo } from '../type';
import PersonSvg from '@/assets/personInformation.svg';
import LogoutSvg from '@/assets/logout.svg';

const router = useRouter();
const userStore = useUserStore();

// 接收完整的userInfo对象
defineProps<{
  userInfo: UserInfo;
}>();

const emit = defineEmits<{
  openSettingDialog: [];
}>();

const openUserInfoDialog = () => {
  emit('openSettingDialog');
  console.log('打开个人信息1');
}

// 退出登录
const handleLogout = () => {
  Modal.confirm({
    title: '确认退出',
    content: '确定要退出登录吗？',
    okText: '确定',
    cancelText: '取消',
    onOk: async () => {
      try {
        // 调用后端登出接口
        await logoutUser();
        
        // 清除本地token和用户信息
        userStore.logout();
        
        Message.success('已退出登录');
        
        // 跳转到登录页
        router.push('/login');
      } catch (error) {
        console.error('退出登录失败:', error);
        // 即使后端接口失败，也清除本地数据
        userStore.logout();
        Message.warning('已退出登录');
        router.push('/login');
      }
    }
  });
};


</script>

<style scoped>
.buttonContainer :deep(.arco-avatar) {
  background-color: transparent !important;
}

.buttonArea {
  cursor: pointer;
}

.buttonArea:hover {
  background-color: #00FF0020;
}
</style>

<!-- 生效的 -->
<!-- h1 -->
<!-- 下划线 -->
<!-- 横线 -->
<!-- 加粗 -->
<!-- 斜体 -->