import { defineStore } from 'pinia'

export type AuthUser = {
  userId: string
  name: string
  account: string
  avatarUrl?: string | null
  bio?: string | null
}

function parseJwt(token: string): AuthUser {
  const parts = token.split('.')
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format')
  }

  const payloadPart = parts[1]
  if (!payloadPart) {
    throw new Error('Invalid JWT format')
  }

  // JWT 是 base64url，要先轉成 base64
  const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/')

  const binary = atob(base64)
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  const json = new TextDecoder('utf-8').decode(bytes)
  const payload = JSON.parse(json)

  return {
    userId: String(payload.userId),
    name: payload.name,
    account: payload.account,
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => {
    const token = localStorage.getItem('token') ?? ''
    let user: AuthUser | null = null

    try {
      user = token ? parseJwt(token) : null
    } catch {
      localStorage.removeItem('token')
    }

    return { token: user ? token : '', user }
  },

  getters: {
    isAuthenticated: (state) => !!state.token && !!state.user,
    userId: (state) => state.user?.userId ?? '',
    userName: (state) => state.user?.name ?? '',
  },

  actions: {
    setAccessToken(token: string) {
      this.token = token
      this.user = parseJwt(token)

      localStorage.setItem('token', token)
    },

    login(token: string) {
      this.setAccessToken(token)
    },

    updateProfile(profile: { name: string; avatarUrl: string | null; bio: string | null }) {
      if (!this.user) return
      this.user = { ...this.user, ...profile }
    },

    logout() {
      this.token = ''
      this.user = null

      localStorage.removeItem('token')
    },
  },
})
