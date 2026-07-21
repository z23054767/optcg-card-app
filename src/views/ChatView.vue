<template>
  <div class="flex h-screen overflow-hidden bg-gray-100 relative">
    <ChatSidebar :open="sidebarOpen" :rooms="chat.rooms" :current-room-id="chat.currentRoomId"
      @close="sidebarOpen = false" @switch-room="switchRoom" />

    <div class="flex min-h-0 flex-1 flex-col min-w-0 bg-white shadow-lg">
      <ChatHeader :title="currentRoomTitle" :current-room-id="chat.currentRoomId"
        :online-count="chat.currentRoomOnlineCount" :has-unread-invitations="chat.hasUnreadInvitationNotice"
        :show-create-button="canCreateRoom" :show-invite-members-button="canInviteMembers"
        :show-manage-group-button="canManageGroup" :show-members-button="isCurrentGroupRoom"
        @open-sidebar="sidebarOpen = true" @create-room="showCreateRoom = true" @back-to-lobby="backToLobby"
        @toggle-sidebar="toggleSidebar" @toggle-user-menu="toggleUserMenu" @open-members="openRoomMembers"
        @invite-members="showInviteMembers = true" @open-manage-group="openGroupManage" />

      <UserMenu :open="showUserMenu" :name="auth.user?.name || auth.user?.account || '使用者'"
        :account="auth.user?.account || ''" :invitation-count="chat.invitations.length" @close="showUserMenu = false"
        @logout="logout" @open-invitations="openInvitations" />

      <CreateRoomModal v-if="showCreateRoom" :loading="creatingRoom" @close="showCreateRoom = false"
        @create="createRoom" />
      <InviteMembersModal v-if="showInviteMembers" :loading="invitingMembers" @close="showInviteMembers = false"
        @invite="inviteMembers" />
      <GroupManageModal v-if="showGroupManage && currentRoom" :room="currentRoom" :members="roomMembers"
        :loading-members="loadingRoomMembers" :updating-info="updatingGroupInfo" :deleting-room="deletingGroupRoom"
        :removing-user-id="removingMemberUserId" :transferring-user-id="transferringManagerUserId"
        :invitations="roomInvitations" :loading-invitations="loadingRoomInvitations"
        :re-inviting-invitee-id="reInvitingInviteeId" @close="showGroupManage = false" @save-info="saveGroupInfo"
        @remove-member="removeMember" @transfer-manager="transferManager" @delete-room="deleteGroupRoom"
        @re-invite="reInvite" />

      <InvitationModal v-if="showInvitations" :invitations="chat.invitations" @close="showInvitations = false"
        @accept="acceptInvitation" @reject="rejectInvitation" />
      <RoomMembersModal v-if="showRoomMembers" :members="roomMembers" :loading="loadingRoomMembers"
        @close="showRoomMembers = false" />

      <main ref="messagesEl" class="relative min-h-0 flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-gray-50 sm:px-4"
        @scroll="handleMessageScroll">

        <div v-if="loadingOlderMessages" class="sticky top-2 z-20 flex justify-center py-2">
          <div
            class="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-lg">
            <span class="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500"></span>

            <span>載入舊訊息中...</span>
          </div>
        </div>
        <template v-for="item in messageTimelineItems" :key="item.key">
          <div v-if="item.type === 'separator'" class="my-3 flex items-center gap-3">
            <div class="h-px flex-1 bg-gray-200"></div>
            <div class="rounded-full bg-gray-200 px-3 py-1 text-xs text-gray-600">
              {{ item.label }}
            </div>
            <div class="h-px flex-1 bg-gray-200"></div>
          </div>
          <ChatMessage v-else :message="item.message" />
        </template>
        <button v-show="showScrollButton" type="button" aria-label="回到最新訊息"
          class="fixed right-4 bottom-20 z-20 flex h-11 w-11 items-center justify-center rounded-full border bg-white/90 shadow-lg backdrop-blur transition hover:bg-white active:scale-95 sm:right-6 sm:bottom-6"
          @click="handleScrollButtonClick">
          <span class="text-lg">⬇️</span>
        </button>
      </main>

      <footer class="border-t bg-white px-3 py-2">
        <ChatInput />
      </footer>

      <WelcomePopup :visible="chat.welcomePopup.visible" :message="chat.welcomePopup.message" />

      <!-- Toast 通知 -->
      <Transition enter-active-class="transition-all duration-300" enter-from-class="opacity-0 translate-y-2"
        enter-to-class="opacity-100 translate-y-0" leave-active-class="transition-all duration-200"
        leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 translate-y-2">
        <div v-if="toast"
          class="fixed bottom-6 left-1/2 -translate-x-1/2 z-100 px-5 py-3 rounded-xl shadow-lg text-sm font-medium text-white pointer-events-none"
          :class="toast.type === 'success' ? 'bg-gray-800' : 'bg-red-600'">
          {{ toast.type === 'success' ? '✓ ' : '✕ ' }}{{ toast.message }}
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue"
import { useRoute, useRouter } from 'vue-router'
import {
  acceptChatInvitationApi,
  createChatRoomApi,
  getChatRoomMembersApi,
  getChatRoomMessagesApi,
  getMyChatInvitationsApi,
  getMyChatRoomsApi,
  getRoomInvitationsApi,
  inviteChatRoomMembersApi,
  deleteChatRoomApi,
  removeChatRoomMemberApi,
  transferChatRoomManagerApi,
  updateGroupChatRoomApi,
  rejectChatInvitationApi,
} from '@/api/chatApi'
import { connectChatSocket, disconnectChatSocket, joinRoom } from '@/websocket/chatSocket'
import { useAuthStore } from '@/stores/authStore'
import { useChatStore } from '@/stores/chatStore'
import type {
  ChatInvitation as ChatInvitationType,
  ChatMessage as ChatMessageType,
  ChatRoomMember as ChatRoomMemberType,
  ServerWsMessage,
} from '@/types/chat'

