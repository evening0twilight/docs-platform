<template>
  <div class="toolContainer ">
    <!-- H1-H5 下拉菜单 -->
    <div 
      class="heading-dropdown" 
      @mouseenter="handleMouseEnter" 
      @mouseleave="handleMouseLeave"
    >
      <div 
        class="heading-trigger"
        :class="{ 
          'is-active': editor?.isActive('heading', { level: 1 }) || 
            editor?.isActive('heading', { level: 2 }) || 
            editor?.isActive('heading', { level: 3 }) ||
            editor?.isActive('heading', { level: 4 }) ||
            editor?.isActive('heading', { level: 5 })
        }"
      >
        <img :src="H" alt="标题" />
      </div>
      <transition name="menu-fade">
        <div v-if="showHeadingMenu" class="heading-menu">
          <div
            v-for="level in [1, 2, 3, 4, 5]"
            :key="level"
            class="heading-menu-item"
            :class="{ 'is-active': editor?.isActive('heading', { level: level as 1 | 2 | 3 | 4 | 5 | 6 }) }"
            @click="handleHeadingClick(level)"
            :title="`H${level}`"
          >
            <img 
              :src="level === 1 ? h1 : level === 2 ? h2 : level === 3 ? h3 : level === 4 ? h4 : h5" 
              :alt="`H${level}`" 
            />
          </div>
        </div>
      </transition>
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
    <!-- 任务列表 -->
    <div
      :class="{ 'is-active': editor?.isActive('taskList') }"
      @click="editor?.chain().focus().toggleTaskList().run()"
    >
      <img :src="tasklist" alt="任务列表">
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
      :class="getButtonClass('underline')"
      @click="editor?.chain().focus().toggleUnderline().run()"
    >
      <img :src="underline" alt="下划线">
    </div>
    <!-- 文字横线（罢工） -->
    <div
      :class="getButtonClass('strike')"
      @click="editor?.chain().focus().toggleStrike().run()"
    >
      <img :src="hengxian" alt="文字横线（罢工）">
    </div>
    <!-- 加粗 -->
    <div
      :class="getButtonClass('bold')"
      @click="editor?.chain().focus().toggleBold().run()"
    >
      <img :src="strong" alt="加粗">
    </div>
    <!-- 斜体 -->
    <div
      :class="getButtonClass('italic')"
      @click="editor?.chain().focus().toggleItalic().run()"
    >
      <img :src="xieti" alt="斜体">
    </div>
    <!-- 图片上传 -->
    <div
      @click="triggerImageUpload"
      :title="'插入图片'"
    >
      <img :src="imageIcon" alt="插入图片">
      <input 
        type="file" 
        ref="fileInputRef"
        accept="image/jpeg,image/png,image/gif,image/webp"
        @change="handleImageSelect"
        style="display: none"
      />
    </div>
    <!-- 链接(这里涉及到将那一块链接某一块地址,后面加上这个功能) -->
    <!-- <div
      :class="{ 'is-active': editor?.isActive('link') }"
      @click="editor?.chain().focus().toggleItalic().run()"
    >
      <img :src="xieti" alt="斜体">
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
* @description 富文本编辑器工具栏
* 支持三态显示：
* - 完全激活：选区内所有文本都有该样式
* - 部分激活：选区内部分文本有该样式（半透明显示）
* - 未激活：选区内没有该样式
*/
import { ref, onMounted, reactive, toRefs, computed } from 'vue';
import type { Editor } from '@tiptap/vue-3';
import Highlight from '@tiptap/extension-highlight'
import Superscript from '@tiptap/extension-superscript'
import Subscript from '@tiptap/extension-subscript'
import { uploadImage } from '@/api/upload'
import { processEditorImage } from '@/utils/imageCompress'
import { Message } from '@arco-design/web-vue'
import H from '@/assets/editorIcon/H.svg'
import h1 from '@/assets/editorIcon/h1.svg'
import h2 from '@/assets/editorIcon/h2.svg'
import h3 from '@/assets/editorIcon/h3.svg'
import h4 from '@/assets/editorIcon/h4.svg'
import h5 from '@/assets/editorIcon/h5.svg'
import unOrderly from '@/assets/editorIcon/unOrderly.svg'
import orderly from '@/assets/editorIcon/orderly.svg'
import tasklist from '@/assets/editorIcon/tasklist.svg'
import imageIcon from '@/assets/editorIcon/tupian.svg'
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

// 定义 emit
const emit = defineEmits<{
  'upload-start': []
  'upload-end': []
}>();

interface AxiosResponse {
  url? : string
}

// 控制标题下拉菜单显示
const showHeadingMenu = ref(false);
let hideMenuTimer: number | null = null;

// 添加调试日志
const handleMouseEnter = () => {
  console.log('ToolList 鼠标悬停在标题按钮上');
  // 清除之前的隐藏定时器
  if (hideMenuTimer) {
    clearTimeout(hideMenuTimer);
    hideMenuTimer = null;
  }
  showHeadingMenu.value = true;
};

const handleMouseLeave = () => {
  console.log('ToolList 鼠标离开标题按钮区域');
  // 延迟 200ms 隐藏，给用户时间移动到菜单上
  hideMenuTimer = setTimeout(() => {
    showHeadingMenu.value = false;
    hideMenuTimer = null;
  }, 200) as unknown as number;
};

const handleHeadingClick = (level: number) => {
  console.log('ToolList 点击标题级别:', level);
  props.editor?.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 | 4 | 5 | 6 }).run();
  // 点击后立即关闭菜单
  showHeadingMenu.value = false;
};

