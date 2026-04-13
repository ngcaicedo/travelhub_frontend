import { describe, it, expect } from 'vitest'
import { usePaymentsCompliance } from '~/composables/usePaymentsCompliance'

describe('usePaymentsCompliance', () => {
  it('returns a computed ref', () => {
    const result = usePaymentsCompliance()
    expect(result).toBeDefined()
    expect(typeof result.value).toBe('boolean')
  })

  it('returns false when compliance mode is not set', () => {
    const result = usePaymentsCompliance()
    expect(result.value).toBe(false)
  })
})
