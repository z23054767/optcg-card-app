import { computed, onMounted, onUnmounted, ref, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  getMyChatInvitationsApi,
  getMyChatRoomsApi,
  getMyFriendRequestsApi,
} from '@/api/chatApi'
import { connectChatSocket, disconnectChatSocket, joinRoom } from '@/websocket/chatSocket'
import { refreshAccessToken } from '@/api/http'
import { getMyProfileApi, resolveUserAvatarUrl, type UserProfile } from '@/api/profileApi'
import { useAuthStore } from '@/stores/authStore'
import { useChatStore } from '@/stores/chatStore'
import type { ChatFriendRequest, ChatInvitation } from '@/types/chat'

type RoomSessionDeps = {
  messages: {
    messagesEl: { value: HTMLElement | null }
    loadingLatestMessages: { value: boolean }
    loadingOlderMessages: { value: boolean }
    initializingRoom: { value: boolean }
    prepareRoom: (roomId: string) => void
    loadLatestMessages: (roomId: string) => Promise<void>
    scrollToBottom: (smooth?: boolean) => Promise<void>
  }
  modals: {
    showGroupManage: { value: boolean }
    showRoomMembers: { value: boolean }
    showInviteMembers: { value: boolean }
    showPrivateChat: { value: boolean }
    showInvitations: { value: boolean }
    showProfileSettings: { value: boolean }
    friendRequests: { value: ChatFriendRequest[] }
    roomInvitations: { value: ChatInvitation[] }
    roomMembers: { value: Array<{ userId: string; account: string; name: string; role: 'manager' | 'member'; avatarUrl?: string | null }> }
    loadRoomMembers: (roomId: string) => Promise<void>
    loadRoomInvitations: (roomId: string) => Promise<void>
  }
  showToast: (message: string, type?: 'success' | 'error') => void
}

