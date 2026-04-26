import { describe, it, expect } from 'vitest'

import { computeCanonicalBreakdown } from '../../app/utils/pricing'

describe('computeCanonicalBreakdown', () => {
  it('reproduce el cálculo del backend (price × nights × guests + cleaning + service + taxes)', () => {
    // 2 noches, 2 huéspedes, price=200, cleaning=50, tax=10%, service=8%
    const breakdown = computeCanonicalBreakdown({
      pricePerNight: 200,
      cleaningFee: 50,
      taxRate: 0.10,
      nights: 2,
      guests: 2
    })

    expect(breakdown.accommodationInCents).toBe(80000)
    expect(breakdown.cleaningFeeInCents).toBe(5000)
    expect(breakdown.serviceFeeInCents).toBe(6400)
    expect(breakdown.taxesInCents).toBe(9140)
    expect(breakdown.totalInCents).toBe(100540)
    expect(breakdown.nights).toBe(2)
    expect(breakdown.nightlyRateInCents).toBe(40000)
  })

  it('escala accommodation con la cantidad de huéspedes', () => {
    const oneGuest = computeCanonicalBreakdown({
      pricePerNight: 100,
      nights: 3,
      guests: 1,
      taxRate: 0
    })
    const threeGuests = computeCanonicalBreakdown({
      pricePerNight: 100,
      nights: 3,
      guests: 3,
      taxRate: 0
    })

    expect(threeGuests.accommodationInCents).toBe(oneGuest.accommodationInCents * 3)
  })

  it('omite cleaning y service cuando la propiedad no los expone', () => {
    const breakdown = computeCanonicalBreakdown({
      pricePerNight: 100,
      nights: 1,
      guests: 1,
      taxRate: 0
    })

    expect(breakdown.cleaningFeeInCents).toBe(0)
    // service_fee aplica sobre accommodation aún cuando cleaning sea 0
    expect(breakdown.serviceFeeInCents).toBe(800)
    expect(breakdown.totalInCents).toBe(10800)
  })

  it('aplica taxes sobre subtotal que incluye cleaning y service', () => {
    // price=100, nights=1, guests=1, cleaning=20, service=8% → subtotal=128;
    // tax=0.16 → taxes=20.48; total=148.48
    const breakdown = computeCanonicalBreakdown({
      pricePerNight: 100,
      cleaningFee: 20,
      taxRate: 0.16,
      nights: 1,
      guests: 1
    })

    expect(breakdown.totalInCents).toBe(14848)
    expect(breakdown.taxesInCents).toBe(2048)
  })

  it('protege contra valores degenerados (nights=0, guests=0)', () => {
    const breakdown = computeCanonicalBreakdown({
      pricePerNight: 100,
      nights: 0,
      guests: 0
    })

    expect(breakdown.nights).toBe(1)
    expect(breakdown.accommodationInCents).toBe(10000)
  })
})
