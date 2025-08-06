<template>
  <div class="toolContainer ">
    <!-- h1 -->
    <!-- 后期我希望是加一个框，里面包含h1-h5全部可以修改 -->
    <div
      :class="{ 'is-active': editor?.isActive('heading', { level: 1 }) }" 
      @click="editor?.chain().focus().toggleHeading({ level: 1 }).run()" 
    >
      <img :src="h1" />
    </div>
    <!-- 无序列表 -->
    <div
      :class="{ 'is-active': editor?.isActive('bulletList') }" 
      @click="editor?.chain().focus().toggleBulletList().run()"
    >
      <img :src="unOrderly" alt="无序列表">
    </div>
    <!-- 有序列表 -->
    <div
      :class="{ 'is-active': editor?.isActive('orderedList') }"
      @click="editor?.chain().focus().toggleOrderedList().run()"
    >
      <img :src="orderly" alt="有序列表">
    </div>
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
import h1 from '@/assets/editorIcon/h1.svg'
import unOrderly from '@/assets/editorIcon/unOrderly.svg'
import orderly from '@/assets/editorIcon/orderly.svg'

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