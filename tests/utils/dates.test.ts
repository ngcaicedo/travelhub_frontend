import { describe, expect, it } from 'vitest'

import { parseApiDateToTimestamp } from '~/utils/dates'

describe('parseApiDateToTimestamp', () => {
  it('treats naive API datetimes as UTC', () => {
    const withZone = parseApiDateToTimestamp('2026-04-26T15:06:48.793861Z')
    const naive = parseApiDateToTimestamp('2026-04-26T15:06:48.793861')

    expect(naive).toBe(withZone)
  })

  it('returns null for empty input', () => {
    expect(parseApiDateToTimestamp('')).toBeNull()
    expect(parseApiDateToTimestamp(undefined)).toBeNull()
  })
})
