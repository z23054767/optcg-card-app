import { http } from "@/api/http"

export interface LoginRequest {
  account: string
  password: string
}

export interface LoginResponse {
  success: boolean
  token: string
}

export async function loginApi(
  input: LoginRequest
): Promise<LoginResponse> {
  const { data } = await http.post<LoginResponse>(
    "/auth/login",
    input
  )

  return data
}
