<template>
  <span
    class="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold select-none"
    :style="placeholderStyle"
    :aria-label="`${avatar.label} 頭像`"
  >
    <img
      v-if="avatarImageUrl && !imageLoadFailed"
      :key="avatarImageUrl"
      :src="avatarImageUrl"
      :alt="`${avatar.label} 頭像`"
      class="h-full w-full object-cover"
      @error="handleImageError"
      @load="handleImageLoad"
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
    displayName?: string | null
    username?: string | null
    userId?: string | number | null
  }>(),
  {
    avatarUrl: null,
    displayName: null,
    username: null,
    userId: null,
  },
)

const imageLoadFailed = ref(false)
const imageRetryCount = ref(0)
const avatar = computed(() => getAvatarProps(props))
const avatarImageUrl = computed(() => {
  const imageUrl = avatar.value.imageUrl

  if (!imageUrl) {
    return null
  }

  if (imageRetryCount.value === 0) {
    return imageUrl
  }

  const url = new URL(imageUrl, window.location.origin)
  url.searchParams.set('_avatarRetry', String(imageRetryCount.value))

  return ABSOLUTE_URL_RE.test(imageUrl) ? url.toString() : `${url.pathname}${url.search}${url.hash}`
})
const placeholderStyle = computed(() => ({
  backgroundColor: avatar.value.backgroundColor,
  color: avatar.value.textColor,
}))

const ABSOLUTE_URL_RE = /^(?:https?:)?\/\//i

function resetImageState(): void {
  imageLoadFailed.value = false
  imageRetryCount.value = 0
}

function handleImageLoad(): void {
  imageLoadFailed.value = false
}

function handleImageError(): void {
  if (!avatar.value.imageUrl) {
    imageLoadFailed.value = true
    return
  }

  if (imageRetryCount.value === 0) {
    imageRetryCount.value = 1
    return
  }

  imageLoadFailed.value = true
}

watch(
  () => avatar.value.imageUrl,
  resetImageState,
)
</script>
