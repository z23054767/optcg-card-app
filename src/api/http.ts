import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import router from '@/router'
import { useAuthStore } from '@/stores/authStore'

type RetryableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean }

type RefreshResponse = { success: boolean; token: string }

type ApiErrorResponse = {
  success: false
  code?: string
  error?: string
}

export const http = axios.create({
  baseURL: (import.meta.env.VITE_API_FULL_URL || import.meta.env.VITE_API_BASE_URL).replace(
    /\/$/,
    '',
  ),
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
  withCredentials: true,
})

const refreshHttp = axios.create({
  baseURL: (import.meta.env.VITE_API_FULL_URL || import.meta.env.VITE_API_BASE_URL).replace(
    /\/$/,
    '',
  ),
  timeout: 10000,
  withCredentials: true,
})

let refreshPromise: Promise<string> | null = null

export async function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = refreshHttp
      .post<RefreshResponse>('/auth/refresh')
      .then(({ data }) => {
        const auth = useAuthStore()
        auth.setAccessToken(data.token)
        return data.token
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

async function redirectToLogin(): Promise<void> {
  const auth = useAuthStore()
  const currentRoute = router.currentRoute.value
  auth.logout()

  if (currentRoute.path !== '/login') {
    await router.replace({
      path: '/login',
      query: { redirect: currentRoute.fullPath, reason: 'expired' },
    })
  }
}

http.interceptors.request.use((config) => {
  const auth = useAuthStore()

  if (config.data instanceof FormData) delete config.headers['Content-Type']
  if (auth.token) config.headers.Authorization = `Bearer ${auth.token}`

  return config
})

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryableRequestConfig | undefined

    const responseData = error.response?.data as ApiErrorResponse | undefined
    const shouldRefresh =
      error.response?.status === 401 &&
      responseData?.code === 'AUTH_TOKEN_EXPIRED' &&
      Boolean(config) &&
      !config?._retry

    if (!shouldRefresh || !config) {
      return Promise.reject(error)
    }

    config._retry = true

    try {
      const token = await refreshAccessToken()
      config.headers.Authorization = `Bearer ${token}`
      return http(config)
    } catch (refreshError) {
      await redirectToLogin()
      return Promise.reject(refreshError)
    }
  },
)
