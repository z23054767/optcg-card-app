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

export type InvitationReceivedEvent = BaseChatEvent<
  'INVITATION_RECEIVED',
  {
    invitationId: string

    roomId: string
    roomName: string | null

    inviterId: string
    inviterName: string
    inviterAccount: string

    inviteeId: string
    inviteeAccount: string

    status: 'pending' | 'accepted' | 'rejected'

    createdAt: string
  }
>

export type RoomSnapshotEvent = BaseChatEvent<
  'ROOM_SNAPSHOT',
  {
    roomId: string
    userIds: string[]
  }
>

export type RoomDeletedEvent = BaseChatEvent<
  'ROOM_DELETED',
  {
    roomId: string
  }
>

export type MemberRemovedEvent = BaseChatEvent<
  'MEMBER_REMOVED',
  {
    roomId: string
  }
>

export type InvitationRejectedEvent = BaseChatEvent<
  'INVITATION_REJECTED',
  {
    roomId: string
    invitationId: string
    inviteeId: string
    inviteeAccount: string
  }
>

export type ChatWsEvent =
  | UserOnlineEvent
  | UserOfflineEvent
  | RoomJoinedEvent
  | RoomLeftEvent
  | NewMessageEvent
  | LobbySnapshotEvent
  | InvitationReceivedEvent
  | RoomSnapshotEvent
  | RoomDeletedEvent
  | MemberRemovedEvent
  | InvitationRejectedEvent