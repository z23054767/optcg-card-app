import { useAuthStore } from '@/stores/authStore'

export type RpsChoice = 'ROCK' | 'PAPER' | 'SCISSORS'

export type BattlePhase =
  | 'WAITING_OPPONENT'
  | 'RPS_CHOOSING'
  | 'RPS_RESOLVED'
  | 'MULLIGAN_DECIDING'
  | 'TURN_ACTIVE'
  | 'TURN_DRAW'
  | 'TURN_DON'
  | 'TURN_MAIN'
  | 'TURN_END'
  | 'GAME_OVER'

export interface CardInstance {
  instanceId: string
  cardId: string
  isRested: boolean
  attachedDonCount: number
  givenPowerBuff: number
  name?: string
  cost?: number
  power?: number
  imageUrl?: string
}

export interface PlayerFieldState {
  userId: string
  username: string
  leader: CardInstance
  lifeCount: number
  deckCount: number
  trash: CardInstance[]
  costDon: CardInstance[]
  donDeckCount: number
  characters: (CardInstance | null)[]
  stage: CardInstance | null
}

export interface SelfPlayerState extends PlayerFieldState {
  hand: CardInstance[]
}

export interface OpponentPlayerState extends PlayerFieldState {
  handCount: number
  isOnline: boolean
}

export interface BattleState {
  roomId: string
  phase: BattlePhase
  revision?: number
  turnCount?: number
  turn?: number
  activePlayerId?: string | null
  firstPlayerId?: string | null
  rpsWinnerId?: string | null
  timerExpiresAt?: number | null
  me?: SelfPlayerState
  opponent?: OpponentPlayerState
  [key: string]: unknown
}

export interface BattleOpponentInfo {
  userId: string
  username: string
}

export interface BattleEvent {
  type: string
  roomId?: string
  opponent?: BattleOpponentInfo
  state?: BattleState
  message?: string
  timeoutSec?: number
  yourMove?: RpsChoice
  opponentMove?: RpsChoice
  winnerId?: string | null
  isDraw?: boolean
  firstPlayerId?: string
  yourHand?: CardInstance[]
  payload?: Record<string, unknown>
  [key: string]: unknown
}

export type BattleWsMessage = BattleEvent

function battleSocketUrl(token: string): string {
  const configured = import.meta.env.VITE_BATTLE_WS_URL as string | undefined

  if (configured) {
    const separator = configured.includes('?') ? '&' : '?'
    return `${configured}${separator}token=${encodeURIComponent(token)}`
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}/ws/battle?token=${encodeURIComponent(token)}`
}

export class BattleSocket {
  private socket: WebSocket | null = null
  private reconnectTimer: number | null = null
  private reconnectAttempts = 0
  private manuallyClosed = false

  constructor(
    private readonly onEvent: (event: BattleEvent) => void,
    private readonly onConnectionChange: (connected: boolean) => void,
  ) { }

  connect(): void {
    const token = useAuthStore().token

    if (!token) {
      this.onEvent({
        type: 'ERROR',
        message: '尚未登入，無法取得認證 Token',
        payload: {
          code: 'AUTH_TOKEN_REQUIRED',
        },
      })
      return
    }

    if (
      this.socket?.readyState === WebSocket.OPEN ||
      this.socket?.readyState === WebSocket.CONNECTING
    ) {
      return
    }

    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    this.manuallyClosed = false

    const socketUrl = battleSocketUrl(token)
    console.log('Connecting Battle WebSocket:', socketUrl)

    const socket = new WebSocket(socketUrl)
    this.socket = socket

    socket.addEventListener('open', () => {
      if (this.socket !== socket) {
        socket.close()
        return
      }

      console.log('Battle WebSocket connected')
      this.reconnectAttempts = 0
      this.onConnectionChange(true)
    })

    socket.addEventListener('message', ({ data }: MessageEvent<string>) => {
      try {
        const parsed = JSON.parse(String(data)) as unknown
        if (typeof parsed === 'object' && parsed !== null && 'type' in parsed) {
          this.onEvent(parsed as BattleEvent)
        } else {
          throw new Error('Invalid packet structure')
        }
      } catch (error) {
        console.error('Invalid Battle WebSocket message:', error)

        this.onEvent({
          type: 'ERROR',
          message: '接收到無效的伺服器訊息格式',
          payload: {
            code: 'BATTLE_INVALID_SERVER_MESSAGE',
          },
        })
      }
    })

    socket.addEventListener('error', (event) => {
      console.error('Battle WebSocket error:', event)
    })

    socket.addEventListener('close', (event: CloseEvent) => {
      if (this.socket !== socket) {
        return
      }

      this.socket = null
      this.onConnectionChange(false)

      console.warn('Battle WebSocket closed:', {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
      })

      if (this.manuallyClosed) {
        return
      }

      if (
        event.code === 4001 ||
        event.code === 4002 ||
        event.code === 4009
      ) {
        let errorCode = event.reason

        if (!errorCode) {
          if (event.code === 4001) {
            errorCode = 'AUTH_TOKEN_EXPIRED'
          } else if (event.code === 4002) {
            errorCode = 'AUTH_TOKEN_INVALID'
          } else {
            errorCode = 'SIGNED_IN_ELSEWHERE'
          }
        }

        this.onEvent({
          type: 'ERROR',
          message: errorCode,
          payload: {
            code: errorCode,
          },
        })

        return
      }

      this.scheduleReconnect()
    })
  }

  send(message: Record<string, unknown>): void {
    if (this.socket?.readyState !== WebSocket.OPEN) {
      this.onEvent({
        type: 'ERROR',
        message: '尚未連上對戰伺服器',
        payload: {
          code: 'NOT_CONNECTED',
        },
      })
      return
    }

    this.socket.send(JSON.stringify(message))
  }

  close(): void {
    this.manuallyClosed = true
    this.onConnectionChange(false)

    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    const socket = this.socket
    this.socket = null

    socket?.close(1000, 'CLIENT_CLOSED')
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer !== null || this.manuallyClosed) {
      return
    }

    this.reconnectAttempts += 1

    const delay = Math.min(
      1500 * this.reconnectAttempts,
      10000,
    )

    console.log(`Battle WebSocket 將於 ${delay}ms 後重新連線`)

    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null
      this.connect()
    }, delay)
  }
}