import type { RegisterPayload, UserResponse } from '~/types/api'
import { createUsersClient } from './_client'

export const usersService = {
  register(payload: RegisterPayload) {
    return createUsersClient()<UserResponse>('/api/v1/users', {
      method: 'POST',
      body: payload
    })
  }
}
