<template>
  <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[88vh]">
      <!-- Sticky header -->
      <div class="flex items-center justify-between px-5 py-4 border-b shrink-0">
        <h2 class="text-base font-bold text-gray-800">群組管理</h2>
        <button
          class="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
          @click="$emit('close')">
          ✕
        </button>
      </div>

      <!-- Scrollable body -->
      <div class="overflow-y-auto px-5 py-4 space-y-5">
        <!-- 群組資訊 -->
        <section>
          <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">群組資訊</p>
          <div class="space-y-3">
            <div>
              <label class="block text-sm text-gray-600 mb-1">群組名稱</label>
              <input v-model="editRoomName" type="text"
                class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                :disabled="updatingInfo" />
            </div>

            <div>
              <label class="mb-2 block text-sm text-gray-600">群組頭像</label>

              <input ref="avatarFileInput" type="file" accept="image/png,image/jpeg,image/webp,image/gif" class="hidden"
                :disabled="updatingInfo" @change="selectAvatarFile" />

              <div v-if="!selectedAvatarFile"
                class="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition"
                :class="isDraggingAvatar ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/50'"
                @click="avatarFileInput?.click()" @dragenter.prevent="isDraggingAvatar = true"
                @dragover.prevent="isDraggingAvatar = true" @dragleave.prevent="isDraggingAvatar = false"
                @drop.prevent="dropAvatarFile">
                <div class="mb-2 text-3xl">🖼️</div>
                <p class="text-sm font-medium text-gray-700">拖曳圖片到這裡，或點擊選擇檔案</p>
                <p class="mt-1 text-xs text-gray-400">JPG、PNG、WebP、GIF，檔案上限 5 MB</p>
                <div v-if="currentAvatarUrl && !removeAvatar" class="mt-4 flex items-center gap-3" @click.stop>
                  <img :src="currentAvatarUrl" alt="目前群組頭像" class="h-10 w-10 rounded-full object-cover" />

                  <div class="min-w-0 flex-1 text-left">
                    <div class="text-xs font-medium text-gray-600">目前群組頭像</div>
                    <div class="text-xs text-gray-400">可更換或刪除</div>
                  </div>

                  <button type="button"
                    class="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                    :disabled="updatingInfo" @click.stop="markAvatarForRemoval">
                    刪除頭像
                  </button>
                </div>

                <div v-else-if="removeAvatar"
                  class="mt-4 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-3 py-2"
                  @click.stop>
                  <span class="text-xs text-amber-700">
                    儲存後將刪除目前群組頭像
                  </span>

                  <button type="button" class="text-xs font-medium text-amber-700 hover:underline"
                    @click.stop="cancelAvatarRemoval">
                    復原
                  </button>
                </div>
              </div>

              <div v-else class="space-y-3">
                <div class="grid gap-4 sm:grid-cols-[minmax(0,1fr)_112px]">
                  <div>
                    <div ref="cropViewport"
                      class="relative mx-auto aspect-square w-full max-w-80 touch-none select-none overflow-hidden rounded-xl bg-gray-900 cursor-grab active:cursor-grabbing"
                      @pointerdown="startAvatarDrag" @pointermove="moveAvatar" @pointerup="endAvatarDrag"
                      @pointercancel="endAvatarDrag" @wheel.prevent="zoomAvatarByWheel">
                      <img v-if="localAvatarPreviewUrl" :src="localAvatarPreviewUrl" alt="群組頭像裁切預覽"
                        class="pointer-events-none absolute left-1/2 top-1/2 max-w-none origin-center"
                        :style="avatarImageStyle" draggable="false" />

                      <div
                        class="pointer-events-none absolute inset-0 rounded-full border-2 border-white/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.48)]">
                      </div>
                      <div class="pointer-events-none absolute inset-1/2 h-px w-full -translate-x-1/2 bg-white/20">
                      </div>
                      <div class="pointer-events-none absolute inset-1/2 h-full w-px -translate-y-1/2 bg-white/20">
                      </div>
                    </div>
                    <p class="mt-2 text-center text-xs text-gray-500">拖曳圖片調整位置，滾輪縮放；圓形範圍為實際顯示安全區。</p>
                  </div>

                  <div class="flex flex-col items-center justify-center gap-2">
                    <div class="text-xs font-medium text-gray-500">圓形預覽</div>
                    <div class="h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-gray-100 shadow">
                      <canvas ref="circlePreviewCanvas" width="192" height="192" class="h-full w-full"></canvas>
                    </div>
                  </div>
                </div>

                <div class="flex items-center gap-3">
                  <span class="text-xs text-gray-500">縮放</span>
                  <input v-model.number="avatarZoom" type="range" min="1" max="3" step="0.01" class="min-w-0 flex-1"
                    @input="handleZoomInput" />
                  <span class="w-10 text-right text-xs text-gray-500">{{ Math.round(avatarZoom * 100) }}%</span>
                </div>

                <div class="flex flex-wrap items-center justify-between gap-2">
                  <span class="max-w-full truncate text-xs text-gray-500">{{ selectedAvatarFile.name }}</span>
                  <div class="flex gap-2">
                    <button type="button" class="rounded-lg border px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
                      @click="avatarFileInput?.click()">更換圖片</button>
                    <button type="button" class="rounded-lg border px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                      @click="clearSelectedAvatarFile">取消圖片</button>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex justify-end">
              <button
                class="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 transition"
                :disabled="updatingInfo || !canSaveInfo" @click="saveGroupInfo">
                {{ updatingInfo ? '儲存中…' : '儲存群組資訊' }}
              </button>
            </div>
          </div>
        </section>

        <!-- 成員管理 -->
        <section>
          <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">成員管理</p>
          <div v-if="loadingMembers" class="py-6 text-center text-sm text-gray-400">載入中…</div>
          <div v-else class="space-y-2">
            <div v-for="member in members" :key="member.userId"
              class="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-2.5">
              <div class="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-sm shrink-0">
                👤
              </div>
              <div class="min-w-0 flex-1">
                <div class="truncate text-sm font-medium text-gray-800">{{ member.name }}</div>
                <div class="truncate text-xs text-gray-400">{{ member.account }}</div>
              </div>
              <span class="rounded-full px-2.5 py-0.5 text-[11px] font-semibold shrink-0" :class="member.role === 'manager'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-gray-100 text-gray-500'
                ">
                {{ member.role === 'manager' ? '管理員' : '成員' }}
              </span>
              <div v-if="member.role !== 'manager'">
                <!-- loading 狀態 -->
                <template v-if="transferringUserId === member.userId">
                  <span class="text-xs text-indigo-500 animate-pulse">轉讓中…</span>
                </template>
                <template v-else-if="removingUserId === member.userId">
                  <span class="text-xs text-red-500 animate-pulse">移除中…</span>
                </template>

                <!-- 確認轉讓 -->
                <template v-else-if="confirmingTransfer === member.userId">
                  <div class="flex flex-col items-end gap-1">
                    <span class="text-xs text-gray-600">轉讓給 <b>{{ member.name }}</b>？</span>
                    <div class="flex gap-1">
                      <button class="px-2 py-1 text-xs rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                        @click="confirmTransfer(member.userId)">
                        確認
                      </button>
                      <button class="px-2 py-1 text-xs rounded-lg bg-gray-200 text-gray-600 hover:bg-gray-300"
                        @click="confirmingTransfer = null">
                        取消
                      </button>
                    </div>
                  </div>
                </template>

                <!-- 確認移除 -->
                <template v-else-if="confirmingRemove === member.userId">
                  <div class="flex flex-col items-end gap-1">
                    <span class="text-xs text-gray-600">移除 <b>{{ member.name }}</b>？</span>
                    <div class="flex gap-1">
                      <button class="px-2 py-1 text-xs rounded-lg bg-red-600 text-white hover:bg-red-700"
                        @click="confirmRemove(member.userId)">
                        確認
                      </button>
                      <button class="px-2 py-1 text-xs rounded-lg bg-gray-200 text-gray-600 hover:bg-gray-300"
                        @click="confirmingRemove = null">
                        取消
                      </button>
                    </div>
                  </div>
                </template>

                <!-- 預設按鈕 -->
                <template v-else>
                  <div class="flex items-center gap-1.5">
                    <button class="px-2.5 py-1 text-xs rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                      @click="confirmingTransfer = member.userId">
                      轉讓
                    </button>
                    <button class="px-2.5 py-1 text-xs rounded-lg bg-red-600 text-white hover:bg-red-700"
                      @click="confirmingRemove = member.userId">
                      移除
                    </button>
                  </div>
                </template>
              </div>
            </div>
            <div v-if="members.length === 0" class="py-4 text-center text-sm text-gray-400">
              尚無成員資料
            </div>
          </div>
        </section>

        <!-- 邀請狀態 -->
        <section>
          <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">邀請狀態</p>
          <div v-if="loadingInvitations" class="py-4 text-center text-sm text-gray-400">
            載入中…
          </div>
          <div v-else-if="invitations.length === 0" class="py-3 text-center text-sm text-gray-400">
            目前無待處理邀請
          </div>
          <div v-else class="space-y-2">
            <div v-for="inv in invitations" :key="inv.invitationId"
              class="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-2.5">
              <div class="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm shrink-0">
                👤
              </div>
              <div class="min-w-0 flex-1 truncate text-sm text-gray-700">
                {{ inv.inviteeAccount }}
              </div>
              <template v-if="inv.status === 'pending'">
                <span
                  class="rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-yellow-100 text-yellow-700 shrink-0">邀請中</span>
              </template>
              <template v-else-if="inv.status === 'rejected'">
                <span
                  class="rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-red-100 text-red-600 shrink-0">已拒絕</span>
                <span v-if="reInvitingInviteeId === inv.inviteeId"
                  class="text-xs text-indigo-500 animate-pulse shrink-0">邀請中…</span>
                <button v-else
                  class="px-2.5 py-1 text-xs rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 shrink-0"
                  @click="emit('re-invite', inv.inviteeAccount)">
                  重新邀請
                </button>
              </template>
            </div>
          </div>
        </section>

        <!-- 刪除聊天室 -->
        <section class="pb-1">
          <div v-if="confirmingDelete" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 space-y-2">
            <p class="text-sm font-semibold text-red-700">⚠️ 確定刪除這個聊天室？</p>
            <p class="text-xs text-red-500">此操作無法復原，所有訊息與成員都會一併移除。</p>
            <div class="flex gap-2 justify-end">
              <button class="px-3 py-1.5 text-xs rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
                @click="confirmingDelete = false">
                取消
              </button>
              <button class="px-3 py-1.5 text-xs rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                :disabled="deletingRoom" @click="confirmDelete">
                {{ deletingRoom ? '刪除中…' : '確認刪除' }}
              </button>
            </div>
          </div>
          <button v-else
            class="w-full px-4 py-2.5 text-sm rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition disabled:opacity-50"
            :disabled="deletingRoom" @click="confirmingDelete = true">
            刪除聊天室
          </button>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import type { ChatInvitation, ChatRoomListItem, ChatRoomMember } from '@/types/chat'
