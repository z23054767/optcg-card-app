import { defineStore } from 'pinia'
import type { ChatInvitation, ChatMessage, ChatRoomListItem } from '@/types/chat'
import type { ChatWsEvent } from '@/types/chatWsEvents'

interface WelcomePopup {
  visible: boolean
  message: string
}

interface ChatState {
  messages: ChatMessage[]
  users: Map<string, { name: string; account: string }>
  welcomePopup: WelcomePopup
  onlineUsers: Set<string>
  roomMembers: Map<string, Set<string>>
  currentRoomId: string
  rooms: ChatRoomListItem[]
  invitations: ChatInvitation[]
  hasUnreadInvitationNotice: boolean
}

export const useChatStore = defineStore('chat', {
  state: (): ChatState => ({
    messages: [],
    users: new Map(),
    welcomePopup: { visible: false, message: '' },
    onlineUsers: new Set(),
    roomMembers: new Map(),
    currentRoomId: 'lobby',
    rooms: [],
    invitations: [],
    hasUnreadInvitationNotice: false,
  }),

  actions: {
    // #region 處理來自 WebSocket 的事件
    applyEvent(event: ChatWsEvent): void {
      switch (event.type) {
        case 'NEW_MESSAGE':
          this.appendMessage(event.payload.message)
          break

        case 'USER_ONLINE': {
          const { userId, name, account } = event.payload
          const id = String(userId)

          const map = new Map(this.users)
          map.set(id, { name, account })
          this.users = map

          this.handleUserOnline({
            userId: id,
            name,
            account,
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

        case 'ROOM_SNAPSHOT':
          this.setRoomSnapshot(
            event.payload.roomId,
            event.payload.userIds,
          )
          break

        case 'ROOM_DELETED':
          this.removeRoom(event.payload.roomId)
          break

        case 'MEMBER_REMOVED':
          this.removeRoom(event.payload.roomId)
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
    setInvitations(
      invitations: ChatInvitation[],
      options?: { markUnreadOnNew?: boolean },
    ): void {
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

    setRoomSnapshot(roomId: string, userIds: string[]): void {
      const map = new Map(this.roomMembers)

      map.set(
        roomId,
        new Set(userIds.map((userId) => String(userId))),
      )

      this.roomMembers = map
    },

    setCurrentRoom(roomId: string): void {
      this.currentRoomId = roomId
      this.messages = []
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

    setRooms(rooms: ChatRoomListItem[]): void {
      this.rooms = rooms
    },

    upsertRoom(room: ChatRoomListItem): void {
      const rooms = this.rooms.filter((item) => item.id !== room.id)
      rooms.push(room)
      this.rooms = rooms
    },

    removeRoom(roomId: string): void {
      this.rooms = this.rooms.filter((item) => item.id !== roomId)
    },

    handleUserOnline(payload: { userId: string; name: string; account: string }): void {
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

    showWelcome(name: string, account: string): void {
      this.welcomePopup = {
        visible: true,
        message: `🎉 歡迎 ${name} (${account}) 來到聊天室`,
      }

      setTimeout(() => {
        this.welcomePopup.visible = false
      }, 3000)
    },

    clear(): void {
      this.messages = []
    },

    setLobbySnapshot(userIds: string[]): void {
      this.setRoomSnapshot('lobby', userIds)
    }
    //# endregion
  },

  getters: {
    currentRoomOnlineCount(state): number {
      return state.roomMembers.get(state.currentRoomId)?.size ?? 0
    },
  },
})