export function useChatRoomSession() {
  const auth = useAuthStore()
  const chat = useChatStore()
  const route = useRoute()
  const router = useRouter()

  const sidebarOpen = ref(false)
  const showUserMenu = ref(false)

  const deps = shallowRef<RoomSessionDeps | null>(null)
  const invitationSyncTimer = ref<ReturnType<typeof setInterval> | null>(null)
  const currentProfile = ref<UserProfile | null>(null)

  const currentRoom = computed(() => chat.rooms.find((room) => room.id === chat.currentRoomId))

  const currentRoomTitle = computed(() => {
    if (chat.currentRoomId === 'lobby') return '大廳'

    return currentRoom.value?.name?.trim() || '聊天室'
  })

  const currentRoomType = computed<'group' | 'private' | 'lobby'>(() => {
    if (chat.currentRoomId === 'lobby') return 'lobby'

    return currentRoom.value?.type === 'group' ? 'group' : 'private'
  })

  const currentRoomAvatarUrl = computed<string | null>(() => {
    switch (currentRoomType.value) {
      case 'group':
      case 'private':
        return currentRoom.value?.avatarUrl ?? null
      default:
        return null
    }
  })

  const isCurrentGroupRoom = computed(() => currentRoom.value?.type === 'group')
  const isCurrentRoomManager = computed(
    () => Boolean(currentRoom.value) && String(currentRoom.value?.ownerId) === String(auth.userId),
  )
  const canCreateRoom = computed(() => chat.currentRoomId === 'lobby')
  const canStartPrivateChat = computed(() => chat.currentRoomId === 'lobby')
  const canInviteMembers = computed(() => isCurrentGroupRoom.value && isCurrentRoomManager.value)
  const canManageGroup = computed(() => isCurrentGroupRoom.value && isCurrentRoomManager.value)
  const resolvedUserAvatarUrl = computed(() => resolveUserAvatarUrl(auth.user?.avatarUrl))
  const notificationCount = computed<number>(() => {
    return chat.invitations.length + (deps.value?.modals.friendRequests.value.length ?? 0)
  })

  function initializeSession(nextDeps: RoomSessionDeps): void {
    deps.value = nextDeps
  }

  async function loadMyProfile(): Promise<UserProfile> {
    const profile = await getMyProfileApi()
    currentProfile.value = profile

    auth.updateProfile({
      name: profile.name,
      avatarUrl: profile.avatarUrl,
      bio: profile.bio,
    })

    return profile
  }

  async function loadMyRooms(): Promise<void> {
    const response = await getMyChatRoomsApi()
    chat.setRooms(response.rooms ?? [])
  }

  async function loadMyInvitations(markUnreadOnNew = true): Promise<{
    invitations: ChatInvitation[]
    friendRequests: ChatFriendRequest[]
  }> {
    const [invitationResponse, friendResponse] = await Promise.all([
      getMyChatInvitationsApi(),
      getMyFriendRequestsApi(),
    ])

    const response = {
      invitations: invitationResponse.invitations ?? [],
      friendRequests: friendResponse.requests ?? [],
    }

    chat.setInvitations(response.invitations ?? [], { markUnreadOnNew })
    depsSafe().modals.friendRequests.value = response.friendRequests ?? []
    return response
  }

  async function switchRoom(roomId: string): Promise<void> {
    const nextDeps = depsSafe()

    nextDeps.messages.initializingRoom.value = true

    try {
      nextDeps.messages.prepareRoom(roomId)
      nextDeps.modals.showRoomMembers.value = false
      nextDeps.modals.showInviteMembers.value = false
      nextDeps.modals.showPrivateChat.value = false
      nextDeps.modals.showGroupManage.value = false

      joinRoom(roomId)

      await nextDeps.messages.loadLatestMessages(roomId)

      if (isCurrentGroupRoom.value) {
        await nextDeps.modals.loadRoomMembers(roomId)
      } else {
        nextDeps.modals.roomMembers.value = []
      }

      await nextDeps.messages.scrollToBottom(false)
    } finally {
      nextDeps.messages.initializingRoom.value = false
    }
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

  function logout(): void {
    disconnectChatSocket()
    auth.logout()
    void router.replace('/login')
  }

  function backToLobby(): Promise<void> {
    return switchRoom('lobby')
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

  function depsSafe(): RoomSessionDeps {
    if (!deps.value) {
      throw new Error('Chat room session dependencies are not initialized')
    }

    return deps.value
  }

  onMounted(async () => {
    if (!deps.value) return
    if (!auth.isAuthenticated) return

    const roomId = String(route.query.roomId ?? 'lobby')

    await Promise.all([
      loadMyProfile(),
      loadMyRooms(),
      loadMyInvitations(false),
    ])

    await switchRoom(roomId)

    connectChatSocket(
      auth.token,
      (message) => {
        const nextDeps = depsSafe()

        switch (message.type) {
          case 'ROOM_DELETED': {
            chat.applyEvent(message)
            const { roomId: deletedRoomId } = message.payload
            if (chat.currentRoomId === deletedRoomId) {
              nextDeps.modals.showGroupManage.value = false
              void switchRoom('lobby')
            }
            break
          }
          case 'MEMBER_REMOVED': {
            chat.applyEvent(message)
            const { roomId: removedRoomId } = message.payload
            if (chat.currentRoomId === removedRoomId) {
              void switchRoom('lobby')
              nextDeps.showToast('你已被移出此聊天室', 'error')
            }
            break
          }
          case 'ROOM_MANAGER_TRANSFERRED': {
            chat.applyEvent(message)
            const { roomId: transferredRoomId, ownerId } = message.payload
            if (chat.currentRoomId === transferredRoomId) {
              void nextDeps.modals.loadRoomMembers(transferredRoomId)
              if (String(ownerId) === String(auth.userId)) {
                nextDeps.showToast('你已成為聊天室管理員')
              } else {
                nextDeps.modals.showGroupManage.value = false
                nextDeps.showToast('聊天室管理員已變更')
              }
            }
            break
          }
          case 'USER_PROFILE_UPDATED': {
            chat.applyEvent(message)
            void loadMyRooms()
            if (chat.currentRoomId !== 'lobby') {
              void nextDeps.modals.loadRoomMembers(chat.currentRoomId)
            }
            break
          }
          case 'INVITATION_ACCEPTED': {
            chat.applyEvent(message)
            const { roomId: acceptedRoomId } = message.payload
            if (nextDeps.modals.showGroupManage.value && chat.currentRoomId === acceptedRoomId) {
              void Promise.all([
                nextDeps.modals.loadRoomMembers(acceptedRoomId),
                nextDeps.modals.loadRoomInvitations(acceptedRoomId),
              ])
            }
            break
          }
          case 'INVITATION_REJECTED': {
            chat.applyEvent(message)
            const { roomId: rejectedRoomId, invitationId } = message.payload
            nextDeps.modals.roomInvitations.value = nextDeps.modals.roomInvitations.value.map((invitation) =>
              invitation.invitationId === invitationId
                ? { ...invitation, status: 'rejected' }
                : invitation,
            )
            if (nextDeps.modals.showGroupManage.value && chat.currentRoomId === rejectedRoomId) {
              void nextDeps.modals.loadRoomInvitations(rejectedRoomId)
            }
            break
          }
          case 'FRIEND_REQUEST_ACCEPTED': {
            chat.applyEvent(message)
            const { requestId } = message.payload
            nextDeps.modals.friendRequests.value = nextDeps.modals.friendRequests.value.filter(
              (item) => item.requestId !== requestId,
            )
            void loadMyRooms()
            if (chat.currentRoomId === 'lobby') {
              nextDeps.showToast('好友已接受你的申請')
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
        try {
          return await refreshAccessToken()
        } catch {
          const currentRoute = router.currentRoute.value
          disconnectChatSocket()
          auth.logout()

          await router.replace({
            path: '/login',
            query: { redirect: currentRoute.fullPath, reason: 'expired' },
          })

          return null
        }
      },
    )

    startInvitationSync()
    chat.showSelfWelcome(auth.user?.name ?? auth.user?.account ?? '使用者')
  })

  onUnmounted(() => {
    stopInvitationSync()
    disconnectChatSocket()
  })

  return {
    sidebarOpen,
    showUserMenu,
    currentProfile,
    currentRoom,
    currentRoomTitle,
    currentRoomType,
    currentRoomAvatarUrl,
    isCurrentGroupRoom,
    isCurrentRoomManager,
    canCreateRoom,
    canStartPrivateChat,
    canInviteMembers,
    canManageGroup,
    resolvedUserAvatarUrl,
    notificationCount,
    loadMyProfile,
    loadMyRooms,
    loadMyInvitations,
    switchRoom,
    backToLobby,
    toggleSidebar,
    toggleUserMenu,
    logout,
    initializeSession,
  }
}
