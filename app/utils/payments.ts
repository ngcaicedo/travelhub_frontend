export type PaymentStatus = 'confirmed' | 'failed'
export type ScenarioKind = 'success' | 'insufficient' | 'declined'

export type PaymentResponse = {
  payment_id: string
  reservation_id: string
  status: PaymentStatus
  amount_in_cents: number
  currency: string
  gateway_charge_id: string
  receipt_id: string | null
  receipt_number: string | null
  failure_reason: string | null
}

export type PaymentEvent = {
  event_id: string
  payment_id: string
  event_type: string
  payload: Record<string, unknown>
  created_at: string | null
}

export type ScenarioPreset = {
  cardholderName: string
  cardNumber: string
  expiration: string
  cvv: string
  paymentToken: string
}

export const scenarioPresets: Record<ScenarioKind, ScenarioPreset> = {
  success: {
    cardholderName: 'John Doe',
    cardNumber: '4242 4242 4242 4242',
    expiration: '12/29',
    cvv: '123',
    paymentToken: 'pm_tok_visa_ok'
  },
  insufficient: {
    cardholderName: 'John Doe',
    cardNumber: '4000 0000 0000 9995',
    expiration: '11/29',
    cvv: '456',
    paymentToken: 'pm_fail_insufficient_funds'
  },
  declined: {
    cardholderName: 'John Doe',
    cardNumber: '4000 0000 0000 0002',
    expiration: '10/29',
    cvv: '789',
    paymentToken: 'pm_fail_card_declined'
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asNullableString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function asRequiredString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function asNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function asCurrency(value: unknown): string {
  return typeof value === 'string' && value.trim().length === 3
    ? value.trim().toUpperCase()
    : 'COP'
}

function asStatus(value: unknown): PaymentStatus {
  return value === 'failed' ? 'failed' : 'confirmed'
}

function asIsoDateOrNull(value: unknown): string | null {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return null
  }

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : value
}

export function normalizePaymentResponse(value: unknown): PaymentResponse | null {
  if (!isRecord(value)) {
    return null
  }

  const paymentId = asNullableString(value.payment_id)
  const reservationId = asNullableString(value.reservation_id)

  if (!paymentId || !reservationId) {
    return null
  }

  return {
    payment_id: paymentId,
    reservation_id: reservationId,
    status: asStatus(value.status),
    amount_in_cents: asNumber(value.amount_in_cents),
    currency: asCurrency(value.currency),
    gateway_charge_id: asRequiredString(value.gateway_charge_id),
    receipt_id: asNullableString(value.receipt_id),
    receipt_number: asNullableString(value.receipt_number),
    failure_reason: asNullableString(value.failure_reason)
  }
}

export function normalizePaymentEvents(value: unknown): PaymentEvent[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item): PaymentEvent | null => {
      if (!isRecord(item)) {
        return null
      }

      const eventId = asNullableString(item.event_id)
      const paymentId = asNullableString(item.payment_id)
      const eventType = asNullableString(item.event_type)

      if (!eventId || !paymentId || !eventType) {
        return null
      }

      return {
        event_id: eventId,
        payment_id: paymentId,
        event_type: eventType,
        payload: isRecord(item.payload) ? item.payload : {},
        created_at: asIsoDateOrNull(item.created_at)
      }
    })
    .filter((item): item is PaymentEvent => item !== null)
}