import { resolveChatRoomAvatarUrl } from '@/utils/chatRoomAvatar'

const MAX_AVATAR_SIZE = 5 * 1024 * 1024
const AVATAR_OUTPUT_SIZE = 512

const props = defineProps<{
  room: ChatRoomListItem
  members: ChatRoomMember[]
  loadingMembers: boolean
  updatingInfo: boolean
  deletingRoom: boolean
  removingUserId: string | null
  transferringUserId: string | null
  invitations: ChatInvitation[]
  loadingInvitations: boolean
  reInvitingInviteeId: string | null
}>()

const emit = defineEmits<{
  close: []
  'save-info': [
    payload: {
      roomName: string
      avatarFile: File | null
      removeAvatar: boolean
    },
  ]
  'remove-member': [userId: string]
  'transfer-manager': [userId: string]
  'delete-room': []
  're-invite': [inviteeAccount: string]
}>()

const confirmingTransfer = ref<string | null>(null)
const confirmingRemove = ref<string | null>(null)
const confirmingDelete = ref(false)

function confirmTransfer(userId: string): void {
  confirmingTransfer.value = null
  emit('transfer-manager', userId)
}

function confirmRemove(userId: string): void {
  confirmingRemove.value = null
  emit('remove-member', userId)
}

function confirmDelete(): void {
  emit('delete-room')
}

