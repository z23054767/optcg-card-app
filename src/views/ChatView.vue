<template>
  <div class="flex h-screen overflow-hidden bg-gray-100 relative">
    <ChatSidebar :open="sidebarOpen" :rooms="chat.rooms" :current-room-id="chat.currentRoomId"
      @close="sidebarOpen = false" @switch-room="switchRoom" />

    <div class="flex flex-col flex-1 min-w-0 bg-white shadow-lg">
      <ChatHeader :title="currentRoomTitle" :current-room-id="chat.currentRoomId"
        :online-count="chat.currentRoomOnlineCount" :has-unread-invitations="chat.hasUnreadInvitationNotice"
        @open-sidebar="sidebarOpen = true"
        @create-room="showCreateRoom = true" @back-to-lobby="backToLobby" @toggle-sidebar="toggleSidebar"
        @toggle-user-menu="toggleUserMenu" />

      <UserMenu :open="showUserMenu" :name="auth.user?.name || auth.user?.account || '使用者'"
        :account="auth.user?.account || ''" :invitation-count="chat.invitations.length" @close="showUserMenu = false"
        @logout="logout" @open-invitations="openInvitations" />

      <CreateRoomModal v-if="showCreateRoom" :loading="creatingRoom" @close="showCreateRoom = false"
        @create="createRoom" />

      <InvitationModal v-if="showInvitations" :invitations="chat.invitations" @close="showInvitations = false"
        @accept="acceptInvitation" @reject="rejectInvitation" />

      <main ref="messagesEl" class="relative flex-1 overflow-y-auto px-3 sm:px-4 py-3 space-y-3 bg-gray-50"
        @scroll="onScroll">
        <ChatMessage v-for="m in filteredMessages" :key="m.id" :message="m" />

        <button v-show="showScrollTop" type="button" aria-label="回到最上層"
          class="fixed z-20 rounded-full shadow-lg border bg-white/90 backdrop-blur hover:bg-white active:scale-95 transition right-4 bottom-20 sm:right-6 sm:bottom-6 w-11 h-11 flex items-center justify-center"
          @click="scrollToTop">
          <span class="text-lg">⬆️</span>
        </button>

        <div ref="bottomAnchor"></div>
      </main>

      <footer class="border-t bg-white px-3 py-2">
        <ChatInput @sent="scrollToBottom" />
      </footer>

      <WelcomePopup :visible="chat.welcomePopup.visible" :message="chat.welcomePopup.message" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  acceptChatInvitationApi,
  createChatRoomApi,
  getMyChatInvitationsApi,
  getMyChatRoomsApi,
  rejectChatInvitationApi,
} from '@/api/chatApi'
import { connectChatSocket, disconnectChatSocket, joinRoom } from '@/websocket/chatSocket'
import { useAuthStore } from '@/stores/authStore'
import { useChatStore } from '@/stores/chatStore'
import type { ServerWsMessage } from '@/types/chat'

import UserMenu from '@/components/UserMenu.vue'
import ChatSidebar from '@/components/ChatSidebar.vue'
import ChatHeader from '@/components/ChatHeader.vue'
import ChatMessage from '@/components/ChatMessage.vue'
import ChatInput from '@/components/ChatInput.vue'
import WelcomePopup from '@/components/WelcomePopup.vue'
import InvitationModal from '@/components/InvitationModal.vue'
import CreateRoomModal from '@/components/CreateRoomModal.vue'

const auth = useAuthStore()
const chat = useChatStore()
const route = useRoute()
const router = useRouter()

const sidebarOpen = ref(false)
const showCreateRoom = ref(false)
const creatingRoom = ref(false)
const showUserMenu = ref(false)
const showInvitations = ref(false)
const invitationSyncTimer = ref<ReturnType<typeof setInterval> | null>(null)

const messagesEl = ref<HTMLElement | null>(null)
const bottomAnchor = ref<HTMLElement | null>(null)
const showScrollTop = ref(false)

const filteredMessages = computed(() =>
  chat.messages.filter((m) => m && m.roomId === chat.currentRoomId),
)

const currentRoomTitle = computed(() => {
  if (chat.currentRoomId === 'lobby') return '🏠 大廳聊天室'

  const room = chat.rooms.find((item) => item.id === chat.currentRoomId)
  return `💬 ${room?.name || '聊天室'}`
})

