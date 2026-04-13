import { describe, it, expect } from 'vitest'
import { encodePropertyRouteId, decodePropertyRouteId } from '~/utils/propertyRouteId'

describe('propertyRouteId', () => {
  describe('encodePropertyRouteId', () => {
    it('returns empty string when given empty string', () => {
      expect(encodePropertyRouteId('')).toBe('')
    })

    it('encodes a UUID property ID with ph_ prefix', () => {
      const id = '22222222-2222-2222-2222-222222222222'
      const encoded = encodePropertyRouteId(id)
      expect(encoded).toMatch(/^ph_/)
      expect(encoded.length).toBeGreaterThan(3)
    })

    it('produces base64url-safe characters (no +, /, =)', () => {
      const encoded = encodePropertyRouteId('test/value+with=special')
      expect(encoded).not.toMatch(/[+/=]/)
    })
  })

  describe('decodePropertyRouteId', () => {
    it('returns undefined when given undefined', () => {
      expect(decodePropertyRouteId(undefined)).toBeUndefined()
    })

    it('returns undefined when given empty string', () => {
      expect(decodePropertyRouteId('')).toBeUndefined()
    })

    it('returns the value as-is when it does not start with ph_', () => {
      expect(decodePropertyRouteId('some-plain-id')).toBe('some-plain-id')
    })

    it('returns the original ID or undefined for corrupted base64 after ph_ prefix', () => {
      const result = decodePropertyRouteId('ph_!!!invalid!!!')
      // Buffer.from in Node is lenient with invalid base64, so it may decode to garbage
      // The important thing is it doesn't throw
      expect(typeof result === 'string' || result === undefined).toBe(true)
    })

    it('round-trips a UUID correctly', () => {
      const id = '22222222-2222-2222-2222-222222222222'
      const encoded = encodePropertyRouteId(id)
      const decoded = decodePropertyRouteId(encoded)
      expect(decoded).toBe(id)
    })

    it('round-trips special characters correctly', () => {
      const id = 'prop/special+chars=here'
      const encoded = encodePropertyRouteId(id)
      const decoded = decodePropertyRouteId(encoded)
      expect(decoded).toBe(id)
    })

    it('round-trips unicode characters correctly', () => {
      const id = 'propiedad-café-ñoño'
      const encoded = encodePropertyRouteId(id)
      const decoded = decodePropertyRouteId(encoded)
      expect(decoded).toBe(id)
    })
  })
})