// 图片上传相关
const fileInputRef = ref<HTMLInputElement>();

/**
 * 触发文件选择
 */
const triggerImageUpload = () => {
  fileInputRef.value?.click();
};

/**
 * 处理图片上传
 */
const handleImageSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  
  if (!file) return;

  // 通知父组件开始上传
  emit('upload-start');
  
  try {
    console.log('图片上传 开始处理:', file.name);
    
    // 压缩图片
    const processedFile = await processEditorImage(file);
    
    // 上传图片到后端，获取 URL
    const result = await uploadImage(processedFile);
    console.log('图片上传 返回结果:', result);
    
    // 使用后端返回的 URL 在编辑器中插入图片
    if (props.editor && result.url) {
      props.editor.chain().focus().setImage({ src: result.url }).run();
      Message.success('图片上传成功');
      console.log('图片上传 成功插入图片 URL:', result.url);
    }
  } catch (error: any) {
    console.error('图片上传 失败:', error);
    const errorMsg = error.message || error.response?.data?.message || '图片上传失败';
    Message.error(errorMsg);
  } finally {
    // 通知父组件上传结束
    emit('upload-end');
    // 清空 input，允许重复上传同一文件
    if (target) {
      target.value = '';
    }
  }
};

/**
 * 检查样式在选区中的状态
 * @param markType - 样式类型（如 'bold', 'italic'）
 * @returns 'full' | 'partial' | 'none'
 */
const getMarkState = (markType: string) => {
  if (!props.editor) return 'none';
  
  const { from, to } = props.editor.state.selection;
  
  // 如果选区为空（光标位置），使用默认的 isActive
  if (from === to) {
    return props.editor.isActive(markType) ? 'full' : 'none';
  }
  
  let hasStyle = false;
  let hasNoStyle = false;
  
  props.editor.state.doc.nodesBetween(from, to, (node, pos) => {
    if (node.isText) {
      // 计算当前文本节点在选区中的范围
      const nodeStart = Math.max(from, pos);
      const nodeEnd = Math.min(to, pos + node.nodeSize);
      
      if (nodeStart < nodeEnd) {
        // 检查这段文本是否有该样式
        const hasMark = node.marks.some(mark => mark.type.name === markType);
        if (hasMark) {
          hasStyle = true;
        } else {
          hasNoStyle = true;
        }
      }
    }
  });
  
  if (hasStyle && !hasNoStyle) return 'full';      // 全部有
  if (hasStyle && hasNoStyle) return 'partial';    // 部分有
  return 'none';                                   // 全部没有
};

/**
 * 获取按钮的 class（三态）
 */
const getButtonClass = (markType: string, options?: any) => {
  if (options) {
    const isActive = props.editor?.isActive(markType, options);
    return {
      'is-active': isActive,
    };
  }
  
  // 对于 bold、italic、underline 等样式，使用三态检测
  const state = getMarkState(markType);
  
  return {
    'is-active': state === 'full',
    'is-partial': state === 'partial',
  };
};

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
  height: 50px;
  min-height: 50px;
  display: flex;
  align-items: center;
  padding: 0 0.5rem;
  flex-wrap: nowrap;
  gap: 8px;
  background: #fff;
  white-space: nowrap;
  position: relative;
  z-index: 100;
}

/* 标题下拉菜单样式 */
.heading-dropdown {
  position: relative;
  display: inline-block;
  padding: 0 !important;
  background: transparent !important;
  cursor: default;
}

.heading-trigger {
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
  cursor: pointer;
}

.heading-trigger:hover {
  background-color: #f0f0f0;
}

.heading-trigger.is-active {
  background-color: #1890ff;
  border: 1px solid #1890ff;
}

.heading-trigger.is-active img {
  filter: brightness(0) invert(1);
}

.heading-menu {
  position: absolute;
  top: -8px;
  left: 100%;
  margin-left: 4px;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 4px;
  z-index: 9999;
  pointer-events: auto;
  display: flex;
  flex-direction: row;
  gap: 4px;
  align-items: center;
}

/* Vue transition 过渡效果 */
.menu-fade-enter-active,
.menu-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.menu-fade-enter-from {
  opacity: 0;
  transform: translateX(-8px);
}

.menu-fade-enter-to {
  opacity: 1;
  transform: translateX(0);
}

.menu-fade-leave-from {
  opacity: 1;
  transform: translateX(0);
}

.menu-fade-leave-to {
  opacity: 0;
  transform: translateX(-8px);
}

.heading-menu-item {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px 8px;
  border-radius: 4px;
  transition: all 0.2s;
  cursor: pointer;
  min-width: 32px;
}

.heading-menu-item:hover {
  background-color: #f0f0f0;
}

.heading-menu-item.is-active {
  background-color: #e6f4ff;
  border: 1px solid #91caff;
}

.heading-menu-item img {
  width: 20px;
  height: 20px;
}

/* 通用按钮样式 - 不应用于 heading-dropdown */
.toolContainer > div:not(.heading-dropdown) {
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
  cursor: pointer;
}

.toolContainer > div:not(.heading-dropdown):hover {
  background-color: #f0f0f0;
}

/* 完全激活状态 */
.toolContainer > div.is-active {
  background-color: #1890ff;
  border: 1px solid #1890ff;
}

.toolContainer > div.is-active img {
  filter: brightness(0) invert(1);
}

/* 部分激活状态 */
.toolContainer > div.is-partial {
  background-color: #e6f4ff;
  border: 1px solid #91caff;
}

img {
  width: 20px;
  height: 20px;
  cursor: pointer;
  display: block;
}
</style>