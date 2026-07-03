<template>
  <div class="flex mb-2" :class="isMine ? 'justify-end' : 'justify-start'">
    <div class="max-w-[70%] px-3 py-2 rounded-lg" :class="bubbleClass">
      <!-- 名稱 -->
      <div class="text-xs mb-1" :class="nameClass">
        {{ displayName }}
      </div>

      <!-- 訊息內容 -->
      <div class="break-wrap-break-word">
        {{ message.content }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useAuthStore } from "@/stores/authStore"
import { useChatStore } from "@/stores/chatStore"
import type { ChatMessage } from "@/types/chat"

const props = defineProps<{ message: ChatMessage }>()

const auth = useAuthStore()
const chat = useChatStore()

const isMine = computed(() => {
  return auth.isAuthenticated && props.message.senderId === auth.userId
})

const displayName = computed(() => {
  if (isMine.value) {
    return `${auth.userName}（你）`
  }
  return chat.users.get(props.message.senderId)?.name ?? "Unknown"
})

const bubbleClass = computed(() =>
  isMine.value
    ? "bg-blue-500 text-white"
    : "bg-gray-200 text-gray-900"
)

const nameClass = computed(() =>
  isMine.value
    ? "text-right text-white/70"
    : "text-left text-gray-600"
)
</script>
