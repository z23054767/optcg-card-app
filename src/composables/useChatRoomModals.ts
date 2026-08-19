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
  blockUserApi,
  removeChatRoomMemberApi,
  rejectChatInvitationApi,
  rejectFriendRequestApi,
  searchChatUsersApi,
  transferChatRoomManagerApi,
  unblockUserApi,
  updateGroupChatRoomApi,
  uploadGroupChatRoomAvatarApi,
} from '@/api/chatApi'
import type { UserProfile } from '@/api/profileApi'
import type { AvatarUploadPayload } from '@/types/avatarUpload'
import type {
  ChatFriendshipStatus,
  ChatBlockStatus,
  ChatFriendRequest,
  ChatInvitation,
  ChatRoomListItem,
  ChatRoomMember,
  ChatUserSearchItem,
} from '@/types/chat'
import {
  showConfirmAlert,
  showDangerConfirmAlert,
  showErrorAlert,
  showSuccessAlert,
} from '@/utils/alerts'

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
  const showMessageUserProfile = ref(false)
  const messageProfileLoading = ref(false)
  const sendingMessageUserFriendRequest = ref(false)
  const messageProfileUser = ref<ChatUserSearchItem | null>(null)

  const showInvitations = ref(false)
  const showRoomMembers = ref(false)
  const showInviteMembers = ref(false)
  const showGroupManage = ref(false)
  const groupManageRoom = ref<ChatRoomListItem | null>(null)

  const invitingMembers = ref(false)
  const updatingGroupInfo = ref(false)
  const deletingGroupRoom = ref(false)
  const removingMemberUserId = ref<string | null>(null)
  const transferringManagerUserId = ref<string | null>(null)
  const leavingGroupRoom = ref(false)
  const removingFriend = ref(false)
  const reInvitingInviteeId = ref<string | null>(null)
  const loadingRoomMembers = ref(false)
  const loadingRoomInvitations = ref(false)
  const roomMembers = ref<ChatRoomMember[]>([])
  const roomInvitations = ref<ChatInvitation[]>([])
  const friendRequests = ref<ChatFriendRequest[]>([])
  const processingFriendRequestId = ref<string | null>(null)
  const currentPrivateFriendshipStatus = ref<ChatFriendshipStatus | null>(null)
  const currentPrivateBlockStatus = ref<ChatBlockStatus>('none')

  const notificationCount = computed(() => chat.invitations.length + friendRequests.value.length)

  function cloneRoom(room: ChatRoomListItem): ChatRoomListItem {
    return { ...room }
  }

  function createMessageUserFallback(payload: {
    userId: string
    username: string
    displayName: string
  }): ChatUserSearchItem {
    return {
      userId: payload.userId,
      name: payload.username,
      displayName: payload.displayName || payload.username,
      avatarUrl: null,
      friendshipStatus: 'none',
      blockStatus: 'none',
    }
  }

  function mergeMessageUserWithSearchResult(
    fallback: ChatUserSearchItem,
    searchResult?: ChatUserSearchItem,
  ): ChatUserSearchItem {
    if (!searchResult) {
      return fallback
    }

    return {
      userId: searchResult.userId || fallback.userId,
      name: searchResult.name || fallback.name,
      displayName: searchResult.displayName || fallback.displayName,
      avatarUrl: searchResult.avatarUrl ?? fallback.avatarUrl,
      friendshipStatus: searchResult.friendshipStatus,
      blockStatus: searchResult.blockStatus,
    }
  }

  async function resolveMessageUserProfile(
    payload: {
      userId: string
      username: string
      displayName: string
    },
  ): Promise<ChatUserSearchItem> {
    const fallback = createMessageUserFallback(payload)

    const response = await searchChatUsersApi(payload.username)
    const normalizedUsername = payload.username.trim().toLowerCase()
    const matchedUser = (response.users ?? []).find((item) => item.name.trim().toLowerCase() === normalizedUsername)

    return mergeMessageUserWithSearchResult(fallback, matchedUser)
  }

  async function openMessageUserProfile(payload: {
    userId: string
    username: string
    displayName: string
  }): Promise<void> {
    if (!payload.userId || !payload.username.trim() || String(payload.userId) === String(auth.userId)) {
      return
    }

    messageProfileLoading.value = true
    showMessageUserProfile.value = true
    messageProfileUser.value = createMessageUserFallback(payload)

    try {
      messageProfileUser.value = await resolveMessageUserProfile(payload)
    } catch {
      deps.showToast('載入使用者資料失敗，請稍後再試', 'error')
    } finally {
      messageProfileLoading.value = false
    }
  }

  function closeMessageUserProfile(): void {
    showMessageUserProfile.value = false
    messageProfileLoading.value = false
    sendingMessageUserFriendRequest.value = false
    messageProfileUser.value = null
  }

  function getFriendshipStatusLabel(status: ChatFriendshipStatus): string {
    switch (status) {
      case 'friend':
        return '已是好友'
      case 'incoming_pending':
        return '對方已送出申請，請到通知中心接受'
      case 'outgoing_pending':
        return '好友邀請已送出'
      default:
        return '尚未成為好友'
    }
  }

  async function sendFriendRequestToMessageUser(payload: {
    userId: string
    username?: string
    name?: string
    displayName: string
  }): Promise<void> {
    const username = String(payload.username ?? payload.name ?? '').trim()

    if (
      !payload.userId ||
      !username ||
      String(payload.userId) === String(auth.userId) ||
      sendingMessageUserFriendRequest.value
    ) {
      return
    }

    sendingMessageUserFriendRequest.value = true

    try {
      const user = await resolveMessageUserProfile({
        userId: payload.userId,
        username,
        displayName: payload.displayName,
      })

      if (user.friendshipStatus !== 'none') {
        deps.showToast(getFriendshipStatusLabel(user.friendshipStatus))
        messageProfileUser.value = user
        return
      }

      if (user.blockStatus === 'blocked_by_me') {
        deps.showToast('你已封鎖此使用者', 'error')
        messageProfileUser.value = user
        return
      }

      if (user.blockStatus === 'blocked_me') {
        deps.showToast('你已被此使用者封鎖', 'error')
        messageProfileUser.value = user
        return
      }

      await createFriendRequestApi(user.userId)

      const updatedUser = { ...user, friendshipStatus: 'outgoing_pending' as const }
      messageProfileUser.value = updatedUser
      deps.showToast(`已向 @${user.name} 發送好友邀請`)
    } catch {
      deps.showToast('好友邀請發送失敗', 'error')
    } finally {
      sendingMessageUserFriendRequest.value = false
    }
  }

  async function loadRoomMembers(roomId: string): Promise<void> {
    loadingRoomMembers.value = true

    try {
      const response = await getChatRoomMembersApi(roomId)
      roomMembers.value = response.members ?? []

      if (chat.currentRoomId !== roomId) {
        return
      }

      if (chat.rooms.find((room) => room.id === roomId)?.type !== 'private') {
        currentPrivateFriendshipStatus.value = null
        currentPrivateBlockStatus.value = 'none'
        return
      }

      const otherMember = roomMembers.value.find((member) => String(member.userId) !== String(auth.userId))

      if (!otherMember?.name) {
        currentPrivateFriendshipStatus.value = null
        currentPrivateBlockStatus.value = 'none'
        return
      }

      const matchedUser = await searchChatUsersApi(otherMember.name)
      const exactUser = (matchedUser.users ?? []).find(
        (user) => user.userId === otherMember.userId || user.name === otherMember.name,
      )

      currentPrivateFriendshipStatus.value = exactUser?.friendshipStatus ?? null
      currentPrivateBlockStatus.value = exactUser?.blockStatus ?? 'none'
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
      displayName: profile.displayName,
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
    if (user.friendshipStatus !== 'none' || user.blockStatus !== 'none' || creatingPrivateChat.value) {
      return
    }

    invitingPrivateUserId.value = String(user.userId)
    creatingPrivateChat.value = true

    try {
      await createFriendRequestApi(user.userId)

      privateChatUsers.value = privateChatUsers.value.map((item) =>
        item.userId === user.userId
          ? { ...item, friendshipStatus: 'outgoing_pending', blockStatus: 'none' }
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

  async function inviteMembers(payload: { names: string[] }): Promise<void> {
    if (invitingMembers.value) return
    if (!chat.currentRoomId) return
    if (payload.names.length === 0) return

    const roomId = chat.currentRoomId

    invitingMembers.value = true

    try {
      await inviteChatRoomMembersApi(roomId, {
        names: payload.names,
      })

      await loadRoomInvitations(roomId)

      showInviteMembers.value = false
      deps.showToast('邀請已送出')
    } catch {
      deps.showToast('邀請成員失敗，請稍後再試', 'error')
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
    const currentRoom = chat.rooms.find((room) => room.id === chat.currentRoomId)

    if (!currentRoom) return

    groupManageRoom.value = cloneRoom(currentRoom)

    showGroupManage.value = true
    await Promise.all([
      loadRoomMembers(chat.currentRoomId),
      loadRoomInvitations(chat.currentRoomId),
    ])
  }

  async function reInvite(inviteeName: string): Promise<void> {
    if (!chat.currentRoomId) return

    const invitation = roomInvitations.value.find(
      (item) => item.inviteeName === inviteeName,
    )

    if (invitation) {
      reInvitingInviteeId.value = String(invitation.inviteeId)
    }

    try {
      await inviteChatRoomMembersApi(chat.currentRoomId, {
        names: [inviteeName],
      })

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
    avatarUpload: AvatarUploadPayload | null
    hadSelectedAvatarFile: boolean
    removeAvatar: boolean
  }): Promise<void> {
    if (!chat.currentRoomId) return
    if (updatingGroupInfo.value) return

    updatingGroupInfo.value = true

    try {
      if (payload.hadSelectedAvatarFile && !payload.avatarUpload) {
        throw new Error('GROUP_AVATAR_UPLOAD_PAYLOAD_GENERATION_FAILED')
      }

      const currentRoom =
        groupManageRoom.value ?? chat.rooms.find((room) => room.id === chat.currentRoomId) ?? null
      const originalRoomName = currentRoom?.name?.trim() ?? ''
      const nextRoomName = payload.roomName.trim()

      if (nextRoomName !== originalRoomName) {
        await updateGroupChatRoomApi(chat.currentRoomId, {
          roomName: nextRoomName,
        })

        if (currentRoom) {
          groupManageRoom.value = {
            ...currentRoom,
            name: nextRoomName,
          }
        }
      }

      if (payload.avatarUpload) {
        const response = await uploadGroupChatRoomAvatarApi(chat.currentRoomId, payload.avatarUpload)
        const baseRoom = groupManageRoom.value ?? currentRoom

        if (baseRoom) {
          groupManageRoom.value = {
            ...baseRoom,
            avatarUrl: response.avatarPath,
          }
        }

        chat.updateRoomInfo(chat.currentRoomId, undefined, response.avatarPath)
      } else if (payload.removeAvatar) {
        await deleteGroupChatRoomAvatarApi(chat.currentRoomId)
        const baseRoom = groupManageRoom.value ?? currentRoom

        if (baseRoom) {
          groupManageRoom.value = {
            ...baseRoom,
            avatarUrl: null,
          }
        }

        chat.updateRoomInfo(chat.currentRoomId, undefined, null)
      }

      await deps.loadMyRooms()
      const refreshedRoom = chat.rooms.find((room) => room.id === chat.currentRoomId)

      if (refreshedRoom) {
        groupManageRoom.value = cloneRoom(refreshedRoom)
      }

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

  async function leaveCurrentGroupRoom(): Promise<void> {
    if (!chat.currentRoomId || leavingGroupRoom.value) return;

    if (!auth.userId) return;

    const roomId = chat.currentRoomId;

    const result = await showDangerConfirmAlert("退出後將不再收到此群組的新訊息。", {
      title: '確定要退出群組聊天室？',
      confirmButtonText: '退出群組',
      cancelButtonText: '保留在群組',
    });

    if (!result.isConfirmed) {
      return;
    }

    leavingGroupRoom.value = true;

    try {
      await removeChatRoomMemberApi(roomId, String(auth.userId));

      showGroupManage.value = false;
      showRoomMembers.value = false;

      await deps.loadMyRooms();
      await deps.switchRoom("lobby");

      await showSuccessAlert("已退出群組聊天室");
    } catch {
      await showErrorAlert("退出群組聊天室失敗，請稍後再試");
    } finally {
      leavingGroupRoom.value = false;
    }
  }

  async function sendFriendRequestToCurrentPrivateUser(): Promise<void> {
    if (!chat.currentRoomId || sendingMessageUserFriendRequest.value) return

    const otherMember = roomMembers.value.find(
      (member) => String(member.userId) !== String(auth.userId),
    )

    if (!otherMember) return

    if (currentPrivateBlockStatus.value !== 'none') {
      await showErrorAlert('此使用者目前無法發送好友申請')
      return
    }

    sendingMessageUserFriendRequest.value = true

    try {
      await createFriendRequestApi(otherMember.userId)
      await loadRoomMembers(chat.currentRoomId)
      await showSuccessAlert('已發送好友申請')
    } catch {
      await showErrorAlert('好友申請發送失敗，請稍後再試')
    } finally {
      sendingMessageUserFriendRequest.value = false
    }
  }

  async function blockCurrentUser(): Promise<void> {
    if (!chat.currentRoomId || currentPrivateBlockStatus.value !== 'none') return

    const otherMember = roomMembers.value.find(
      (member) => String(member.userId) !== String(auth.userId),
    )

    if (!otherMember) return

    const result = await showDangerConfirmAlert('封鎖後你們將無法繼續互相傳送訊息。', {
      title: '確定要封鎖這個使用者？',
      confirmButtonText: '封鎖使用者',
      cancelButtonText: '取消',
    })
    if (!result.isConfirmed) {
      return
    }

    removingFriend.value = true

    try {
      await blockUserApi(otherMember.userId)
      await loadRoomMembers(chat.currentRoomId)
      await deps.loadMyRooms()
      await showSuccessAlert('已封鎖使用者')
    } catch {
      await showErrorAlert('封鎖失敗，請稍後再試')
    } finally {
      removingFriend.value = false
    }
  }

  async function unblockCurrentUser(): Promise<void> {
    if (!chat.currentRoomId || currentPrivateBlockStatus.value !== 'blocked_by_me') return

    const otherMember = roomMembers.value.find(
      (member) => String(member.userId) !== String(auth.userId),
    )

    if (!otherMember) return

    const result = await showConfirmAlert('解除封鎖後，對方可再次與你互動。', {
      title: '確定要解除封鎖嗎？',
      confirmButtonText: '解除封鎖',
      cancelButtonText: '取消',
    })
    if (!result.isConfirmed) {
      return
    }

    removingFriend.value = true

    try {
      await unblockUserApi(otherMember.userId)
      await loadRoomMembers(chat.currentRoomId)
      await deps.loadMyRooms()
      await showSuccessAlert('已解除封鎖')
    } catch {
      await showErrorAlert('解除封鎖失敗，請稍後再試')
    } finally {
      removingFriend.value = false
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
    auth.updateProfile({ displayName: profile.displayName, avatarUrl: profile.avatarUrl, bio: profile.bio })
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
    showMessageUserProfile,
    messageProfileLoading,
    sendingMessageUserFriendRequest,
    messageProfileUser,
    showInvitations,
    showRoomMembers,
    showInviteMembers,
    showGroupManage,
    groupManageRoom,
    invitingMembers,
    updatingGroupInfo,
    deletingGroupRoom,
    leavingGroupRoom,
    currentPrivateFriendshipStatus,
    currentPrivateBlockStatus,
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
    leaveCurrentGroupRoom,
    sendFriendRequestToCurrentPrivateUser,
    blockCurrentUser,
    unblockCurrentUser,
    openProfileSettings,
    handleProfileSaved,
    openInvitations,
    openMessageUserProfile,
    closeMessageUserProfile,
    sendFriendRequestToMessageUser,
  }
}
