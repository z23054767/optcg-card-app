<template>
  <div class="flex h-screen items-center justify-center bg-gray-100">
    <div class="rounded bg-white p-6 text-center shadow">
      <p>{{ message }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { acceptChatInvitationApi } from '@/api/chatApi'
import { useAuthStore } from '@/stores/authStore'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const message = ref('正在加入聊天室...')

/**
 * 接受聊天室邀請並導向聊天室頁面
 */
const acceptInvitation = async () => {
  const invitationId = String(route.query.id ?? '').trim()

  if (!invitationId) {
    message.value = '邀請連結無效'
    return
  }

  if (!auth.isAuthenticated) {
    await router.push({
      path: '/login',
      query: {
        redirect: route.fullPath,
      },
    })

    return
  }

  try {
    const response = await acceptChatInvitationApi(invitationId)

    await router.push({
      path: '/chat',
      query: {
        roomId: response.roomId,
      },
    })
  } catch {
    message.value = '加入聊天室失敗，邀請可能已失效或已被處理。'
  }
}

onMounted(acceptInvitation)
</script>
