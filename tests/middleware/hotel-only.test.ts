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

function fakeJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  const body = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return `${header}.${body}.signature`
}

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
    store.token = fakeJwt({ sub: 'u1', role: 'traveler' })

    ;(middleware as MiddlewareFn)({ fullPath: '/hotel/dashboard' }, {})

    expect(navigateToMock).toHaveBeenCalledWith('/properties')
  })

  it('allows hotel role through', () => {
    const store = useAuthStore()
    store.token = fakeJwt({ sub: 'h1', role: 'hotel' })

    const result = (middleware as MiddlewareFn)({ fullPath: '/hotel/dashboard' }, {})

    expect(navigateToMock).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
  })
})
