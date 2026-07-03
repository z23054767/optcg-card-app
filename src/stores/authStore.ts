import { defineStore } from "pinia"

type AuthUser = {
  userId: string
  name: string
  account: string
}

function parseJwt(token: string): AuthUser {
  const parts = token.split(".")
  if (parts.length !== 3) {
    throw new Error("Invalid JWT format")
  }

  const payloadPart = parts[1]
  if (!payloadPart) {
    throw new Error("Invalid JWT format")
  }

  // JWT 是 base64url，要先轉成 base64
  const base64 = payloadPart
    .replace(/-/g, "+")
    .replace(/_/g, "/")

  const binary = atob(base64)
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  const json = new TextDecoder("utf-8").decode(bytes)
  const payload = JSON.parse(json)

  return {
    userId: String(payload.userId),
    name: payload.name,
    account: payload.account
  }
}


export const useAuthStore = defineStore("auth", {
  state: () => {
    const token = localStorage.getItem("token") ?? ""

    return {
      token,
      user: token ? parseJwt(token) : null as AuthUser | null
    }
  },

  getters: {
    isAuthenticated: (state) => !!state.token && !!state.user,
    userId: (state) => state.user?.userId ?? "",
    userName: (state) => state.user?.name ?? ""
  },

  actions: {
    login(token: string) {
      this.token = token
      this.user = parseJwt(token)

      localStorage.setItem("token", token)
    },

    logout() {
      this.token = ""
      this.user = null

      localStorage.removeItem("token")
    }
  }
})
