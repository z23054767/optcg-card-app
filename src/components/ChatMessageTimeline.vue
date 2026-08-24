<template>
  <div class="space-y-3">
    <div v-if="loadingOlderMessages" class="sticky top-2 z-20 flex justify-center py-2">
      <div
        class="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-lg"
      >
        <span
          class="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500"
        ></span>
        <span>載入舊訊息中...</span>
      </div>
    </div>

    <template v-for="item in timelineItems" :key="item.key">
      <div v-if="item.type === 'separator'" class="my-3 flex items-center gap-3">
        <div class="h-px flex-1 bg-gray-200"></div>
        <div class="rounded-full bg-gray-200 px-3 py-1 text-xs text-gray-600">
          {{ item.label }}
        </div>
        <div class="h-px flex-1 bg-gray-200"></div>
      </div>

      <ChatMessage
        v-else
        :message="item.message"
        :scroll-to-message="scrollToMessage"
        @view-user-profile="emit('view-user-profile', $event)"
        @recall-message="emit('recall-message', $event)"
        @send-friend-request="emit('send-friend-request', $event)"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ChatMessage from '@/components/ChatMessage.vue'
import type { ChatMessage as ChatMessageType } from '@/types/chat'

type TimelineItem =
  | { type: 'separator'; key: string; label: string }
  | { type: 'message'; key: string; message: ChatMessageType }

const props = defineProps<{
  messages: ChatMessageType[]
  loadingOlderMessages: boolean
  dateAnchor: number
  scrollToMessage?: (messageId: string) => Promise<void>
}>()

const emit = defineEmits<{
  'view-user-profile': [
    payload: {
      userId: string
      username: string
      displayName: string
    },
  ]
  'send-friend-request': [
    payload: {
      userId: string
      username: string
      displayName: string
    },
  ]
  'recall-message': [payload: { messageId: string }]
}>()

const timelineItems = computed<TimelineItem[]>(() => {
  const nowDate = new Date(props.dateAnchor)
  const items: TimelineItem[] = []
  let previousDateKey = ''

  for (const message of props.messages) {
    const dateKey = getDateKey(message.createdAt)

    if (dateKey && dateKey !== previousDateKey) {
      items.push({
        type: 'separator',
        key: `sep-${dateKey}`,
        label: getDateLabel(message.createdAt, nowDate),
      })
      previousDateKey = dateKey
    }

    items.push({
      type: 'message',
      key: `msg-${message.id}`,
      message,
    })
  }

  return items
})

function getDateKey(input: string | Date): string {
  const date = input instanceof Date ? input : new Date(input)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getDateLabel(isoTime: string, now: Date): string {
  const date = new Date(isoTime)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const todayKey = getDateKey(now)
  const targetKey = getDateKey(isoTime)

  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const yesterdayKey = getDateKey(yesterday)

  if (targetKey === todayKey) {
    return '今天'
  }

  if (targetKey === yesterdayKey) {
    return '昨天'
  }

  return new Intl.DateTimeFormat('zh-TW', {
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}
</script>
