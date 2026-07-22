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
  /** 使用者 ID */
  userId: string

  /** 使用者帳號 */
  account: string

  /** 使用者名稱 */
  name: string

  /** 聊天室角色 */
  role: 'manager' | 'member'
}

/**
 * 群組聊天室邀請資訊
 */
export interface ChatInvitation {
  /** 邀請 ID */
  invitationId: string

  /** 聊天室 ID */
  roomId: ChatRoomId

  /** 聊天室名稱 */
  roomName: string | null

  /** 聊天室類型 */
  roomType: 'group'

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
 * 好友申請狀態
 */
export type ChatFriendRequestStatus = 'pending' | 'accepted' | 'rejected'

/**
 * 好友申請資訊
 */
export interface ChatFriendRequest {
  /** 好友申請 ID */
  requestId: string

  /** 發起者 ID */
  requesterId: string

  /** 發起者名稱 */
  requesterName: string

  /** 發起者帳號 */
  requesterAccount: string

  /** 接收者 ID */
  receiverId: string

  /** 好友申請狀態 */
  status: ChatFriendRequestStatus

  /** 建立時間（ISO 8601） */
  createdAt: string
}

/**
 * 好友申請列表 API 回應
 */
export interface ChatFriendRequestListResponse {
  requests: ChatFriendRequest[]
}

/**
 * 使用者搜尋結果
 */
export type ChatFriendshipStatus =
  | "none"
  | "outgoing_pending"
  | "incoming_pending"
  | "friend"

export interface ChatUserSearchItem {
  /** 使用者 ID */
  userId: string

  /** 使用者名稱 */
  name: string

  /** 使用者帳號 */
  account: string

  /** 與目前登入使用者的好友關係狀態 */
  friendshipStatus: ChatFriendshipStatus
}