<template>
  <div class="flex h-screen bg-gray-100">
    <div class="flex flex-col flex-1 max-w-4xl mx-auto bg-white shadow-lg">
      <!-- Header -->
      <header class="flex items-center justify-between px-4 py-3 border-b bg-white sticky top-0 z-10">
        <div>
          <h1 class="text-lg font-semibold text-gray-800">
            {{ chat.currentRoomId === 'lobby' ? '🏠 大廳聊天室' : '💬 私人聊天室' }}
          </h1>

          <button v-if="chat.currentRoomId !== 'lobby'" class="text-xs text-blue-600 hover:underline"
            @click="backToLobby">
            回到大廳
          </button>
        </div>

        <div class="flex items-center gap-2">
          <button class="text-sm px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
            @click="showCreateRoom = true">
            建立聊天室
          </button>

          <span class="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
            {{ chat.currentRoomOnlineCount }} 人在線
          </span>
        </div>
      </header>

      <!-- 建立聊天室彈窗 -->
      <CreateRoomModal v-if="showCreateRoom" @close="showCreateRoom = false" @create="createRoom"></CreateRoomModal>

      <!-- Messages -->
      <main ref="messagesEl" class="relative flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50" @scroll="onScroll">
        <ChatMessage v-for="m in filteredMessages" :key="m.id" :message="m" />

        <!-- 回到最上層 -->
        <button v-show="showScrollTop" type="button" aria-label="回到最上層" class="fixed z-20 rounded-full shadow-lg border bg-white/90 backdrop-blur
                 hover:bg-white active:scale-95 transition
                 right-4 bottom-20 sm:right-6 sm:bottom-6
                 w-11 h-11 flex items-center justify-center" @click="scrollToTop">
          <span class="text-lg">⬆️</span>
        </button>
        <div ref="bottomAnchor"></div>
      </main>

      <!-- Input -->
      <footer class="border-t bg-white px-3 py-2">
        <ChatInput @sent="scrollToBottom" />
      </footer>

      <!-- 歡迎訊息 -->
      <WelcomePopup :visible="chat.welcomePopup.visible" :message="chat.welcomePopup.message"></WelcomePopup>
    </div>
  </div>
</template>

<script setup lang="ts">
import { http } from "@/api/http"
import { computed, nextTick, onMounted, onUnmounted, ref } from "vue"
import { useRoute } from "vue-router"
import { connectChatSocket, disconnectChatSocket, joinRoom } from "@/websocket/chatSocket"
import { useAuthStore } from "@/stores/authStore"
import { useChatStore } from "@/stores/chatStore"
import type { ChatWsEvent } from "@/types/chatWsEvents"
import type { ServerWsMessage } from "@/types/chat"

import ChatMessage from "@/components/ChatMessage.vue"
import ChatInput from "@/components/ChatInput.vue"
import WelcomePopup from "@/components/WelcomePopup.vue"
import CreateRoomModal from "@/components/CreateRoomModal.vue"

const auth = useAuthStore()
const chat = useChatStore()
const route = useRoute()
const showCreateRoom = ref(false)

const filteredMessages = computed(() =>
  chat.messages.filter(m => m && m.roomId === chat.currentRoomId)
)

// scroll-to-top
const messagesEl = ref<HTMLElement | null>(null)
const showScrollTop = ref(false)

// scroll-to-bottom
const bottomAnchor = ref<HTMLElement | null>(null)

function onScroll(): void {
  const el = messagesEl.value
  if (!el) return
  showScrollTop.value = el.scrollTop > 240
}

function scrollToTop(): void {
  const el = messagesEl.value
  if (!el) return
  el.scrollTo({ top: 0, behavior: "smooth" })
}

async function createRoom(payload: { roomName: string; emails: string[] }): Promise<void> {
  const { data } = await http.post(
    "/chat/rooms",
    {
      roomType: "group",
      roomName: payload.roomName,
      inviteEmails: payload.emails,
    },
    {
      headers: {
        Authorization: `Bearer ${auth.token}`,
      },
    }
  )

  const roomId = data.roomId

  chat.setCurrentRoom(roomId)
  joinRoom(roomId)

  showCreateRoom.value = false

  await scrollToBottom()
}

async function backToLobby(): Promise<void> {
  chat.setCurrentRoom("lobby")
  joinRoom("lobby")

  await scrollToBottom()
}

async function scrollToBottom(): Promise<void> {
  await nextTick()

  bottomAnchor.value?.scrollIntoView({
    behavior: "smooth",
    block: "end"
  })
}

onMounted(() => {
  if (!auth.isAuthenticated) return

  const roomId = String(route.query.roomId ?? "lobby")

  chat.setCurrentRoom(roomId)

  connectChatSocket(
    auth.token,
    (message: ServerWsMessage) => {
      chat.applyEvent(message as ChatWsEvent)
    },
    () => {
      joinRoom(roomId)
    }
  )

  chat.showSelfWelcome(auth.user?.name ?? auth.user?.account ?? "使用者")
})

onUnmounted(() => {
  disconnectChatSocket()
})
</script>
