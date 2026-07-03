import type { ClientWsMessage, ServerWsMessage } from '@/types/chat'

let socket: WebSocket | null = null
let isConnecting = false
let pendingJoinRoomId: string | null = null

/**
 * 建立聊天 WebSocket 連線
 * - singleton：避免重複連線
 * - 透過 Vite proxy 走 /api
 */
export function connectChatSocket(
  token: string,
  onMessage: (message: ServerWsMessage) => void,
  onOpen?: () => void,
): void {
  if (socket || isConnecting) {
    onOpen?.()
    return
  }

  isConnecting = true

  const protocol = location.protocol === 'https:' ? 'wss' : 'ws'
  const webSocketURL = `${protocol}://localhost:3000/chat?token=${token}`

  console.log('[WS] connect to', webSocketURL)

  socket = new WebSocket(webSocketURL)

  socket.onopen = () => {
    isConnecting = false
    console.log('[WS] connected')

    if (pendingJoinRoomId) {
      const roomId = pendingJoinRoomId
      pendingJoinRoomId = null
      joinRoom(roomId)
    }

    onOpen?.()
  }

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data) as ServerWsMessage
      onMessage(data)
    } catch (err) {
      console.error('[WS] invalid message format', err)
    }
  }

  socket.onerror = (event) => {
    console.error('[WS] error', event)
  }

  socket.onclose = (event) => {
    console.warn('[WS] closed', event.code, event.reason)
    socket = null
    isConnecting = false
    pendingJoinRoomId = null
  }
}

/**
 * 發送聊天訊息
 */
export function sendChatMessage(roomId: string, content: string): void {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.warn('[WS] not connected')
    return
  }

  const message: ClientWsMessage = {
    type: 'SEND_MESSAGE',
    payload: { roomId, content },
  }

  socket.send(JSON.stringify(message))
}

/**
 * 主動關閉 WebSocket（登出 / 切頁）
 */
export function disconnectChatSocket(): void {
  if (!socket) return

  socket.close()
  socket = null
  isConnecting = false
  pendingJoinRoomId = null
}

/**
 * 加入聊天室
 */
export function joinRoom(roomId: string): void {
  console.log("[WS] joinRoom call:", roomId)

  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.warn("[WS] not ready, pending join:", roomId)
    pendingJoinRoomId = roomId
    return
  }

  console.log("[WS] send JOIN_ROOM:", roomId)

  socket.send(JSON.stringify({
    type: "JOIN_ROOM",
    payload: { roomId },
  }))
}