const editRoomName = ref(props.room.name ?? '')
const avatarFileInput = ref<HTMLInputElement | null>(null)
const cropViewport = ref<HTMLElement | null>(null)
const circlePreviewCanvas = ref<HTMLCanvasElement | null>(null)
const selectedAvatarFile = ref<File | null>(null)
const removeAvatar = ref(false)
const localAvatarPreviewUrl = ref<string | null>(null)
const avatarImage = ref<HTMLImageElement | null>(null)
const avatarZoom = ref(1)
const avatarOffsetX = ref(0)
const avatarOffsetY = ref(0)
const isDraggingAvatar = ref(false)
const activePointerId = ref<number | null>(null)
const dragStartX = ref(0)
const dragStartY = ref(0)
const dragStartOffsetX = ref(0)
const dragStartOffsetY = ref(0)

watch(
  () => props.room,
  (room) => {
    editRoomName.value = room.name ?? ''
    clearSelectedAvatarFile()
  },
  { deep: true },
)

const currentAvatarUrl = computed(() => resolveChatRoomAvatarUrl(props.room.avatarUrl))

const canSaveInfo = computed(() => {
  const roomName = editRoomName.value.trim()
  if (!roomName) return false

  const originalName = props.room.name ?? ''
  return (
    roomName !== originalName ||
    selectedAvatarFile.value !== null ||
    removeAvatar.value
  )
})

