<template>
  <div class="mb-3 flex w-full" :class="isMine ? 'justify-end' : 'justify-start'" :data-message-id="message.id">
    <div
      class="flex min-w-0 max-w-[86%] items-end gap-1.5 sm:max-w-[76%] lg:max-w-[64%]"
      :class="rowClass"
    >
      <div class="min-w-0">
        <div v-if="!isMine" class="mb-1 px-1 text-[11px] leading-none text-gray-500">
          {{ displayName }}
        </div>

        <div
          ref="messageBubbleEl"
          class="w-fit max-w-full text-sm leading-relaxed sm:text-[15px]"
          :class="[bubbleClass, bubblePaddingClass, isReplyTarget ? 'ring-2 ring-blue-400/70' : '']"
          @click="handleMessageBubbleClick"
          @contextmenu.prevent="handleMessageContextMenu"
        >
          <button
            v-if="message.replyTo"
            type="button"
            class="mb-2 block w-full rounded-lg border border-gray-200/80 bg-gray-50/90 px-2.5 py-2 text-left text-xs transition hover:border-blue-200 hover:bg-blue-50/70"
            @click="handleReplyReferenceClick"
          >
            <div class="truncate font-medium text-gray-600">↩ {{ replyPreviewName }}</div>
            <div class="mt-1 line-clamp-2 text-gray-500">
              {{ message.replyTo.content || '（空白訊息）' }}
            </div>
          </button>

          <!-- 純文字訊息 -->
          <div v-if="message.content" class="whitespace-pre-wrap wrap-break-word">
            {{ message.content }}
          </div>

          <!-- 網址預覽 -->
          <a
            v-if="message.urlPreview"
            :href="message.urlPreview.url"
            target="_blank"
            rel="noopener noreferrer"
            class="block w-[min(76vw,360px)] max-w-full overflow-hidden rounded-xl border bg-white text-left text-gray-900 shadow-sm transition hover:border-gray-300 hover:shadow-md"
            :class="message.content ? 'mt-2' : ''"
          >
            <img
              v-if="message.urlPreview.imageUrl && !urlPreviewImageFailed"
              :src="message.urlPreview.imageUrl"
              :alt="message.urlPreview.title || message.urlPreview.siteName || '網址預覽圖片'"
              class="h-40 w-full bg-gray-100 object-cover sm:h-44"
              loading="lazy"
              referrerpolicy="no-referrer"
              @error="urlPreviewImageFailed = true"
            />

            <div class="px-3 py-2.5">
              <div class="flex items-start gap-2.5">
                <div
                  v-if="!message.urlPreview.imageUrl || urlPreviewImageFailed"
                  class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-lg"
                  aria-hidden="true"
                >
                  🌐
                </div>

                <div class="min-w-0 flex-1">
                  <div
                    v-if="message.urlPreview.siteName"
                    class="mb-1 truncate text-[11px] text-gray-500"
                  >
                    {{ message.urlPreview.siteName }}
                  </div>

                  <div
                    v-if="message.urlPreview.title"
                    class="line-clamp-2 text-sm font-semibold leading-5 text-gray-900"
                  >
                    {{ message.urlPreview.title }}
                  </div>
                </div>
              </div>

              <div
                v-if="message.urlPreview.description"
                class="mt-1 line-clamp-2 text-xs leading-5 text-gray-500"
              >
                {{ message.urlPreview.description }}
              </div>

              <div class="mt-1.5 truncate text-[11px] text-blue-600">
                {{ previewHostname }}
              </div>
            </div>
          </a>

          <!-- 圖片載入中 -->
          <div
            v-if="message.attachment && isImageAttachment && previewLoading"
            class="flex h-36 w-52 max-w-[70vw] items-center justify-center overflow-hidden rounded-xl bg-gray-100 sm:h-48 sm:w-72"
            :class="message.content ? 'mt-2' : ''"
          >
            <div class="flex flex-col items-center gap-2 text-gray-400">
              <span
                class="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-500"
              ></span>
              <span class="text-xs">圖片載入中</span>
            </div>
          </div>

          <!-- 圖片附件 -->
          <div
            v-else-if="message.attachment && isImageAttachment && previewUrl && !previewLoadFailed"
            class="overflow-hidden rounded-xl border shadow-sm"
            :class="[
              message.content ? 'mt-2' : '',
              isMine ? 'border-blue-400/50 bg-blue-600' : 'border-gray-200 bg-white',
            ]"
          >
            <button
              type="button"
              class="group relative block max-w-full overflow-hidden bg-gray-100"
              title="開啟圖片預覽"
              @click="openImagePreview"
            >
              <img
                :src="previewUrl"
                :alt="message.attachment.name"
                class="block h-auto max-h-65 max-w-[70vw] object-contain sm:max-h-95 sm:max-w-105 lg:max-h-110 lg:max-w-130"
                @error="handlePreviewError"
              />

              <span
                class="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/20 group-hover:opacity-100"
              >
                <span class="rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white">
                  查看圖片
                </span>
              </span>
            </button>

            <div
              class="flex max-w-[70vw] items-center gap-2 px-2.5 py-2 sm:max-w-105 lg:max-w-130"
              :class="isMine ? 'text-white' : 'text-gray-700'"
            >
              <div class="min-w-0 flex-1">
                <div class="truncate text-xs font-medium">
                  {{ message.attachment.name }}
                </div>

                <div class="text-[11px]" :class="isMine ? 'text-blue-100' : 'text-gray-400'">
                  {{ formattedFileSize }}
                </div>
              </div>

              <button
                type="button"
                class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition"
                :class="
                  isMine
                    ? 'bg-white/15 text-white hover:bg-white/25'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                "
                title="下載圖片"
                @click.stop="downloadAttachment"
              >
                ↓
              </button>
            </div>
          </div>

          <!-- 不支援預覽的附件 -->
          <button
            v-else-if="message.attachment"
            type="button"
            class="group flex w-[min(76vw,320px)] max-w-full items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-3 text-left text-gray-800 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 active:scale-[0.99]"
            :class="message.content ? 'mt-2' : ''"
            @click="downloadAttachment"
          >
            <span
              class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-2xl"
            >
              {{ attachmentIcon }}
            </span>

            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm font-medium text-gray-800">
                {{ message.attachment.name }}
              </span>

              <span class="mt-0.5 block text-xs text-gray-500">
                {{ attachmentTypeLabel }}・{{ formattedFileSize }}
              </span>
            </span>

            <span
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition group-hover:bg-gray-200"
            >
              ↓
            </span>
          </button>

          <!-- 預覽失敗 -->
          <div
            v-if="message.attachment && isImageAttachment && previewLoadFailed"
            class="mt-1 text-xs"
            :class="isMine ? 'text-blue-100' : 'text-red-600'"
          >
            圖片預覽載入失敗，請點擊附件下載。
          </div>
        </div>

        <!-- 時間改到氣泡下方，手機比較不會擠壓 -->
        <div
          class="mt-1 px-1 text-[10px] leading-none text-gray-400"
          :class="isMine ? 'text-right' : 'text-left'"
        >
          {{ formattedTime }}
        </div>
      </div>
    </div>
  </div>

  <Teleport to="body">
    <div v-if="contextMenuOpen">
      <div class="fixed inset-0 z-70" aria-hidden="true" @click="closeContextMenu"></div>
      <div
        ref="contextMenuEl"
        class="fixed z-80 min-w-32 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-xl"
        :style="contextMenuStyle"
        role="menu"
        aria-label="訊息操作選單"
      >
        <button
          v-for="action in contextMenuActions"
          :key="action.key"
          type="button"
          class="flex w-full items-center px-3 py-2 text-left text-sm transition hover:bg-gray-100"
          :class="action.key === 'send-friend-request' ? 'text-indigo-600' : 'text-gray-700'"
          role="menuitem"
          @click="handleContextMenuAction(action.key)"
        >
          {{ action.label }}
        </button>
      </div>
    </div>
  </Teleport>

  <!-- 全螢幕圖片預覽 -->
  <Teleport to="body">
    <div
      v-if="imagePreviewOpen && previewUrl && message.attachment"
      class="fixed inset-0 z-100 flex flex-col bg-black/90"
      @click.self="closeImagePreview"
    >
      <header class="flex h-14 shrink-0 items-center justify-between gap-3 px-3 text-white sm:px-5">
        <div class="min-w-0">
          <div class="truncate text-sm font-medium">
            {{ message.attachment.name }}
          </div>

          <div class="text-[11px] text-gray-300">
            {{ formattedFileSize }}
          </div>
        </div>

        <div class="flex shrink-0 items-center gap-2">
          <button
            type="button"
            class="rounded-lg bg-white/10 px-3 py-2 text-sm hover:bg-white/20"
            @click="downloadAttachment"
          >
            下載
          </button>

          <button
            type="button"
            class="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-2xl hover:bg-white/20"
            aria-label="關閉圖片預覽"
            @click="closeImagePreview"
          >
            ×
          </button>
        </div>
      </header>

      <div
        class="flex min-h-0 flex-1 items-center justify-center overflow-auto p-3 sm:p-5"
        @click.self="closeImagePreview"
      >
        <img
          :src="previewUrl"
          :alt="message.attachment.name"
          class="max-h-full max-w-full object-contain"
        />
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { downloadChatAttachmentApi, getChatAttachmentBlobApi } from '@/api/chatApi'
import { useAuthStore } from '@/stores/authStore'
import { useChatStore } from '@/stores/chatStore'
import type { ChatMessage } from '@/types/chat'

