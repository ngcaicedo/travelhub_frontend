import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useAuthStore } from '~/stores/auth'
import * as authServiceModule from '~/services/auth'

const { navigateToMock } = vi.hoisted(() => ({
  navigateToMock: vi.fn().mockResolvedValue(undefined)
}))

mockNuxtImport('navigateTo', () => navigateToMock)

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    navigateToMock.mockClear()
  })

  it('initializes with empty token and role', () => {
    const store = useAuthStore()
    expect(store.token).toBeNull()
    expect(store.role).toBeNull()
  })

  it('isAuthenticated is false when token is null', () => {
    const store = useAuthStore()
    expect(store.isAuthenticated).toBe(false)
  })

  it('isAuthenticated is true when token is set', () => {
    const store = useAuthStore()
    store.token = 'test-token'
    expect(store.isAuthenticated).toBe(true)
  })

  it('login calls authService with correct parameters', async () => {
    const store = useAuthStore()
    const loginSpy = vi.spyOn(authServiceModule.authService, 'login').mockResolvedValue({ message: 'OTP sent' })

    await store.login('test@example.com', 'password123')

    expect(loginSpy).toHaveBeenCalledWith('test@example.com', 'password123')
    expect(navigateToMock).toHaveBeenCalledWith({ path: '/verify-otp', query: { email: 'test@example.com' } })
  })

  it('logout clears token and role', async () => {
    const store = useAuthStore()
    store.token = 'test-token'
    store.role = 'traveler'

    await store.logout()

    expect(store.token).toBeNull()
    expect(store.role).toBeNull()
    expect(navigateToMock).toHaveBeenCalledWith('/properties')
  })
})
