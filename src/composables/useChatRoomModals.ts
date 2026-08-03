import { computed, ref, type Ref } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useChatStore } from '@/stores/chatStore'
import {
  acceptChatInvitationApi,
  acceptFriendRequestApi,
  createChatRoomApi,
  createFriendRequestApi,
  deleteChatRoomApi,
  deleteGroupChatRoomAvatarApi,
  getChatRoomMembersApi,
  getRoomInvitationsApi,
  inviteChatRoomMembersApi,
  removeChatRoomMemberApi,
  rejectChatInvitationApi,
  rejectFriendRequestApi,
  searchChatUsersApi,
  transferChatRoomManagerApi,
  updateGroupChatRoomApi,
  uploadGroupChatRoomAvatarApi,
} from '@/api/chatApi'
import type { UserProfile } from '@/api/profileApi'
import type { ChatFriendRequest, ChatInvitation, ChatRoomMember, ChatUserSearchItem } from '@/types/chat'

type ChatRoomModalsDeps = {
  showUserMenu: Ref<boolean>
  loadMyRooms: () => Promise<void>
  loadMyProfile: () => Promise<UserProfile>
  switchRoom: (roomId: string) => Promise<void>
  showToast: (message: string, type?: 'success' | 'error') => void
}

export function useChatRoomModals(deps: ChatRoomModalsDeps) {
  const auth = useAuthStore()
  const chat = useChatStore()

  const showCreateRoom = ref(false)
  const creatingRoom = ref(false)
  const showPrivateChat = ref(false)
  const creatingPrivateChat = ref(false)
  const searchingPrivateUsers = ref(false)
  const privateUserSearched = ref(false)
  const invitingPrivateUserId = ref<string | null>(null)
  const privateChatUsers = ref<ChatUserSearchItem[]>([])
  let privateUserSearchRequestId = 0

  const showProfileSettings = ref(false)
  const userProfile = ref<UserProfile | null>(null)

  const showInvitations = ref(false)
  const showRoomMembers = ref(false)
  const showInviteMembers = ref(false)
  const showGroupManage = ref(false)

  const invitingMembers = ref(false)
  const updatingGroupInfo = ref(false)
  const deletingGroupRoom = ref(false)
  const removingMemberUserId = ref<string | null>(null)
  const transferringManagerUserId = ref<string | null>(null)
  const reInvitingInviteeId = ref<string | null>(null)
  const loadingRoomMembers = ref(false)
  const loadingRoomInvitations = ref(false)
  const roomMembers = ref<ChatRoomMember[]>([])
  const roomInvitations = ref<ChatInvitation[]>([])
  const friendRequests = ref<ChatFriendRequest[]>([])
  const processingFriendRequestId = ref<string | null>(null)

  const notificationCount = computed(() => chat.invitations.length + friendRequests.value.length)

  async function loadRoomMembers(roomId: string): Promise<void> {
    loadingRoomMembers.value = true

    try {
      const response = await getChatRoomMembersApi(roomId)
      roomMembers.value = response.members ?? []
    } finally {
      loadingRoomMembers.value = false
    }
  }

  async function loadRoomInvitations(roomId: string): Promise<void> {
    loadingRoomInvitations.value = true

    try {
      const response = await getRoomInvitationsApi(roomId)
      roomInvitations.value = [...(response.invitations ?? [])]
    } finally {
      loadingRoomInvitations.value = false
    }
  }

  async function loadMyProfile(): Promise<void> {
    const profile = await deps.loadMyProfile()

    userProfile.value = profile
    auth.updateProfile({
      name: profile.name,
      avatarUrl: profile.avatarUrl,
      bio: profile.bio,
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

      await deps.switchRoom(response.roomId)
      showCreateRoom.value = false
    } finally {
      creatingRoom.value = false
    }
  }

  async function searchPrivateUsers(keyword: string): Promise<void> {
    const trimmedKeyword = keyword.trim()

    if (!trimmedKeyword) {
      clearPrivateUserSearch()
      return
    }

    const requestId = ++privateUserSearchRequestId

    searchingPrivateUsers.value = true
    privateUserSearched.value = true

    try {
      const response = await searchChatUsersApi(trimmedKeyword)

      if (requestId !== privateUserSearchRequestId) {
        return
      }

      privateChatUsers.value = response.users ?? []
    } catch {
      if (requestId !== privateUserSearchRequestId) {
        return
      }

      privateChatUsers.value = []
      deps.showToast('搜尋使用者失敗，請稍後再試', 'error')
    } finally {
      if (requestId === privateUserSearchRequestId) {
        searchingPrivateUsers.value = false
      }
    }
  }

  function clearPrivateUserSearch(): void {
    privateUserSearchRequestId += 1
    privateChatUsers.value = []
    privateUserSearched.value = false
    searchingPrivateUsers.value = false
  }

  function closePrivateChatModal(): void {
    showPrivateChat.value = false
    clearPrivateUserSearch()
  }

  async function createPrivateChat(user: ChatUserSearchItem): Promise<void> {
    if (user.friendshipStatus !== 'none' || creatingPrivateChat.value) {
      return
    }

    invitingPrivateUserId.value = String(user.userId)
    creatingPrivateChat.value = true

    try {
      await createFriendRequestApi(user.userId)

      privateChatUsers.value = privateChatUsers.value.map((item) =>
        item.userId === user.userId
          ? { ...item, friendshipStatus: 'outgoing_pending' }
          : item,
      )

      deps.showToast(`已向 ${user.name} 發送好友邀請`)
    } catch {
      deps.showToast('好友邀請發送失敗', 'error')
    } finally {
      creatingPrivateChat.value = false
      invitingPrivateUserId.value = null
    }
  }

  async function acceptInvitation(invitationId: string): Promise<void> {
    try {
      const response = await acceptChatInvitationApi(invitationId)

      chat.removeInvitation(invitationId)
      await deps.loadMyRooms()
      await deps.switchRoom(response.roomId)

      showInvitations.value = false
      deps.showToast('已接受聊天室邀請')
    } catch {
      deps.showToast('接受聊天室邀請失敗，請稍後再試', 'error')
    }
  }

  async function acceptFriendRequest(requestId: string): Promise<void> {
    if (processingFriendRequestId.value) return

    processingFriendRequestId.value = requestId

    try {
      const response = await acceptFriendRequestApi(requestId)

      friendRequests.value = friendRequests.value.filter((item) => item.requestId !== requestId)

      await deps.loadMyRooms()
      await deps.switchRoom(response.roomId)

      showInvitations.value = false
      deps.showToast('已接受好友申請')
    } catch {
      deps.showToast('接受好友申請失敗，請稍後再試', 'error')
    } finally {
      processingFriendRequestId.value = null
    }
  }

  async function rejectFriendRequest(requestId: string): Promise<void> {
    if (processingFriendRequestId.value) return

    processingFriendRequestId.value = requestId

    try {
      await rejectFriendRequestApi(requestId)

      friendRequests.value = friendRequests.value.filter((item) => item.requestId !== requestId)

      if (friendRequests.value.length === 0) {
        showInvitations.value = false
      }

      deps.showToast('已拒絕好友申請')
    } catch {
      deps.showToast('拒絕好友申請失敗，請稍後再試', 'error')
    } finally {
      processingFriendRequestId.value = null
    }
  }

  async function rejectInvitation(invitationId: string): Promise<void> {
    try {
      await rejectChatInvitationApi(invitationId)

      chat.removeInvitation(invitationId)

      if (chat.invitations.length === 0 && friendRequests.value.length === 0) {
        showInvitations.value = false
      }

      deps.showToast('已拒絕聊天室邀請')
    } catch {
      deps.showToast('拒絕邀請失敗，請稍後再試', 'error')
    }
  }

  async function inviteMembers(payload: { emails: string[] }): Promise<void> {
    if (invitingMembers.value) return
    if (!chat.currentRoomId) return

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

  async function openRoomMembers(): Promise<void> {
    if (!chat.currentRoomId) return
    showRoomMembers.value = true
    await loadRoomMembers(chat.currentRoomId)
  }

  async function openGroupManage(): Promise<void> {
    if (!chat.currentRoomId) return

    showGroupManage.value = true
    await Promise.all([loadRoomMembers(chat.currentRoomId), loadRoomInvitations(chat.currentRoomId)])
  }

  async function reInvite(inviteeAccount: string): Promise<void> {
    if (!chat.currentRoomId) return

    const inv = roomInvitations.value.find((item) => item.inviteeAccount === inviteeAccount)

    if (inv) {
      reInvitingInviteeId.value = String(inv.inviteeId)
    }

    try {
      await inviteChatRoomMembersApi(chat.currentRoomId, { inviteEmails: [inviteeAccount] })
      await loadRoomInvitations(chat.currentRoomId)
      deps.showToast('已重新送出邀請')
    } catch {
      deps.showToast('重新邀請失敗，請稍後再試', 'error')
    } finally {
      reInvitingInviteeId.value = null
    }
  }

  async function saveGroupInfo(payload: {
    roomName: string
    avatarFile: File | null
    removeAvatar: boolean
  }): Promise<void> {
    if (!chat.currentRoomId) return
    if (updatingGroupInfo.value) return

    updatingGroupInfo.value = true

    try {
      await updateGroupChatRoomApi(chat.currentRoomId, {
        roomName: payload.roomName,
      })

      if (payload.removeAvatar) {
        await deleteGroupChatRoomAvatarApi(chat.currentRoomId)
      } else if (payload.avatarFile) {
        await uploadGroupChatRoomAvatarApi(chat.currentRoomId, payload.avatarFile)
      }

      await deps.loadMyRooms()

      deps.showToast(payload.removeAvatar ? '群組頭像已刪除' : '群組資訊已更新')
    } catch {
      deps.showToast('更新失敗，請稍後再試', 'error')
    } finally {
      updatingGroupInfo.value = false
    }
  }

  async function removeMember(userId: string): Promise<void> {
    if (!chat.currentRoomId || removingMemberUserId.value) return

    removingMemberUserId.value = userId

    try {
      await removeChatRoomMemberApi(chat.currentRoomId, userId)
      await loadRoomMembers(chat.currentRoomId)
      deps.showToast('已移除成員')
    } catch {
      deps.showToast('移除失敗，請稍後再試', 'error')
    } finally {
      removingMemberUserId.value = null
    }
  }

  async function transferManager(userId: string): Promise<void> {
    if (!chat.currentRoomId || transferringManagerUserId.value) return

    transferringManagerUserId.value = userId

    try {
      await transferChatRoomManagerApi(chat.currentRoomId, {
        targetUserId: userId,
      })

      showGroupManage.value = false
      await deps.loadMyRooms()
      await loadRoomMembers(chat.currentRoomId)
      deps.showToast('已成功轉讓管理員')
    } catch {
      deps.showToast('轉讓失敗，請稍後再試', 'error')
    } finally {
      transferringManagerUserId.value = null
    }
  }

  async function deleteGroupRoom(): Promise<void> {
    if (!chat.currentRoomId || deletingGroupRoom.value) return

    deletingGroupRoom.value = true

    try {
      await deleteChatRoomApi(chat.currentRoomId)
      showGroupManage.value = false
      await deps.loadMyRooms()
      await deps.switchRoom('lobby')
      deps.showToast('聊天室已刪除')
    } catch {
      deps.showToast('刪除失敗，請稍後再試', 'error')
    } finally {
      deletingGroupRoom.value = false
    }
  }

  async function openProfileSettings(): Promise<void> {
    deps.showUserMenu.value = false

    try {
      userProfile.value = await deps.loadMyProfile()
      showProfileSettings.value = true
    } catch {
      deps.showToast('無法載入個人設定', 'error')
    }
  }

  function handleProfileSaved(profile: UserProfile): void {
    userProfile.value = profile
    auth.updateProfile({ name: profile.name, avatarUrl: profile.avatarUrl, bio: profile.bio })
    showProfileSettings.value = false
    deps.showToast('個人設定已更新')
  }

  function openInvitations(): void {
    deps.showUserMenu.value = false
    showInvitations.value = true
    chat.markNotificationsAsSeen()
  }

  return {
    showCreateRoom,
    creatingRoom,
    showPrivateChat,
    creatingPrivateChat,
    searchingPrivateUsers,
    privateUserSearched,
    invitingPrivateUserId,
    privateChatUsers,
    showProfileSettings,
    userProfile,
    showInvitations,
    showRoomMembers,
    showInviteMembers,
    showGroupManage,
    invitingMembers,
    updatingGroupInfo,
    deletingGroupRoom,
    removingMemberUserId,
    transferringManagerUserId,
    reInvitingInviteeId,
    loadingRoomMembers,
    loadingRoomInvitations,
    roomMembers,
    roomInvitations,
    friendRequests,
    processingFriendRequestId,
    notificationCount,
    loadRoomMembers,
    loadRoomInvitations,
    loadMyProfile,
    createRoom,
    searchPrivateUsers,
    clearPrivateUserSearch,
    closePrivateChatModal,
    createPrivateChat,
    acceptInvitation,
    acceptFriendRequest,
    rejectFriendRequest,
    rejectInvitation,
    inviteMembers,
    openRoomMembers,
    openGroupManage,
    reInvite,
    saveGroupInfo,
    removeMember,
    transferManager,
    deleteGroupRoom,
    openProfileSettings,
    handleProfileSaved,
    openInvitations,
  }
}