const props = defineProps<{
  message: ChatMessage
  scrollToMessage?: (messageId: string) => Promise<void>
}>()

const emit = defineEmits<{
  'view-user-profile': [
    payload: {
      userId: string
      username: string
      displayName: string
    },
  ]
  'send-friend-request': [
    payload: {
      userId: string
      username: string
      displayName: string
    },
  ]
}>()

const auth = useAuthStore()
const chat = useChatStore()

const previewUrl = ref('')
const previewLoading = ref(false)
const previewLoadFailed = ref(false)
const imagePreviewOpen = ref(false)
const urlPreviewImageFailed = ref(false)
const messageBubbleEl = ref<HTMLElement | null>(null)
const contextMenuEl = ref<HTMLElement | null>(null)
const contextMenuOpen = ref(false)
const contextMenuX = ref(0)
const contextMenuY = ref(0)

type ContextMenuActionKey = 'reply' | 'view-profile' | 'send-friend-request'

interface ContextMenuAction {
  key: ContextMenuActionKey
  label: string
}

const isSystemMessage = computed(() => {
  return props.message.senderUsername === 'system'
})

const isMine = computed(() => {
  return !isSystemMessage.value && auth.isAuthenticated && props.message.senderId === auth.userId
})

const isLobbyMessage = computed(() => {
  return props.message.roomId === 'lobby' || chat.currentRoomId === 'lobby'
})