import UserMenu from '@/components/UserMenu.vue'
import ChatSidebar from '@/components/ChatSidebar.vue'
import ChatHeader from '@/components/ChatHeader.vue'
import ChatMessage from '@/components/ChatMessage.vue'
import ChatInput from '@/components/ChatInput.vue'
import WelcomePopup from '@/components/WelcomePopup.vue'
import InvitationModal from '@/components/InvitationModal.vue'
import CreateRoomModal from '@/components/CreateRoomModal.vue'
import InviteMembersModal from '@/components/InviteMembersModal.vue'
import RoomMembersModal from '@/components/RoomMembersModal.vue'
import GroupManageModal from '@/components/GroupManageModal.vue'

const auth = useAuthStore()
const chat = useChatStore()
const route = useRoute()
const router = useRouter()

const toast = ref<{ message: string; type: 'success' | 'error' } | null>(null)
let toastTimer: ReturnType<typeof setTimeout> | null = null

function showToast(message: string, type: 'success' | 'error' = 'success'): void {
  if (toastTimer) clearTimeout(toastTimer)
  toast.value = { message, type }
  toastTimer = setTimeout(() => {
    toast.value = null
    toastTimer = null
  }, 3000)
}

const sidebarOpen = ref(false)
const showCreateRoom = ref(false)
const creatingRoom = ref(false)
const invitingMembers = ref(false)
const updatingGroupInfo = ref(false)
const deletingGroupRoom = ref(false)
const removingMemberUserId = ref<string | null>(null)
const transferringManagerUserId = ref<string | null>(null)
const reInvitingInviteeId = ref<string | null>(null)
const showUserMenu = ref(false)
const showInvitations = ref(false)
const showRoomMembers = ref(false)
const showInviteMembers = ref(false)
const showGroupManage = ref(false)
const invitationSyncTimer = ref<ReturnType<typeof setInterval> | null>(null)
const midnightRefreshTimer = ref<ReturnType<typeof setTimeout> | null>(null)
const loadingLatestMessages = ref(false)
const loadingOlderMessages = ref(false)
const loadingRoomMembers = ref(false)
const loadingRoomInvitations = ref(false)
const hasMoreMessages = ref(true)
const historyCursor = ref<{ beforeCreatedAt: string; beforeId: string } | null>(null)
const dateLabelAnchor = ref(Date.now())
const roomMembers = ref<ChatRoomMemberType[]>([])
const roomInvitations = ref<ChatInvitationType[]>([])

