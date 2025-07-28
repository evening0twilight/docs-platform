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
      <div class="flex justify-start items-center w-full gap-2 h-[30px] rounded-lg p-2 buttonArea">
        <div>
          <a-avatar :imageUrl=LogoutSvg :size="20" />
        </div>
        <div class="flex justify-center items-center text-red-500">
          退出登录
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { UserInfo } from '../type';
import PersonSvg from '@/assets/personInformation.svg';
import LogoutSvg from '@/assets/logout.svg';

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