<template>
  <div class="">
    {{ id }} {{ password }}
  </div>
</template>

<script setup lang="ts">
/**
* @description 
*/
import { ref, onMounted, reactive, toRefs } from 'vue';

interface State {
  id: string
  password: string
}

const state = reactive<State>({
  id: '123',
  password: '123'
});

const {
  id,
  password
} = toRefs(state);

</script>

<style scoped></style>