const senderActionPayload = computed(() => ({
  userId: props.message.senderId,
  username: props.message.senderUsername,
  displayName: props.message.senderName || props.message.senderUsername || '使用者',
}))

const contextMenuActions = computed<ContextMenuAction[]>(() => {
  if (isSystemMessage.value) {
    return []
  }

  const actions: ContextMenuAction[] = [{ key: 'reply', label: '回覆' }]

  if (!isMine.value && props.message.senderId) {
    actions.push({ key: 'view-profile', label: '檢視個人檔案' })

    if (isLobbyMessage.value) {
      actions.push({ key: 'send-friend-request', label: '發送好友申請' })
    }
  }

  return actions
})

const displayName = computed(() => {
  if (isSystemMessage.value) {
    return props.message.senderName || '系統'
  }

  if (isMine.value) {
    const name =
      auth.userName || props.message.senderName || props.message.senderUsername || '使用者'

    return `${name}（你）`
  }

  const user = chat.users.get(props.message.senderId)

  return (
    props.message.senderName ||
    user?.displayName ||
    props.message.senderUsername ||
    user?.username ||
    'Unknown'
  )
})

const replyPreviewName = computed(() => {
  if (isSystemMessage.value) {
    return props.message.senderName || '系統'
  }

  if (isMine.value) {
    return auth.userName || props.message.senderName || props.message.senderUsername || '使用者'
  }

  const user = chat.users.get(props.message.senderId)

  return (
    props.message.senderName ||
    user?.displayName ||
    props.message.senderUsername ||
    user?.username ||
    'Unknown'
  )
})