function onScroll(): void {
  const el = messagesEl.value
  if (!el) return

  showScrollTop.value = el.scrollTop > 240
}

function scrollToTop(): void {
  const el = messagesEl.value
  if (!el) return

  el.scrollTo({
    top: 0,
    behavior: 'smooth',
  })
}

async function scrollToBottom(): Promise<void> {
  await nextTick()

  bottomAnchor.value?.scrollIntoView({
    behavior: 'smooth',
    block: 'end',
  })
}

async function createRoom(payload: { roomName: string; emails: string[] }): Promise<void> {
  if (creatingRoom.value) return

  creatingRoom.value = true

  try {
    const response = await createChatRoomApi({
      roomType: 'group',
      roomName: payload.roomName,
      inviteEmails: payload.emails,
    })

    chat.upsertRoom({
      id: response.roomId,
      type: 'group',
      name: payload.roomName,
      ownerId: auth.userId ?? '',
    })

    await switchRoom(response.roomId)

    showCreateRoom.value = false
  } finally {
    creatingRoom.value = false
  }
}

async function switchRoom(roomId: string): Promise<void> {
  chat.setCurrentRoom(roomId)
  joinRoom(roomId)

  sidebarOpen.value = false
  showUserMenu.value = false

  await scrollToBottom()
}

async function backToLobby(): Promise<void> {
  await switchRoom('lobby')
}

async function loadMyRooms(): Promise<void> {
  const response = await getMyChatRoomsApi()

  chat.setRooms(response.rooms ?? [])
}

async function loadMyInvitations(markUnreadOnNew = true): Promise<void> {
  const response = await getMyChatInvitationsApi()

  chat.setInvitations(response.invitations ?? [], { markUnreadOnNew })
}

function startInvitationSync(): void {
  if (invitationSyncTimer.value) return

  invitationSyncTimer.value = setInterval(() => {
    void loadMyInvitations()
  }, 3000)
}

function stopInvitationSync(): void {
  if (!invitationSyncTimer.value) return

  clearInterval(invitationSyncTimer.value)
  invitationSyncTimer.value = null
}

function handleWindowFocus(): void {
  void loadMyInvitations()
}

function handleVisibilityChange(): void {
  if (document.visibilityState !== 'visible') return

  void loadMyInvitations()
}

async function acceptInvitation(invitationId: string): Promise<void> {
  const response = await acceptChatInvitationApi(invitationId)

  chat.removeInvitation(invitationId)

  await loadMyRooms()
  await switchRoom(response.roomId)

  showInvitations.value = false
}

async function rejectInvitation(invitationId: string): Promise<void> {
  await rejectChatInvitationApi(invitationId)

  chat.removeInvitation(invitationId)
}

function openInvitations(): void {
  showUserMenu.value = false
  showInvitations.value = true
  chat.markInvitationsAsSeen()
}

function logout(): void {
  disconnectChatSocket()
  auth.logout()
  router.push('/login')
}

function toggleSidebar(): void {
  sidebarOpen.value = !sidebarOpen.value

  if (sidebarOpen.value) {
    showUserMenu.value = false
  }
}

function toggleUserMenu(): void {
  showUserMenu.value = !showUserMenu.value

  if (showUserMenu.value) {
    sidebarOpen.value = false
  }
}

onMounted(async () => {
  if (!auth.isAuthenticated) return

  const roomId = String(route.query.roomId ?? 'lobby')

  await loadMyRooms()
  await loadMyInvitations(false)

  chat.setCurrentRoom(roomId)

  connectChatSocket(
    auth.token,
    (message: ServerWsMessage) => {
      chat.applyEvent(message)
    },
    () => {
      void loadMyInvitations()
      joinRoom(chat.currentRoomId)
    },
  )

  startInvitationSync()
  window.addEventListener('focus', handleWindowFocus)
  document.addEventListener('visibilitychange', handleVisibilityChange)

  chat.showSelfWelcome(auth.user?.name ?? auth.user?.account ?? '使用者')
})

onUnmounted(() => {
  stopInvitationSync()
  window.removeEventListener('focus', handleWindowFocus)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  disconnectChatSocket()
})
</script>
