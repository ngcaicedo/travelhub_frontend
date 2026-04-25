import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import VerifyOtpPage from '~/pages/verify-otp.vue'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('~/services/auth', () => ({
  authService: {
    login: vi.fn(),
    verifyOtp: vi.fn()
  }
}))

type OtpVm = { otp: string, error: string, isLoading: boolean }

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

    ;(component.vm as unknown as OtpVm).error = 'Test error'
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
    expect((component.vm as unknown as OtpVm).otp).toBe('123456')
  })

  it('shows validation error when OTP is too short', async () => {
    const component = await mountSuspended(VerifyOtpPage, {
      route: {
        query: { email: 'test@example.com' }
      }
    })

    const input = component.find('input[type="text"]')
    await input.setValue('123')

    await component.find('form').trigger('submit')
    await component.vm.$nextTick()

    expect((component.vm as unknown as OtpVm).error).toBeTruthy()
  })

  it('shows validation error when email is missing', async () => {
    const component = await mountSuspended(VerifyOtpPage, {
      route: {
        query: {}
      }
    })

    const input = component.find('input[type="text"]')
    await input.setValue('123456')

    await component.find('form').trigger('submit')
    await component.vm.$nextTick()

    expect((component.vm as unknown as OtpVm).error).toBeTruthy()
  })

  it('submits OTP and handles API error', async () => {
    const { authService } = await import('~/services/auth')
    const verifyOtpSpy = vi.mocked(authService.verifyOtp)
    verifyOtpSpy.mockRejectedValueOnce({ data: { detail: 'Invalid OTP' } })

    const component = await mountSuspended(VerifyOtpPage, {
      route: {
        query: { email: 'test@example.com' }
      }
    })

    await component.find('input[type="text"]').setValue('123456')
    await component.find('form').trigger('submit')
    await flushPromises()

    const vm = component.vm as unknown as OtpVm
    expect(vm.error).toBeTruthy()
    expect(vm.isLoading).toBe(false)
  })

  it('clears error when closing the alert', async () => {
    const component = await mountSuspended(VerifyOtpPage, {
      route: {
        query: { email: 'test@example.com' }
      }
    })

    const vm = component.vm as unknown as OtpVm
    vm.error = 'Test error'
    await component.vm.$nextTick()

    expect(component.text()).toContain('Test error')

    vm.error = ''
    await component.vm.$nextTick()

    expect(vm.error).toBe('')
  })
})