const isReplyTarget = computed(() => chat.replyingToMessage?.messageId === props.message.id)

const rowClass = computed(() => {
  return isMine.value ? 'flex-row-reverse' : 'flex-row'
})

const isAttachmentOnlyMessage = computed(() => {
  return Boolean(props.message.attachment) && !props.message.content
})

const bubbleClass = computed(() => {
  if (isAttachmentOnlyMessage.value) {
    return ''
  }

  if (isMine.value) {
    return 'rounded-2xl rounded-br-md bg-blue-500 text-white shadow-sm'
  }

  return 'rounded-2xl rounded-bl-md border border-gray-200 bg-white text-gray-900 shadow-sm'
})

const bubblePaddingClass = computed(() => {
  if (isAttachmentOnlyMessage.value) {
    return ''
  }

  return 'px-3 py-2'
})

const attachmentMimeType = computed(() => {
  return props.message.attachment?.mimeType?.toLowerCase() ?? ''
})

const attachmentFileName = computed(() => {
  return props.message.attachment?.name.toLowerCase() ?? ''
})

const isImageAttachment = computed(() => {
  if (attachmentMimeType.value.startsWith('image/')) {
    return true
  }

  return /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(attachmentFileName.value)
})

const attachmentIcon = computed(() => {
  const mimeType = attachmentMimeType.value
  const fileName = attachmentFileName.value

  if (isImageAttachment.value) {
    return '🖼️'
  }

  if (mimeType.startsWith('video/') || /\.(mp4|webm|mov|m4v|avi)$/i.test(fileName)) {
    return '🎬'
  }

  if (mimeType.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(fileName)) {
    return '🎵'
  }

  if (mimeType.includes('pdf') || fileName.endsWith('.pdf')) {
    return '📕'
  }

  if (
    mimeType.includes('zip') ||
    mimeType.includes('compressed') ||
    /\.(zip|rar|7z)$/i.test(fileName)
  ) {
    return '🗜️'
  }

  if (mimeType.includes('word') || /\.(doc|docx)$/i.test(fileName)) {
    return '📝'
  }

  if (
    mimeType.includes('spreadsheet') ||
    mimeType.includes('excel') ||
    /\.(xls|xlsx)$/i.test(fileName)
  ) {
    return '📊'
  }

  if (
    mimeType.includes('presentation') ||
    mimeType.includes('powerpoint') ||
    /\.(ppt|pptx)$/i.test(fileName)
  ) {
    return '📽️'
  }

  if (mimeType.startsWith('text/') || /\.(txt|csv|json|xml|md)$/i.test(fileName)) {
    return '📃'
  }

  return '📄'
})

