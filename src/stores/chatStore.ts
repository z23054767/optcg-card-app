import { defineStore } from 'pinia'
import type { ChatMessage } from '@/types/chat'
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
}

export const useChatStore = defineStore('chat', {
  state: (): ChatState => ({
    messages: [],
    users: new Map(),
    welcomePopup: { visible: false, message: "" },
    onlineUsers: new Set(),
    roomMembers: new Map(),
    currentRoomId: "lobby"
  }),

  actions: {
    // #region 處理來自 WebSocket 的事件
    applyEvent(event: ChatWsEvent): void {
      switch (event.type) {
        case "NEW_MESSAGE":
          this.messages.push(event.payload.message)
          break

        case "USER_ONLINE": {
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

        default:
          console.warn('[ChatStore] Unknown event:', event)
      }
    },
    // #endregion

    //# region 狀態處理

    setCurrentRoom(roomId: string): void {
      this.currentRoomId = roomId
      this.messages = []
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
      const map = new Map(this.roomMembers)
      map.set('lobby', new Set(userIds))
      this.roomMembers = map
    },
    //# endregion
  },

  getters: {
    currentRoomOnlineCount(state): number {
      return state.roomMembers.get(state.currentRoomId)?.size ?? 0
    },
  },
})
