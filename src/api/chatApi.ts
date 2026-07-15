import { http } from '@/api/http'
import type { ChatInvitation, ChatRoomId, ChatRoomListItem } from '@/types/chat'

/**
 * 建立聊天室請求
 */
export interface CreateChatRoomRequest {
  /** 聊天室類型 */
  roomType: 'group' | 'private'

  /** 聊天室名稱 */
  roomName?: string

  /** 成員 ID 清單 */
  memberIds?: string[]

  /** 邀請 Email 清單 */
  inviteEmails?: string[]
}

/**
 * 建立聊天室回應
 */
export interface ChatRoomResponse {
  /** 聊天室 ID */
  roomId: ChatRoomId
}

/**
 * 我的聊天室列表回應
 */
export interface MyChatRoomsResponse {
  /** 聊天室列表 */
  rooms: ChatRoomListItem[]
}

/**
 * 我的聊天室邀請列表回應
 */
export interface MyChatInvitationsResponse {
  /** 邀請列表 */
  invitations: ChatInvitation[]
}

/**
 * 拒絕聊天室邀請回應
 */
export interface RejectChatInvitationResponse {
  /** 是否成功 */
  success: boolean
}

/**
 * 建立聊天室
 *
 * @param input 建立聊天室參數
 * @returns 建立完成的聊天室資訊
 */
export async function createChatRoomApi(input: CreateChatRoomRequest): Promise<ChatRoomResponse> {
  const { data } = await http.post<ChatRoomResponse>('/chat/rooms', input)

  return data
}

/**
 * 取得目前使用者所屬聊天室
 *
 * @returns 聊天室列表
 */
export async function getMyChatRoomsApi(): Promise<MyChatRoomsResponse> {
  const { data } = await http.get<MyChatRoomsResponse>('/chat/rooms/my')

  return data
}

/**
 * 取得目前使用者收到的聊天室邀請
 *
 * @returns 聊天室邀請列表
 */
export async function getMyChatInvitationsApi(): Promise<MyChatInvitationsResponse> {
  const { data } = await http.get<MyChatInvitationsResponse>('/chat/invitations/my')

  return data
}

/**
 * 接受聊天室邀請
 *
 * @param invitationId 聊天室邀請 ID
 * @returns 加入的聊天室資訊
 */
export async function acceptChatInvitationApi(invitationId: string): Promise<ChatRoomResponse> {
  const { data } = await http.post<ChatRoomResponse>(
    `/chat/invitations/${encodeURIComponent(invitationId)}/accept`,
  )

  return data
}

/**
 * 拒絕聊天室邀請
 *
 * @param invitationId 聊天室邀請 ID
 * @returns 拒絕結果
 */
export async function rejectChatInvitationApi(
  invitationId: string,
): Promise<RejectChatInvitationResponse> {
  const { data } = await http.post<RejectChatInvitationResponse>(
    `/chat/invitations/${encodeURIComponent(invitationId)}/reject`,
  )

  return data
}