const attachmentTypeLabel = computed(() => {
  const mimeType = attachmentMimeType.value
  const fileName = attachmentFileName.value

  if (mimeType.includes('pdf') || fileName.endsWith('.pdf')) {
    return 'PDF 文件'
  }

  if (mimeType.includes('word') || /\.(doc|docx)$/i.test(fileName)) {
    return 'Word 文件'
  }

  if (
    mimeType.includes('spreadsheet') ||
    mimeType.includes('excel') ||
    /\.(xls|xlsx)$/i.test(fileName)
  ) {
    return 'Excel 試算表'
  }

  if (
    mimeType.includes('presentation') ||
    mimeType.includes('powerpoint') ||
    /\.(ppt|pptx)$/i.test(fileName)
  ) {
    return 'PowerPoint 簡報'
  }

  if (
    mimeType.includes('zip') ||
    mimeType.includes('compressed') ||
    /\.(zip|rar|7z)$/i.test(fileName)
  ) {
    return '壓縮檔案'
  }

  if (mimeType.startsWith('video/') || /\.(mp4|webm|mov|m4v|avi)$/i.test(fileName)) {
    return '影片檔案'
  }

  if (mimeType.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(fileName)) {
    return '音訊檔案'
  }

  if (mimeType.startsWith('text/') || /\.(txt|csv|json|xml|md)$/i.test(fileName)) {
    return '文字檔案'
  }

  return '附件'
})

