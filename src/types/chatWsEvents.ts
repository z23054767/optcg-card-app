import type { ChatFriendRequest, ChatInvitation, ChatMessage, ChatRoomId } from '@/types/chat'

/**
 * WebSocket 事件基底格式
 */
export interface BaseChatEvent<T extends string, P> {
  type: T
  payload: P
}

/**
 * 使用者上線事件
 */
export type UserOnlineEvent = BaseChatEvent<
  'USER_ONLINE',
  {
    userId: string
    username: string
    displayName: string
  }
>

/**
 * 使用者離線事件
 */
export type UserOfflineEvent = BaseChatEvent<
  'USER_OFFLINE',
  {
    userId: string
  }
>

/**
 * 使用者加入聊天室事件
 */
export type RoomJoinedEvent = BaseChatEvent<
  'ROOM_JOINED',
  {
    userId: string
    roomId: ChatRoomId
  }
>

/**
 * 使用者離開聊天室事件
 */
export type RoomLeftEvent = BaseChatEvent<
  'ROOM_LEFT',
  {
    userId: string
    roomId: ChatRoomId
  }
>

/**
 * 新訊息事件
 */
export type NewMessageEvent = BaseChatEvent<
  'NEW_MESSAGE',
  {
    roomId: ChatRoomId
    message: ChatMessage
  }
>

/**
 * 大廳在線使用者快照事件
 */
export type LobbySnapshotEvent = BaseChatEvent<
  'LOBBY_SNAPSHOT',
  {
    userIds: string[]
  }
>

/**
 * 聊天室在線成員快照事件
 */
export type RoomSnapshotEvent = BaseChatEvent<
  'ROOM_SNAPSHOT',
  {
    roomId: ChatRoomId
    userIds: string[]
  }
>

/**
 * 收到群組聊天室邀請事件
 */
export type InvitationReceivedEvent = BaseChatEvent<'INVITATION_RECEIVED', ChatInvitation>

/**
 * 群組聊天室邀請被接受事件
 */
export type InvitationAcceptedEvent = BaseChatEvent<
  'INVITATION_ACCEPTED',
  {
    roomId: ChatRoomId
    invitationId: string
    inviteeId: string
    inviteeUsername: string
  }
>

/**
 * 群組聊天室邀請被拒絕事件
 */
export type InvitationRejectedEvent = BaseChatEvent<
  'INVITATION_REJECTED',
  {
    roomId: ChatRoomId
    invitationId: string
    inviteeId: string
    inviteeUsername: string
  }
>

/**
 * 聊天室被刪除事件
 */
export type RoomDeletedEvent = BaseChatEvent<
  'ROOM_DELETED',
  {
    roomId: ChatRoomId
  }
>

/**
 * 成員被移除事件
 */
export type MemberRemovedEvent = BaseChatEvent<
  'MEMBER_REMOVED',
  {
    roomId: ChatRoomId
  }
>

/**
 * 聊天室管理員轉讓事件
 */
export type RoomManagerTransferredEvent = BaseChatEvent<
  'ROOM_MANAGER_TRANSFERRED',
  {
    roomId: ChatRoomId
    previousOwnerId: string
    ownerId: string
  }
>

/**
 * 群組聊天室資訊已更新事件
 */
export type RoomUpdatedEvent = BaseChatEvent<
  'ROOM_UPDATED',
  {
    roomId: ChatRoomId
    roomName?: string | null
    avatarUrl?: string | null
  }
>

/**
 * 收到好友申請事件
 */
export type FriendRequestReceivedEvent = BaseChatEvent<'FRIEND_REQUEST_RECEIVED', ChatFriendRequest>

/**
 * 好友申請被接受事件
 */
export type FriendRequestAcceptedEvent = BaseChatEvent<
  'FRIEND_REQUEST_ACCEPTED',
  {
    requestId: string
    roomId: ChatRoomId
    requesterId: string
    receiverId: string
  }
>

/**
 * 好友申請被拒絕事件
 */
export type FriendRequestRejectedEvent = BaseChatEvent<
  'FRIEND_REQUEST_REJECTED',
  {
    requestId: string
    receiverId: string
  }
>

export type PrivateRelationshipUpdatedEvent = BaseChatEvent<
  'PRIVATE_RELATIONSHIP_UPDATED',
  {
    otherUserId: string
    friendshipStatus: 'none'
    blockStatus: 'none' | 'blocked_by_me' | 'blocked_me'
  }
>

/**
 * 好友個人資料已更新事件
 */
export type UserProfileUpdatedEvent = BaseChatEvent<
  'USER_PROFILE_UPDATED',
  {
    userId: string
    name: string
    displayName: string
    avatarUrl: string | null
  }
>

/**
 * 使用者輸入狀態事件
 */
export type UserTypingEvent = BaseChatEvent<
  'USER_TYPING',
  {
    roomId: ChatRoomId
    userId: string
    username: string
    displayName: string
    isTyping: boolean
  }
>

/**
 * WebSocket 錯誤事件
 */
export type ErrorEvent = BaseChatEvent<
  'ERROR',
  {
    message: string
  }
>

/**
 * Server → Client WebSocket 訊息格式
 */
export type ChatWsEvent =
  | UserOnlineEvent
  | UserOfflineEvent
  | RoomJoinedEvent
  | RoomLeftEvent
  | NewMessageEvent
  | LobbySnapshotEvent
  | RoomSnapshotEvent
  | InvitationReceivedEvent
  | InvitationAcceptedEvent
  | InvitationRejectedEvent
  | RoomDeletedEvent
  | MemberRemovedEvent
  | RoomManagerTransferredEvent
  | RoomUpdatedEvent
  | FriendRequestReceivedEvent
  | FriendRequestAcceptedEvent
  | FriendRequestRejectedEvent
  | PrivateRelationshipUpdatedEvent
  | UserProfileUpdatedEvent
  | UserTypingEvent
  | ErrorEvent
