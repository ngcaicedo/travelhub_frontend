import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useAuthStore } from '~/stores/auth'
import middleware from '~/middleware/hotel-manager'

const { navigateToMock } = vi.hoisted(() => ({
  navigateToMock: vi.fn(),
}))
mockNuxtImport('navigateTo', () => navigateToMock)

type MiddlewareFn = (to: { fullPath: string }, from: object) => unknown

function fakeJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  const body = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return `${header}.${body}.signature`
}

describe('hotel-manager middleware', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    navigateToMock.mockReset().mockReturnValue('navigation')
  })

  it('redirects unauthenticated users to /login with redirect query', () => {
    ;(middleware as MiddlewareFn)({ fullPath: '/hotel/reports/income' }, {})

    expect(navigateToMock).toHaveBeenCalledWith({
      path: '/login',
      query: { redirect: '/hotel/reports/income' },
    })
  })

  it('redirects basic hotel role to /hotel/dashboard', () => {
    const store = useAuthStore()
    store.token = fakeJwt({ sub: 'h1', role: 'hotel' })

    ;(middleware as MiddlewareFn)({ fullPath: '/hotel/reports/income' }, {})

    expect(navigateToMock).toHaveBeenCalledWith('/hotel/dashboard')
  })

  it('redirects traveler role to /hotel/dashboard', () => {
    const store = useAuthStore()
    store.token = fakeJwt({ sub: 'u1', role: 'traveler' })

    ;(middleware as MiddlewareFn)({ fullPath: '/hotel/reports/income' }, {})

    expect(navigateToMock).toHaveBeenCalledWith('/hotel/dashboard')
  })

  it('allows hotel_admin role through', () => {
    const store = useAuthStore()
    store.token = fakeJwt({ sub: 'a1', role: 'hotel_admin' })

    const result = (middleware as MiddlewareFn)({ fullPath: '/hotel/reports/income' }, {})

    expect(navigateToMock).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
  })

  it('allows hotel_manager role through', () => {
    const store = useAuthStore()
    store.token = fakeJwt({ sub: 'm1', role: 'hotel_manager' })

    const result = (middleware as MiddlewareFn)({ fullPath: '/hotel/reports/income' }, {})

    expect(navigateToMock).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
  })
})
