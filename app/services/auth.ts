import type { LoginResponse, TokenResponse } from '~/types/api'
import { createSecurityClient } from './_client'

export const authService = {
  login(email: string, password: string) {
    return createSecurityClient()<LoginResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: { email, password }
    })
  },

  verifyOtp(email: string, otp_code: string) {
    return createSecurityClient()<TokenResponse>('/api/v1/auth/verify-otp', {
      method: 'POST',
      body: { email, otp_code }
    })
  }
}
