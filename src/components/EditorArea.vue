<template>
  <div class="w-full h-full flex">
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

<style scoped></style>