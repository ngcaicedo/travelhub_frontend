import { describe, it, expect } from 'vitest'
import { getApiErrorMessage } from '~/utils/apiError'

describe('getApiErrorMessage', () => {
  it('returns string detail when error has detail as string', () => {
    const error = {
      data: {
        detail: 'El correo electrónico ya existe'
      }
    }
    const message = getApiErrorMessage(error)
    expect(message).toBe('El correo electrónico ya existe')
  })

  it('concatenates array detail when error has detail as array', () => {
    const error = {
      data: {
        detail: [
          { msg: 'Email is required' },
          { msg: 'Phone must be 7-20 chars' }
        ]
      }
    }
    const message = getApiErrorMessage(error)
    expect(message).toBe('Email is required, Phone must be 7-20 chars')
  })

  it('returns default message when error is unknown', () => {
    const error = {}
    const message = getApiErrorMessage(error)
    expect(message).toBe('An unexpected error occurred')
  })

  it('returns default message when error.data is null', () => {
    const error = {
      data: null
    }
    const message = getApiErrorMessage(error)
    expect(message).toBe('An unexpected error occurred')
  })
})