const avatarImageStyle = computed(() => {
  const image = avatarImage.value
  const viewport = cropViewport.value
  if (!image || !viewport) return {}

  const baseScale = Math.max(viewport.clientWidth / image.naturalWidth, viewport.clientHeight / image.naturalHeight)
  const renderedWidth = image.naturalWidth * baseScale
  const renderedHeight = image.naturalHeight * baseScale

  return {
    width: `${renderedWidth}px`,
    height: `${renderedHeight}px`,
    transform: `translate(calc(-50% + ${avatarOffsetX.value}px), calc(-50% + ${avatarOffsetY.value}px)) scale(${avatarZoom.value})`,
  }
})

function selectAvatarFile(event: Event): void {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] ?? null
  if (file) void loadAvatarFile(file)
}

function dropAvatarFile(event: DragEvent): void {
  isDraggingAvatar.value = false
  const file = event.dataTransfer?.files?.[0] ?? null
  if (file) void loadAvatarFile(file)
}

async function loadAvatarFile(file: File): Promise<void> {
  if (!file.type.startsWith('image/') || file.size > MAX_AVATAR_SIZE) {
    if (avatarFileInput.value) {
      avatarFileInput.value.value = ''
    }

    return
  }

  clearSelectedAvatarFile()

  removeAvatar.value = false
  selectedAvatarFile.value = file
  localAvatarPreviewUrl.value = URL.createObjectURL(file)

  const image = new Image()
  image.src = localAvatarPreviewUrl.value
  await image.decode()

  avatarImage.value = image
  avatarZoom.value = 1
  avatarOffsetX.value = 0
  avatarOffsetY.value = 0

  await nextTick()

  constrainAvatarPosition()
  renderCirclePreview()
}

function clearSelectedAvatarFile(): void {
  if (localAvatarPreviewUrl.value) URL.revokeObjectURL(localAvatarPreviewUrl.value)

  localAvatarPreviewUrl.value = null
  selectedAvatarFile.value = null
  avatarImage.value = null
  avatarZoom.value = 1
  avatarOffsetX.value = 0
  avatarOffsetY.value = 0
  activePointerId.value = null

  if (avatarFileInput.value) avatarFileInput.value.value = ''
}

function startAvatarDrag(event: PointerEvent): void {
  if (!selectedAvatarFile.value) return
  activePointerId.value = event.pointerId
  dragStartX.value = event.clientX
  dragStartY.value = event.clientY
  dragStartOffsetX.value = avatarOffsetX.value
  dragStartOffsetY.value = avatarOffsetY.value
  cropViewport.value?.setPointerCapture(event.pointerId)
}

