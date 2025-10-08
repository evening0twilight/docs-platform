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
    <!-- 段落、下划线、文字横线、加粗、斜体、链接，图片、代码块、上标、下标、高亮强调 -->
    <!-- 段落 -->
    <div
      :class="{ 'is-active': editor?.isActive('paragraph') }"
      @click="editor?.chain().focus().setParagraph().run()"
    >
      <img :src="paragraph" alt="段落">
    </div>
    <!-- 下划线 -->
    <div
      :class="{ 'is-active': editor?.isActive('underline') }"
      @click="editor?.chain().focus().toggleUnderline().run()"
    >
      <img :src="underline" alt="下划线">
    </div>
    <!-- 文字横线（罢工） -->
    <div
      :class="{ 'is-active': editor?.isActive('strike') }"
      @click="editor?.chain().focus().toggleStrike().run()"
    >
      <img :src="hengxian" alt="文字横线（罢工）">
    </div>
    <!-- 加粗 -->
    <div
      :class="{ 'is-active': editor?.isActive('bold') }"
      @click="editor?.chain().focus().toggleBold().run()"
    >
      <img :src="strong" alt="加粗">
    </div>
    <!-- 斜体 -->
    <div
      :class="{ 'is-active': editor?.isActive('italic') }"
      @click="editor?.chain().focus().toggleItalic().run()"
    >
      <img :src="xieti" alt="斜体">
    </div>
    <!-- 链接(这里涉及到将那一块链接某一块地址,后面加上这个功能) -->
    <!-- <div
      :class="{ 'is-active': editor?.isActive('link') }"
      @click="editor?.chain().focus().toggleItalic().run()"
    >
      <img :src="xieti" alt="斜体">
    </div> -->
    <!-- 图片(这一块涉及到上传逻辑,后面再加上) -->
    <!-- <div>

    </div> -->
    <!-- 代码块 -->
    <div
      :class="{ 'is-active': editor?.isActive('codeBlock') }"
      @click="editor?.chain().focus().toggleCodeBlock().run()"
    >
      <img :src="code" alt="代码块">
    </div>
    <!-- 上标 -->
    <div
      :class="{ 'is-active': editor?.isActive('superscript') }"
      @click="editor.chain().focus().toggleSuperscript().run()"
    >
      <img :src="up" alt="上标">
    </div>
    <!-- 下标 -->
    <div
      :class="{ 'is-active': editor?.isActive('subscript') }"
      @click="editor.chain().focus().toggleSubscript().run()"
    >
      <img :src="down" alt="上标">
    </div>
    <!-- 高亮强调(得加上颜色),现在我就加一个普通的高亮后面再加上其他的颜色选项 -->
    <div
      :class="{ 'is-active': editor?.isActive('highlight') }"
      @click="editor.chain().focus().toggleHighlight().run()"
    >
      <img :src="hightLight" alt="高亮强调(普通)">
    </div>
  </div>
</template>

<script setup lang="ts">
/**
* @description 
*/
import { ref, onMounted, reactive, toRefs } from 'vue';
import type { Editor } from '@tiptap/vue-3';
import Highlight from '@tiptap/extension-highlight'
import Superscript from '@tiptap/extension-superscript'
import Subscript from '@tiptap/extension-subscript'
import h1 from '@/assets/editorIcon/h1.svg'
import unOrderly from '@/assets/editorIcon/unOrderly.svg'
import orderly from '@/assets/editorIcon/orderly.svg'
import paragraph from '@/assets/editorIcon/paragraph.svg'
import underline from '@/assets/editorIcon/xiahuaxian.svg'
import hengxian from '@/assets/editorIcon/hengxian.svg'
import strong from '@/assets/editorIcon/jiacu.svg'
import xieti from '@/assets/editorIcon/xieti.svg'
import code from '@/assets/editorIcon/daimakuai.svg'
import colorHighlight from '@/assets/folder.svg'
import down from '@/assets/down.svg'
import up from '@/assets/up.svg'
import hightLight from '@/assets/hightLight.svg'

interface Props {
  editor: Editor | null
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