const messagesEl = ref<HTMLElement | null>(null)
const lastRequestedCursorKey = ref<string | null>(null)

const showScrollButton = ref(false)
const initializingRoom = ref(false)

const MESSAGE_PAGE_SIZE = 30

const filteredMessages = computed(() =>
  chat.messages.filter(
    (message) =>
      message &&
      String(message.roomId) === String(chat.currentRoomId),
  ),
)

const lastMessageId = computed<string | null>(() => {
  const messages = filteredMessages.value
  const lastMessage = messages[messages.length - 1]

  return lastMessage?.id ?? null
})

type MessageTimelineItem =
  | {
    type: 'separator'
    key: string
    label: string
  }
  | {
    type: 'message'
    key: string
    message: ChatMessageType
  }

const messageTimelineItems = computed<MessageTimelineItem[]>(() => {
  const nowDate = new Date(dateLabelAnchor.value)
  const items: MessageTimelineItem[] = []
  let previousDateKey = ''

  for (const message of filteredMessages.value) {
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

const currentRoomTitle = computed(() => {
  if (chat.currentRoomId === 'lobby') return '🏠 大廳'

  const room = chat.rooms.find((item) => item.id === chat.currentRoomId)
  return `💬 ${room?.name || '聊天室'}`
})

const currentRoom = computed(() =>
  chat.rooms.find((room) => room.id === chat.currentRoomId),
)

const isCurrentGroupRoom = computed(() => currentRoom.value?.type === 'group')
const isCurrentRoomManager = computed(
  () => Boolean(currentRoom.value) && String(currentRoom.value?.ownerId) === String(auth.userId),
)
const canCreateRoom = computed(() => chat.currentRoomId === 'lobby')
const canInviteMembers = computed(() => isCurrentGroupRoom.value && isCurrentRoomManager.value)
const canManageGroup = computed(() => isCurrentGroupRoom.value && isCurrentRoomManager.value)

function handleMessageScroll(event: Event): void {
  const el = event.currentTarget

  if (!(el instanceof HTMLElement)) return

  const distanceFromBottom =
    el.scrollHeight - el.scrollTop - el.clientHeight

  const isNearTop = el.scrollTop <= 50
  const isNearBottom = distanceFromBottom <= 50

  // 只要不在最底，就顯示按鈕
  showScrollButton.value = !isNearBottom

  if (initializingRoom.value) return

  if (!isNearTop) return

  void loadOlderMessages()
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds)
  })
}

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

function scheduleNextMidnightRefresh(): void {
  const now = new Date()
  const nextMidnight = new Date(now)
  nextMidnight.setHours(24, 0, 0, 0)

  const delay = Math.max(1000, nextMidnight.getTime() - now.getTime())

  midnightRefreshTimer.value = setTimeout(() => {
    dateLabelAnchor.value = Date.now()
    scheduleNextMidnightRefresh()
  }, delay)
}

function startMidnightRefresh(): void {
  stopMidnightRefresh()
  scheduleNextMidnightRefresh()
}

function stopMidnightRefresh(): void {
  if (!midnightRefreshTimer.value) return

  clearTimeout(midnightRefreshTimer.value)
  midnightRefreshTimer.value = null
}

