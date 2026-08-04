<template>
  <div class="min-h-screen bg-gray-100 px-4 py-6 sm:flex sm:items-center sm:justify-center">
    <div class="mx-auto w-full max-w-md rounded-xl bg-white p-6 text-center shadow-lg sm:p-8">
      <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
        <FontAwesomeIcon icon="circle-check" class="text-3xl" />
      </div>

      <h1 class="text-2xl font-bold text-gray-800">
        Email 驗證成功
      </h1>

      <p class="mt-3 text-sm text-gray-600">
        帳號已完成驗證，將自動前往登入頁面。
      </p>

      <p class="mt-4 text-xs text-gray-400">
        {{ countdown }} 秒後跳轉
      </p>

      <button
        type="button"
        class="mt-6 w-full rounded-lg bg-blue-600 py-2 font-semibold text-white transition hover:bg-blue-700"
        @click="goLoginNow"
      >
        立即前往登入
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

const router = useRouter()
const auth = useAuthStore()
const countdown = ref(3)
let timer: number | undefined

async function goLoginNow() {
  const target = auth.isAuthenticated ? '/chat' : '/login'
  await router.replace(target)
}

onMounted(() => {
  if (auth.isAuthenticated) {
    void router.replace('/chat')
    return
  }

  timer = window.setInterval(() => {
    if (countdown.value <= 1) {
      if (timer) {
        window.clearInterval(timer)
      }

      void goLoginNow()
      return
    }

    countdown.value -= 1
  }, 1000)
})

onBeforeUnmount(() => {
  if (timer) {
    window.clearInterval(timer)
  }
})
</script>
