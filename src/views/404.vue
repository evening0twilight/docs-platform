<template>
  <div class="not-found-container w-full h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
    <div class="text-center">
      <!-- 404 数字 -->
      <div class="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-4">
        404
      </div>
      
      <!-- 错误信息 -->
      <h1 class="text-3xl font-bold text-gray-800 mb-4">页面未找到</h1>
      <p class="text-gray-600 mb-8 max-w-md">
        抱歉，您访问的页面不存在或已被移除。请检查网址是否正确，或返回首页继续浏览。
      </p>
      
      <!-- 操作按钮 -->
      <div class="space-x-4">
        <a-button type="primary" @click="goHome" size="large">
          <template #icon><icon-home /></template>
          返回首页
        </a-button>
        <a-button @click="goBack" size="large">
          <template #icon><icon-left /></template>
          返回上页
        </a-button>
      </div>
      
      <!-- 装饰图案 -->
      <div class="mt-16 opacity-60">
        <svg width="200" height="120" viewBox="0 0 200 120" fill="none">
          <circle cx="40" cy="40" r="20" fill="url(#gradient1)" />
          <circle cx="160" cy="40" r="15" fill="url(#gradient2)" />
          <circle cx="100" cy="80" r="25" fill="url(#gradient3)" />
          <defs>
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#8B5CF6" />
              <stop offset="100%" style="stop-color:#EC4899" />
            </linearGradient>
            <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#06B6D4" />
              <stop offset="100%" style="stop-color:#8B5CF6" />
            </linearGradient>
            <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#10B981" />
              <stop offset="100%" style="stop-color:#06B6D4" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/workspace')
}

const goBack = () => {
  if (window.history.length > 1) {
    router.go(-1)
  } else {
    router.push('/workspace')
  }
}
</script>

<style scoped>
.not-found-container {
  background-image: 
    radial-gradient(circle at 20% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(236, 72, 153, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 40% 40%, rgba(6, 182, 212, 0.1) 0%, transparent 50%);
}
</style>