function moveAvatar(event: PointerEvent): void {
  if (activePointerId.value !== event.pointerId) return
  avatarOffsetX.value = dragStartOffsetX.value + event.clientX - dragStartX.value
  avatarOffsetY.value = dragStartOffsetY.value + event.clientY - dragStartY.value
  constrainAvatarPosition()
  renderCirclePreview()
}

function endAvatarDrag(event: PointerEvent): void {
  if (activePointerId.value !== event.pointerId) return
  activePointerId.value = null
  cropViewport.value?.releasePointerCapture(event.pointerId)
}

function zoomAvatarByWheel(event: WheelEvent): void {
  const change = event.deltaY > 0 ? -0.08 : 0.08
  avatarZoom.value = Math.min(3, Math.max(1, avatarZoom.value + change))
  constrainAvatarPosition()
  renderCirclePreview()
}

function handleZoomInput(): void {
  constrainAvatarPosition()
  renderCirclePreview()
}

function constrainAvatarPosition(): void {
  const image = avatarImage.value
  const viewport = cropViewport.value
  if (!image || !viewport) return

  const viewportSize = viewport.clientWidth
  const baseScale = Math.max(viewportSize / image.naturalWidth, viewportSize / image.naturalHeight)
  const width = image.naturalWidth * baseScale * avatarZoom.value
  const height = image.naturalHeight * baseScale * avatarZoom.value
  const maxX = Math.max(0, (width - viewportSize) / 2)
  const maxY = Math.max(0, (height - viewportSize) / 2)

  avatarOffsetX.value = Math.min(maxX, Math.max(-maxX, avatarOffsetX.value))
  avatarOffsetY.value = Math.min(maxY, Math.max(-maxY, avatarOffsetY.value))
}

function drawCroppedAvatar(canvas: HTMLCanvasElement): void {
  const image = avatarImage.value
  const viewport = cropViewport.value
  if (!image || !viewport) return

  const context = canvas.getContext('2d')
  if (!context) return

  const outputSize = canvas.width
  const viewportSize = viewport.clientWidth
  const baseScale = Math.max(viewportSize / image.naturalWidth, viewportSize / image.naturalHeight)
  const finalScale = baseScale * avatarZoom.value
  const sourceSize = viewportSize / finalScale
  const sourceX = image.naturalWidth / 2 - avatarOffsetX.value / finalScale - sourceSize / 2
  const sourceY = image.naturalHeight / 2 - avatarOffsetY.value / finalScale - sourceSize / 2

  context.clearRect(0, 0, outputSize, outputSize)
  context.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, outputSize, outputSize)
}

function renderCirclePreview(): void {
  const canvas = circlePreviewCanvas.value
  if (!canvas) return

  const context = canvas.getContext('2d')
  if (!context) return

  context.save()
  context.clearRect(0, 0, canvas.width, canvas.height)
  context.beginPath()
  context.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2, 0, Math.PI * 2)
  context.clip()
  drawCroppedAvatar(canvas)
  context.restore()
}

async function createCroppedAvatarFile(): Promise<File | null> {
  const sourceFile = selectedAvatarFile.value
  if (!sourceFile || !avatarImage.value) return null

  const canvas = document.createElement('canvas')
  canvas.width = AVATAR_OUTPUT_SIZE
  canvas.height = AVATAR_OUTPUT_SIZE
  drawCroppedAvatar(canvas)

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png', 0.92))
  if (!blob) return null

  const baseName = sourceFile.name.replace(/\.[^.]+$/, '') || 'chat-room-avatar'
  return new File([blob], `${baseName}.png`, { type: 'image/png' })
}

async function saveGroupInfo(): Promise<void> {
  emit('save-info', {
    roomName: editRoomName.value.trim(),
    avatarFile: await createCroppedAvatarFile(),
    removeAvatar: removeAvatar.value,
  })
}

function markAvatarForRemoval(): void {
  clearSelectedAvatarFile()
  removeAvatar.value = true
}

function cancelAvatarRemoval(): void {
  removeAvatar.value = false
}

watch(
  () => props.room,
  (room) => {
    editRoomName.value = room.name ?? ''
    removeAvatar.value = false
    clearSelectedAvatarFile()
  },
  { deep: true },
)
onBeforeUnmount(clearSelectedAvatarFile)
</script>