async function handleScrollButtonClick(): Promise<void> {
  await scrollToBottom(true)
}

async function scrollToBottom(smooth = false): Promise<void> {
  await nextTick()

  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      const el = messagesEl.value

      if (el) {
        el.scrollTo({
          top: el.scrollHeight,
          behavior: smooth ? "smooth" : "auto",
        })
      }

      resolve()
    })
  })
}

async function createRoom(payload: { roomName: string }): Promise<void> {
  if (creatingRoom.value) return

  creatingRoom.value = true

  try {
    const response = await createChatRoomApi({
      roomType: 'group',
      roomName: payload.roomName,
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
  initializingRoom.value = true

  try {
    chat.setCurrentRoom(roomId)
    historyCursor.value = null
    lastRequestedCursorKey.value = null
    hasMoreMessages.value = true

    showRoomMembers.value = false
    showInviteMembers.value = false
    showGroupManage.value = false

    sidebarOpen.value = false
    showUserMenu.value = false

    joinRoom(roomId)

    await loadLatestMessages(roomId)

    if (isCurrentGroupRoom.value) {
      await loadRoomMembers(roomId)
    } else {
      roomMembers.value = []
    }

    // 初始直接定位最新訊息
    await scrollToBottom(false)
  } finally {
    initializingRoom.value = false
  }
}

async function loadLatestMessages(roomId: string): Promise<void> {
  loadingLatestMessages.value = true

  try {
    const response = await getChatRoomMessagesApi(roomId, {
      limit: MESSAGE_PAGE_SIZE,
    })

    chat.setMessages(response.messages ?? [])
    hasMoreMessages.value = response.hasMore === true
    historyCursor.value = response.nextCursor ?? null
  } finally {
    loadingLatestMessages.value = false
  }
}

async function loadOlderMessages(): Promise<void> {
  if (initializingRoom.value) return
  if (loadingLatestMessages.value) return
  if (loadingOlderMessages.value) return
  if (!hasMoreMessages.value) return

  const cursor = historyCursor.value
  const el = messagesEl.value

  if (!cursor || !el) return

  const cursorKey = `${cursor.beforeCreatedAt}_${cursor.beforeId}`

  if (lastRequestedCursorKey.value === cursorKey) return

  const roomId = chat.currentRoomId
  const previousScrollHeight = el.scrollHeight
  const previousScrollTop = el.scrollTop

  lastRequestedCursorKey.value = cursorKey
  loadingOlderMessages.value = true

  try {
    // 先讓 Vue 顯示「載入舊訊息中...」
    await nextTick()

    // 確保瀏覽器已經繪製畫面
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        resolve()
      })
    })

    // 讓載入提示固定顯示 800 毫秒後，再呼叫 API
    await delay(800)

    const response = await getChatRoomMessagesApi(roomId, {
      limit: MESSAGE_PAGE_SIZE,
      beforeCreatedAt: cursor.beforeCreatedAt,
      beforeId: cursor.beforeId,
    })

    if (chat.currentRoomId !== roomId) return

    const olderMessages = response.messages ?? []

    if (olderMessages.length === 0) {
      hasMoreMessages.value = false
      historyCursor.value = null
      return
    }

    chat.prependMessages(olderMessages)

    hasMoreMessages.value = response.hasMore === true
    historyCursor.value = response.nextCursor ?? null

    await nextTick()

    const addedHeight = el.scrollHeight - previousScrollHeight

    // 維持載入前的閱讀位置
    el.scrollTop = previousScrollTop + addedHeight
  } catch (error) {
    lastRequestedCursorKey.value = null
    throw error
  } finally {
    loadingOlderMessages.value = false
  }
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
  try {
    await rejectChatInvitationApi(invitationId)

    chat.removeInvitation(invitationId)

    /**
     * 關閉邀請視窗，避免列表清空後仍停留在 Modal。
     */
    if (chat.invitations.length === 0) {
      showInvitations.value = false
    }

    showToast('已拒絕聊天室邀請')
  } catch {
    showToast('拒絕邀請失敗，請稍後再試', 'error')
  }
}

