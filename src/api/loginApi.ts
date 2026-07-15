import { http } from '@/api/http'

/**
 * 登入請求
 */
export interface LoginRequest {
  /** 帳號 */
  account: string

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
