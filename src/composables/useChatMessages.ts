import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import { getChatRoomMessagesApi } from '@/api/chatApi'
import { useChatStore } from '@/stores/chatStore'

const MESSAGE_PAGE_SIZE = 30

export function useChatMessages() {
  const chat = useChatStore()

  const messagesEl = ref<HTMLElement | null>(null)
  const loadingLatestMessages = ref(false)
  const loadingOlderMessages = ref(false)
  const hasMoreMessages = ref(true)
  const historyCursor = ref<{ beforeCreatedAt: string; beforeId: string } | null>(null)
  const dateLabelAnchor = ref(Date.now())
  const showScrollButton = ref(false)
  const initializingRoom = ref(false)
  const lastRequestedCursorKey = ref<string | null>(null)
  const midnightRefreshTimer = ref<ReturnType<typeof setTimeout> | null>(null)

  const filteredMessages = computed(() =>
    chat.messages.filter(
      (message) => message && String(message.roomId) === String(chat.currentRoomId),
    ),
  )

  const lastMessageId = computed<string | null>(() => {
    const messages = filteredMessages.value
    const lastMessage = messages[messages.length - 1]

    return lastMessage?.id ?? null
  })

  function prepareRoom(roomId: string): void {
    chat.setCurrentRoom(roomId)
    historyCursor.value = null
    lastRequestedCursorKey.value = null
    hasMoreMessages.value = true
    showScrollButton.value = false
  }

  async function loadLatestMessages(roomId: string): Promise<void> {
    loadingLatestMessages.value = true

    try {
      const response = await getChatRoomMessagesApi(roomId, {
        limit: MESSAGE_PAGE_SIZE,
      })

      chat.setMessages(response.messages ?? [])
      hasMoreMessages.value = response.hasMore === true
      historyCursor.value = response.nextCursor ?? null
    } finally {
      loadingLatestMessages.value = false
    }
  }

  async function loadOlderMessages(): Promise<void> {
    if (initializingRoom.value) return
    if (loadingLatestMessages.value) return
    if (loadingOlderMessages.value) return
    if (!hasMoreMessages.value) return

    const cursor = historyCursor.value
    const el = messagesEl.value

    if (!cursor || !el) return

    const cursorKey = `${cursor.beforeCreatedAt}_${cursor.beforeId}`

    if (lastRequestedCursorKey.value === cursorKey) return

    const roomId = chat.currentRoomId
    const previousScrollHeight = el.scrollHeight
    const previousScrollTop = el.scrollTop

    lastRequestedCursorKey.value = cursorKey
    loadingOlderMessages.value = true

    try {
      await nextTick()

      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          resolve()
        })
      })

      await delay(800)

      const response = await getChatRoomMessagesApi(roomId, {
        limit: MESSAGE_PAGE_SIZE,
        beforeCreatedAt: cursor.beforeCreatedAt,
        beforeId: cursor.beforeId,
      })

      if (chat.currentRoomId !== roomId) return

      const olderMessages = response.messages ?? []

      if (olderMessages.length === 0) {
        hasMoreMessages.value = false
        historyCursor.value = null
        return
      }

      chat.prependMessages(olderMessages)

      hasMoreMessages.value = response.hasMore === true
      historyCursor.value = response.nextCursor ?? null

      await nextTick()

      const addedHeight = el.scrollHeight - previousScrollHeight
      el.scrollTop = previousScrollTop + addedHeight
    } catch (error) {
      lastRequestedCursorKey.value = null
      throw error
    } finally {
      loadingOlderMessages.value = false
    }
  }

  function handleMessageScroll(event: Event): void {
    const el = event.currentTarget

    if (!(el instanceof HTMLElement)) return

    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    const isNearTop = el.scrollTop <= 50
    const isNearBottom = distanceFromBottom <= 50

    showScrollButton.value = !isNearBottom

    if (initializingRoom.value) return
    if (!isNearTop) return

    void loadOlderMessages()
  }

  async function scrollToBottom(smooth = false): Promise<void> {
    await nextTick()

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        const el = messagesEl.value

        if (el) {
          el.scrollTo({
            top: el.scrollHeight,
            behavior: smooth ? 'smooth' : 'auto',
          })
        }

        resolve()
      })
    })
  }

  async function handleScrollButtonClick(): Promise<void> {
    await scrollToBottom(true)
  }

  async function scrollToMessage(messageId: string): Promise<void> {
    const container = messagesEl.value

    if (!container) return

    await nextTick()

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        resolve()
      })
    })

    const target = Array.from(container.querySelectorAll<HTMLElement>('[data-message-id]')).find(
      (element) => element.dataset.messageId === messageId,
    )

    if (!target) return

    target.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }

  function delay(milliseconds: number): Promise<void> {
    return new Promise((resolve) => {
      window.setTimeout(resolve, milliseconds)
    })
  }

  function scheduleNextMidnightRefresh(): void {
    const now = new Date()
    const nextMidnight = new Date(now)
    nextMidnight.setHours(24, 0, 0, 0)

    const delayMs = Math.max(1000, nextMidnight.getTime() - now.getTime())

    midnightRefreshTimer.value = setTimeout(() => {
      dateLabelAnchor.value = Date.now()
      scheduleNextMidnightRefresh()
    }, delayMs)
  }

  function startMidnightRefresh(): void {
    stopMidnightRefresh()
    scheduleNextMidnightRefresh()
  }

  function stopMidnightRefresh(): void {
    if (!midnightRefreshTimer.value) return

    clearTimeout(midnightRefreshTimer.value)
    midnightRefreshTimer.value = null
  }

  watch(
    lastMessageId,
    async (newMessageId, oldMessageId) => {
      if (initializingRoom.value) return
      if (loadingLatestMessages.value) return
      if (loadingOlderMessages.value) return
      if (!oldMessageId) return
      if (!newMessageId || newMessageId === oldMessageId) return

      await scrollToBottom(true)
    },
    { flush: 'post' },
  )

  onUnmounted(() => {
    stopMidnightRefresh()
  })

  return {
    messagesEl,
    filteredMessages,
    loadingLatestMessages,
    loadingOlderMessages,
    hasMoreMessages,
    historyCursor,
    dateLabelAnchor,
    showScrollButton,
    initializingRoom,
    prepareRoom,
    loadLatestMessages,
    loadOlderMessages,
    handleMessageScroll,
    scrollToBottom,
    scrollToMessage,
    handleScrollButtonClick,
    startMidnightRefresh,
    stopMidnightRefresh,
  }
}
