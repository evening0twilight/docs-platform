<template>
  <div class="addContainer flex flex-col w-full h-full p-2 gap-[10px]">
    <div v-for="item in addData" :key="item.name"
      class="addItem flex items-center w-full h-[30px] gap-[10px] cursor-pointer hover:bg-gray-100 rounded-lg p-2">
      <div>
        <a-space size="large" class="transparent-avatar">
          <a-avatar :size="25" shape="square" :image-url="item.avatar" class="transparent-avatar" :key="item.avatar"
            @click="selectOne(item)" />
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
    title: '添加文档',
    selected: '文档'
  },
  {
    avatar: folderSvg,
    name: '添加文件夹',
    title: '添加文件夹',
    selected: '文件夹'
  }
]);

const emit = defineEmits<{
  (e: 'selectOne', item: any): void;
}>();

const selectOne = (item: any) => {
  console.log(item, 'selectOne');

  emit('selectOne', item);
};
</script>

<style scoped>
.transparent-avatar :deep(.arco-avatar) {
  background-color: transparent !important;
}
</style>