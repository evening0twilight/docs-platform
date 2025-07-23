<template>
  <div class="tiptap-editor">
    <editor-content :editor="editor" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, watch } from 'vue'
import { Editor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { WebrtcProvider } from 'y-webrtc'
import * as Y from 'yjs'

interface Props {
  documentId: string
}

const props = defineProps<Props>()

// 初始化Y.js文档
const ydoc = new Y.Doc()
let provider: WebrtcProvider | null = null

// 初始化编辑器
const editor = new Editor({
  content: '',
  extensions: [
    StarterKit
  ]
})

// 设置协同编辑
const setupCollaboration = () => {
  if (provider) {
    provider.destroy()
  }

  provider = new WebrtcProvider(props.documentId, ydoc)
  const yXmlFragment = ydoc.getXmlFragment('prosemirror')

  editor.commands.setContent(yXmlFragment)
}

// 监听documentId变化
watch(() => props.documentId, () => {
  setupCollaboration()
})

onMounted(() => {
  setupCollaboration()
})

onBeforeUnmount(() => {
  provider?.destroy()
  editor.destroy()
})
</script>

<style lang="scss">
.tiptap-editor {
  height: 100%;

  .ProseMirror {
    height: 100%;
    outline: none;

    &:focus {
      outline: none;
    }
  }
}
</style>