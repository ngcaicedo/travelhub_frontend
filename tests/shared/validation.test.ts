import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  validateReservationDates,
  calculateStayDuration,
  calculateTotalPrice,
  formatCurrency
} from '../../app/utils/validation'

describe('shared/utils/validation', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 3, 2, 12, 0, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('validateReservationDates', () => {
    it('rejects same-day check-in and check-out', () => {
      const sameDay = new Date(2026, 3, 5)
      const result = validateReservationDates(sameDay, sameDay)

      expect(result).toEqual({
        valid: false,
        error: 'checkout_after_checkin'
      })
    })

    it('rejects check-in dates in the past', () => {
      const checkIn = new Date(2026, 3, 1)
      const checkOut = new Date(2026, 3, 3)
      const result = validateReservationDates(checkIn, checkOut)

      expect(result).toEqual({
        valid: false,
        error: 'no_past_dates'
      })
    })

    it('accepts today as check-in when check-out is after it', () => {
      const checkIn = new Date(2026, 3, 2)
      const checkOut = new Date(2026, 3, 4)
      const result = validateReservationDates(checkIn, checkOut)

      expect(result).toEqual({
        valid: true,
        error: null
      })
    })
  })

  describe('calculateStayDuration', () => {
    it('returns 1 night for a next-day stay', () => {
      const checkIn = new Date(2026, 3, 10)
      const checkOut = new Date(2026, 3, 11)

      expect(calculateStayDuration(checkIn, checkOut)).toBe(1)
    })

    it('handles DST-like boundaries without undercounting nights', () => {
      const checkIn = new Date(2026, 2, 28, 12, 0, 0)
      const checkOut = new Date(2026, 2, 29, 11, 0, 0)

      expect(calculateStayDuration(checkIn, checkOut)).toBe(1)
    })

    it('returns 3 nights for a 3-day stay', () => {
      const checkIn = new Date(2026, 3, 10)
      const checkOut = new Date(2026, 3, 13)

      expect(calculateStayDuration(checkIn, checkOut)).toBe(3)
    })
  })

  describe('calculateTotalPrice', () => {
    it('multiplies nightly price by number of nights', () => {
      const result = calculateTotalPrice(1240, 3)
      expect(result.subtotal).toBe(3720)
      expect(result.taxes).toBe(0)
      expect(result.cleaningFee).toBe(0)
      expect(result.total).toBe(3720)
    })

    it('includes tax and cleaning fee in total', () => {
      const result = calculateTotalPrice(1000, 2, 0.19, 120)
      expect(result.subtotal).toBe(2000)
      expect(result.taxes).toBeCloseTo(380)
      expect(result.cleaningFee).toBe(120)
      expect(result.total).toBeCloseTo(2500)
    })
  })

  describe('formatCurrency', () => {
    it('formats currency using COP by default', () => {
      const expected = new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(1240)

      expect(formatCurrency(1240)).toBe(expected)
    })

    it('formats currency using the provided code', () => {
      const expected = new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(1240)

      expect(formatCurrency(1240, 'USD')).toBe(expected)
    })

    it('formats currency using the provided locale', () => {
      const expected = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(1240)

      expect(formatCurrency(1240, 'USD', 'en-US')).toBe(expected)
    })
  })
})
