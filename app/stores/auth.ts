import { defineStore } from 'pinia'
import { authService } from '~/services/auth'

export const useAuthStore = defineStore('auth', () => {
  const token = useCookie<string | null>('auth_token', { default: () => null })
  const role = useState<string | null>('auth_role', () => null)
  const isAuthenticated = computed(() => !!token.value)

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

  return { token, role, isAuthenticated, login, verifyOtp, logout }
})
