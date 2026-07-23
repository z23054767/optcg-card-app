import { http } from '@/api/http'
import type {
  ChatInvitation,
  ChatMessage,
  ChatRoomId,
  ChatRoomListItem,
  ChatRoomMember,
  ChatUserSearchItem,
  ChatFriendRequestListResponse,
} from '@/types/chat'

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
 * 邀請聊天室成員請求
 */
export interface InviteChatRoomMembersRequest {
  inviteEmails: string[]
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
 * 取得聊天室訊息紀錄請求
 */
export interface GetChatRoomMessagesRequest {
  /** 單次查詢筆數 */
  limit?: number

  /** 查詢此時間點之前的訊息 */
  beforeCreatedAt?: string

  /** 同秒訊息游標 ID */
  beforeId?: string
}

/**
 * 取得聊天室訊息紀錄回應
 */
export interface ChatRoomMessagesResponse {
  messages: ChatMessage[]
  hasMore: boolean
  nextCursor?: {
    beforeCreatedAt: string
    beforeId: string
  }
}

/**
 * 聊天室成員列表回應
 */
export interface ChatRoomMembersResponse {
  members: ChatRoomMember[]
}

/**
 * 邀請聊天室成員回應
 */
export interface InviteChatRoomMembersResponse {
  invitedCount: number
}

/**
 * 更新群組聊天室請求
 */
export interface UpdateGroupChatRoomRequest {
  roomName: string
}

export interface UploadGroupChatRoomAvatarResponse {
  success: true
  avatarPath: string
}

/**
 * 轉讓管理員請求
 */
export interface TransferChatRoomManagerRequest {
  targetUserId: string
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

/**
 * 取得聊天室訊息紀錄（分頁）
 */
export async function getChatRoomMessagesApi(
  roomId: string,
  query: GetChatRoomMessagesRequest = {},
): Promise<ChatRoomMessagesResponse> {
  const { data } = await http.get<ChatRoomMessagesResponse>(
    `/chat/rooms/${encodeURIComponent(roomId)}/messages`,
    {
      params: query,
    },
  )

  return data
}

/**
 * 取得聊天室成員列表
 */
export async function getChatRoomMembersApi(roomId: string): Promise<ChatRoomMembersResponse> {
  const { data } = await http.get<ChatRoomMembersResponse>(
    `/chat/rooms/${encodeURIComponent(roomId)}/members`,
  )

  return data
}

/**
 * 邀請成員加入聊天室
 */
export async function inviteChatRoomMembersApi(
  roomId: string,
  input: InviteChatRoomMembersRequest,
): Promise<InviteChatRoomMembersResponse> {
  const { data } = await http.post<InviteChatRoomMembersResponse>(
    `/chat/rooms/${encodeURIComponent(roomId)}/invitations`,
    input,
  )

  return data
}

/**
 * 更新群組聊天室資訊
 */
export async function updateGroupChatRoomApi(
  roomId: string,
  input: UpdateGroupChatRoomRequest,
): Promise<{ success: true }> {
  const { data } = await http.patch<{ success: true }>(
    `/chat/rooms/${encodeURIComponent(roomId)}`,
    input,
  )

  return data
}

/**
 * 上傳群組聊天室頭像
 */
export async function uploadGroupChatRoomAvatarApi(
  roomId: string,
  file: File,
): Promise<UploadGroupChatRoomAvatarResponse> {
  const formData = new FormData()
  formData.append('file', file)

  const { data } = await http.post<UploadGroupChatRoomAvatarResponse>(
    `/chat/rooms/${encodeURIComponent(roomId)}/avatar`,
    formData,
  )

  return data
}

/**
 * 刪除群組聊天室頭像
 */
export async function deleteGroupChatRoomAvatarApi(
  roomId: string,
): Promise<void> {
  await http.delete(`/chat/rooms/${roomId}/avatar`)
}

/**
 * 移除聊天室成員
 */
export async function removeChatRoomMemberApi(
  roomId: string,
  memberId: string,
): Promise<{ success: true }> {
  const { data } = await http.delete<{ success: true }>(
    `/chat/rooms/${encodeURIComponent(roomId)}/members/${encodeURIComponent(memberId)}`,
  )

  return data
}

/**
 * 轉讓聊天室管理員
 */
export async function transferChatRoomManagerApi(
  roomId: string,
  input: TransferChatRoomManagerRequest,
): Promise<{ success: true }> {
  const { data } = await http.post<{ success: true }>(
    `/chat/rooms/${encodeURIComponent(roomId)}/transfer-manager`,
    input,
  )

  return data
}

/**
 * 取得聊天室邀請列表（管理員專用）
 */
export interface RoomInvitationsResponse {
  invitations: ChatInvitation[]
}

/**
 * 依 email 查詢使用者結果
 */
export type SearchUserByEmailResponse =
  | { found: true; userId: string; name: string; account: string; isMember: boolean }
  | { found: false }

/**
 * 刪除聊天室
 */
export async function deleteChatRoomApi(roomId: string): Promise<{ success: true }> {
  const { data } = await http.delete<{ success: true }>(`/chat/rooms/${encodeURIComponent(roomId)}`)

  return data
}

/**
 * 取得聊天室邀請列表（管理員）
 */
export async function getRoomInvitationsApi(roomId: string): Promise<RoomInvitationsResponse> {
  const { data } = await http.get<RoomInvitationsResponse>(
    `/chat/rooms/${encodeURIComponent(roomId)}/invitations`,
  )

  return data
}

/**
 * 依 email 查詢使用者是否存在
 */
export async function searchUserByEmailApi(
  email: string,
  roomId: string,
): Promise<SearchUserByEmailResponse> {
  const { data } = await http.get<SearchUserByEmailResponse>('/chat/users/search/email', {
    params: { email, roomId },
  })

  return data
}

/**
 * 依關鍵字搜尋使用者
 */
export async function searchChatUsersApi(
  keyword: string,
): Promise<{ users: ChatUserSearchItem[] }> {
  const { data } = await http.get<{ users: ChatUserSearchItem[] }>('/chat/users/search', {
    params: { keyword },
  })
  return data
}

/**
 * 建立私人聊天室邀請
 */
export async function createFriendRequestApi(receiverId: string): Promise<{ requestId: string }> {
  const { data } = await http.post<{ requestId: string }>('/chat/friend-requests', { receiverId })
  return data
}
/**
 * @summary 取得目前使用者收到的好友申請
 */
export async function getMyFriendRequestsApi(): Promise<ChatFriendRequestListResponse> {
  const { data } = await http.get<ChatFriendRequestListResponse>('/chat/friend-requests/received')

  return data
}

/**
 * @summary 接受好友申請
 */
export async function acceptFriendRequestApi(requestId: string): Promise<{ roomId: string }> {
  const { data } = await http.post<{ roomId: string }>(
    `/chat/friend-requests/${encodeURIComponent(requestId)}/accept`,
  )

  return data
}

/**
 * @summary 拒絕好友申請
 */
export async function rejectFriendRequestApi(requestId: string): Promise<{ success: boolean }> {
  const { data } = await http.post<{ success: boolean }>(
    `/chat/friend-requests/${encodeURIComponent(requestId)}/reject`,
  )

  return data
}
