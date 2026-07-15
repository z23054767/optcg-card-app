<template>
  <transition name="fade">
    <div v-if="visible" class="welcome-popup">
      {{ message }}
    </div>
  </transition>
</template>

<script setup lang="ts">
defineProps<{
  visible: boolean
  message: string
}>()
</script>

<style scoped>
.welcome-popup {
  position: fixed;
  right: 24px;
  bottom: 24px;

  min-width: 260px;
  max-width: 360px;

  background: #1f2937;
  color: white;
  padding: 14px 18px;
  border-radius: 12px;

  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);

  z-index: 9999;
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
  transform: translateY(0);
}
</style>
