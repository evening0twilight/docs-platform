<template>
  <teleport to="body">
    <a-modal v-model:visible="visible" :width="800" :closable="false" title="历史版本">
      <a-radio-group class="flex flex-col gap-4 w-full h-[400px] overflow-y-auto" direction="vertical"
        v-model="selectedValue">
        <a-radio v-for="item in modelDats" :key="item.id" :value="item.id"
          class="w-full flex gap-[10px] items-center p-2 border border-solid border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100">
          <div class="flex gap-[10px] items-center w-full">
            <div>{{ item.name }}</div>
            <div>{{ item.createTime }}</div>
            <div>{{ item.createor }}</div>
            <div>{{ item.updateTime }}</div>
          </div>
        </a-radio>
      </a-radio-group>

      <!-- 添加底部按钮 -->
      <template #footer>
        <div class="flex justify-end">
          <a-button @click="closeDiolog" type="outline" style="margin-right: 8px">关闭</a-button>
          <a-button @click="closeDiolog" type="primary">确定</a-button>
        </div>
      </template>
    </a-modal>
  </teleport>
</template>

<script setup lang="ts">
/**
* @description 
*/
import { ref, onMounted, reactive, toRefs, watch } from 'vue';

interface State {
  visible: boolean
  selectedValue: string;
}

const state = reactive<State>({
  visible: false,
  selectedValue: ''
});

const {
  visible,
  selectedValue
} = toRefs(state);

watch(() => selectedValue.value, (newVal) => {
  console.log(selectedValue.value);
  console.log(`选中的值: ${newVal}`);
});

const openDiolog = () => {
  visible.value = true;
};

const closeDiolog = () => {
  visible.value = false;
};

const modelDats = [
  { id: 1, name: '1', createTime: '2023-01-01', createor: '1', updateTime: '2023-01-01' },
  { id: 2, name: '2', createTime: '2023-01-02', createor: '2', updateTime: '2023-01-02' },
  { id: 3, name: '3', createTime: '2023-01-03', createor: '3', updateTime: '2023-01-03' },
  { id: 4, name: '4', createTime: '2023-01-04', createor: '4', updateTime: '2023-01-04' },
  { id: 5, name: '5', createTime: '2023-01-05', createor: '5', updateTime: '2023-01-05' },
  { id: 6, name: '6', createTime: '2023-01-06', createor: '6', updateTime: '2023-01-06' },
  { id: 7, name: '7', createTime: '2023-01-07', createor: '7', updateTime: '2023-01-07' },
  { id: 8, name: '8', createTime: '2023-01-08', createor: '8', updateTime: '2023-01-08' },
  { id: 9, name: '9', createTime: '2023-01-09', createor: '9', updateTime: '2023-01-09' },
  { id: 10, name: '10', createTime: '2023-01-10', createor: '10', updateTime: '2023-01-10' },
  { id: 11, name: '11', createTime: '2023-01-11', createor: '11', updateTime: '2023-01-11' },
  { id: 12, name: '12', createTime: '2023-01-12', createor: '12', updateTime: '2023-01-12' },
  { id: 13, name: '13', createTime: '2023-01-13', createor: '13', updateTime: '2023-01-13' },
  { id: 14, name: '14', createTime: '2023-01-14', createor: '14', updateTime: '2023-01-14' },
  { id: 15, name: '15', createTime: '2023-01-15', createor: '15', updateTime: '2023-01-15' },
  { id: 16, name: '16', createTime: '2023-01-16', createor: '16', updateTime: '2023-01-16' },
  { id: 17, name: '17', createTime: '2023-01-17', createor: '17', updateTime: '2023-01-17' },
  { id: 18, name: '18', createTime: '2023-01-18', createor: '18', updateTime: '2023-01-18' },
  { id: 19, name: '19', createTime: '2023-01-19', createor: '19', updateTime: '2023-01-19' },
  { id: 20, name: '20', createTime: '2023-01-20', createor: '20', updateTime: '2023-01-20' }
]

defineExpose({
  visible,
  openDiolog,
  closeDiolog
});

</script>

<style scoped>
/* 美化滚动条 */
.flex.flex-col.gap-4 {
  scrollbar-width: thin;
}

.flex.flex-col.gap-4::-webkit-scrollbar {
  width: 6px;
}

.flex.flex-col.gap-4::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.flex.flex-col.gap-4::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 10px;
}

.flex.flex-col.gap-4::-webkit-scrollbar-thumb:hover {
  background: #aaa;
}
</style>