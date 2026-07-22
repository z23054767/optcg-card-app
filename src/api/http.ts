import axios from 'axios'
import router from '@/router'

import { useAuthStore } from '@/stores/authStore'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

http.interceptors.request.use((config) => {
  const auth = useAuthStore()

  if (auth.token) {
    config.headers.Authorization = `Bearer ${auth.token}`
  }

  return config
})

http.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error) || error.response?.status !== 401) {
      return Promise.reject(error)
    }

    const auth = useAuthStore()
    const currentRoute = router.currentRoute.value

    auth.logout()

    if (currentRoute.path !== '/login') {
      await router.replace({
        path: '/login',
        query: {
          redirect: currentRoute.fullPath,
          reason: 'expired',
        },
      })
    }

    return Promise.reject(error)
  },
)
