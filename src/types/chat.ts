/**
 * 聊天室 ID
 */
export type ChatRoomId = string

/**
 * 聊天訊息
 */
export interface ChatMessage {
  /** 訊息 ID */
  id: string

  /** 所屬聊天室 ID */
  roomId: ChatRoomId

  /** 發送者 ID */
  senderId: string

  /** 發送者帳號 */
  senderAccount: string

  /** 發送者名稱 */
  senderName: string

  /** 訊息內容 */
  content: string

  /** 建立時間（ISO 8601） */
  createdAt: string
}

/**
 * 傳送訊息 Payload
 */
export interface SendMessagePayload {
  /** 聊天室 ID */
  roomId: ChatRoomId

  /** 訊息內容 */
  content: string
}

/**
 * 加入聊天室 Payload
 */
export interface JoinRoomPayload {
  /** 聊天室 ID */
  roomId: ChatRoomId
}

/**
 * 離開聊天室 Payload
 */
export interface LeaveRoomPayload {
  /** 聊天室 ID */
  roomId: ChatRoomId
}

/**
 * Client → Server WebSocket 訊息格式
 */
export type ClientWsMessage =
  | {
    /** 傳送聊天訊息 */
    type: 'SEND_MESSAGE'
    payload: SendMessagePayload
  }
  | {
    /** 加入聊天室 */
    type: 'JOIN_ROOM'
    payload: JoinRoomPayload
  }
  | {
    /** 離開聊天室 */
    type: 'LEAVE_ROOM'
    payload: LeaveRoomPayload
  }

/**
 * 使用者在線資訊
 */
export interface UserPresencePayload {
  /** 使用者 ID */
  userId: string

  /** 使用者帳號 */
  account: string

  /** 使用者名稱 */
  name: string
}

/**
 * 使用者上線事件
 */
export interface UserOnlineEvent {
  type: 'USER_ONLINE'
  payload: UserPresencePayload
}

/**
 * 使用者離線事件
 */
export interface UserOfflineEvent {
  type: 'USER_OFFLINE'
  payload: UserPresencePayload
}

/**
 * 聊天室事件 Payload
 */
export interface RoomEventPayload {
  /** 使用者 ID */
  userId: string

  /** 聊天室 ID */
  roomId: ChatRoomId
}

/**
 * 加入聊天室事件
 */
export interface RoomJoinedEvent {
  type: 'ROOM_JOINED'
  payload: RoomEventPayload
}

/**
 * 離開聊天室事件
 */
export interface RoomLeftEvent {
  type: 'ROOM_LEFT'
  payload: RoomEventPayload
}

/**
 * 新訊息事件
 */
export interface NewMessageEvent {
  type: 'NEW_MESSAGE'
  payload: {
    roomId: ChatRoomId
    message: ChatMessage
  }
}

/**
 * 大廳快照事件
 */
export type LobbySnapshotEvent = {
  type: 'LOBBY_SNAPSHOT'
  payload: {
    /** 目前在線使用者 ID */
    userIds: string[]
  }
}

/**
 * 聊天室在線成員快照事件
 */
export interface RoomSnapshotEvent {
  /** 事件類型 */
  type: 'ROOM_SNAPSHOT'

  /** 事件資料 */
  payload: {
    /** 聊天室 ID */
    roomId: ChatRoomId

    /** 目前位於聊天室內的使用者 ID 清單 */
    userIds: string[]
  }
}

/**
 * 聊天室資訊
 */
export interface ChatRoomListItem {
  /** 聊天室 ID */
  id: ChatRoomId

  /** 聊天室類型 */
  type: 'group' | 'private' | 'lobby'

  /** 聊天室名稱 */
  name?: string | null

  /** 聊天室頭像 */
  avatarUrl?: string | null

  /** 建立者 ID */
  ownerId: string
}

/**
 * 聊天室成員
 */
export interface ChatRoomMember {
  userId: string
  account: string
  name: string
  role: 'manager' | 'member'
}

/**
 * 聊天室邀請資訊
 */
export interface ChatInvitation {
  /** 邀請 ID */
  invitationId: string

  /** 聊天室 ID */
  roomId: ChatRoomId

  /** 聊天室名稱 */
  roomName: string | null

  /** 聊天室類型 */
  roomType: "group" | "private"

  /** 邀請者 ID */
  inviterId: string

  /** 邀請者名稱 */
  inviterName: string

  /** 邀請者帳號 */
  inviterAccount: string

  /** 受邀者 ID */
  inviteeId: string

  /** 受邀者帳號 */
  inviteeAccount: string

  /** 邀請狀態 */
  status: 'pending' | 'accepted' | 'rejected'

  /** 建立時間（ISO 8601） */
  createdAt: string
}

/**
 * 收到聊天室邀請事件
 */
export interface InvitationReceivedEvent {
  type: 'INVITATION_RECEIVED'
  payload: ChatInvitation
}

/**
 * 聊天室被刪除事件
 */
export interface RoomDeletedEvent {
  type: 'ROOM_DELETED'
  payload: {
    roomId: ChatRoomId
  }
}

/**
 * 成員被移除事件
 */
export interface MemberRemovedEvent {
  type: 'MEMBER_REMOVED'
  payload: {
    roomId: ChatRoomId
  }
}

/**
 * 邀請被接受事件（推播給管理員）
 */
export type InvitationAcceptedEvent = {
  type: "INVITATION_ACCEPTED"
  payload: {
    roomId: string
    invitationId: string
    inviteeId: string
    inviteeAccount: string
  }
}

/**
 * 邀請被拒絕事件（推播給管理員）
 */
export interface InvitationRejectedEvent {
  type: 'INVITATION_REJECTED'
  payload: {
    roomId: ChatRoomId
    invitationId: string
    inviteeId: string
    inviteeAccount: string
  }
}


/**
 * 聊天室管理員已轉讓事件
 */
export interface RoomManagerTransferredEvent {
  type: 'ROOM_MANAGER_TRANSFERRED'
  payload: {
    roomId: ChatRoomId
    previousOwnerId: string
    ownerId: string
  }
}

/**
 * Server → Client WebSocket 訊息格式
 */
export type ServerWsMessage =
  | UserOnlineEvent
  | UserOfflineEvent
  | RoomJoinedEvent
  | RoomLeftEvent
  | NewMessageEvent
  | LobbySnapshotEvent
  | RoomSnapshotEvent
  | InvitationReceivedEvent
  | RoomDeletedEvent
  | MemberRemovedEvent
  | InvitationAcceptedEvent
  | InvitationRejectedEvent
  | RoomManagerTransferredEvent

export interface ChatUserSearchItem {
  userId: string
  name: string
  account: string
}
