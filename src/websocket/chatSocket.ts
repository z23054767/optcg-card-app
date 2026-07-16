import type { ClientWsMessage, ServerWsMessage } from "@/types/chat";

/**
 * WebSocket 實例（Singleton）
 */
let socket: WebSocket | null = null;

/**
 * 是否正在建立連線
 *
 * 避免同時間重複建立多條 WebSocket。
 */
let isConnecting = false;

/**
 * 尚未連線完成前欲加入的聊天室
 *
 * 若 joinRoom() 時 WebSocket 尚未建立完成，
 * 則暫存 RoomId，待連線成功後自動加入。
 */
let pendingJoinRoomId: string | null = null;

/**
 * 是否允許自動重連
 *
 * 登出時會設為 false，避免持續重新連線。
 */
let shouldReconnect = false;

/**
 * 已重連次數
 *
 * 用於計算 Exponential Backoff 延遲時間。
 */
let reconnectAttempts = 0;

/**
 * 重連 Timer
 */
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * 建立 WebSocket 所使用的 JWT Token
 */
let connectionToken = "";

/**
 * 收到 Server 訊息後的 Callback
 */
let onMessageHandler: ((message: ServerWsMessage) => void) | null = null;

/**
 * WebSocket 成功建立後的 Callback
 */
let onOpenHandler: (() => void) | null = null;
let onAuthFailedHandler: (() => void) | null = null;

/**
 * 重連最小等待時間
 */
const RECONNECT_BASE_DELAY_MS = 1000;

/**
 * 重連最大等待時間
 */
const RECONNECT_MAX_DELAY_MS = 10000;
const WS_CLOSE_AUTH_TOKEN_EXPIRED = 4001;
const WS_CLOSE_AUTH_TOKEN_INVALID = 4002;

/**
 * 清除重連 Timer
 */
function clearReconnectTimer(): void {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

/**
 * 安排下一次重連
 *
 * 採用 Exponential Backoff：
 *
 * 第一次：1 秒
 * 第二次：2 秒
 * 第三次：4 秒
 * 第四次：8 秒
 * 第五次以上：10 秒
 */
function scheduleReconnect(): void {
  if (!shouldReconnect || reconnectTimer) return;

  const delay = Math.min(
    RECONNECT_BASE_DELAY_MS * 2 ** reconnectAttempts,
    RECONNECT_MAX_DELAY_MS,
  );

  reconnectAttempts += 1;

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;

    if (!shouldReconnect) return;

    createSocket();
  }, delay);
}

/**
 * 建立 WebSocket 連線
 *
 * - 避免重複建立 Socket
 * - 建立完成後自動加入暫存聊天室
 * - 斷線後可自動重連
 */
