import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import VerifyOtpPage from '~/pages/verify-otp.vue'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('~/services/auth', () => ({
  authService: {
    login: vi.fn(),
    verifyOtp: vi.fn()
  }
}))

describe('verify-otp page', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders OTP input field', async () => {
    const component = await mountSuspended(VerifyOtpPage, {
      route: {
        query: { email: 'test@example.com' }
      }
    })
    expect(component.find('input').exists()).toBe(true)
  })

  it('displays error message when error occurs', async () => {
    const component = await mountSuspended(VerifyOtpPage, {
      route: {
        query: { email: 'test@example.com' }
      }
    })

    await component.vm.$nextTick()

    component.vm.error = 'Test error'
    await component.vm.$nextTick()

    expect(component.text()).toContain('Test error')
  })

  it('clears OTP input after successful verification', async () => {
    const component = await mountSuspended(VerifyOtpPage, {
      route: {
        query: { email: 'test@example.com' }
      }
    })

    const input = component.find('input[type="text"]')
    await input.setValue('123456')
    expect(component.vm.otp).toBe('123456')
  })
})
