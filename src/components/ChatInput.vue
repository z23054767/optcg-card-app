<template>
  <div>
    <div
      v-if="chat.replyingToMessage"
      class="mb-2 rounded-lg px-3 py-2"
      :class="
        isReplyingToRecalledMessage
          ? 'border border-gray-200 bg-gray-100'
          : 'border border-blue-200 bg-blue-50'
      "
    >
      <div class="flex items-start justify-between gap-2">
        <button type="button" class="min-w-0 flex-1 text-left" @click="handleReplyPreviewClick">
          <div
            v-if="!isReplyingToRecalledMessage"
            class="text-[11px] font-semibold"
            :class="'text-blue-700'"
          >
            回覆 {{ chat.replyingToMessage.senderName }}
          </div>
          <div
            class="mt-1 line-clamp-2 text-sm"
            :class="isReplyingToRecalledMessage ? 'text-center italic text-gray-400' : 'text-gray-700'"
          >
            {{ replyPreviewContent }}
          </div>

          <div
            v-if="replyPreviewAttachmentLabel && !isReplyingToRecalledMessage"
            class="mt-1 inline-flex max-w-full items-center gap-1.5 rounded-full px-2 py-1 text-[11px]"
            :class="replyAttachmentBadgeClass"
          >
            <span aria-hidden="true">{{ replyPreviewAttachmentIcon }}</span>
            <span class="truncate">{{ replyPreviewAttachmentLabel }}</span>
            <span class="text-[10px] opacity-75">{{ replyPreviewAttachmentSize }}</span>
          </div>
        </button>

        <button
          type="button"
          class="shrink-0 rounded-full p-1 text-sm text-gray-500 hover:text-gray-700"
          :class="isReplyingToRecalledMessage ? 'hover:bg-gray-200' : 'hover:bg-blue-100'"
          aria-label="取消回覆"
          @click="chat.clearReplyTarget()"
        >
          ✕
        </button>
      </div>
    </div>
    <div v-if="sendDisabledReason" class="mb-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
      {{ sendDisabledReason }}
    </div>

    <div class="flex items-end gap-2">
      <input ref="fileInput" type="file" multiple class="hidden" @change="handleFiles" />
      <button
        type="button"
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border text-xl hover:bg-gray-50 disabled:opacity-50"
        :disabled="uploading || Boolean(sendDisabledReason)"
        title="上傳檔案"
        @click="fileInput?.click()"
      >
        ＋
      </button>
      <textarea
        v-model="text"
        rows="1"
        placeholder="輸入訊息..."
        class="max-h-32 min-h-10 flex-1 resize-none rounded-lg border px-3 py-2"
        :disabled="Boolean(sendDisabledReason)"
        @keydown.enter.exact.prevent="send"
      />
      <button
        type="button"
        class="h-10 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white disabled:opacity-50"
        :disabled="uploading || !text.trim() || Boolean(sendDisabledReason)"
        @click="send"
      >
        傳送
      </button>
    </div>
  </div>
  <div v-if="uploading" class="mt-1 text-xs text-gray-500">正在上傳 {{ uploadProgress }}...</div>
  <div v-if="errorMessage" class="mt-1 text-xs text-red-600">{{ errorMessage }}</div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { sendChatMessage, sendTypingStatus } from '@/websocket/chatSocket'
import { useChatStore } from '@/stores/chatStore'
import { uploadChatAttachmentApi } from '@/api/chatApi'
import { RECALL_MESSAGE_PLACEHOLDER, RECALL_REPLY_UNAVAILABLE_TEXT } from '@/types/chat'
import {
  getReplyAttachmentPreviewIcon,
  getReplyAttachmentPreviewLabel,
  getReplyAttachmentPreviewSizeText,
  getReplyAttachmentPreviewToneClass,
} from '@/utils/chatReplyPreview'

const props = defineProps<{
  scrollToMessage?: (messageId: string) => Promise<void>
  sendDisabledReason?: string
}>()

const chat = useChatStore()
const text = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const uploadProgress = ref('')
const errorMessage = ref('')
const typingActive = ref(false)
const typingStopTimer = ref<ReturnType<typeof setTimeout> | null>(null)
const MAX_FILE_SIZE = 25 * 1024 * 1024
const MAX_FILES = 10
const TYPING_IDLE_MS = 1400

