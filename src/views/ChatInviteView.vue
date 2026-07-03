<template>
    <div class="h-screen flex items-center justify-center bg-gray-100">
        <div class="bg-white p-6 rounded shadow text-center">
            <p>{{ message }}</p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue"
import { useRoute, useRouter } from "vue-router"
import { http } from "@/api/http"
import { useAuthStore } from "@/stores/authStore"

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const message = ref("正在加入聊天室...")

onMounted(async () => {
    const token = String(route.query.token ?? "")

    if (!token) {
        message.value = "邀請連結無效"
        return
    }

    if (!auth.isAuthenticated) {
        await router.push(`/login?redirect=${encodeURIComponent(route.fullPath)}`)
        return
    }

    const { data } = await http.post(
        "/chat/invitations/accept",
        { token },
        {
            headers: {
                Authorization: `Bearer ${auth.token}`,
            },
        }
    )

    const roomId = data.roomId
    await router.push(`/chat?roomId=${encodeURIComponent(roomId)}`)
})
</script>