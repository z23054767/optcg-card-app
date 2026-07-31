<template>
  <div class="flex items-end gap-2">
    <input ref="fileInput" type="file" multiple class="hidden" @change="handleFiles" />
    <button type="button"
      class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border text-xl hover:bg-gray-50 disabled:opacity-50"
      :disabled="uploading" title="上傳檔案" @click="fileInput?.click()">＋</button>
    <textarea v-model="text" rows="1" placeholder="輸入訊息..."
      class="max-h-32 min-h-10 flex-1 resize-none rounded-lg border px-3 py-2" @keydown.enter.exact.prevent="send" />
    <button type="button" class="h-10 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white disabled:opacity-50"
      :disabled="uploading || !text.trim()" @click="send">傳送</button>
  </div>
  <div v-if="uploading" class="mt-1 text-xs text-gray-500">正在上傳 {{ uploadProgress }}...</div>
  <div v-if="errorMessage" class="mt-1 text-xs text-red-600">{{ errorMessage }}</div>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { sendChatMessage } from "@/websocket/chatSocket"
import { useChatStore } from "@/stores/chatStore"
import { uploadChatAttachmentApi } from "@/api/chatApi"

const chat = useChatStore()
const text = ref("")
const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const uploadProgress = ref("")
const errorMessage = ref("")
const MAX_FILE_SIZE = 25 * 1024 * 1024
const MAX_FILES = 10

function send(): void {
  const content = text.value.trim()
  if (!content) return
  sendChatMessage(chat.currentRoomId, content)
  text.value = ""
}

async function handleFiles(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? []).slice(0, MAX_FILES)

  input.value = ""

  if (files.length === 0) return

  errorMessage.value = ""

  const oversized = files.find((file) => file.size > MAX_FILE_SIZE)

  if (oversized) {
    errorMessage.value = `${oversized.name} 超過 25 MB`
    return
  }

  uploading.value = true

  try {
    for (const [index, file] of files.entries()) {
      uploadProgress.value = `${index + 1}/${files.length}：${file.name}`

      await uploadChatAttachmentApi(
        chat.currentRoomId,
        file
      )
    }
  } catch (error: unknown) {
    console.error("檔案上傳失敗", error)
    errorMessage.value = "檔案上傳失敗，請稍後再試"
  } finally {
    uploading.value = false
    uploadProgress.value = ""
  }
}
</script>
