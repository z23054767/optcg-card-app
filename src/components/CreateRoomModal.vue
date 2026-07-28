<template>
  <div class="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4" @click.self="emit('close')">
    <div class="w-full max-w-md rounded-xl bg-white shadow-lg">
      <div class="flex items-center justify-between border-b px-5 py-4">
        <h2 class="text-base font-semibold text-gray-800">
          建立群組聊天室
        </h2>

        <button type="button"
          class="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          @click="emit('close')">
          ✕
        </button>
      </div>

      <div class="p-5">
        <div>
          <label class="mb-1 block text-sm text-gray-600">
            群組名稱
          </label>

          <input v-model="roomName" type="text" class="w-full rounded-lg border px-3 py-2 text-sm"
            placeholder="例如：OPTCG 交流群組" :disabled="props.loading" />
        </div>

        <div class="mt-5 flex justify-end gap-2">
          <button class="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50" :disabled="props.loading"
            @click="emit('close')">
            取消
          </button>

          <button class="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white disabled:opacity-50"
            :disabled="!canCreate || props.loading" @click="handleCreate">
            {{ props.loading ? '建立中...' : '建立聊天室' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

const props = defineProps<{
  loading: boolean
}>()

const emit = defineEmits<{
  close: []
  create: [
    payload: {
      roomName: string
    },
  ]
}>()

const roomName = ref('')

const canCreate = computed(() => {
  return roomName.value.trim().length > 0
})

function handleCreate(): void {
  if (!canCreate.value || props.loading) {
    return
  }

  emit('create', {
    roomName: roomName.value.trim(),
  })
}
</script>
