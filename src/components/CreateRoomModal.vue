<template>
  <div class="fixed inset-0 z-30 bg-black/40 flex items-center justify-center">
    <div class="bg-white rounded-lg shadow-lg w-96 p-4">
      <h2 class="font-semibold mb-3">建立群組聊天室</h2>

      <div class="space-y-3">
        <div>
          <label class="block text-sm text-gray-600 mb-1">群組名稱</label>
          <input v-model="roomName" type="text" class="w-full border rounded px-3 py-2 text-sm"
            placeholder="例如：OPTCG 交流群組" :disabled="props.loading" />
        </div>

      </div>

      <div class="flex justify-end gap-2 mt-4">
        <button class="px-3 py-1 text-sm border rounded disabled:opacity-50" :disabled="props.loading"
          @click="emit('close')">
          取消
        </button>

        <button class="px-3 py-1 text-sm rounded bg-blue-600 text-white disabled:opacity-50"
          :disabled="!canCreate || props.loading" @click="handleCreate">
          {{ props.loading ? '建立中...' : '建立聊天室' }}
        </button>
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
