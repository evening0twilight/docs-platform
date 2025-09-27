<template>
  <div 
    class="gradient-bg" 
    :style="gradientStyle"
  ></div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  colors: {
    type: Array,
    default: () => ['#ff4e50', '#f9d423', '#ec008c', '#00b4db']
  },
  speed: {
    type: Number,
    default: 15
  },
  angle: {
    type: Number,
    default: 45
  }
});

const gradientStyle = computed(() => {
  return {
    background: `linear-gradient(${props.angle}deg, ${props.colors[0]}, ${props.colors[1]}, ${props.colors[2]}, ${props.colors[3]})`,
    backgroundSize: `200% 200%`,
    animation: `gradient ${props.speed}s ease infinite`
  };
});
</script>

<style scoped>
.gradient-bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  transition: background 0.5s ease;
}

/* 动画定义 */
@keyframes gradient {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
</style>