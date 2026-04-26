export function parseApiDateToTimestamp(value: string | null | undefined): number | null {
  if (!value || typeof value !== 'string') return null

  const normalized = /(?:Z|[+-]\d{2}:\d{2})$/.test(value)
    ? value
    : `${value}Z`

  const timestamp = new Date(normalized).getTime()
  return Number.isFinite(timestamp) ? timestamp : null
}

