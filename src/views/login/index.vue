<template>
  <div class="login-container">
    <!-- 添加动态渐变背景 -->
    <LoginBackground :colors="['#ff595e', '#ffca3a', '#8ac926', '#1982c4']" :speed="20" :angle="135" />

    <!-- 引入登录表单组件 -->
    <LoginForm />
  </div>
</template>

<script setup lang="ts">
import LoginBackground from './components/loginBackground.vue';
import LoginForm from './components/loginForm.vue';
</script>

<style lang="scss" scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}
</style>

<!-- // 自然清新风格
['#a8e6cf', '#dcedc1', '#ffd3b6', '#ffaaa5'] // 薄荷绿 + 柔粉
['#caf0f8', '#90e0ef', '#00b4d8', '#0077b6'] // 天蓝渐变
['#ccf5ac', '#b0efeb', '#eddcd2', '#fff1e6'] // 浅绿 + 米白
['#e0fbfc', '#98c1d9', '#ee6c4d', '#293241'] // 天空蓝 + 珊瑚色

// 柔和梦幻风格
['#d9bfd7', '#c4a7bf', '#a38cb3', '#7d80a0'] // 淡紫渐变
['#ffcdb2', '#ffb4a2', '#e5989b', '#b5838d'] // 柔粉渐变
['#fdc5f5', '#f7aef8', '#b388eb', '#8093f1'] // 粉紫渐变
['#f2d0a9', '#f2a279', '#d96459', '#8c4646'] // 暖棕渐变

// 现代简约风格
['#f8f9fa', '#e9ecef', '#dee2e6', '#ced4da'] // 高级灰
['#faf3dd', '#c8d5b9', '#8fc0a9', '#68b0ab'] // 绿灰调
['#f0efeb', '#d8cec6', '#a9927d', '#5e503f'] // 大地色系
['#edf2fb', '#e2eafc', '#d7e3fc', '#ccdbfd'] // 淡蓝灰

// 活力明亮风格
['#ff99c8', '#fcf6bd', '#d0f4de', '#a9def9'] // 糖果色
['#ff595e', '#ffca3a', '#8ac926', '#1982c4'] // 明亮多彩
['#f72585', '#7209b7', '#3a0ca3', '#4361ee'] // 霓虹紫蓝
['#f94144', '#f3722c', '#f8961e', '#f9c74f'] // 暖色调

// 深色高级风格
['#0d1b2a', '#1b263b', '#415a77', '#778da9'] // 深蓝灰
['#22223b', '#4a4e69', '#9a8c98', '#c9ada7'] // 深紫灰
['#001219', '#005f73', '#0a9396', '#94d2bd'] // 深绿蓝
['#390099', '#9e0059', '#ff0054', '#ff5400'] // 深红紫

// 更多自然灵感
['#606c38', '#283618', '#fefae0', '#dda15e'] // 森林色系
['#007f5f', '#2b9348', '#55a630', '#80b918'] // 绿色系
['#03071e', '#370617', '#6a040f', '#9d0208'] // 深红色系
['#ffcbf2', '#f3c4fb', '#ecbcfd', '#e5b3fe'] // 淡紫色系

// 海洋灵感
['#0077b6', '#00b4d8', '#90e0ef', '#caf0f8'] // 海洋蓝
['#03045e', '#023e8a', '#0077b6', '#0096c7'] // 深海蓝
['#48cae4', '#90e0ef', '#ade8f4', '#caf0f8'] // 浅海蓝

// 日落天空
['#ff9e00', '#ffca3a', '#ff595e', '#6a4c93'] // 日落色调
['#ff5e5b', '#ff9d5c', '#ffca5c', '#8ac926'] // 夕阳暖色
['#ff6b6b', '#ff9d5c', '#ffca5c', '#4ecdc4'] // 日落渐变

// 柔和商务风
['#264653', '#2a9d8f', '#e9c46a', '#f4a261'] // 高级商务
['#3d5a80', '#98c1d9', '#e0fbfc', '#ee6c4d'] // 专业蓝橙
['#1a535c', '#4ecdc4', '#f7fff7', '#ff6b6b'] // 商务绿红

// 更多选择
['#f72585', '#b5179e', '#7209b7', '#560bad'] // 紫红色系
['#f94144', '#f3722c', '#f8961e', '#f9844a'] // 橙红色系
['#90be6d', '#43aa8b', '#4d908e', '#577590'] // 自然绿蓝
['#f9c74f', '#90be6d', '#43aa8b', '#577590'] // 黄绿色系 -->