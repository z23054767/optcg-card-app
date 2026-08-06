<template>
  <span
    class="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold select-none"
    :style="placeholderStyle"
    :aria-label="`${avatar.label} 頭像`"
  >
    <img
      v-if="avatar.imageUrl && !imageLoadFailed"
      :src="avatar.imageUrl"
      :alt="`${avatar.label} 頭像`"
      class="h-full w-full object-cover"
      @error="imageLoadFailed = true"
    />
    <span v-else>{{ avatar.initial }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { getAvatarProps } from '@/utils/avatar'

const props = withDefaults(
  defineProps<{
    avatarUrl?: string | null
    name?: string | null
    account?: string | null
    userId?: string | number | null
  }>(),
  {
    avatarUrl: null,
    name: null,
    account: null,
    userId: null,
  },
)

const imageLoadFailed = ref(false)
const avatar = computed(() => getAvatarProps(props))
const placeholderStyle = computed(() => ({
  backgroundColor: avatar.value.backgroundColor,
  color: avatar.value.textColor,
}))

watch(
  () => props.avatarUrl,
  () => {
    imageLoadFailed.value = false
  },
)
</script>