const isReplyingToRecalledMessage = computed(() => {
  const content = chat.replyingToMessage?.content?.trim()

  return (
    content === RECALL_MESSAGE_PLACEHOLDER ||
    content === RECALL_REPLY_UNAVAILABLE_TEXT ||
    content === '訊息已收回' ||
    content === '已收回訊息'
  )
})

const replyPreviewContent = computed(() => {
  if (isReplyingToRecalledMessage.value) {
    return RECALL_REPLY_UNAVAILABLE_TEXT
  }

  if (chat.replyingToMessage?.content) {
    return chat.replyingToMessage.content
  }

  if (chat.replyingToMessage?.attachment) {
    return ''
  }

  return '（空白訊息）'
})

const replyPreviewAttachmentLabel = computed(() => {
  if (isReplyingToRecalledMessage.value) {
    return ''
  }

  return getReplyAttachmentPreviewLabel(chat.replyingToMessage?.attachment)
})

const replyPreviewAttachmentIcon = computed(() => {
  if (isReplyingToRecalledMessage.value) {
    return ''
  }

  return getReplyAttachmentPreviewIcon(chat.replyingToMessage?.attachment)
})

const replyPreviewAttachmentSize = computed(() => {
  if (isReplyingToRecalledMessage.value) {
    return ''
  }

  return getReplyAttachmentPreviewSizeText(chat.replyingToMessage?.attachment)
})

const replyAttachmentBadgeClass = computed(() => {
  return getReplyAttachmentPreviewToneClass(chat.replyingToMessage?.attachment)
})

function send(): void {
  const content = text.value.trim()
  if (!content) return

  sendChatMessage(chat.currentRoomId, content, chat.replyingToMessage)
  text.value = ''
  stopTypingIndicator(chat.currentRoomId)
  chat.clearReplyTarget()
}

async function handleReplyPreviewClick(): Promise<void> {
  if (!chat.replyingToMessage?.messageId) return

  await props.scrollToMessage?.(chat.replyingToMessage.messageId)
}

async function handleFiles(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? []).slice(0, MAX_FILES)

  input.value = ''

  if (files.length === 0) return

  errorMessage.value = ''

  const oversized = files.find((file) => file.size > MAX_FILE_SIZE)

  if (oversized) {
    errorMessage.value = `${oversized.name} 超過 25 MB`
    return
  }

  uploading.value = true

  try {
    const replyTarget = chat.replyingToMessage

    for (const [index, file] of files.entries()) {
      uploadProgress.value = `${index + 1}/${files.length}：${file.name}`

      await uploadChatAttachmentApi(chat.currentRoomId, file, replyTarget)
    }

    if (replyTarget) {
      chat.clearReplyTarget()
    }
  } catch (error: unknown) {
    console.error('檔案上傳失敗', error)
    errorMessage.value = '檔案上傳失敗，請稍後再試'
  } finally {
    uploading.value = false
    uploadProgress.value = ''
  }
}

function startTypingIndicator(): void {
  if (typingActive.value) {
    return
  }

  typingActive.value = true
  sendTypingStatus(chat.currentRoomId, true)
}

function stopTypingIndicator(roomId: string): void {
  clearTypingStopTimer()

  if (!typingActive.value) {
    return
  }

  typingActive.value = false
  sendTypingStatus(roomId, false)
}

function scheduleTypingStop(): void {
  clearTypingStopTimer()

  typingStopTimer.value = setTimeout(() => {
    typingStopTimer.value = null
    stopTypingIndicator(chat.currentRoomId)
  }, TYPING_IDLE_MS)
}

function clearTypingStopTimer(): void {
  if (!typingStopTimer.value) {
    return
  }

  clearTimeout(typingStopTimer.value)
  typingStopTimer.value = null
}

watch(
  () => text.value,
  (value) => {
    if (!value.trim()) {
      stopTypingIndicator(chat.currentRoomId)
      return
    }

    startTypingIndicator()
    scheduleTypingStop()
  },
)

watch(
  () => chat.currentRoomId,
  (nextRoomId, previousRoomId) => {
    if (previousRoomId) {
      stopTypingIndicator(previousRoomId)
    }

    if (text.value.trim()) {
      typingActive.value = false
      startTypingIndicator()
      scheduleTypingStop()
      return
    }

    typingActive.value = false
    clearTypingStopTimer()
  },
)

onBeforeUnmount(() => {
  stopTypingIndicator(chat.currentRoomId)
  clearTypingStopTimer()
})
</script>
