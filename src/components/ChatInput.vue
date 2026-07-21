<template>
  <input v-model="text" @keyup.enter="send" placeholder="Type a message..." class="w-full border rounded px-3 py-2" />
</template>

<script setup lang="ts">
import { ref } from "vue"
import { sendChatMessage } from "@/websocket/chatSocket"
import { useChatStore } from "@/stores/chatStore"

const chat = useChatStore()
const text = ref("")

function send(): void {
  const content = text.value.trim()
  if (!content) return

  sendChatMessage(chat.currentRoomId, content)

  text.value = ""
}
</script>