import { defineStore } from 'pinia'
import { authService } from '~/services/auth'

interface JwtClaims {
  sub?: string
  email?: string
}

function decodeJwtClaims(token: string | null): JwtClaims | null {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  try {
    const payload = parts[1]!.replace(/-/g, '+').replace(/_/g, '/')
    const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4)
    const json = typeof atob === 'function'
      ? atob(padded)
      : Buffer.from(padded, 'base64').toString('utf-8')
    return JSON.parse(json) as JwtClaims
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const token = useCookie<string | null>('auth_token', { default: () => null })
  const role = useState<string | null>('auth_role', () => null)
  const isAuthenticated = computed(() => !!token.value)
  const decodedClaims = computed(() => decodeJwtClaims(token.value))
  const userId = computed(() => decodedClaims.value?.sub ?? null)
  const email = computed(() => decodedClaims.value?.email ?? null)

  async function login(email: string, password: string, redirect?: string) {
    await authService.login(email, password)
    const query: Record<string, string> = { email }
    if (redirect) query.redirect = redirect
    await navigateTo({ path: '/verify-otp', query })
  }

  async function verifyOtp(email: string, otp: string, redirect?: string) {
    const res = await authService.verifyOtp(email, otp)
    token.value = res.access_token
    role.value = res.role
    await navigateTo(redirect || '/properties')
  }

  async function logout() {
    token.value = null
    role.value = null
    await navigateTo('/properties')
  }

  return { token, role, isAuthenticated, userId, email, login, verifyOtp, logout }
})
