import { describe, it, expect } from 'vitest'

// useProperty composable - validates it's properly exported
describe('useProperty', () => {
  it('composable module exports function', async () => {
    // Import validates the module can be loaded
    const module = await import('~/composables/useProperty')
    expect(typeof module.useProperty).toBe('function')
  })
})
