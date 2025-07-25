<template>
  <div class="sidebarContainer w-full h-full flex flex-col gap-[20px] px-[20px] py-[10px] bg-[#00FFFF] overflow-hidden">
    <!-- logo+用户信息 -->
    <div class="flex items-center justify-between h-[50px] flex-shrink-0">
      <!-- logo -->
      <div class="flex items-center justify-center">
        <a-space size="large">
          <a-avatar :imageUrl="imgUrl" v-if="imgUrl">
          </a-avatar>
          <a-avatar :imageUrl="unImgUrl" v-else>
          </a-avatar>
        </a-space>
      </div>
      <!-- 用户头像 -->
      <div class="flex items-center justify-center">
        <a-popover position="bl" trigger="hover"
          :content-style="{ padding: '0', background: 'transparent', boxShadow: 'none', border: 'none' }">
          <a-space size="large">
            <a-avatar :imageUrl="userInfo.avatar || unImgUrl" :style="{ cursor: 'pointer' }" />
          </a-space>

          <!-- 用户信息弹窗 -->
          <template #content>
            <UserDiolog :userInfo="userInfo" />
          </template>
        </a-popover>
      </div>
    </div>
    <!-- 搜索+添加 -->
    <div class="w-full flex justify-between items-center justify-between h-[50px] flex-shrink-0">
      <div class="w-[80%]">
        <a-input placeholder="搜索" allowClear></a-input>
      </div>
      <div class="flex items-center justify-center">
        <a-popover position="bl" trigger="hover" :content-style="{ padding: '0' }">
          <a-space size="small">
            <a-avatar :imageUrl="addSvg" :size="30" :style="{ cursor: 'pointer' }" shape="square" />
          </a-space>
          <!-- 用户信息弹窗 -->
          <template #content>
            <AddDiolog />
          </template>
        </a-popover>
      </div>
    </div>
    <!-- 文档 -->
    <div class="flex-1 overflow-auto">
    </div>
    <!-- 历史记录 -->
    <div class="w-full h-[50px] flex justify-center items-center px-[10px] py-[1px] flex-shrink-0">
      <div class=" w-4/5 h-4/5 rounded-lg border-solid border border-black flex items-center justify-center z-[5px]"
        @click="changeDiolog">
        历史记录
      </div>
    </div>
  </div>
  <HistoryDiolog ref="historyDialog" />
</template>

<script setup lang="ts">
/**
* @description 侧边栏组件
*/
import { ref, onMounted, reactive, toRefs } from 'vue'
import UserDiolog from './sider/user.vue'
import AddDiolog from './sider/add.vue';
import HistoryDiolog from './sider/historyDiolog.vue';
import type { UserInfo } from './type';
import addSvg from '@/assets/add.svg';

interface State {
  imgUrl: string | undefined;
  userInfo: UserInfo; // 将userInfo添加到响应式state中
}

// 没有头像的默认图片
const unImgUrl = ref<string>("https://p1-arco.byteimg.com/tos-cn-i-uwbnlip3yd/3ee5f13fb09879ecb5185e440cef6eb9123.png~tplv-uwbnlip3yd-webp.webp");

const state = reactive<State>({
  imgUrl: 'https://p1-arco.byteimg.com/tos-cn-i-uwbnlip3yd/3ee5f13fb09879ecb5185e440cef6eb9.png~tplv-uwbnlip3yd-webp.webp',
  // 初始化userInfo，包含所有必要的字段
  userInfo: {
    id: '10001',
    name: '默认用户',
    email: 'default@example.com',
    power: 1,
    avatar: undefined
  },
});

const {
  imgUrl,
  userInfo,
} = toRefs(state);

const historyDialog = ref<InstanceType<typeof HistoryDiolog>>();

const changeDiolog = () => {
  historyDialog.value.openDiolog();
};

onMounted(() => {
  // 模拟获取用户信息 - 更新已有的userInfo对象
  userInfo.value = {
    id: '10001',
    name: '张三',
    email: 'zhangsan@example.com',
    power: 2, // 添加必需的power字段
    avatar: imgUrl.value // 使用imgUrl作为头像
  };

  // 这里可以添加实际的API调用来获取用户信息
  // fetchUserInfo().then(data => {
  //   userInfo.value = data;
  // });
});
</script>

<style scoped></style>