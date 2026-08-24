/**
 * 將後端回傳的群組頭像相對路徑轉成可存取網址。
 */
export function resolveChatRoomAvatarUrl(avatarPath?: string | null): string | null {
  const rawPath = String(avatarPath ?? '').trim()

  if (!rawPath) return null
  if (
    /^(?:https?:)?\/\//i.test(rawPath) ||
    rawPath.startsWith('data:') ||
    rawPath.startsWith('blob:')
  ) {
    return rawPath
  }

  const apiBaseUrl = (
    import.meta.env.VITE_API_FULL_URL || import.meta.env.VITE_API_BASE_URL
  ).replace(/\/$/, '')
  const normalizedPath = rawPath.replace(/\\/g, '/')
  const match = normalizedPath.match(/^([^?#]+)([?#].*)?$/)
  const pathname = (match?.[1] ?? normalizedPath).replace(/^\/+/, '')
  const suffix = match?.[2] ?? ''

  if (pathname.startsWith('chat/room-avatars/')) {
    return `${apiBaseUrl}/${pathname}${suffix}`
  }

  if (pathname.startsWith('chat-room-avatars/')) {
    const fileName = pathname.slice('chat-room-avatars/'.length)

    if (!fileName) return null

    return `${apiBaseUrl}/chat/room-avatars/${encodeURIComponent(fileName)}${suffix}`
  }

  return `${apiBaseUrl}/${pathname}${suffix}`
}
