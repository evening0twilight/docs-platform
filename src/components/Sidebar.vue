<template>
  <div class="sidebarContainer w-full h-full flex flex-col gap-[20px] px-[20px] py-[10px] bg-[#00FFFF]">
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
            <UserDiolog :userInfo="userInfo" @open-setting-dialog="openUserSettingDialog" />
          </template>
        </a-popover>
      </div>
    </div>
    <!-- 搜索+添加 -->
    <div class="w-full flex items-center h-[50px] flex-shrink-0" style="gap: 20px;">
      <!-- 搜索框 -->
      <div class="flex-1">
        <a-input v-model="searchKeyword" placeholder="搜索文档..." @input="handleSearch" @clear="handleClearSearch"
          allow-clear :style="{ width: '100%' }" />
      </div>
      <!-- 添加按钮 -->
      <div class="flex items-center justify-center">
        <a-popover ref="addPopover" position="bl" trigger="click" :content-style="{ padding: '0' }">
          <a-space size="small">
            <a-avatar :imageUrl="addSvg" :size="30" :style="{ cursor: 'pointer' }" shape="square" />
          </a-space>
          <!-- 添加弹窗 -->
          <template #content>
            <AddDiolog @selectOne="selectOne" />
          </template>
        </a-popover>
      </div>
    </div>
    <!-- 文档 -->
    <div class="flex-1 overflow-auto">
      <DocsArea ref="docsArea" @document-click="handleDocumentClick" />
    </div>
    <!-- 历史记录 -->
    <!-- <div class="w-full h-[50px] flex justify-center items-center px-[10px] py-[1px] flex-shrink-0">
      <div class=" w-4/5 h-4/5 rounded-lg border-solid border border-black flex items-center justify-center z-[5px]"
        @click="changeDiolog">
        历史记录
      </div>
    </div> -->
    <!-- <HistoryDiolog ref="historyDialog" /> -->
    <SettingInfo ref="settingInfo" />
    <AddDocs ref="addDocs" :title="title" :selected="selected" @created="handleItemCreated" />
  </div>
</template>

<script setup lang="ts">
/**
* @description 侧边栏组件
*/
import { ref, onMounted, reactive, toRefs, nextTick, computed } from 'vue'
import { useUserStore } from '@/store/user'
import UserDiolog from './sider/user.vue'
import AddDiolog from './sider/add.vue';
import HistoryDiolog from './sider/historyDiolog.vue';
import type { UserInfo } from './type';
import addSvg from '@/assets/add.svg';
import SettingInfo from './sider/diolog/settingInfo.vue'
import AddDocs from './sider/diolog/addDocs.vue';
import DocsArea from './sider/docsArea.vue'

// 获取用户store
const userStore = useUserStore()

// 定义组件发射的事件
const emit = defineEmits<{
  'document-click': [doc: any]
}>();

interface State {
  imgUrl: string | undefined;
  title: string; // 确认是添加文档还是文件夹
  selected: string; // 表示选择的是文档还是文件夹
  searchKeyword: string; // 搜索关键词
}

// 没有头像的默认图片
const unImgUrl = ref<string>("https://p1-arco.byteimg.com/tos-cn-i-uwbnlip3yd/3ee5f13fb09879ecb5185e440cef6eb9123.png~tplv-uwbnlip3yd-webp.webp");

const state = reactive<State>({
  imgUrl: 'https://p1-arco.byteimg.com/tos-cn-i-uwbnlip3yd/3ee5f13fb09879ecb5185e440cef6eb9.png~tplv-uwbnlip3yd-webp.webp',
  title: '文档',
  selected: '文档',
  searchKeyword: '' // 搜索关键词初始值
});

const {
  imgUrl,
  title,
  selected,
  searchKeyword,
} = toRefs(state);

// 从store中获取用户信息
const userInfo = computed<UserInfo>(() => ({
  id: userStore.token || '10001', // 使用token作为临时id
  name: userStore.name || '默认用户',
  email: userStore.email || '',
  power: 1,
  avatar: userStore.avatar || undefined
}));

const historyDialog = ref<InstanceType<typeof HistoryDiolog>>();
const settingInfo = ref<InstanceType<typeof SettingInfo>>();
// AddDocs对话框的ref
const addDocs = ref<InstanceType<typeof AddDocs>>();
// DocsArea组件的ref
const docsArea = ref<InstanceType<typeof DocsArea>>();

// 在组件挂载后检查ref并获取用户信息
onMounted(async () => {
  nextTick(() => {
    console.log('nextTick后检查addDocs.value:', addDocs.value);
  });

  // 从store获取用户信息
  if (userStore.token && !userStore.name) {
    // 如果有token但没有用户信息，尝试获取
    await userStore.fetchUserInfo();
    console.log('已获取用户信息:', userStore.name, userStore.avatar);
  }
});
const addPopover = ref();

// 处理文档点击事件，传递给父组件
const handleDocumentClick = (doc: any) => {
  emit('document-click', doc);
};

// 历史记录弹窗
// const changeDiolog = () => {
//   historyDialog.value?.openDiolog();
// };

// 个人信息弹窗
const openUserSettingDialog = () => {
  settingInfo.value?.openDialog();
  console.log('打开个人信息2');
};

const openAddDocsDialog = () => {
  console.log('尝试打开AddDocs对话框, addDocs.value:', addDocs.value);
  if (addDocs.value && typeof addDocs.value.openDialog === 'function') {
    addDocs.value.openDialog();
  } else {
    console.error('addDocs组件还没有准备好或openDialog方法不存在');
  }
};

// 处理创建成功事件
const handleItemCreated = async (item: any) => {
  console.log('创建成功:', item);
  // 刷新文档列表
  if (docsArea.value && typeof docsArea.value.refresh === 'function') {
    try {
      await docsArea.value.refresh();
      console.log('文档列表刷新成功');
    } catch (error) {
      console.error('刷新文档列表失败:', error);
    }
  } else {
    console.warn('docsArea组件还没有准备好或refresh方法不存在');
  }
};

const selectOne = (item: any) => {
  console.log('选中的项:', item);
  // 更新状态
  title.value = item.title || item.name;
  selected.value = item.selected || '文档';
  openAddDocsDialog();
};

// 搜索处理方法
let searchTimer: any = null;
const handleSearch = (value: string) => {
  console.log('搜索关键词:', value);

  // 防抖处理
  if (searchTimer) {
    clearTimeout(searchTimer);
  }

  searchTimer = setTimeout(() => {
    // 调用DocsArea的搜索方法
    if (docsArea.value && typeof docsArea.value.search === 'function') {
      docsArea.value.search(value);
    }
  }, 300); // 300ms防抖
};

// 清除搜索
const handleClearSearch = () => {
  console.log('清除搜索');
  searchKeyword.value = '';
  // 调用DocsArea的重置搜索方法
  if (docsArea.value && typeof docsArea.value.resetSearch === 'function') {
    docsArea.value.resetSearch();
  }
};
</script>

<style scoped></style>