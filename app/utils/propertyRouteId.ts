const ROUTE_ID_PREFIX = 'ph_'

const toBase64 = (value: string) => {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(value, 'utf-8').toString('base64')
  }

  const bytes = new TextEncoder().encode(value)
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary)
}

const fromBase64 = (value: string) => {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(value, 'base64').toString('utf-8')
  }

  const binary = atob(value)
  const bytes = Uint8Array.from(binary, char => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

const toBase64Url = (value: string) =>
  toBase64(value)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')

const fromBase64Url = (value: string) => {
  const padded = `${value}${'='.repeat((4 - (value.length % 4)) % 4)}`
    .replace(/-/g, '+')
    .replace(/_/g, '/')
  return fromBase64(padded)
}

export const encodePropertyRouteId = (propertyId: string) => {
  if (!propertyId) {
    return propertyId
  }

  return `${ROUTE_ID_PREFIX}${toBase64Url(propertyId)}`
}

export const decodePropertyRouteId = (routeId?: string) => {
  if (!routeId) {
    return undefined
  }

  if (!routeId.startsWith(ROUTE_ID_PREFIX)) {
    return routeId
  }

  try {
    return fromBase64Url(routeId.slice(ROUTE_ID_PREFIX.length))
  } catch {
    return undefined
  }
}
