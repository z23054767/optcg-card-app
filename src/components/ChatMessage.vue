<template>
  <div class="mb-2 flex" :class="isMine ? 'justify-end' : 'justify-start'">
    <div class="flex max-w-[92%] items-end gap-1 sm:max-w-[82%] lg:max-w-[68%]" :class="rowClass">
      <div class="shrink-0 px-0.5 pb-0.5 text-[11px] leading-none text-gray-400">
        {{ formattedTime }}
      </div>

      <div class="min-w-0">
        <div v-if="!isMine" class="mb-1 px-1 text-[11px] leading-none text-gray-500">
          {{ displayName }}
        </div>
        <div
          class="w-fit rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm sm:text-[15px]"
          :class="bubbleClass"
        >
          <div class="whitespace-pre-wrap break-words">
            {{ message.content }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { useAuthStore } from '@/stores/authStore'
import { useChatStore } from '@/stores/chatStore'
import type { ChatMessage } from '@/types/chat'

const props = defineProps<{
  message: ChatMessage
}>()

const auth = useAuthStore()
const chat = useChatStore()

const isMine = computed(() => {
  return auth.isAuthenticated && props.message.senderId === auth.userId
})

const displayName = computed(() => {
  if (isMine.value) {
    const name =
      auth.userName ||
      props.message.senderName ||
      props.message.senderAccount ||
      '使用者'

    return `${name}（你）`
  }

  const user = chat.users.get(props.message.senderId)

  return (
    props.message.senderName ||
    user?.name ||
    props.message.senderAccount ||
    user?.account ||
    'Unknown'
  )
})

const rowClass = computed(() => (isMine.value ? 'flex-row-reverse' : 'flex-row'))

const bubbleClass = computed(() => {
  if (isMine.value) {
    return 'rounded-br-md bg-blue-500 text-white'
  }

  return 'rounded-bl-md border border-gray-200 bg-white text-gray-900'
})

const formattedTime = computed(() => formatMessageTime(props.message.createdAt))

function formatMessageTime(isoTime: string): string {
  const date = new Date(isoTime)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const now = new Date()
  const isSameDate =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()

  const timeText = new Intl.DateTimeFormat('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)

  if (isSameDate) {
    return timeText
  }

  const dateText = new Intl.DateTimeFormat('zh-TW', {
    month: '2-digit',
    day: '2-digit',
  }).format(date)

  return `${dateText} ${timeText}`
}
</script>