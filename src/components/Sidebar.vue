<template>
  <div class="sidebarContainer w-full h-full flex flex-col gap-[20px] px-[20px] py-[10px]">
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
    <div class="flex-1 overflow-auto flex flex-col" style="gap: 12px;">
      <!-- 我的文档区域 -->
      <div class="docs-section">
        <div class="section-header" @click="toggleMyDocs">
          <div class="header-left">
            <span class="toggle-icon">{{ myDocsExpanded ? '▼' : '▶' }}</span>
            <span class="section-title">我的文档</span>
          </div>
        </div>
        <div v-show="myDocsExpanded" class="section-content">
          <DocsArea ref="docsArea" @document-click="handleDocumentClick" />
        </div>
      </div>

      <!-- 分享给我的文档区域 -->
      <div class="docs-section shared-section">
        <div class="section-header" @click="toggleSharedDocs">
          <div class="header-left">
            <span class="toggle-icon">{{ sharedDocsExpanded ? '▼' : '▶' }}</span>
            <span class="section-title">分享给我</span>
            <span v-if="sharedDocuments.length > 0" class="count-badge">({{ sharedDocuments.length }})</span>
          </div>
        </div>
        <div v-show="sharedDocsExpanded" class="section-content">
          <!-- 加载状态 -->
          <div v-if="sharedDocsLoading" class="loading-state">
            <a-spin :size="20" />
            <span class="loading-text">加载中...</span>
          </div>
          <!-- 分享文档列表 -->
          <div v-else-if="sharedDocuments.length > 0" class="shared-docs-list">
            <div v-for="doc in sharedDocuments" :key="doc.id" class="shared-doc-item"
              :class="{ active: lastDoc?.id === doc.id }" @click="handleSharedDocClick(doc)">
              <div class="doc-icon">📄</div>
              <div class="doc-info">
                <div class="doc-name">{{ doc.name }}</div>
                <div class="doc-meta">
                  <span class="owner">{{ doc.owner.username }}</span>
                  <span class="separator">•</span>
                  <span class="permission" :class="'perm-' + doc.permission">
                    {{ doc.permission === 'editor' ? '可编辑' : '只读' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <!-- 空状态 -->
          <div v-else class="empty-state">
            <div class="empty-icon">📭</div>
            <div class="empty-text">暂无分享文档</div>
          </div>
        </div>
      </div>
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
import unImgUrl from '@/assets/头像.svg';
import { getSharedDocuments } from '@/api/docs'

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
  username: userStore.name || '默认用户',
  name: userStore.name || '默认用户', // 兼容旧版本
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
const lastDoc = ref<any>(null)

// 分享文档相关状态
const myDocsExpanded = ref(true)  // 我的文档默认展开
const sharedDocsExpanded = ref(false)  // 分享给我默认折叠
const sharedDocuments = ref<any[]>([])
const sharedDocsLoading = ref(false)

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

  // 获取分享给我的文档
  fetchSharedDocuments()
});
const addPopover = ref();

// 切换我的文档展开/折叠
const toggleMyDocs = () => {
  myDocsExpanded.value = !myDocsExpanded.value
}

// 切换分享文档展开/折叠
const toggleSharedDocs = () => {
  sharedDocsExpanded.value = !sharedDocsExpanded.value
  // 首次展开时加载数据
  if (sharedDocsExpanded.value && sharedDocuments.value.length === 0) {
    fetchSharedDocuments()
  }
}

// 获取分享给我的文档列表
const fetchSharedDocuments = async () => {
  try {
    sharedDocsLoading.value = true
    const res = await getSharedDocuments()
    sharedDocuments.value = res.documents || []
    console.log('分享给我的文档:', sharedDocuments.value)
  } catch (error) {
    console.error('获取分享文档失败:', error)
  } finally {
    sharedDocsLoading.value = false
  }
}

// 处理分享文档点击
const handleSharedDocClick = (doc: any) => {
  lastDoc.value = doc
  emit('document-click', doc)
}

// 处理文档点击事件，传递给父组件
const handleDocumentClick = (doc: any) => {
  // 保存最近一次点击的文档，便于分享等操作使用
  lastDoc.value = doc
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

<style scoped>
.sidebarContainer {
  background: linear-gradient(135deg, #ff7d00 0%, #ffb347 50%, #ff9500 100%);
  background-size: 200% 200%;
  animation: gradientShift 15s ease infinite;
}

@keyframes gradientShift {
  0% {
    background-position: 0% 50%;
  }

  50% {
    background-position: 100% 50%;
  }

  100% {
    background-position: 0% 50%;
  }
}

/* ====== 文档区域样式 ====== */
.docs-section {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.docs-section:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

/* 区域标题 */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  cursor: pointer;
  user-select: none;
  transition: all 0.3s ease;
}

.section-header:hover {
  background: linear-gradient(135deg, #5568d3 0%, #6a3f91 100%);
}

.section-header:active {
  transform: scale(0.98);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toggle-icon {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
  transition: transform 0.3s ease;
  display: inline-block;
  width: 16px;
  text-align: center;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
  letter-spacing: 0.5px;
}

.count-badge {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.85);
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
}

/* 区域内容 */
.section-content {
  padding: 8px;
  max-height: 500px;
  overflow-y: auto;
}

/* 分享文档区域特殊样式 */
.shared-section .section-header {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.shared-section .section-header:hover {
  background: linear-gradient(135deg, #e082ea 0%, #e4465b 100%);
}

/* ====== 加载状态 ====== */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  gap: 12px;
}

.loading-text {
  font-size: 13px;
  color: #86909c;
}

/* ====== 分享文档列表 ====== */
.shared-docs-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.shared-doc-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.shared-doc-item:hover {
  background: #f7f8fa;
  border-color: #d1d5db;
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.shared-doc-item.active {
  background: #e8f3ff;
  border-color: #4080ff;
  box-shadow: 0 2px 8px rgba(64, 128, 255, 0.15);
}

.doc-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.doc-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.doc-name {
  font-size: 14px;
  font-weight: 500;
  color: #1d2129;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.doc-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #86909c;
}

.owner {
  color: #4e5969;
  font-weight: 400;
}

.separator {
  color: #c9cdd4;
  font-weight: normal;
}

.permission {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
}

.permission.perm-editor {
  background: #e8f7ed;
  color: #00b42a;
}

.permission.perm-viewer {
  background: #fff7e8;
  color: #ff7d00;
}

/* ====== 空状态 ====== */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 16px;
  gap: 12px;
}

.empty-icon {
  font-size: 48px;
  opacity: 0.6;
}

.empty-text {
  font-size: 13px;
  color: #86909c;
  text-align: center;
}

/* 滚动条样式 */
.section-content::-webkit-scrollbar {
  width: 6px;
}

.section-content::-webkit-scrollbar-track {
  background: transparent;
}

.section-content::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}

.section-content::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.2);
}
</style>