const formattedFileSize = computed(() => {
  const size = props.message.attachment?.size ?? 0

  if (size < 1024) {
    return `${size} B`
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`
})

const previewHostname = computed(() => {
  const url = props.message.urlPreview?.url

  if (!url) return ''

  try {
    return new URL(url).hostname
  } catch {
    return url
  }
})

const formattedTime = computed(() => {
  return formatMessageTime(props.message.createdAt)
})

const contextMenuStyle = computed(() => ({
  left: `${contextMenuX.value}px`,
  top: `${contextMenuY.value}px`,
}))

function setReplyTarget(): void {
  chat.setReplyTarget({
    messageId: props.message.id,
    content: props.message.content || props.message.replyTo?.content || props.message.attachment?.name || '',
    senderName: replyPreviewName.value,
    senderUsername: props.message.senderUsername || props.message.senderName || '使用者',
  })
}

function closeContextMenu(): void {
  contextMenuOpen.value = false
}

async function openContextMenu(clientX: number, clientY: number): Promise<void> {
  contextMenuX.value = clientX
  contextMenuY.value = clientY
  contextMenuOpen.value = true

  await nextTick()
  adjustContextMenuPosition()
}

function adjustContextMenuPosition(): void {
  const menu = contextMenuEl.value

  if (!menu) {
    return
  }

  const padding = 8
  const { innerWidth, innerHeight } = window
  const { width, height } = menu.getBoundingClientRect()

  contextMenuX.value = Math.min(contextMenuX.value, innerWidth - width - padding)
  contextMenuY.value = Math.min(contextMenuY.value, innerHeight - height - padding)
  contextMenuX.value = Math.max(contextMenuX.value, padding)
  contextMenuY.value = Math.max(contextMenuY.value, padding)
}

function handleMessageContextMenu(event: MouseEvent): void {
  void openContextMenu(event.clientX, event.clientY)
}

function handleMessageBubbleClick(event: MouseEvent): void {
  const target = event.target as HTMLElement | null

  if (target?.closest('button, a, input, textarea')) {
    return
  }

  void openContextMenu(event.clientX, event.clientY)
}

function handleContextMenuAction(actionKey: ContextMenuActionKey): void {
  switch (actionKey) {
    case 'reply':
      setReplyTarget()
      break
    case 'view-profile':
      emit('view-user-profile', senderActionPayload.value)
      break
    case 'send-friend-request':
      emit('send-friend-request', senderActionPayload.value)
      break
    default:
      break
  }

  closeContextMenu()
}

async function handleReplyReferenceClick(): Promise<void> {
  if (!props.message.replyTo?.messageId) {
    return
  }

  await props.scrollToMessage?.(props.message.replyTo.messageId)
}

function handleDocumentPointerDown(event: PointerEvent): void {
  if (!contextMenuOpen.value) {
    return
  }

  const target = event.target as Node | null

  if (target && contextMenuEl.value?.contains(target)) {
    return
  }

  closeContextMenu()
}

function handleDocumentContextMenu(event: MouseEvent): void {
  if (!contextMenuOpen.value) {
    return
  }

  const target = event.target as Node | null

  if (target && (contextMenuEl.value?.contains(target) || messageBubbleEl.value?.contains(target))) {
    return
  }

  closeContextMenu()
}

function handleEscapeKey(event: KeyboardEvent): void {
  if (event.key !== 'Escape') {
    return
  }

  closeContextMenu()
}

function handleViewportChange(): void {
  if (!contextMenuOpen.value) {
    return
  }

  closeContextMenu()
}

async function loadAttachmentPreview(): Promise<void> {
  revokePreviewUrl()

  const attachment = props.message.attachment

  if (!attachment || !isImageAttachment.value) {
    return
  }

  previewLoading.value = true
  previewLoadFailed.value = false

  try {
    const blob = await getChatAttachmentBlobApi(props.message.roomId, attachment.id)

    previewUrl.value = URL.createObjectURL(blob)
  } catch (error: unknown) {
    console.error('圖片預覽載入失敗', error)
    previewLoadFailed.value = true
  } finally {
    previewLoading.value = false
  }
}

async function downloadAttachment(): Promise<void> {
  const attachment = props.message.attachment

  if (!attachment) return

  try {
    await downloadChatAttachmentApi(props.message.roomId, attachment.id, attachment.name)
  } catch (error: unknown) {
    console.error('附件下載失敗', error)
  }
}

function handlePreviewError(): void {
  previewLoadFailed.value = true
}

function openImagePreview(): void {
  if (!previewUrl.value) return

  imagePreviewOpen.value = true
  document.body.style.overflow = 'hidden'
}

function closeImagePreview(): void {
  imagePreviewOpen.value = false
  document.body.style.overflow = ''
}

function revokePreviewUrl(): void {
  if (!previewUrl.value) return

  URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = ''
}

function formatMessageTime(isoTime: string): string {
  const date = new Date(isoTime)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const now = new Date()

  const isSameDate =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()

  const timeText = new Intl.DateTimeFormat('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)

  if (isSameDate) {
    return timeText
  }

  const dateText = new Intl.DateTimeFormat('zh-TW', {
    month: '2-digit',
    day: '2-digit',
  }).format(date)

  return `${dateText} ${timeText}`
}

watch(
  () => props.message.attachment?.id,
  () => {
    closeImagePreview()
    void loadAttachmentPreview()
  },
)

watch(
  () => props.message.urlPreview?.imageUrl,
  () => {
    urlPreviewImageFailed.value = false
  },
)

watch(contextMenuOpen, (isOpen) => {
  if (isOpen) {
    document.addEventListener('pointerdown', handleDocumentPointerDown)
    document.addEventListener('contextmenu', handleDocumentContextMenu)
    document.addEventListener('keydown', handleEscapeKey)
    document.addEventListener('scroll', handleViewportChange, true)
    window.addEventListener('resize', handleViewportChange)
    window.addEventListener('blur', handleViewportChange)
    return
  }

  document.removeEventListener('pointerdown', handleDocumentPointerDown)
  document.removeEventListener('contextmenu', handleDocumentContextMenu)
  document.removeEventListener('keydown', handleEscapeKey)
  document.removeEventListener('scroll', handleViewportChange, true)
  window.removeEventListener('resize', handleViewportChange)
  window.removeEventListener('blur', handleViewportChange)
})

onMounted(() => {
  void loadAttachmentPreview()
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleDocumentPointerDown)
  document.removeEventListener('contextmenu', handleDocumentContextMenu)
  document.removeEventListener('keydown', handleEscapeKey)
  document.removeEventListener('scroll', handleViewportChange, true)
  window.removeEventListener('resize', handleViewportChange)
  window.removeEventListener('blur', handleViewportChange)
  closeContextMenu()
  closeImagePreview()
  revokePreviewUrl()
})
</script>
