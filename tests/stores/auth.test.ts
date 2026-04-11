import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '~/stores/auth'
import * as authServiceModule from '~/services/auth'

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
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

    try {
      await store.login('test@example.com', 'password123')
    } catch {
      // navigateTo throws in test environment, which is expected
    }

    expect(loginSpy).toHaveBeenCalledWith('test@example.com', 'password123')
  })

  it('logout clears token and role', async () => {
    const store = useAuthStore()
    store.token = 'test-token'
    store.role = 'traveler'

    try {
      await store.logout()
    } catch {
      // navigateTo throws in test environment, which is expected
    }

    expect(store.token).toBeNull()
    expect(store.role).toBeNull()
  })
})
