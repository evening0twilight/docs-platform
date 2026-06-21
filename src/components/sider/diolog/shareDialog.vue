<template>
  <a-modal v-model:visible="visible" title="分享文档" :mask-closable="false" width="500px">
    <div class="share-content">
      <a-form :model="formData" layout="vertical">
        <!-- 用户邮箱或ID -->
        <a-form-item label="分享给用户" required>
          <a-input v-model="formData.userIdentifier" placeholder="输入用户邮箱或用户ID" allow-clear />
          <div class="form-tip">可以输入用户的邮箱地址或用户 ID</div>
        </a-form-item>

        <!-- 权限角色选择 -->
        <a-form-item label="权限角色" required>
          <a-radio-group v-model="formData.role" direction="vertical">
            <a-radio value="editor">
              <div class="role-option">
                <div class="role-title">编辑者</div>
                <div class="role-desc">可以查看和编辑文档内容</div>
              </div>
            </a-radio>
            <a-radio value="viewer">
              <div class="role-option">
                <div class="role-title">查看者</div>
                <div class="role-desc">只能查看文档内容，无法编辑</div>
              </div>
            </a-radio>
          </a-radio-group>
        </a-form-item>

        <!-- 分享成功提示(按用户授权,无需复制链接) -->
        <a-form-item v-if="shared">
          <div class="form-tip success">
            ✓ 已分享给该用户,对方将在「分享给我」中看到此文档(按账号授权,无需发送链接)
          </div>
        </a-form-item>
      </a-form>
    </div>
    <template #footer>
      <a-space>
        <a-button @click="handleCancel">{{ shared ? '关闭' : '取消' }}</a-button>
        <a-button v-if="!shared" type="primary" :loading="loading" @click="handleShare">
          分享
        </a-button>
      </a-space>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { http } from '@/utils/request'
import { Message } from '@arco-design/web-vue'

const visible = ref(false)
const loading = ref(false)
const shared = ref(false)
const documentId = ref<string | number>('')

const formData = reactive({
  userIdentifier: '',
  role: 'editor' as 'editor' | 'viewer',
})

// openDialog 传入文档对象或文档id
function openDialog(doc?: any) {
  // 重置表单
  formData.userIdentifier = ''
  formData.role = 'editor'
  shared.value = false

  // 设置文档ID
  if (doc) {
    if (typeof doc === 'string' || typeof doc === 'number') {
      documentId.value = doc
    } else if (doc.id) {
      documentId.value = doc.id
    }
  }

  visible.value = true
}

async function handleShare() {
  // 验证输入
  if (!formData.userIdentifier.trim()) {
    Message.warning('请输入用户邮箱或ID')
    return
  }

  if (!documentId.value) {
    Message.error('文档ID不存在')
    return
  }

  try {
    loading.value = true

    // 调用后端分享API
    // POST /api/documents/:documentId/permissions/share
    const res: any = await http.post(
      `/documents/${documentId.value}/permissions/share`,
      {
        userIdentifier: formData.userIdentifier,
        role: formData.role,
      }
    )

    Message.success('分享成功！')
    shared.value = true

  } catch (error: any) {
    console.error('分享失败:', error)
    const errMsg = error?.response?.data?.message || error?.message || '分享失败，请重试'
    Message.error(errMsg)
  } finally {
    loading.value = false
  }
}

// 取消/关闭
function handleCancel() {
  visible.value = false
}

defineExpose({ openDialog })
</script>

<style scoped>
.share-content {
  padding: 8px 0;
}

.form-tip {
  font-size: 12px;
  color: var(--c-text-3);
  margin-top: 4px;
}

.form-tip.success {
  color: #00b42a;
}

.role-option {
  margin-left: 8px;
}

.role-title {
  font-weight: 500;
  color: var(--c-text);
  margin-bottom: 2px;
}

.role-desc {
  font-size: 12px;
  color: var(--c-text-3);
}

:deep(.arco-radio) {
  margin-bottom: 12px;
}

:deep(.arco-input-group) {
  display: flex;
}

:deep(.arco-input-group .arco-input-wrapper) {
  flex: 1;
}
</style>
