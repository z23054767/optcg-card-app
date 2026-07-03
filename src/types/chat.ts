export type ChatRoomId = string

/**
 * Client → Server
 */
export interface ChatMessage {
  id: string
  roomId: ChatRoomId
  senderId: string
  content: string
  createdAt: string
}

export interface SendMessagePayload {
  roomId: ChatRoomId
  content: string
}

export interface JoinRoomPayload {
  roomId: ChatRoomId
}

export interface LeaveRoomPayload {
  roomId: ChatRoomId
}

export type ClientWsMessage =
  | {
    type: 'SEND_MESSAGE'
    payload: SendMessagePayload
  }
  | {
    type: 'JOIN_ROOM'
    payload: JoinRoomPayload
  }
  | {
    type: 'LEAVE_ROOM'
    payload: LeaveRoomPayload
  }

/**
 * Server → Client
 */

export interface UserPresencePayload {
  userId: string
  account: string
  name: string
}

export interface UserOnlineEvent {
  type: 'USER_ONLINE'
  payload: UserPresencePayload
}

export interface UserOfflineEvent {
  type: 'USER_OFFLINE'
  payload: UserPresencePayload
}

export interface RoomEventPayload {
  userId: string
  roomId: ChatRoomId
}

export interface RoomJoinedEvent {
  type: 'ROOM_JOINED'
  payload: RoomEventPayload
}

export interface RoomLeftEvent {
  type: 'ROOM_LEFT'
  payload: RoomEventPayload
}

export interface NewMessageEvent {
  type: 'NEW_MESSAGE'
  payload: ChatMessage
}

export type LobbySnapshotEvent = {
  type: 'LOBBY_SNAPSHOT'
  payload: {
    userIds: string[]
  }
}

export type ServerWsMessage =
  | UserOnlineEvent
  | UserOfflineEvent
  | RoomJoinedEvent
  | RoomLeftEvent
  | NewMessageEvent
  | LobbySnapshotEvent
