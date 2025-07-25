<template>
  <div class="addContainer flex flex-col w-full h-full p-2 gap-[10px]">
    <div v-for="item in addData" :key="item.name" class="addItem flex items-center w-full h-[30px] gap-[10px]">
      <div class>
        <a-space size="large" class="transparent-avatar">
          <a-avatar :size="30" shape="square" :image-url="item.avatar" class="transparent-avatar" />
        </a-space>
      </div>
      <div>
        {{ item.name }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
* @description 
*/
import { ref, onMounted, reactive, toRefs } from 'vue';
import docsSvg from '@/assets/document.svg';
import folderSvg from '@/assets/folder.svg';

// interface State {
//   : any
// }

// const state = reactive<State>({
//   : null
// });

// const {

// } = toRefs(state);

const addData = reactive([
  {
    avatar: docsSvg,
    name: '添加文档',
  },
  {
    avatar: folderSvg,
    name: '添加文件夹',
  }
]);

</script>

<style scoped>
.transparent-avatar :deep(.arco-avatar) {
  background-color: transparent !important;
}
</style>