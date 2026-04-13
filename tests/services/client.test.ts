import { describe, it, expect } from 'vitest'
import { createUsersClient, createSecurityClient, createSearchClient, createPaymentsClient } from '~/services/_client'

describe('API client factories', () => {
  it('createUsersClient returns a function', () => {
    const client = createUsersClient()
    expect(typeof client).toBe('function')
  })

  it('createSecurityClient returns a function', () => {
    const client = createSecurityClient()
    expect(typeof client).toBe('function')
  })

  it('createSearchClient returns a function', () => {
    const client = createSearchClient()
    expect(typeof client).toBe('function')
  })

  it('createPaymentsClient returns a function', () => {
    const client = createPaymentsClient()
    expect(typeof client).toBe('function')
  })
})