async function loadRoomMembers(roomId: string): Promise<void> {
  loadingRoomMembers.value = true

  try {
    const response = await getChatRoomMembersApi(roomId)
    roomMembers.value = response.members ?? []
  } finally {
    loadingRoomMembers.value = false
  }
}

async function openRoomMembers(): Promise<void> {
  if (!isCurrentGroupRoom.value) return

  showRoomMembers.value = true
  await loadRoomMembers(chat.currentRoomId)
}

async function inviteMembers(payload: { emails: string[] }): Promise<void> {
  if (!canInviteMembers.value || invitingMembers.value) return

  invitingMembers.value = true

  try {
    await inviteChatRoomMembersApi(chat.currentRoomId, {
      inviteEmails: payload.emails,
    })
    showInviteMembers.value = false
  } finally {
    invitingMembers.value = false
  }
}

async function openGroupManage(): Promise<void> {
  if (!canManageGroup.value) return

  showGroupManage.value = true
  await Promise.all([
    loadRoomMembers(chat.currentRoomId),
    loadRoomInvitations(chat.currentRoomId),
  ])
}

async function loadRoomInvitations(roomId: string): Promise<void> {
  loadingRoomInvitations.value = true

  try {
    const response = await getRoomInvitationsApi(roomId)

    roomInvitations.value = [...(response.invitations ?? [])]
  } catch {
    showToast('取得邀請紀錄失敗，請稍後再試', 'error')
  } finally {
    loadingRoomInvitations.value = false
  }
}

async function reInvite(inviteeAccount: string): Promise<void> {
  if (!canManageGroup.value) return

  // 從邀請列表找到 inviteeId 以顯示 loading
  const inv = roomInvitations.value.find(
    (item) => item.inviteeAccount === inviteeAccount,
  )

  if (inv) {
    reInvitingInviteeId.value = String(inv.inviteeId)
  }

  try {
    await inviteChatRoomMembersApi(chat.currentRoomId, { inviteEmails: [inviteeAccount] })
    await loadRoomInvitations(chat.currentRoomId)
    showToast('已重新送出邀請')
  } catch {
    showToast('重新邀請失敗，請稍後再試', 'error')
  } finally {
    reInvitingInviteeId.value = null
  }
}

async function saveGroupInfo(payload: { roomName: string; avatarUrl: string | null }): Promise<void> {
  if (!canManageGroup.value || updatingGroupInfo.value) return

  updatingGroupInfo.value = true

  try {
    await updateGroupChatRoomApi(chat.currentRoomId, {
      roomName: payload.roomName,
      avatarUrl: payload.avatarUrl,
    })
    await loadMyRooms()
    showToast('群組資訊已更新')
  } catch {
    showToast('更新失敗，請稍後再試', 'error')
  } finally {
    updatingGroupInfo.value = false
  }
}

async function removeMember(userId: string): Promise<void> {
  if (!canManageGroup.value || removingMemberUserId.value) return

  removingMemberUserId.value = userId

  try {
    await removeChatRoomMemberApi(chat.currentRoomId, userId)
    await loadRoomMembers(chat.currentRoomId)
    showToast('已移除成員')
  } catch {
    showToast('移除失敗，請稍後再試', 'error')
  } finally {
    removingMemberUserId.value = null
  }
}

async function transferManager(userId: string): Promise<void> {
  if (!canManageGroup.value || transferringManagerUserId.value) return

  transferringManagerUserId.value = userId

  try {
    await transferChatRoomManagerApi(chat.currentRoomId, {
      targetUserId: userId,
    })
    await loadMyRooms()
    await loadRoomMembers(chat.currentRoomId)
    showToast('已成功轉讓管理員')
  } catch {
    showToast('轉讓失敗，請稍後再試', 'error')
  } finally {
    transferringManagerUserId.value = null
  }
}

