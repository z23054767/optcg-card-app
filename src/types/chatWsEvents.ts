import type { ChatMessage } from '@/types/chat'

export type BaseChatEvent<T extends string, P> = {
  type: T
  payload: P
}

export type UserOnlineEvent = BaseChatEvent<
  'USER_ONLINE',
  {
    userId: string
    account: string
    name: string
  }
>

export type UserOfflineEvent = BaseChatEvent<
  'USER_OFFLINE',
  {
    userId: string
  }
>

export type RoomJoinedEvent = BaseChatEvent<
  'ROOM_JOINED',
  {
    userId: string
    roomId: string
  }
>

export type RoomLeftEvent = BaseChatEvent<
  'ROOM_LEFT',
  {
    userId: string
    roomId: string
  }
>

export type NewMessageEvent = BaseChatEvent<
  'NEW_MESSAGE',
  {
    roomId: string
    message: ChatMessage
  }
>

export type LobbySnapshotEvent = BaseChatEvent<
  'LOBBY_SNAPSHOT',
  {
    userIds: string[]
  }
>

export type ChatWsEvent =
  | UserOnlineEvent
  | UserOfflineEvent
  | RoomJoinedEvent
  | RoomLeftEvent
  | NewMessageEvent
  | LobbySnapshotEvent
