<template>
  <div class="footer-container w-full h-full flex items-center justify-end gap-[16px] px-[20px]">
    <button 
      class="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white py-2 px-4 rounded transition-colors duration-200 flex items-center gap-2"
      :disabled="!hasUnsavedChanges || saving"
      @click="handleSave"
    >
      <span v-if="saving" class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
      {{ saving ? '保存中...' : '保存' }}
    </button>
    <!-- <button class="bg-white text-black py-2 px-4 rounded">取消</button> -->
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTabsStore } from '@/store/tabs'
import { Message } from '@arco-design/web-vue'

// 状态管理
const tabsStore = useTabsStore()
const saving = ref(false)

// 计算属性：是否有未保存的更改
const hasUnsavedChanges = computed(() => {
  return tabsStore.hasModifiedTabs
})

// 保存处理函数
const handleSave = async () => {
  if (!hasUnsavedChanges.value || saving.value) return
  
  try {
    saving.value = true
    
    // 触发全局保存事件
    window.dispatchEvent(new CustomEvent('manual-save-request'))
    
    // 给用户一点时间看到保存状态，然后重置
    setTimeout(() => {
      saving.value = false
    }, 1000)
    
  } catch (error) {
    console.error('保存失败:', error)
    Message.error('保存失败，请重试')
    saving.value = false
  }
}
</script>

<style scoped>

</style>