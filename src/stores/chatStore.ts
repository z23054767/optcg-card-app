import { defineStore } from 'pinia'
import type {
  ChatFriendRequest,
  ChatInvitation,
  ChatMessage,
  ChatReplyContext,
  ChatRoomListItem,
} from '@/types/chat'
import { RECALL_MESSAGE_PLACEHOLDER } from '@/types/chat'
import type { ChatWsEvent } from '@/types/chatWsEvents'

interface WelcomePopup {
  visible: boolean
  message: string
}

interface ChatState {
  messages: ChatMessage[]
  users: Map<string, { displayName: string; username: string }>
  typingUsersByRoom: Map<string, Map<string, { displayName: string; username: string; updatedAt: number }>>
  replyingToMessage: ChatReplyContext | null
  welcomePopup: WelcomePopup
  onlineUsers: Set<string>
  roomMembers: Map<string, Set<string>>
  currentRoomId: string
  rooms: ChatRoomListItem[]
  invitations: ChatInvitation[]
  friendRequests: ChatFriendRequest[]
  hasUnreadInvitationNotice: boolean
  hasUnreadFriendRequestNotice: boolean
  unreadMessageCountsByRoom: Record<string, number>
}

export const useChatStore = defineStore('chat', {
  state: (): ChatState => ({
    messages: [],
    users: new Map(),
    typingUsersByRoom: new Map(),
    replyingToMessage: null,
    welcomePopup: { visible: false, message: '' },
    onlineUsers: new Set(),
    roomMembers: new Map(),
    currentRoomId: 'lobby',
    rooms: [],
    invitations: [],
    friendRequests: [],
    hasUnreadInvitationNotice: false,
    hasUnreadFriendRequestNotice: false,
    unreadMessageCountsByRoom: {},
  }),

  actions: {
    // #region 處理來自 WebSocket 的事件
    applyEvent(event: ChatWsEvent, options?: { currentUserId?: string }): void {
      switch (event.type) {
        case 'NEW_MESSAGE': {
          const roomId = String(event.payload.roomId)
          const senderId = String(event.payload.message.senderId)
          const currentUserId = options?.currentUserId ? String(options.currentUserId) : ''

          if (roomId === String(this.currentRoomId)) {
            this.appendMessage(event.payload.message)
          }

          if (roomId !== String(this.currentRoomId) && senderId !== currentUserId) {
            this.incrementUnreadMessageCount(roomId)
          }
          break
        }

        case 'MESSAGE_RECALLED':
          this.applyMessageRecalled(event.payload.message)
          break

        case 'USER_ONLINE': {
          const { userId, displayName, username } = event.payload
          const id = String(userId)

          const map = new Map(this.users)
          map.set(id, { displayName, username })
          this.users = map

          this.handleUserOnline({
            userId: id,
            displayName,
            username,
          })

          break
        }

        case 'USER_OFFLINE':
          this.handleUserOffline(event.payload.userId)
          break

        case 'ROOM_JOINED':
          this.userJoinedRoom(event.payload.roomId, event.payload.userId)
          break

        case 'ROOM_LEFT':
          this.userLeftRoom(event.payload.roomId, event.payload.userId)
          break

        case 'LOBBY_SNAPSHOT':
          this.setLobbySnapshot(event.payload.userIds)
          break
        case 'INVITATION_RECEIVED':
          this.addInvitation(event.payload)
          break
        case 'FRIEND_REQUEST_RECEIVED':
          this.addFriendRequest(event.payload)
          break

        case 'FRIEND_REQUEST_ACCEPTED':
          this.removeFriendRequest(event.payload.requestId)
          break

        case 'FRIEND_REQUEST_REJECTED':
          this.removeFriendRequest(event.payload.requestId)
          break

        case 'PRIVATE_RELATIONSHIP_UPDATED':
          break

        case 'ROOM_SNAPSHOT':
          this.setRoomSnapshot(event.payload.roomId, event.payload.userIds)
          break

        case 'ROOM_DELETED':
          this.removeRoom(event.payload.roomId)
          break

        case 'MEMBER_REMOVED':
          this.removeRoom(event.payload.roomId)
          break

        case 'ROOM_MANAGER_TRANSFERRED':
          this.updateRoomOwner(event.payload.roomId, event.payload.ownerId)
          break

        case 'USER_PROFILE_UPDATED':
          // ChatView 會重新取得聊天室與目前成員資料。
          break

        case 'USER_TYPING':
          this.handleUserTyping(event.payload)
          break

        case 'ERROR':
          console.warn('[ChatStore] WebSocket error:', event.payload.message)
          break

        case 'ROOM_UPDATED':
          this.updateRoomInfo(event.payload.roomId, event.payload.roomName, event.payload.avatarUrl)
          break

        case 'INVITATION_ACCEPTED':
          // 管理員側在 ChatView 重新取得成員與邀請資料
          break
        case 'INVITATION_REJECTED':
          // 管理員側在 ChatView 直接處理，store 不需額外狀態
          break

        default:
          console.warn('[ChatStore] Unknown event:', event)
      }
    },
    // #endregion

    //# region 狀態處理
    setInvitations(invitations: ChatInvitation[], options?: { markUnreadOnNew?: boolean }): void {
      const markUnreadOnNew = options?.markUnreadOnNew ?? true
      const existingIds = new Set(this.invitations.map((item) => item.invitationId))
      const hasNewInvitation = invitations.some((item) => !existingIds.has(item.invitationId))

      this.invitations = invitations

      if (markUnreadOnNew && hasNewInvitation) {
        this.hasUnreadInvitationNotice = true
      }
    },

    addInvitation(invitation: ChatInvitation): void {
      const exists = this.invitations.some((item) => item.invitationId === invitation.invitationId)

      if (exists) return

      this.invitations = [invitation, ...this.invitations]
      this.hasUnreadInvitationNotice = true
    },

    removeInvitation(invitationId: string): void {
      this.invitations = this.invitations.filter((item) => item.invitationId !== invitationId)
    },

    markInvitationsAsSeen(): void {
      this.hasUnreadInvitationNotice = false
    },

    setFriendRequests(
      friendRequests: ChatFriendRequest[],
      options?: { markUnreadOnNew?: boolean },
    ): void {
      const markUnreadOnNew = options?.markUnreadOnNew ?? true

      const existingIds = new Set(this.friendRequests.map((item) => item.requestId))

      const hasNewFriendRequest = friendRequests.some((item) => !existingIds.has(item.requestId))

      this.friendRequests = friendRequests

      if (markUnreadOnNew && hasNewFriendRequest) {
        this.hasUnreadFriendRequestNotice = true
      }
    },

    addFriendRequest(friendRequest: ChatFriendRequest): void {
      const exists = this.friendRequests.some((item) => item.requestId === friendRequest.requestId)

      if (exists) return

      this.friendRequests = [friendRequest, ...this.friendRequests]

      this.hasUnreadFriendRequestNotice = true
    },

    removeFriendRequest(requestId: string): void {
      this.friendRequests = this.friendRequests.filter((item) => item.requestId !== requestId)
    },

    markFriendRequestsAsSeen(): void {
      this.hasUnreadFriendRequestNotice = false
    },

    markNotificationsAsSeen(): void {
      this.hasUnreadInvitationNotice = false
      this.hasUnreadFriendRequestNotice = false
    },

    incrementUnreadMessageCount(roomId: string): void {
      const normalizedRoomId = String(roomId)
      const currentCount = this.unreadMessageCountsByRoom[normalizedRoomId] ?? 0

      this.unreadMessageCountsByRoom = {
        ...this.unreadMessageCountsByRoom,
        [normalizedRoomId]: currentCount + 1,
      }
    },

    markRoomMessagesAsRead(roomId: string): void {
      const normalizedRoomId = String(roomId)

      if (!(normalizedRoomId in this.unreadMessageCountsByRoom)) {
        return
      }

      const nextCounts = { ...this.unreadMessageCountsByRoom }
      delete nextCounts[normalizedRoomId]
      this.unreadMessageCountsByRoom = nextCounts
    },

    setRoomSnapshot(roomId: string, userIds: string[]): void {
      const map = new Map(this.roomMembers)

      map.set(roomId, new Set(userIds.map((userId) => String(userId))))

      this.roomMembers = map
    },

    setCurrentRoom(roomId: string): void {
      this.currentRoomId = roomId
      this.messages = []
      this.replyingToMessage = null
      this.markRoomMessagesAsRead(roomId)
      this.pruneTypingUsers()
    },

    setMessages(messages: ChatMessage[]): void {
      const map = new Map<string, ChatMessage>()

      for (const message of messages) {
        map.set(message.id, message)
      }

      this.messages = Array.from(map.values()).sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      )
    },

    setReplyTarget(reply: ChatReplyContext | null): void {
      this.replyingToMessage = reply
    },

    clearReplyTarget(): void {
      this.replyingToMessage = null
    },

    prependMessages(messages: ChatMessage[]): void {
      const map = new Map<string, ChatMessage>()

      for (const message of messages) {
        map.set(message.id, message)
      }

      for (const message of this.messages) {
        map.set(message.id, message)
      }

      this.messages = Array.from(map.values()).sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      )
    },

    appendMessage(message: ChatMessage): void {
      const exists = this.messages.some((item) => item.id === message.id)

      if (exists) return

      this.messages = [...this.messages, message]
    },

    markMessageAsRecalled(messageId: string): void {
      const recalledAt = new Date().toISOString()

      const updateReplyContext = (
        replyTo?: ChatReplyContext | null,
      ): ChatReplyContext | null | undefined => {
        if (!replyTo || replyTo.messageId !== messageId) {
          return replyTo
        }

        return {
          ...replyTo,
          content: RECALL_MESSAGE_PLACEHOLDER,
        }
      }

      this.messages = this.messages.map((item) => {
        if (item.id === messageId) {
          return {
            ...item,
            content: RECALL_MESSAGE_PLACEHOLDER,
            attachment: null,
            urlPreview: null,
            isRecalled: true,
            recalledAt,
          }
        }

        return {
          ...item,
          replyTo: updateReplyContext(item.replyTo),
        }
      })

      if (this.replyingToMessage?.messageId === messageId) {
        this.replyingToMessage = null
      }
    },

    applyMessageRecalled(message: ChatMessage): void {
      const updateReplyContext = (replyTo?: ChatReplyContext | null): ChatReplyContext | null | undefined => {
        if (!replyTo || replyTo.messageId !== message.id) {
          return replyTo
        }

        return {
          ...replyTo,
          content: RECALL_MESSAGE_PLACEHOLDER,
        }
      }

      this.messages = this.messages.map((item) => {
        if (item.id === message.id) {
          return {
            ...item,
            ...message,
          }
        }

        return {
          ...item,
          replyTo: updateReplyContext(item.replyTo),
        }
      })

      if (this.replyingToMessage?.messageId === message.id) {
        this.replyingToMessage = null
      }
    },

    setRooms(rooms: ChatRoomListItem[]): void {
      this.rooms = rooms

      const nextUnreadCounts: Record<string, number> = {}
      const currentRoomId = String(this.currentRoomId)

      for (const room of rooms) {
        const roomId = String(room.id)
        const unreadCount = Number(room.unreadMessageCount ?? 0)

        if (unreadCount > 0 && roomId !== currentRoomId) {
          nextUnreadCounts[roomId] = unreadCount
        }
      }

      const lobbyUnreadCount = this.unreadMessageCountsByRoom.lobby ?? 0

      if (lobbyUnreadCount > 0 && currentRoomId !== 'lobby') {
        nextUnreadCounts.lobby = lobbyUnreadCount
      }

      this.unreadMessageCountsByRoom = nextUnreadCounts
    },

    upsertRoom(room: ChatRoomListItem): void {
      const rooms = this.rooms.filter((item) => item.id !== room.id)
      rooms.push(room)
      this.rooms = rooms
    },

    removeRoom(roomId: string): void {
      this.rooms = this.rooms.filter((item) => item.id !== roomId)
      this.markRoomMessagesAsRead(roomId)
    },

    updateRoomOwner(roomId: string, ownerId: string): void {
      this.rooms = this.rooms.map((room) =>
        room.id === roomId
          ? {
              ...room,
              ownerId,
            }
          : room,
      )
    },

    updateRoomInfo(roomId: string, roomName?: string | null, avatarUrl?: string | null): void {
      this.rooms = this.rooms.map((room) =>
        room.id === roomId
          ? {
              ...room,
              ...(roomName === undefined ? {} : { name: roomName }),
              ...(avatarUrl === undefined ? {} : { avatarUrl }),
            }
          : room,
      )
    },

    handleUserOnline(payload: { userId: string; displayName: string; username: string }): void {
      if (!this.onlineUsers.has(payload.userId)) {
        const users = new Set(this.onlineUsers)
        users.add(payload.userId)
        this.onlineUsers = users
      }
    },

    handleUserOffline(userId: string): void {
      const users = new Set(this.onlineUsers)
      users.delete(userId)
      this.onlineUsers = users
      this.removeTypingUserFromAllRooms(userId)
    },

    /** 使用者加入房間（安全處理 Map / Set reactivity） */
    userJoinedRoom(roomId: string, userId: string): void {
      const members = new Set(this.roomMembers.get(roomId) ?? [])
      members.add(userId)

      const map = new Map(this.roomMembers)
      map.set(roomId, members)
      this.roomMembers = map
    },

    /** 使用者離開房間 */
    userLeftRoom(roomId: string, userId: string): void {
      const members = new Set(this.roomMembers.get(roomId) ?? [])
      members.delete(userId)

      const map = new Map(this.roomMembers)
      map.set(roomId, members)
      this.roomMembers = map
    },
    //# endregion

    //# region UI 處理

    showSelfWelcome(name: string): void {
      this.welcomePopup = {
        visible: true,
        message: `🎉 歡迎回來 ${name}`,
      }

      setTimeout(() => {
        this.welcomePopup.visible = false
      }, 3000)
    },

    showWelcome(displayName: string, username: string): void {
      this.welcomePopup = {
        visible: true,
        message: `🎉 歡迎 ${displayName} (${username}) 來到聊天室`,
      }

      setTimeout(() => {
        this.welcomePopup.visible = false
      }, 3000)
    },

    clear(): void {
      this.$reset()
    },


    setLobbySnapshot(userIds: string[]): void {
      this.setRoomSnapshot('lobby', userIds)
    },

    handleUserTyping(payload: {
      roomId: string
      userId: string
      username: string
      displayName: string
      isTyping: boolean
    }): void {
      const nextTypingByRoom = new Map(this.typingUsersByRoom)
      const roomTypingUsers = new Map(nextTypingByRoom.get(payload.roomId) ?? [])
      const typingUserId = String(payload.userId)

      if (!payload.isTyping) {
        roomTypingUsers.delete(typingUserId)
      } else {
        roomTypingUsers.set(typingUserId, {
          username: payload.username,
          displayName: payload.displayName || payload.username,
          updatedAt: Date.now(),
        })
      }

      if (roomTypingUsers.size === 0) {
        nextTypingByRoom.delete(payload.roomId)
      } else {
        nextTypingByRoom.set(payload.roomId, roomTypingUsers)
      }

      this.typingUsersByRoom = nextTypingByRoom
      this.pruneTypingUsers()
    },

    pruneTypingUsers(): void {
      const EXPIRE_MS = 6000
      const now = Date.now()
      const nextTypingByRoom = new Map<string, Map<string, { displayName: string; username: string; updatedAt: number }>>()

      for (const [roomId, roomTypingUsers] of this.typingUsersByRoom.entries()) {
        const nextRoomTypingUsers = new Map<string, { displayName: string; username: string; updatedAt: number }>()

        for (const [userId, typingUser] of roomTypingUsers.entries()) {
          if (now - typingUser.updatedAt <= EXPIRE_MS) {
            nextRoomTypingUsers.set(userId, typingUser)
          }
        }

        if (nextRoomTypingUsers.size > 0) {
          nextTypingByRoom.set(roomId, nextRoomTypingUsers)
        }
      }

      this.typingUsersByRoom = nextTypingByRoom
    },

    removeTypingUserFromAllRooms(userId: string): void {
      const normalizedUserId = String(userId)
      const nextTypingByRoom = new Map(this.typingUsersByRoom)

      for (const [roomId, roomTypingUsers] of nextTypingByRoom.entries()) {
        const nextRoomTypingUsers = new Map(roomTypingUsers)
        nextRoomTypingUsers.delete(normalizedUserId)

        if (nextRoomTypingUsers.size === 0) {
          nextTypingByRoom.delete(roomId)
        } else {
          nextTypingByRoom.set(roomId, nextRoomTypingUsers)
        }
      }

      this.typingUsersByRoom = nextTypingByRoom
    },
    //# endregion
  },

  getters: {
    currentRoomOnlineCount(state): number {
      return state.roomMembers.get(state.currentRoomId)?.size ?? 0
    },

    hasUnreadNotifications(state): boolean {
      return state.hasUnreadInvitationNotice || state.hasUnreadFriendRequestNotice
    },

    currentRoomTypingUsers(state): Array<{ userId: string; displayName: string; username: string }> {
      const EXPIRE_MS = 6000
      const now = Date.now()
      const roomTypingUsers = state.typingUsersByRoom.get(state.currentRoomId)

      if (!roomTypingUsers) {
        return []
      }

      const users: Array<{ userId: string; displayName: string; username: string }> = []

      for (const [userId, typingUser] of roomTypingUsers.entries()) {
        if (now - typingUser.updatedAt > EXPIRE_MS) {
          continue
        }

        users.push({
          userId,
          displayName: typingUser.displayName,
          username: typingUser.username,
        })
      }

      return users
    },
  },
})
