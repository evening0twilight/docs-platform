<template>
  <div class="user-popover-container">
    <!-- 用户信息卡片 -->
    <div class="user-info-card">
      <div class="user-avatar-section">
        <div class="avatar-wrapper">
          <a-avatar :image-url="userInfo.avatar || defaultAvatar" :size="50" class="user-avatar" />
          <div class="avatar-ring"></div>
        </div>
        <div class="user-details">
          <p class="user-name">{{ userInfo.name }}</p>
          <p class="user-email">{{ userInfo.email }}</p>
        </div>
      </div>
    </div>

    <!-- 分割线 -->
    <div class="divider-line"></div>

    <!-- 操作按钮区域 -->
    <div class="action-buttons">
      <div class="action-button info-button" @click="openUserInfoDialog">
        <div class="button-icon">
          <a-avatar :imageUrl="PersonSvg" :size="22" />
        </div>
        <span class="button-text">个人信息</span>
        <div class="button-arrow">→</div>
      </div>

      <div class="action-button logout-button" @click="handleLogout">
        <div class="button-icon">
          <a-avatar :imageUrl="LogoutSvg" :size="22" />
        </div>
        <span class="button-text">退出登录</span>
        <div class="button-arrow">→</div>
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
import defaultAvatar from '@/assets/头像.svg';

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
.user-popover-container {
  width: 320px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.4);
  position: relative;
  overflow: hidden;
}

.user-popover-container::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
  animation: rotate 20s linear infinite;
}

@keyframes rotate {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

/* 用户信息卡片 */
.user-info-card {
  position: relative;
  z-index: 1;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 16px;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.user-avatar-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.avatar-wrapper {
  position: relative;
}

.user-avatar {
  border: 3px solid #fff;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.avatar-ring {
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  border-radius: 50%;
  border: 2px solid transparent;
  background: linear-gradient(135deg, #667eea, #764ba2) border-box;
  mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
  -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }

  50% {
    opacity: 0.6;
    transform: scale(1.05);
  }
}

.user-details {
  flex: 1;
}

.user-name {
  font-size: 18px;
  font-weight: 600;
  color: #1d2129;
  margin: 0 0 6px 0;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.user-email {
  font-size: 13px;
  color: #86909c;
  margin: 0;
}

/* 分割线 */
.divider-line {
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent);
  margin: 16px 0;
  position: relative;
  z-index: 1;
}

/* 操作按钮区域 */
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
  position: relative;
  z-index: 1;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
}

.action-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  transition: left 0.5s ease;
}

.action-button:hover::before {
  left: 100%;
}

.action-button:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.info-button:hover {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
}

.logout-button:hover {
  background: linear-gradient(135deg, rgba(245, 63, 63, 0.1), rgba(255, 125, 0, 0.1));
}

.button-icon :deep(.arco-avatar) {
  background-color: transparent !important;
  transition: transform 0.3s ease;
}

.action-button:hover .button-icon :deep(.arco-avatar) {
  transform: scale(1.1);
}

.button-text {
  flex: 1;
  font-size: 15px;
  font-weight: 500;
  color: #1d2129;
}

.logout-button .button-text {
  color: #f53f3f;
}

.button-arrow {
  font-size: 18px;
  font-weight: bold;
  color: #86909c;
  opacity: 0;
  transform: translateX(-10px);
  transition: all 0.3s ease;
}

.action-button:hover .button-arrow {
  opacity: 1;
  transform: translateX(0);
}

.info-button:hover .button-arrow {
  color: #667eea;
}

.logout-button:hover .button-arrow {
  color: #f53f3f;
}
</style>

<!-- 生效的 -->
<!-- h1 -->
<!-- 下划线 -->
<!-- 横线 -->
<!-- 加粗 -->
<!-- 斜体 -->