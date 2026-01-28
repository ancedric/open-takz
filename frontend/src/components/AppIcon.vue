<template>
  <span 
    class="app-icon" 
    v-html="ICONS[name]" 
    :style="{ width: size + 'px', height: size + 'px' }"
  ></span>
</template>

<script setup>
import { ICONS } from '../utils/icons.js';

defineProps({
  name: { type: String, required: true },
  size: { type: [String, Number], default: 18 }
});
</script>

<style scoped>
.app-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: inherit; /* Utilise la couleur du parent */
}
/* On s'assure que le SVG à l'intérieur prend toute la place du span */
:deep(svg) {
  width: 100%;
  height: 100%;
}
</style>