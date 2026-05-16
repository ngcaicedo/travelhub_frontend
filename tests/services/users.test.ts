import { describe, it, expect, vi } from 'vitest'
import { usersService } from '~/services/users'

const mockFetch = vi.fn()

vi.mock('~/services/_client', () => ({
  createUsersClient: () => mockFetch
}))

describe('usersService', () => {
  it('register calls users client with payload', async () => {
    mockFetch.mockResolvedValue({ id: 'user-1' })

    const payload = {
      email: 'test@example.com',
      phone: '+123',
      password: 'pass',
      full_name: 'John',
      country_code: 'CO',
      role: 'traveler' as const
    }

    await usersService.register(payload)

    expect(mockFetch).toHaveBeenCalledWith('/api/v1/users', {
      method: 'POST',
      body: payload
    })
  })
})
