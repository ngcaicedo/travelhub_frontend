import type { CheckoutSessionStatus } from '~/utils/payments'
import type { PaymentConfirmationSummary } from '~/types/payments'
import { createPaymentsClient } from './_client'
import { normalizeCheckoutSessionStatus } from '~/utils/payments'

const REQUEST_TIMEOUT_MS = 10_000

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asNullableString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null
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

function asIsoDateOrNull(value: unknown): string | null {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return null
  }

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : value
}

function normalizePaymentConfirmationSummary(value: unknown): PaymentConfirmationSummary | null {
  if (!isRecord(value)) {
    return null
  }

  const paymentId = asNullableString(value.payment_id)
  const reservationId = asNullableString(value.reservation_id)
  const travelerId = asNullableString(value.traveler_id)

  if (!paymentId || !reservationId || !travelerId) {
    return null
  }

  return {
    payment_id: paymentId,
    reservation_id: reservationId,
    traveler_id: travelerId,
    status: asRequiredString(value.status),
    amount_in_cents: asNumber(value.amount_in_cents),
    currency: asCurrency(value.currency),
    receipt_id: asNullableString(value.receipt_id),
    receipt_number: asNullableString(value.receipt_number),
    property_name: asNullableString(value.property_name),
    check_in_date: asIsoDateOrNull(value.check_in_date),
    check_out_date: asIsoDateOrNull(value.check_out_date)
  }
}

export interface CreateChargePayload {
  reservation_id: string
  traveler_id: string
  payment_method_token: string
  amount_in_cents: number
  currency: string
  idempotency_key: string
}

export interface CreateIntentPayload {
  reservation_id: string
  traveler_id: string
  amount_in_cents: number
  currency: string
  property_name: string
  check_in_date: string
  check_out_date: string
}

export interface FinalizePaymentPayload {
  payment_transaction_id: string
  confirmation_token_id: string
}

export const paymentsService = {
  async getConfig(): Promise<unknown> {
    return await createPaymentsClient()('/api/v1/payments/config', {
      timeout: REQUEST_TIMEOUT_MS
    })
  },

  async createCharge(body: CreateChargePayload): Promise<unknown> {
    return await createPaymentsClient()('/api/v1/payments/charges', {
      method: 'POST',
      timeout: REQUEST_TIMEOUT_MS,
      body
    })
  },

  async createIntent(body: CreateIntentPayload): Promise<unknown> {
    return await createPaymentsClient()('/api/v1/payments/create-intent', {
      method: 'POST',
      timeout: REQUEST_TIMEOUT_MS,
      body
    })
  },

  async finalizePayment(body: FinalizePaymentPayload): Promise<unknown> {
    return await createPaymentsClient()('/api/v1/payments/finalize', {
      method: 'POST',
      timeout: REQUEST_TIMEOUT_MS,
      body
    })
  },

  async getPayment(paymentId: string): Promise<unknown> {
    return await createPaymentsClient()(`/api/v1/payments/${paymentId}`, {
      timeout: REQUEST_TIMEOUT_MS
    })
  },

  async getPaymentEvents(paymentId: string): Promise<unknown> {
    return await createPaymentsClient()(`/api/v1/payments/${paymentId}/events`, {
      timeout: REQUEST_TIMEOUT_MS
    })
  },

  async getPaymentConfirmationSummary(paymentId: string): Promise<PaymentConfirmationSummary> {
    const response = await createPaymentsClient()(`/api/v1/payments/${paymentId}/confirmation`, {
      method: 'GET'
    })

    const normalized = normalizePaymentConfirmationSummary(response)
    if (!normalized) {
      throw new Error('payments.errors.invalidConfirmationResponse')
    }

    return normalized
  },

  async getCheckoutStatus(paymentTransactionId: string): Promise<CheckoutSessionStatus> {
    const response = await createPaymentsClient()(`/api/v1/payments/checkout/${paymentTransactionId}`, {
      method: 'GET'
    })

    const normalized = normalizeCheckoutSessionStatus(response)
    if (!normalized) {
      throw new Error('payments.errors.invalidCheckoutStatusResponse')
    }

    return normalized
  }
}
