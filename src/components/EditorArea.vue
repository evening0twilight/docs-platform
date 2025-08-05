<template>
  <div class="editorContainer w-full h-full flex">
    <ToolList :editor="editor" />
    <editor-content :editor="editor" class="w-full h-full" />
  </div>
</template>

<script setup lang="ts">
/**
* @description 
*/
import { ref, onMounted, reactive, toRefs, onBeforeUnmount } from 'vue';
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import ToolList  from './editor/ToolList.vue';

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
  content: "<p>I'm running Tiptap with Vue.js. 🎉</p>",
  extensions: [StarterKit],
})

</script>

<style scoped>
.editorContainer {
  width: 100%;
  height: 100%;
  border: 2px solid #dcdfe6;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  /* 防止外层出现滚动 */
}</style>