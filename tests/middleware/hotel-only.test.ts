import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useAuthStore } from '~/stores/auth'
import middleware from '~/middleware/hotel-only'

const { navigateToMock } = vi.hoisted(() => ({
  navigateToMock: vi.fn(),
}))
mockNuxtImport('navigateTo', () => navigateToMock)

type MiddlewareFn = (to: { fullPath: string }, from: object) => unknown

describe('hotel-only middleware', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    navigateToMock.mockReset().mockReturnValue('navigation')
  })

  it('redirects unauthenticated users to /login with redirect query', () => {
    ;(middleware as MiddlewareFn)({ fullPath: '/hotel/dashboard' }, {})

    expect(navigateToMock).toHaveBeenCalledWith({
      path: '/login',
      query: { redirect: '/hotel/dashboard' },
    })
  })

  it('redirects authenticated travelers to /properties', () => {
    const store = useAuthStore()
    store.token = 'jwt-token'
    store.role = 'traveler'

    ;(middleware as MiddlewareFn)({ fullPath: '/hotel/dashboard' }, {})

    expect(navigateToMock).toHaveBeenCalledWith('/properties')
  })

  it('allows hotel role through', () => {
    const store = useAuthStore()
    store.token = 'jwt-token'
    store.role = 'hotel'

    const result = (middleware as MiddlewareFn)({ fullPath: '/hotel/dashboard' }, {})

    expect(navigateToMock).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
  })
})