async function deleteGroupRoom(): Promise<void> {
  if (!canManageGroup.value || deletingGroupRoom.value) return

  deletingGroupRoom.value = true

  try {
    await deleteChatRoomApi(chat.currentRoomId)
    showGroupManage.value = false
    await loadMyRooms()
    await switchRoom('lobby')
    showToast('聊天室已刪除')
  } catch {
    showToast('刪除失敗，請稍後再試', 'error')
  } finally {
    deletingGroupRoom.value = false
  }
}

function openInvitations(): void {
  showUserMenu.value = false
  showInvitations.value = true
  chat.markInvitationsAsSeen()
}

function logout(): void {
  disconnectChatSocket()
  auth.logout()
  void router.replace('/login')
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

watch(
  lastMessageId,
  async (newMessageId, oldMessageId) => {
    if (initializingRoom.value) return
    if (loadingLatestMessages.value) return
    if (loadingOlderMessages.value) return
    if (!oldMessageId) return
    if (!newMessageId || newMessageId === oldMessageId) return

    await scrollToBottom(true)
  },
  {
    flush: "post",
  },
)

onMounted(async () => {
  if (!auth.isAuthenticated) return

  const roomId = String(route.query.roomId ?? 'lobby')

  await loadMyRooms()
  await loadMyInvitations(false)
  await switchRoom(roomId)

  connectChatSocket(
    auth.token,
    (message: ServerWsMessage) => {
      switch (message.type) {
        case "ROOM_DELETED": {
          const { roomId } = message.payload

          chat.applyEvent(message)

          if (chat.currentRoomId === roomId) {
            showGroupManage.value = false
            void switchRoom("lobby")
          }

          break
        }

        case "MEMBER_REMOVED": {
          const { roomId } = message.payload

          chat.applyEvent(message)

          if (chat.currentRoomId === roomId) {
            void switchRoom("lobby")
            showToast("你已被移出此聊天室", "error")
          }

          break
        }

        case "INVITATION_ACCEPTED": {
          const { roomId } = message.payload

          console.log("[ChatView] 收到邀請接受事件", message.payload)

          if (
            showGroupManage.value &&
            chat.currentRoomId === roomId
          ) {
            void Promise.all([
              loadRoomMembers(roomId),
              loadRoomInvitations(roomId),
            ])
          }

          break
        }

        case "INVITATION_REJECTED": {
          const { roomId, invitationId } = message.payload

          console.log("[ChatView] 收到邀請拒絕事件", message.payload)

          roomInvitations.value = roomInvitations.value.map((invitation) =>
            invitation.invitationId === invitationId
              ? {
                ...invitation,
                status: "rejected",
              }
              : invitation,
          )

          if (
            showGroupManage.value &&
            chat.currentRoomId === roomId
          ) {
            void loadRoomInvitations(roomId)
          }

          break
        }

        default:
          chat.applyEvent(message)
          break
      }
    },
    () => {
      void loadMyInvitations()
      joinRoom(chat.currentRoomId)
    },
    async () => {
      const currentRoute = router.currentRoute.value

      disconnectChatSocket()
      auth.logout()

      await router.replace({
        path: "/login",
        query: {
          redirect: currentRoute.fullPath,
          reason: "expired",
        },
      })
    },
  )

  startInvitationSync()
  startMidnightRefresh()
  window.addEventListener('focus', handleWindowFocus)
  document.addEventListener('visibilitychange', handleVisibilityChange)

  chat.showSelfWelcome(auth.user?.name ?? auth.user?.account ?? '使用者')
})

onUnmounted(() => {
  stopInvitationSync()
  stopMidnightRefresh()
  window.removeEventListener("focus", handleWindowFocus)
  document.removeEventListener("visibilitychange", handleVisibilityChange)
  disconnectChatSocket()
})
</script>
