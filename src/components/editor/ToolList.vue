<template>
  <div class="toolContainer ">
    <!-- h1 -->
    <div 
      :class="{ 'is-active': editor?.isActive('heading', { level: 1 }) }" 
      @click="editor?.chain().focus().toggleHeading({ level: 1 }).run()" 
    >
      <img :src="h1" />
    </div>
    <div></div>
    <div></div>
    <div></div>
    <div></div>
  </div>
</template>

<script setup lang="ts">
/**
* @description 
*/
import { ref, onMounted, reactive, toRefs } from 'vue';
import type { Editor } from '@tiptap/vue-3';
import h1  from '@/assets/editorIcon/h1.svg'

interface Props {
  editor: Editor | undefined
}

const props = defineProps<Props>();

// interface State {
//   : any
// }

// const state = reactive<State>({
//   : null
// });

// const {
  
// } = toRefs(state);

</script>

<style scoped>
.toolContainer {
  border-bottom: 2px solid #dcdfe6;
  height: 50px;
  min-height: 50px;
  display: flex;
  align-items: center;
  padding: 0 0.5rem;
  flex-wrap: wrap;
  gap: 50px;
  background: #fff;
  z-index: 1;
  flex-shrink: 0;
}

img {
  width: 20px;
  height: 20px;
  cursor: pointer;
}
</style>