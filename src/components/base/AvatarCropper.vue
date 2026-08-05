<template>
  <div>
    <input
      ref="avatarFileInput"
      type="file"
      accept="image/png,image/jpeg,image/webp,image/gif"
      class="hidden"
      :disabled="disabled"
      @change="selectAvatarFile"
    />

    <div
      v-if="!selectedAvatarFile"
      class="flex min-h-40 flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition"
      :class="[
        disabled ? 'cursor-not-allowed border-gray-200 bg-gray-50 opacity-60' : 'cursor-pointer',
        !disabled && isDraggingAvatar
          ? 'border-blue-500 bg-blue-50'
          : !disabled
            ? 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/50'
            : '',
      ]"
      @click="openFileSelector"
      @dragenter.prevent="handleDragEnter"
      @dragover.prevent="handleDragOver"
      @dragleave.prevent="handleDragLeave"
      @drop.prevent="dropAvatarFile"
    >
      <div class="mb-2 text-3xl">🖼️</div>

      <p class="text-sm font-medium text-gray-700">拖曳圖片到這裡，或點擊選擇檔案</p>

      <p class="mt-1 text-xs text-gray-400">JPG、PNG、WebP、GIF，檔案上限 5 MB</p>

      <div
        v-if="currentAvatarUrl && !removeAvatar"
        class="mt-4 flex items-center gap-3"
        @click.stop
      >
        <img
          :src="currentAvatarUrl"
          :alt="currentAvatarAlt"
          class="h-10 w-10 rounded-full object-cover"
        />

        <div class="min-w-0 flex-1 text-left">
          <div class="text-xs font-medium text-gray-600">
            {{ currentAvatarLabel }}
          </div>

          <div class="text-xs text-gray-400">可更換或刪除</div>
        </div>

        <button
          type="button"
          class="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="disabled"
          @click.stop="markAvatarForRemoval"
        >
          刪除頭像
        </button>
      </div>

      <div
        v-else-if="removeAvatar"
        class="mt-4 flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2"
        @click.stop
      >
        <span class="text-xs text-amber-700"> 儲存後將刪除目前頭像 </span>

        <button
          type="button"
          class="shrink-0 text-xs font-medium text-amber-700 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="disabled"
          @click.stop="cancelAvatarRemoval"
        >
          復原
        </button>
      </div>
    </div>

    <div v-else class="space-y-3">
      <div class="grid gap-4 sm:grid-cols-[minmax(0,1fr)_112px]">
        <div>
          <div
            ref="cropViewport"
            class="relative mx-auto aspect-square w-full max-w-80 touch-none select-none overflow-hidden rounded-xl bg-gray-900"
            :class="
              disabled ? 'cursor-not-allowed opacity-60' : 'cursor-grab active:cursor-grabbing'
            "
            @pointerdown="startAvatarDrag"
            @pointermove="moveAvatar"
            @pointerup="endAvatarDrag"
            @pointercancel="endAvatarDrag"
            @wheel.prevent="zoomAvatarByWheel"
          >
            <img
              v-if="localAvatarPreviewUrl"
              :src="localAvatarPreviewUrl"
              alt="頭像裁切預覽"
              class="pointer-events-none absolute left-1/2 top-1/2 max-w-none origin-center"
              :style="avatarImageStyle"
              draggable="false"
            />

            <div
              class="pointer-events-none absolute inset-0 rounded-full border-2 border-white/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.48)]"
            />

            <div
              class="pointer-events-none absolute inset-1/2 h-px w-full -translate-x-1/2 bg-white/20"
            />

            <div
              class="pointer-events-none absolute inset-1/2 h-full w-px -translate-y-1/2 bg-white/20"
            />
          </div>

          <p class="mt-2 text-center text-xs text-gray-500">
            拖曳圖片調整位置，滾輪縮放；圓形範圍為實際顯示安全區。
          </p>
        </div>

        <div class="flex flex-col items-center justify-center gap-2">
          <div class="text-xs font-medium text-gray-500">圓形預覽</div>

          <div
            class="h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-gray-100 shadow"
          >
            <canvas ref="circlePreviewCanvas" width="192" height="192" class="h-full w-full" />
          </div>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <span class="text-xs text-gray-500"> 縮放 </span>

        <input
          v-model.number="avatarZoom"
          type="range"
          min="1"
          max="3"
          step="0.01"
          class="min-w-0 flex-1"
          :disabled="disabled"
          @input="handleZoomInput"
        />

        <span class="w-10 text-right text-xs text-gray-500">
          {{ Math.round(avatarZoom * 100) }}%
        </span>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-2">
        <span class="max-w-full truncate text-xs text-gray-500">
          {{ selectedAvatarFile.name }}
        </span>

        <div class="flex gap-2">
          <button
            type="button"
            class="rounded-lg border px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="disabled"
            @click="openFileSelector"
          >
            更換圖片
          </button>

          <button
            type="button"
            class="rounded-lg border px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="disabled"
            @click="clearSelectedAvatarFile"
          >
            取消圖片
          </button>
        </div>
      </div>

      <p v-if="errorMessage" class="text-sm text-red-600">
        {{ errorMessage }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch, type CSSProperties } from 'vue'
