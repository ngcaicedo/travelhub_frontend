import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useAuthStore } from '~/stores/auth'
import * as authServiceModule from '~/services/auth'

const { navigateToMock } = vi.hoisted(() => ({
  navigateToMock: vi.fn().mockResolvedValue(undefined)
}))

mockNuxtImport('navigateTo', () => navigateToMock)

function fakeJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  const body = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return `${header}.${body}.signature`
}

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

  it('isHotelUser is true for hotel-compatible roles', () => {
    const store = useAuthStore()
    store.token = fakeJwt({ sub: 'h1', role: 'hotel' })
    expect(store.isHotelUser).toBe(true)
  })

  it('decodes email and userId from token claims', () => {
    const store = useAuthStore()
    const payload = Buffer.from(JSON.stringify({ sub: 'user-123', email: 'traveler@example.com' }), 'utf-8').toString('base64')
    store.token = `header.${payload}.signature`

    expect(store.userId).toBe('user-123')
    expect(store.email).toBe('traveler@example.com')
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
    store.token = fakeJwt({ sub: 'u1', role: 'traveler' })
    expect(store.role).toBe('traveler')

    await store.logout()

    expect(store.token).toBeNull()
    expect(store.role).toBeNull()
    expect(navigateToMock).toHaveBeenCalledWith('/properties')
  })

  it('verifyOtp sets token and role and navigates', async () => {
    const store = useAuthStore()
    const travelerToken = fakeJwt({ sub: 'u1', role: 'traveler' })
    const verifySpy = vi.spyOn(authServiceModule.authService, 'verifyOtp').mockResolvedValue({
      access_token: travelerToken,
      token_type: 'bearer',
      role: 'traveler'
    })

    await store.verifyOtp('test@example.com', '123456')

    expect(verifySpy).toHaveBeenCalledWith('test@example.com', '123456')
    expect(store.token).toBe(travelerToken)
    expect(store.role).toBe('traveler')
    expect(navigateToMock).toHaveBeenCalledWith('/properties')
  })

  it('verifyOtp redirects hotel role to /hotel/dashboard by default', async () => {
    const store = useAuthStore()
    const hotelToken = fakeJwt({ sub: 'h1', role: 'hotel' })
    vi.spyOn(authServiceModule.authService, 'verifyOtp').mockResolvedValue({
      access_token: hotelToken,
      token_type: 'bearer',
      role: 'hotel'
    })

    await store.verifyOtp('hotel-a@travelhub.demo', '000000')

    expect(store.role).toBe('hotel')
    expect(navigateToMock).toHaveBeenCalledWith('/hotel/dashboard')
  })

  it('verifyOtp deriva el fallback del claim del JWT, no de res.role', async () => {
    const store = useAuthStore()
    const hotelToken = fakeJwt({ sub: 'h1', role: 'hotel' })
    vi.spyOn(authServiceModule.authService, 'verifyOtp').mockResolvedValue({
      access_token: hotelToken,
      token_type: 'bearer',
      role: 'traveler'
    })

    await store.verifyOtp('hotel@travelhub.demo', '000000')

    expect(navigateToMock).toHaveBeenCalledWith('/hotel/dashboard')
  })

  it('verifyOtp navigates to redirect path when provided', async () => {
    const store = useAuthStore()
    vi.spyOn(authServiceModule.authService, 'verifyOtp').mockResolvedValue({
      access_token: fakeJwt({ sub: 'u1', role: 'traveler' }),
      token_type: 'bearer',
      role: 'traveler'
    })

    await store.verifyOtp('test@example.com', '123456', '/checkout')

    expect(navigateToMock).toHaveBeenCalledWith('/checkout')
  })

  it('login passes redirect to query params when provided', async () => {
    const store = useAuthStore()
    vi.spyOn(authServiceModule.authService, 'login').mockResolvedValue({ message: 'OTP sent' })

    await store.login('test@example.com', 'pass123', '/checkout')

    expect(navigateToMock).toHaveBeenCalledWith({
      path: '/verify-otp',
      query: { email: 'test@example.com', redirect: '/checkout' }
    })
  })
})
