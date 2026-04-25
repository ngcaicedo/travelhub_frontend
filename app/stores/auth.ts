import { defineStore } from 'pinia'
import { authService } from '~/services/auth'

function decodeJwtSub(token: string | null): string | null {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  try {
    const payload = parts[1]!.replace(/-/g, '+').replace(/_/g, '/')
    const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4)
    const json = typeof atob === 'function'
      ? atob(padded)
      : Buffer.from(padded, 'base64').toString('utf-8')
    const claims = JSON.parse(json) as { sub?: string }
    return claims.sub ?? null
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const token = useCookie<string | null>('auth_token', { default: () => null })
  const role = useState<string | null>('auth_role', () => null)
  const isAuthenticated = computed(() => !!token.value)
  const userId = computed(() => decodeJwtSub(token.value))

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
    const fallback = res.role === 'hotel' ? '/hotel/dashboard' : '/properties'
    await navigateTo(redirect || fallback)
  }

  async function logout() {
    token.value = null
    role.value = null
    await navigateTo('/properties')
  }

  return { token, role, isAuthenticated, userId, login, verifyOtp, logout }
})
