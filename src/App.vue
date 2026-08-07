<template>
  <div id="app-shell" :class="themeClass">
    <RouterView />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { usePreferencesStore } from '@/stores/preferencesStore'

const preferences = usePreferencesStore()
preferences.initialize()

const themeClass = computed(() => (preferences.isDark ? 'theme-dark' : 'theme-light'))
</script>