function createSocket(): void {
  if (isConnecting || !connectionToken) return;

  if (
    socket &&
    (socket.readyState === WebSocket.OPEN ||
      socket.readyState === WebSocket.CONNECTING)
  ) {
    return;
  }

  /**
   * 根據目前網站協定決定 WebSocket 協定
   *
   * http  -> ws
   * https -> wss
   */
  const protocol = location.protocol === "https:" ? "wss" : "ws";

  /**
   * 建立 WebSocket URL
   */
  const webSocketURL = `${protocol}://localhost:3000/chat?token=${connectionToken}`;

  isConnecting = true;
  socket = new WebSocket(webSocketURL);

  console.log("[WS] connect to", webSocketURL);

  /**
   * WebSocket 建立成功
   */
  socket.onopen = () => {
    isConnecting = false;

    /**
     * 重置重連次數
     */
    reconnectAttempts = 0;

    clearReconnectTimer();

    console.log("[WS] connected");

    /**
     * 若建立連線前已有指定聊天室，
     * 則於連線成功後自動加入。
     */
    if (pendingJoinRoomId) {
      const roomId = pendingJoinRoomId;
      pendingJoinRoomId = null;

      joinRoom(roomId);
    }

    /**
     * 通知外部已成功建立連線
     */
    onOpenHandler?.();
  };

  /**
   * 收到 Server 推播訊息
   */
  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data) as ServerWsMessage;

      onMessageHandler?.(data);
    } catch (err) {
      console.error("[WS] invalid message format", err);
    }
  };

  /**
   * WebSocket 發生錯誤
   */
  socket.onerror = (event) => {
    console.error("[WS] error", event);
  };

  /**
   * WebSocket 關閉
   *
   * 若允許重連則自動安排重新建立連線。
   */
  socket.onclose = (event) => {
    console.warn("[WS] closed", event.code, event.reason);

    socket = null;
    isConnecting = false;

    const isAuthErrorClose =
      event.code === WS_CLOSE_AUTH_TOKEN_EXPIRED ||
      event.code === WS_CLOSE_AUTH_TOKEN_INVALID ||
      event.reason === "AUTH_TOKEN_EXPIRED" ||
      event.reason === "AUTH_TOKEN_INVALID";

    if (isAuthErrorClose) {
      shouldReconnect = false;
      clearReconnectTimer();
      onAuthFailedHandler?.();
      return;
    }

    if (shouldReconnect) {
      scheduleReconnect();
    }
  };
}

/**
 * 建立聊天 WebSocket 連線
 *
 * @param token JWT Token
 * @param onMessage 收到 Server 訊息 Callback
 * @param onOpen WebSocket 建立成功 Callback
 */
export function connectChatSocket(
  token: string,
  onMessage: (message: ServerWsMessage) => void,
  onOpen?: () => void,
  onAuthFailed?: () => void,
): void {
  connectionToken = token;
  onMessageHandler = onMessage;
  onOpenHandler = onOpen ?? null;
  onAuthFailedHandler = onAuthFailed ?? null;

  /**
   * 開啟自動重連
   */
  shouldReconnect = true;

  /**
   * 已存在可用連線則直接通知成功
   */
  if (
    socket &&
    (socket.readyState === WebSocket.OPEN ||
      socket.readyState === WebSocket.CONNECTING)
  ) {
    onOpen?.();
    return;
  }

  createSocket();
}

/**
 * 發送聊天訊息
 *
 * @param roomId 聊天室 Id
 * @param content 訊息內容
 */
export function sendChatMessage(roomId: string, content: string): void {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.warn("[WS] not connected");
    return;
  }

  const message: ClientWsMessage = {
    type: "SEND_MESSAGE",
    payload: {
      roomId,
      content,
    },
  };

  socket.send(JSON.stringify(message));
}

/**
 * 主動中斷 WebSocket
 *
 * 用於：
 * - 登出
 * - 離開聊天室
 * - 系統關閉
 *
 * 同時停止所有自動重連。
 */
export function disconnectChatSocket(): void {
  shouldReconnect = false;

  clearReconnectTimer();

  if (socket && socket.readyState !== WebSocket.CLOSED) {
    socket.close();
  }

  socket = null;
  isConnecting = false;
  pendingJoinRoomId = null;
  reconnectAttempts = 0;
  connectionToken = "";
  onMessageHandler = null;
  onOpenHandler = null;
  onAuthFailedHandler = null;
}

/**
 * 加入聊天室
 *
 * 若 WebSocket 尚未建立完成，
 * 則先暫存 RoomId，待連線成功後自動加入。
 *
 * @param roomId 聊天室 Id
 */
export function joinRoom(roomId: string): void {
  console.log("[WS] joinRoom call:", roomId);

  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.warn("[WS] not ready, pending join:", roomId);

    pendingJoinRoomId = roomId;

    return;
  }

  console.log("[WS] send JOIN_ROOM:", roomId);

  socket.send(
    JSON.stringify({
      type: "JOIN_ROOM",
      payload: {
        roomId,
      },
    }),
  );
}