import type { AvatarCropperExpose } from '@/components/base/avatarCropper'

const DEFAULT_MAX_FILE_SIZE = 5 * 1024 * 1024
const DEFAULT_OUTPUT_SIZE = 512
const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']

const props = withDefaults(
  defineProps<{
    currentAvatarUrl?: string | null
    currentAvatarLabel?: string
    currentAvatarAlt?: string
    outputFileName?: string
    outputSize?: number
    maxFileSize?: number
    disabled?: boolean
    removeAvatar?: boolean
  }>(),
  {
    currentAvatarUrl: null,
    currentAvatarLabel: '目前頭像',
    currentAvatarAlt: '目前頭像',
    outputFileName: 'avatar',
    outputSize: DEFAULT_OUTPUT_SIZE,
    maxFileSize: DEFAULT_MAX_FILE_SIZE,
    disabled: false,
    removeAvatar: false,
  },
)

const emit = defineEmits<{
  'update:removeAvatar': [value: boolean]
  'selection-change': [hasSelectedFile: boolean]
  error: [message: string]
}>()

const avatarFileInput = ref<HTMLInputElement | null>(null)
const cropViewport = ref<HTMLElement | null>(null)
const circlePreviewCanvas = ref<HTMLCanvasElement | null>(null)

const selectedAvatarFile = ref<File | null>(null)
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

const errorMessage = ref('')

const avatarImageStyle = computed<CSSProperties>(() => {
  const image = avatarImage.value
  const viewport = cropViewport.value

  if (!image || !viewport) {
    return {}
  }

  const baseScale = Math.max(
    viewport.clientWidth / image.naturalWidth,
    viewport.clientHeight / image.naturalHeight,
  )

  const renderedWidth = image.naturalWidth * baseScale
  const renderedHeight = image.naturalHeight * baseScale

  return {
    width: `${renderedWidth}px`,
    height: `${renderedHeight}px`,
    transform: `translate(calc(-50% + ${avatarOffsetX.value}px), calc(-50% + ${avatarOffsetY.value}px)) scale(${avatarZoom.value})`,
  }
})

function openFileSelector(): void {
  if (props.disabled) {
    return
  }

  avatarFileInput.value?.click()
}

function handleDragEnter(): void {
  if (props.disabled) {
    return
  }

  isDraggingAvatar.value = true
}

function handleDragOver(): void {
  if (props.disabled) {
    return
  }

  isDraggingAvatar.value = true
}

function handleDragLeave(): void {
  isDraggingAvatar.value = false
}

function selectAvatarFile(event: Event): void {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] ?? null

  if (!file) {
    return
  }

  void loadAvatarFile(file)
}

function dropAvatarFile(event: DragEvent): void {
  isDraggingAvatar.value = false

  if (props.disabled) {
    return
  }

  const file = event.dataTransfer?.files?.[0] ?? null

  if (!file) {
    return
  }

  void loadAvatarFile(file)
}

