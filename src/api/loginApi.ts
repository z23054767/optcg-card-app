import { http } from '@/api/http'

export type OAuthProvider = 'google' | 'microsoft' | 'line' | 'discord'

/**
 * 登入請求
 */
export interface LoginRequest {
  /** 帳號 */
  name: string

  /** 密碼 */
  password: string
}

/**
 * 登入回應
 */
export interface LoginResponse {
  /** 是否登入成功 */
  success: boolean

  /** JWT Token */
  token: string
}

/**
 * 使用帳號密碼登入
 *
 * @param input 登入資訊
 * @returns 登入結果
 */
export async function loginApi(input: LoginRequest): Promise<LoginResponse> {
  const { data } = await http.post<LoginResponse>('/auth/login', input)

  return data
}

/** 登出並撤銷 Refresh Token。 */
export async function logoutApi(): Promise<void> {
  await http.post('/auth/logout')
}

export function buildOAuthLoginUrl(provider: OAuthProvider, redirect: string): string {
  const apiBaseUrl = (
    import.meta.env.VITE_API_FULL_URL || import.meta.env.VITE_API_BASE_URL
  ).replace(/\/$/, '')
  const url = new URL(`${apiBaseUrl}/auth/oauth/${provider}/start`, window.location.origin)
  url.searchParams.set('redirect', redirect)

  return url.toString()
}

/** 註冊請求 */
export interface RegisterRequest {
  name: string
  displayName?: string
  email: string
  password: string
}

/** 建立本機帳號並寄送驗證信。 */
export async function registerApi(input: RegisterRequest): Promise<void> {
  await http.post('/auth/register', input)
}

/** 寄送密碼重設信。 */
export async function forgotPasswordApi(email: string): Promise<void> {
  await http.post('/auth/forgot-password', { email })
}

/** 使用重設密碼權杖更新密碼。 */
export async function resetPasswordApi(token: string, newPassword: string): Promise<void> {
  await http.post('/auth/reset-password', { token, newPassword })
}

export async function checkNameAvailabilityApi(name: string): Promise<boolean> {
  const { data } = await http.get<{ success: boolean; available: boolean }>(
    '/auth/name-availability',
    { params: { name } },
  )
  return data.available
}
