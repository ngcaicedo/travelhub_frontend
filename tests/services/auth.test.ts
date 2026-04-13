import { describe, it, expect, vi } from 'vitest'
import { authService } from '~/services/auth'

const mockFetch = vi.fn()

vi.mock('~/services/_client', () => ({
  createSecurityClient: () => mockFetch
}))

describe('authService', () => {
  it('login calls security client with email and password', async () => {
    mockFetch.mockResolvedValue({ message: 'OTP sent' })

    await authService.login('test@example.com', 'pass123')

    expect(mockFetch).toHaveBeenCalledWith('/api/v1/auth/login', {
      method: 'POST',
      body: { email: 'test@example.com', password: 'pass123' }
    })
  })

  it('verifyOtp calls security client with email and otp_code', async () => {
    mockFetch.mockResolvedValue({ access_token: 'tok', role: 'traveler' })

    await authService.verifyOtp('test@example.com', '123456')

    expect(mockFetch).toHaveBeenCalledWith('/api/v1/auth/verify-otp', {
      method: 'POST',
      body: { email: 'test@example.com', otp_code: '123456' }
    })
  })
})