async function loadAvatarFile(file: File): Promise<void> {
  errorMessage.value = ''

  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    setErrorMessage('僅支援 JPG、PNG、WebP、GIF 圖片格式')
    resetFileInput()
    return
  }

  if (file.size > props.maxFileSize) {
    setErrorMessage('圖片檔案不可超過 5 MB')
    resetFileInput()
    return
  }

  clearSelectedAvatarFile()

  emit('update:removeAvatar', false)

  selectedAvatarFile.value = file
  localAvatarPreviewUrl.value = URL.createObjectURL(file)

  try {
    const image = new Image()
    image.src = localAvatarPreviewUrl.value

    await image.decode()

    avatarImage.value = image
    avatarZoom.value = 1
    avatarOffsetX.value = 0
    avatarOffsetY.value = 0

    emit('selection-change', true)

    await nextTick()

    constrainAvatarPosition()
    renderCirclePreview()
  } catch {
    setErrorMessage('無法讀取圖片，請重新選擇其他圖片')
    clearSelectedAvatarFile()
  }
}

function clearSelectedAvatarFile(): void {
  if (localAvatarPreviewUrl.value) {
    URL.revokeObjectURL(localAvatarPreviewUrl.value)
  }

  localAvatarPreviewUrl.value = null
  selectedAvatarFile.value = null
  avatarImage.value = null

  avatarZoom.value = 1
  avatarOffsetX.value = 0
  avatarOffsetY.value = 0

  activePointerId.value = null
  isDraggingAvatar.value = false

  resetFileInput()
  emit('selection-change', false)
}

function resetFileInput(): void {
  if (avatarFileInput.value) {
    avatarFileInput.value.value = ''
  }
}

function startAvatarDrag(event: PointerEvent): void {
  if (props.disabled || !selectedAvatarFile.value) {
    return
  }

  activePointerId.value = event.pointerId

  dragStartX.value = event.clientX
  dragStartY.value = event.clientY

  dragStartOffsetX.value = avatarOffsetX.value
  dragStartOffsetY.value = avatarOffsetY.value

  cropViewport.value?.setPointerCapture(event.pointerId)
}

function moveAvatar(event: PointerEvent): void {
  if (props.disabled || activePointerId.value !== event.pointerId) {
    return
  }

  avatarOffsetX.value = dragStartOffsetX.value + event.clientX - dragStartX.value

  avatarOffsetY.value = dragStartOffsetY.value + event.clientY - dragStartY.value

  constrainAvatarPosition()
  renderCirclePreview()
}

function endAvatarDrag(event: PointerEvent): void {
  if (activePointerId.value !== event.pointerId) {
    return
  }

  activePointerId.value = null

  if (cropViewport.value?.hasPointerCapture(event.pointerId)) {
    cropViewport.value.releasePointerCapture(event.pointerId)
  }
}

function zoomAvatarByWheel(event: WheelEvent): void {
  if (props.disabled || !selectedAvatarFile.value) {
    return
  }

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

  if (!image || !viewport) {
    return
  }

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

  if (!image || !viewport) {
    return
  }

  const context = canvas.getContext('2d')

  if (!context) {
    return
  }

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

  if (!canvas) {
    return
  }

  const context = canvas.getContext('2d')

  if (!context) {
    return
  }

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

  if (!sourceFile || !avatarImage.value) {
    return null
  }

  const canvas = document.createElement('canvas')

  canvas.width = props.outputSize
  canvas.height = props.outputSize

  drawCroppedAvatar(canvas)

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/png', 0.92)
  })

  if (!blob) {
    setErrorMessage('無法產生裁切後的圖片')
    return null
  }

  const baseName = sourceFile.name.replace(/\.[^.]+$/, '') || props.outputFileName

  return new File([blob], `${baseName}.png`, {
    type: 'image/png',
  })
}

function markAvatarForRemoval(): void {
  clearSelectedAvatarFile()
  emit('update:removeAvatar', true)
}

function cancelAvatarRemoval(): void {
  emit('update:removeAvatar', false)
}

function setErrorMessage(message: string): void {
  errorMessage.value = message
  emit('error', message)
}

function reset(): void {
  errorMessage.value = ''
  clearSelectedAvatarFile()
}

watch(
  () => props.currentAvatarUrl,
  () => {
    errorMessage.value = ''
  },
)

onBeforeUnmount(() => {
  if (localAvatarPreviewUrl.value) {
    URL.revokeObjectURL(localAvatarPreviewUrl.value)
  }
})

defineExpose<AvatarCropperExpose>({
  createCroppedAvatarFile,
  reset,
})
</script>
