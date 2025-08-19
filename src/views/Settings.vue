<template>
  <div class="settings-container w-full h-full p-6">
    <div class="max-w-4xl mx-auto">
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-gray-800 mb-2">设置</h1>
        <p class="text-gray-600">管理您的个人设置和偏好</p>
      </div>
      
      <a-card class="mb-6">
        <template #title>
          <div class="flex items-center">
            <icon-user class="mr-2" />
            个人信息
          </div>
        </template>
        
        <a-form layout="vertical" :model="userForm">
          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="用户名" field="username">
                <a-input v-model="userForm.username" />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="邮箱" field="email">
                <a-input v-model="userForm.email" />
              </a-form-item>
            </a-col>
          </a-row>
          
          <a-form-item label="个人简介" field="bio">
            <a-textarea 
              v-model="userForm.bio" 
              :max-length="200"
              show-word-limit
              placeholder="简单介绍一下自己..."
            />
          </a-form-item>
        </a-form>
      </a-card>
      
      <a-card class="mb-6">
        <template #title>
          <div class="flex items-center">
            <icon-settings class="mr-2" />
            编辑器设置
          </div>
        </template>
        
        <a-form layout="vertical" :model="editorSettings">
          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="主题" field="theme">
                <a-select v-model="editorSettings.theme">
                  <a-option value="light">浅色主题</a-option>
                  <a-option value="dark">深色主题</a-option>
                  <a-option value="auto">跟随系统</a-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="字体大小" field="fontSize">
                <a-slider 
                  v-model="editorSettings.fontSize"
                  :min="12"
                  :max="20"
                  :marks="{ 12: '12px', 16: '16px', 20: '20px' }"
                />
              </a-form-item>
            </a-col>
          </a-row>
          
          <a-form-item>
            <a-switch v-model="editorSettings.autoSave">
              <template #checked>开启自动保存</template>
              <template #unchecked>关闭自动保存</template>
            </a-switch>
          </a-form-item>
        </a-form>
      </a-card>
      
      <div class="flex justify-end gap-4">
        <a-button @click="resetSettings">重置</a-button>
        <a-button type="primary" @click="saveSettings">保存设置</a-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { Message } from '@arco-design/web-vue'

const userForm = reactive({
  username: '用户名',
  email: 'user@example.com',
  bio: ''
})

const editorSettings = reactive({
  theme: 'light',
  fontSize: 14,
  autoSave: true
})

const saveSettings = () => {
  // 保存设置到本地存储或发送到服务器
  localStorage.setItem('userSettings', JSON.stringify({
    user: userForm,
    editor: editorSettings
  }))
  
  Message.success('设置保存成功')
}

const resetSettings = () => {
  // 重置为默认值
  Object.assign(userForm, {
    username: '用户名',
    email: 'user@example.com',
    bio: ''
  })
  
  Object.assign(editorSettings, {
    theme: 'light',
    fontSize: 14,
    autoSave: true
  })
  
  Message.info('设置已重置')
}
</script>

<style scoped>
.settings-container {
  background-color: #f8f9fa;
  min-height: 100vh;
}
</style>
