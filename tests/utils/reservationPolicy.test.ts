import { describe, expect, it, vi } from 'vitest'

import {
  buildReservationPolicyItems,
  formatReservationRefundType,
  parseReservationPolicy
} from '~/utils/reservationPolicy'

const echoT = (key: string) => key

describe('parseReservationPolicy', () => {
  it('returns null for empty input', () => {
    expect(parseReservationPolicy(null)).toBeNull()
    expect(parseReservationPolicy(undefined)).toBeNull()
    expect(parseReservationPolicy('')).toBeNull()
  })

  it('parses a valid JSON object', () => {
    const result = parseReservationPolicy('{"policy_type":"full","penalty_percentage":10}')
    expect(result).toEqual({ policy_type: 'full', penalty_percentage: 10 })
  })

  it('wraps invalid JSON in a raw envelope', () => {
    expect(parseReservationPolicy('not-json {{')).toEqual({ raw: 'not-json {{' })
  })

  it('wraps a JSON array in a raw envelope', () => {
    expect(parseReservationPolicy('[1,2,3]')).toEqual({ raw: '[1,2,3]' })
  })

  it('wraps a JSON primitive in a raw envelope', () => {
    expect(parseReservationPolicy('"just a string"')).toEqual({ raw: '"just a string"' })
  })
})

describe('buildReservationPolicyItems', () => {
  it('returns an empty array for empty input', () => {
    expect(buildReservationPolicyItems(null, echoT)).toEqual([])
    expect(buildReservationPolicyItems(undefined, echoT)).toEqual([])
  })

  it('returns an ordered list of formatted items for a known policy', () => {
    const t = vi.fn((key: string) => {
      if (key === 'reservationFlow.policy.values.full_refund') return 'Reembolso total'
      if (key === 'reservationFlow.policy.hoursUnit') return 'h'
      if (key === 'reservationFlow.policy.percentUnit') return '%'
      return key
    })

    const policyJson = JSON.stringify({
      policy_type: 'full',
      minimum_notice_hours: 48,
      penalty_percentage: 25,
      timezone: 'America/Bogota',
      ignored_field: 'should not appear'
    })

    const items = buildReservationPolicyItems(policyJson, t)

    expect(items.map(item => item.key)).toEqual([
      'policy_type',
      'minimum_notice_hours',
      'penalty_percentage',
      'timezone'
    ])
    expect(items[0]?.value).toBe('Reembolso total')
    expect(items[1]?.value).toBe('48 h')
    expect(items[2]?.value).toBe('25%')
    expect(items[3]?.value).toBe('America/Bogota')
    expect(items[0]?.label).toBe('reservationFlow.policy.policyType')
    expect(items[3]?.label).toBe('reservationFlow.policy.timezone')
  })

  it('returns a single raw item when policy could not be parsed as object', () => {
    const items = buildReservationPolicyItems('not-json', echoT)
    expect(items).toEqual([
      { key: 'raw', label: 'reservationFlow.policy.raw', value: 'not-json' }
    ])
  })

  it('returns an empty list when the policy has no recognised keys', () => {
    const items = buildReservationPolicyItems(JSON.stringify({ unknown: 'value' }), echoT)
    expect(items).toEqual([])
  })

  it('serialises array values via comma separation', () => {
    const items = buildReservationPolicyItems(
      JSON.stringify({ timezone: ['America/Bogota', 'America/Lima'] }),
      echoT
    )
    expect(items[0]?.value).toBe('America/Bogota, America/Lima')
  })

  it('serialises object values as JSON', () => {
    const items = buildReservationPolicyItems(
      JSON.stringify({ timezone: { primary: 'America/Bogota' } }),
      echoT
    )
    expect(items[0]?.value).toBe('{"primary":"America/Bogota"}')
  })

  it('skips null and empty values', () => {
    const items = buildReservationPolicyItems(
      JSON.stringify({ policy_type: 'full', penalty_percentage: null, timezone: '' }),
      echoT
    )
    expect(items.find(item => item.key === 'penalty_percentage')?.value).toBe('')
    expect(items.find(item => item.key === 'timezone')?.value).toBe('')
  })
})

describe('formatReservationRefundType', () => {
  it('returns empty string for empty input', () => {
    expect(formatReservationRefundType(null, echoT)).toBe('')
    expect(formatReservationRefundType(undefined, echoT)).toBe('')
    expect(formatReservationRefundType('', echoT)).toBe('')
  })

  it('maps short aliases to canonical translation keys', () => {
    const t = vi.fn((key: string) => `T(${key})`)
    expect(formatReservationRefundType('full', t)).toBe('T(reservationFlow.policy.values.full_refund)')
    expect(formatReservationRefundType('partial', t)).toBe('T(reservationFlow.policy.values.partial_refund)')
    expect(formatReservationRefundType('none', t)).toBe('T(reservationFlow.policy.values.no_refund)')
  })

  it('accepts already canonical refund types', () => {
    const t = vi.fn((key: string) => `T(${key})`)
    expect(formatReservationRefundType('full_refund', t)).toBe('T(reservationFlow.policy.values.full_refund)')
  })

  it('falls back to the original value when translation is missing', () => {
    expect(formatReservationRefundType('weird_value', echoT)).toBe('weird_value')
  })
})
