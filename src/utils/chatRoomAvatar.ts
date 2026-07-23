/**
 * 將後端回傳的群組頭像相對路徑轉成可存取網址。
 */
export function resolveChatRoomAvatarUrl(avatarPath?: string | null): string | null {
  if (!avatarPath) return null

  if (/^https?:\/\//i.test(avatarPath)) {
    return avatarPath
  }

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')
  const normalizedPath = avatarPath.replace(/\\/g, '/').replace(/^\/+/, '')

  if (normalizedPath.startsWith('chat-room-avatars/')) {
    const fileName = normalizedPath.slice('chat-room-avatars/'.length)

    if (!fileName) return null

    return `${apiBaseUrl}/chat/room-avatars/${encodeURIComponent(fileName)}`
  }

  return `${apiBaseUrl}/${normalizedPath}`
}
