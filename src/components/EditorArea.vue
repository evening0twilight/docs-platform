<template>
  <div class="editorContainer w-full h-full flex flex-col overflow-hidden">
    <ToolList :editor="editor" />
    <editor-content :editor="editor" class="w-full h-full text-black" />
  </div>
</template>

<script setup lang="ts">
/**
* @description 
*/
import { ref, onMounted, reactive, toRefs, onBeforeUnmount } from 'vue';
import { useEditor, EditorContent } from '@tiptap/vue-3'
import Highlight from '@tiptap/extension-highlight'
import Superscript from '@tiptap/extension-superscript'
import Subscript from '@tiptap/extension-subscript'
import StarterKit from '@tiptap/starter-kit'
import ToolList from './editor/ToolList.vue';

interface State {
  // editor: any
}

const state = reactive<State>({
  // editor: null
});

const {
  // editor
} = toRefs(state);

const editor = useEditor({
  // content: null,
  extensions: [
    StarterKit,
    Highlight,
    Subscript
  ],
  editable: true, // 该用户是否可编辑
  injectCSS: false, // 是否注入默认的 CSS 样式
})

</script>

<style scoped>
.editorContainer {
  width: 100%;
  height: 100%;
  /* border: 2px solid #dcdfe6; */
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.editorContainer :deep(.ProseMirror) {
  width: 100%;
  height: calc(100vh - 260px);
  border: 1px black solid;
  border-radius: 10px;
  display: block;
  box-sizing: border-box;
  overflow-y: hidden;
  align-items: flex-start !important;
  justify-content: flex-start !important;
  text-align: left !important;
  margin: 0 !important;
  padding: 10px 5px 10px 5px !important;
  overflow: auto;
}
</style>