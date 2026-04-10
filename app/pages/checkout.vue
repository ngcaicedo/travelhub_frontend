<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, shallowRef, watch } from 'vue'
import {
  normalizeCheckoutSession,
  normalizeCheckoutSessionStatus,
  normalizeFinalizePaymentResponse,
  normalizePaymentEvents,
  normalizePaymentResponse,
  normalizePaymentsConfig,
  scenarioPresets,
  type CheckoutSession,
  type FinalizePaymentResponse,
  type PaymentEvent,
  type PaymentResponse,
  type PaymentsConfig,
  type ScenarioKind
} from '~/utils/payments'
import { loadStripeJs, type StripeClient, type StripeElementsInstance } from '~/utils/stripe'

type Tone = 'info' | 'success' | 'error' | 'warning'
type FeedbackState = {
  tone: Tone
  titleKey?: string | null
  titleText?: string | null
  descriptionKey?: string | null
  descriptionText?: string | null
  descriptionParams?: Record<string, string | number>
}

const { t, locale } = useI18n()
const config = useRuntimeConfig()
const paymentsApiBase = String(config.public.paymentsApiBase || 'http://localhost:8003').replace(/\/$/, '')
const requestTimeoutMs = 10000

const form = reactive({
  scenario: 'success' as ScenarioKind,
  cardholderName: 'John Doe',
  cardNumber: scenarioPresets.success.cardNumber,
  expiration: scenarioPresets.success.expiration,
  cvv: scenarioPresets.success.cvv,
  paymentToken: scenarioPresets.success.paymentToken,
  reservationId: '11111111-1111-1111-1111-111111111111',
  travelerId: '22222222-2222-2222-2222-222222222222',
  amountInCents: 287650,
  currency: 'COP',
  checkInDate: '2026-10-12',
  checkOutDate: '2026-10-17'
})

const paymentResult = ref<PaymentResponse | null>(null)
const paymentEvents = ref<PaymentEvent[]>([])
const paymentsConfig = ref<PaymentsConfig>({ provider: 'fake_stripe', stripe_enabled: false, publishable_key: '' })
const stripeSession = ref<CheckoutSession | null>(null)
const feedback = ref<FeedbackState>({ tone: 'info', titleKey: null, titleText: '', descriptionKey: null, descriptionText: '' })
const eventsNotice = ref('')
const stripeNotice = ref('')
const lastFailureMessage = ref<string | null>(null)
const lastIdempotencyKey = ref('')
const processing = ref(false)
const eventsLoading = ref(false)
const configLoading = ref(true)
const stripeLoading = ref(false)
const stripeReady = ref(false)
const stripeClient = shallowRef<StripeClient | null>(null)
const stripeElements = shallowRef<StripeElementsInstance | null>(null)
const stripePaymentElement = shallowRef<{ mount: (target: string | HTMLElement) => void, unmount?: () => void, destroy?: () => void } | null>(null)

function isTimeoutLikeError(error: unknown) {
  const message = (
    (error as { message?: string })?.message
    || (error as { statusMessage?: string })?.statusMessage
    || ''
  ).toLowerCase()

  return message.includes('timeout')
    || message.includes('timed out')
    || message.includes('fetch failed')
    || message.includes('network')
}

async function goToPaymentConfirmation(paymentId: string) {
  await navigateTo({
    path: '/notifications/payment-confirmation',
    query: { paymentId }
  })
}

async function goToPendingVerification(paymentTransactionId: string) {
  await navigateTo({
    path: '/notifications/payment-confirmation',
    query: { transactionId: paymentTransactionId }
  })
}

const booking = computed(() => ({
  property: t('payments.booking.property'),
  location: t('payments.booking.location'),
  rating: '4.95',
  reviews: t('payments.booking.reviews'),
  dates: t('payments.booking.dates'),
  guests: t('payments.booking.guests'),
  lines: [
    { label: t('payments.booking.line1'), amount: '$2,250.00' },
    { label: t('payments.booking.line2'), amount: '$120.00' },
    { label: t('payments.booking.line3'), amount: '$245.00' },
    { label: t('payments.booking.line4'), amount: '$261.50' }
  ]
}))

const isStripeMode = computed(() => paymentsConfig.value.provider === 'stripe_test' && paymentsConfig.value.stripe_enabled)
const scenarioOptions = computed(() => [
  { label: t('payments.scenarios.success'), value: 'success' },
  { label: t('payments.scenarios.insufficient'), value: 'insufficient' },
  { label: t('payments.scenarios.declined'), value: 'declined' }
])
const toneClass = computed(() => feedback.value.tone === 'success'
  ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
  : feedback.value.tone === 'warning'
    ? 'border-amber-200 bg-amber-50 text-amber-900'
    : feedback.value.tone === 'error'
      ? 'border-rose-200 bg-rose-50 text-rose-900'
      : 'border-blue-200 bg-blue-50 text-blue-900')
const feedbackTitle = computed(() => feedback.value.titleKey ? t(feedback.value.titleKey) : (feedback.value.titleText || ''))
const feedbackDescription = computed(() => feedback.value.descriptionKey
  ? t(feedback.value.descriptionKey, feedback.value.descriptionParams || {})
  : (feedback.value.descriptionText || ''))

watch(() => form.scenario, (scenario) => {
  const preset = scenarioPresets[scenario]
  form.cardNumber = preset.cardNumber
  form.expiration = preset.expiration
  form.cvv = preset.cvv
  form.paymentToken = preset.paymentToken
})

watch(() => [form.reservationId, form.travelerId, form.amountInCents, form.currency, form.checkInDate, form.checkOutDate], () => {
  if (isStripeMode.value && stripeReady.value) resetStripe(t('payments.integration.sessionNeedsRefresh'))
})

onMounted(async () => {
  await fetchConfig()
  setReadyFeedback()
})

onBeforeUnmount(() => unmountStripeElement())
useSeoMeta({ title: () => `${t('payments.meta.title')} - TravelHub` })

function setReadyFeedback() {
  feedback.value = {
    tone: 'info',
    titleKey: 'payments.feedback.readyTitle',
    descriptionKey: isStripeMode.value ? 'payments.feedback.stripeReadyDescription' : 'payments.feedback.readyDescription'
  }
}

function formatMoney(amountInCents: number, currency: string) {
  const c = currency?.trim().toUpperCase()
  if (!c || c.length !== 3) {
    return `${(amountInCents / 100).toFixed(2)}`
  }
  try {
    return new Intl.NumberFormat(locale.value, { style: 'currency', currency: c }).format(amountInCents / 100)
  } catch {
    return `${(amountInCents / 100).toFixed(2)} ${c}`
  }
}

function formatDate(value: string | null) {
  if (!value) return t('payments.events.dateUnavailable')
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? t('payments.events.dateUnavailable') : new Intl.DateTimeFormat(locale.value, { dateStyle: 'short', timeStyle: 'short' }).format(parsed)
}

function buildIdempotencyKey() {
  return `checkout-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}
function detailMessage(detail: unknown) {
  return typeof detail === 'string' ? detail : t('payments.feedback.requestErrorDescription')
}
function isDuplicate(detail: unknown): detail is { message: string } {
  return typeof detail === 'object' && detail !== null && 'message' in detail && typeof detail.message === 'string'
}
function isCardDeclined(value: string | null | undefined) {
  if (!value) return false
  const normalized = value.toLowerCase()
  return normalized.includes('card_declined')
    || normalized.includes('card was declined')
    || normalized.includes('payment failed')
    || normalized.includes('tarjeta fue rechazada')
    || normalized.includes('cartÃ£o foi recusado')
}
function isInsufficientFunds(value: string | null | undefined) {
  if (!value) return false
  const normalized = value.toLowerCase()
  return normalized.includes('insufficient_funds')
    || normalized.includes('insufficient funds')
    || normalized.includes('fondos insuficientes')
}

function resolveFailureDescription(failureReason: string | null, errorMessage: string | null) {
  if (isInsufficientFunds(failureReason) || isInsufficientFunds(errorMessage)) {
    return { descriptionKey: 'payments.feedback.failureInsufficient' }
  }
  if (isCardDeclined(failureReason) || isCardDeclined(errorMessage)) {
    return { descriptionKey: 'payments.feedback.failureDeclined' }
  }
  return errorMessage
    ? { descriptionText: errorMessage }
    : { descriptionKey: 'payments.feedback.failureDeclined' }
}

function resolveRequestErrorDescription(detail: unknown) {
  const message = detailMessage(detail)
  if (isInsufficientFunds(message)) return { descriptionKey: 'payments.feedback.failureInsufficient' }
  if (isCardDeclined(message)) return { descriptionKey: 'payments.feedback.failureDeclined' }
  return { descriptionText: message }
}

function eventLabel(type: string) {
  return ({
    'payment.succeeded': t('payments.events.labels.paymentSucceeded'),
    'reservation.confirmation.requested': t('payments.events.labels.reservationConfirmationRequested'),
    'inventory.update.requested': t('payments.events.labels.inventoryUpdateRequested'),
    'receipt.generated': t('payments.events.labels.receiptGenerated'),
    'payment.failed': t('payments.events.labels.paymentFailed')
  } as Record<string, string>)[type] || type
}

function eventDetail(event: PaymentEvent) {
  const payload = event.payload || {}
  if (typeof payload.receipt_number === 'string') return payload.receipt_number
  if (typeof payload.failure_reason === 'string') return payload.failure_reason
  if (typeof payload.gateway_charge_id === 'string') return payload.gateway_charge_id
  if (typeof payload.status === 'string') return payload.status
  return t('payments.events.details.recorded')
}

function handleError(error: unknown) {
  const detail = (error as { data?: { detail?: unknown } })?.data?.detail
  feedback.value = isDuplicate(detail)
    ? { tone: 'warning', titleKey: 'payments.feedback.duplicateTitle', descriptionText: detail.message }
    : { tone: 'error', titleKey: 'payments.feedback.requestErrorTitle', ...resolveRequestErrorDescription(detail) }
}

async function fetchConfig() {
  configLoading.value = true
  try {
    paymentsConfig.value = normalizePaymentsConfig(await $fetch(`${paymentsApiBase}/api/v1/payments/config`, { timeout: requestTimeoutMs }))
  } catch {
    paymentsConfig.value = { provider: 'fake_stripe', stripe_enabled: false, publishable_key: '' }
  } finally {
    configLoading.value = false
  }
}

async function loadEvents(paymentId: string) {
  eventsLoading.value = true
  try {
    paymentEvents.value = normalizePaymentEvents(await $fetch(`${paymentsApiBase}/api/v1/payments/${paymentId}/events`, { timeout: requestTimeoutMs }))
    eventsNotice.value = ''
  } catch {
    paymentEvents.value = []
    eventsNotice.value = t('payments.feedback.eventsUnavailable')
  } finally {
    eventsLoading.value = false
  }
}

async function loadPayment(paymentId: string) {
  const normalized = normalizePaymentResponse(await $fetch(`${paymentsApiBase}/api/v1/payments/${paymentId}`, { timeout: requestTimeoutMs }))
  if (!normalized) throw createError({ statusCode: 502, data: { detail: 'invalid_backend_response' } })
  paymentResult.value = normalized
  const failureFeedback = resolveFailureDescription(normalized.failure_reason, lastFailureMessage.value)
  feedback.value = normalized.status === 'confirmed'
    ? { tone: 'success', titleKey: 'payments.feedback.successTitle', descriptionKey: 'payments.feedback.successDescription', descriptionParams: { receipt: normalized.receipt_number || 'N/A' } }
    : { tone: 'error', titleKey: 'payments.feedback.failureTitle', ...failureFeedback }
  if (normalized.status === 'confirmed') lastFailureMessage.value = null
}

async function loadPaymentAndEvents(paymentId: string) {
  await loadPayment(paymentId)
  await loadEvents(paymentId)
}

function unmountStripeElement() {
  stripePaymentElement.value?.unmount?.()
  stripePaymentElement.value?.destroy?.()
  stripePaymentElement.value = null
  stripeElements.value = null
}

function resetStripe(message = '') {
  stripeReady.value = false
  stripeSession.value = null
  stripeNotice.value = message
  unmountStripeElement()
}

async function prepareStripe() {
  if (!isStripeMode.value) return false
  stripeLoading.value = true
  try {
    const session = normalizeCheckoutSession(await $fetch(`${paymentsApiBase}/api/v1/payments/create-intent`, {
      method: 'POST',
      timeout: requestTimeoutMs,
      headers: { 'x-forwarded-proto': 'https' },
      body: {
        reservation_id: form.reservationId,
        traveler_id: form.travelerId,
        amount_in_cents: form.amountInCents,
        currency: form.currency.toUpperCase(),
        property_name: booking.value.property,
        check_in_date: form.checkInDate,
        check_out_date: form.checkOutDate
      }
    }))
    if (!session?.publishable_key) throw new Error('invalid_stripe_session')
    await loadStripeJs()
    if (!window.Stripe) throw new Error('stripe_js_unavailable')
    stripeClient.value = window.Stripe(session.publishable_key)
    stripeSession.value = session
    await nextTick()
    unmountStripeElement()
    stripeElements.value = stripeClient.value.elements({ mode: 'payment', amount: session.amount_in_cents, currency: session.currency.toLowerCase() })
    stripePaymentElement.value = stripeElements.value.create('payment', { layout: 'accordion' })
    stripePaymentElement.value.mount('#stripe-payment-element')
    stripeReady.value = true
    stripeNotice.value = t('payments.integration.sessionReady')
    feedback.value = { tone: 'info', titleKey: 'payments.integration.secureFormTitle', descriptionKey: 'payments.integration.secureFormDescription' }
    return true
  } catch (error) {
    resetStripe(t('payments.integration.sessionError'))
    handleError(error)
    return false
  } finally {
    stripeLoading.value = false
  }
}

async function submitFake() {
  const idempotencyKey = buildIdempotencyKey()
  lastIdempotencyKey.value = idempotencyKey
  lastFailureMessage.value = null
  const normalized = normalizePaymentResponse(await $fetch(`${paymentsApiBase}/api/v1/payments/charges`, {
    method: 'POST',
    timeout: requestTimeoutMs,
    headers: { 'x-forwarded-proto': 'https' },
    body: {
      reservation_id: form.reservationId,
      traveler_id: form.travelerId,
      payment_method_token: form.paymentToken,
      amount_in_cents: form.amountInCents,
      currency: form.currency.toUpperCase(),
      idempotency_key: idempotencyKey
    }
  }))
  if (!normalized) throw createError({ statusCode: 502, data: { detail: 'invalid_backend_response' } })
  paymentResult.value = normalized
  await loadPaymentAndEvents(normalized.payment_id)
  if (normalized.status === 'confirmed') {
    await goToPaymentConfirmation(normalized.payment_id)
  }
}

async function submitStripe() {
  lastFailureMessage.value = null
  if (!stripeReady.value) {
    const prepared = await prepareStripe()
    if (!prepared || !stripeSession.value || !stripeClient.value || !stripeElements.value) return
  }
  const submitResult = await stripeElements.value!.submit()
  if (submitResult.error?.message) throw createError({ statusCode: 400, data: { detail: submitResult.error.message } })
  const confirmation = await stripeClient.value!.createConfirmationToken({
    elements: stripeElements.value!,
    params: { payment_method_data: { billing_details: { name: form.cardholderName } }, return_url: window.location.href }
  })
  if (!confirmation.confirmationToken?.id) throw createError({ statusCode: 400, data: { detail: confirmation.error?.message || t('payments.integration.confirmationTokenError') } })
  let finalized: FinalizePaymentResponse | null = null
  try {
    finalized = normalizeFinalizePaymentResponse(await $fetch(`${paymentsApiBase}/api/v1/payments/finalize`, {
      method: 'POST',
      timeout: requestTimeoutMs,
      headers: { 'x-forwarded-proto': 'https' },
      body: { payment_transaction_id: stripeSession.value!.payment_transaction_id, confirmation_token_id: confirmation.confirmationToken.id }
    }))
  } catch (error) {
    if (stripeSession.value?.payment_transaction_id && isTimeoutLikeError(error)) {
      await goToPendingVerification(stripeSession.value.payment_transaction_id)
      return
    }
    throw error
  }
  if (!finalized) throw createError({ statusCode: 502, data: { detail: 'invalid_backend_response' } })
  lastIdempotencyKey.value = stripeSession.value!.payment_transaction_id
  if (finalized.status === 'failed') lastFailureMessage.value = finalized.error
  if (finalized.payment_id) {
    await loadPaymentAndEvents(finalized.payment_id)
    if (paymentResult.value?.status === 'confirmed') {
      await goToPaymentConfirmation(finalized.payment_id)
    }
    return
  }
  if (finalized.status === 'requires_action' && finalized.client_secret) {
    feedback.value = { tone: 'info', titleKey: 'payments.integration.requiresActionTitle', descriptionKey: 'payments.integration.requiresActionDescription' }
    const nextAction = await stripeClient.value!.handleNextAction({ clientSecret: finalized.client_secret })
    if (nextAction.error?.message) throw createError({ statusCode: 400, data: { detail: nextAction.error.message } })
    for (let i = 0; i < 6; i += 1) {
      const status = normalizeCheckoutSessionStatus(await $fetch(`${paymentsApiBase}/api/v1/payments/checkout/${stripeSession.value!.payment_transaction_id}`, { timeout: requestTimeoutMs }))
      if (status?.payment_id) {
        await loadPaymentAndEvents(status.payment_id)
        if (paymentResult.value?.status === 'confirmed') {
          await goToPaymentConfirmation(status.payment_id)
        }
        return
      }
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    await goToPendingVerification(stripeSession.value!.payment_transaction_id)
  }
}

async function submitPayment() {
  processing.value = true
  paymentResult.value = null
  paymentEvents.value = []
  try {
    if (isStripeMode.value) await submitStripe()
    else await submitFake()
  } catch (error) {
    handleError(error)
  } finally {
    processing.value = false
    if (isStripeMode.value) {
      resetStripe(t('payments.integration.sessionNeedsRefresh'))
    }
  }
}

async function simulateDuplicate() {
  if (isStripeMode.value) {
    feedback.value = { tone: 'warning', titleKey: 'payments.feedback.duplicateTitle', descriptionKey: 'payments.integration.duplicateOnlyFake' }
    return
  }
  processing.value = true
  try {
    const key = buildIdempotencyKey()
    lastIdempotencyKey.value = key
    const first = normalizePaymentResponse(await $fetch(`${paymentsApiBase}/api/v1/payments/charges`, {
      method: 'POST',
      timeout: requestTimeoutMs,
      headers: { 'x-forwarded-proto': 'https' },
      body: {
        reservation_id: form.reservationId,
        traveler_id: form.travelerId,
        payment_method_token: form.paymentToken,
        amount_in_cents: form.amountInCents,
        currency: form.currency.toUpperCase(),
        idempotency_key: key
      }
    }))
    if (first) await loadPaymentAndEvents(first.payment_id)
    await $fetch(`${paymentsApiBase}/api/v1/payments/charges`, {
      method: 'POST',
      timeout: requestTimeoutMs,
      headers: { 'x-forwarded-proto': 'https' },
      body: {
        reservation_id: form.reservationId,
        traveler_id: form.travelerId,
        payment_method_token: form.paymentToken,
        amount_in_cents: form.amountInCents,
        currency: form.currency.toUpperCase(),
        idempotency_key: key
      }
    })
    feedback.value = { tone: 'warning', titleKey: 'payments.feedback.duplicateTitle', descriptionKey: 'payments.feedback.duplicateUnexpectedDescription' }
  } catch (error) {
    handleError(error)
  } finally {
    processing.value = false
  }
}
</script>

<template>
  <section class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <div class="mb-6 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-4 text-sm text-slate-700">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <span>{{ t('payments.timer.prefix') }} <strong>{{ t('payments.timer.value') }}</strong></span>
        <span class="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">{{ configLoading ? t('payments.integration.loadingConfig') : (isStripeMode ? t('payments.integration.stripeBadge') : t('payments.integration.fakeBadge')) }}</span>
      </div>
    </div>

    <div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div class="space-y-6">
        <div>
          <h1 class="text-4xl font-semibold tracking-tight text-slate-900">
            {{ t('payments.title') }}
          </h1>
          <p class="mt-2 text-sm text-emerald-700">
            {{ t('payments.subtitle') }}
          </p>
          <p class="mt-4 text-sm text-slate-600">
            {{ isStripeMode ? t('payments.integration.stripeModeDescription') : t('payments.integration.fakeModeDescription') }}
          </p>
        </div>

        <div :class="['rounded-2xl border px-4 py-4 text-sm', toneClass]">
          <p class="font-semibold">
            {{ feedbackTitle }}
          </p>
          <p class="mt-1">
            {{ feedbackDescription }}
          </p>
        </div>

        <div class="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2">
          <label
            v-if="!isStripeMode"
            class="space-y-2 text-sm"
          ><span>{{ t('payments.scenarioLabel') }}</span><select
            v-model="form.scenario"
            class="w-full rounded-xl border border-slate-200 px-3 py-2"
          ><option
            v-for="option in scenarioOptions"
            :key="option.value"
            :value="option.value"
          >{{ option.label }}</option></select></label>
          <label class="space-y-2 text-sm"><span>{{ t('payments.form.cardholder') }}</span><input
            v-model="form.cardholderName"
            type="text"
            class="w-full rounded-xl border border-slate-200 px-3 py-2"
          ></label>
          <template v-if="!isStripeMode">
            <label class="space-y-2 text-sm"><span>{{ t('payments.form.cardNumber') }}</span><input
              v-model="form.cardNumber"
              type="text"
              class="w-full rounded-xl border border-slate-200 px-3 py-2"
            ></label>
            <div class="grid grid-cols-2 gap-4">
              <label class="space-y-2 text-sm"><span>{{ t('payments.form.expiration') }}</span><input
                v-model="form.expiration"
                type="text"
                class="w-full rounded-xl border border-slate-200 px-3 py-2"
              ></label>
              <label class="space-y-2 text-sm"><span>{{ t('payments.form.cvv') }}</span><input
                v-model="form.cvv"
                type="text"
                class="w-full rounded-xl border border-slate-200 px-3 py-2"
              ></label>
            </div>
            <label class="space-y-2 text-sm md:col-span-2"><span>{{ t('payments.form.token') }}</span><input
              v-model="form.paymentToken"
              type="text"
              class="w-full rounded-xl border border-slate-200 px-3 py-2"
            ></label>
          </template>
          <label class="space-y-2 text-sm"><span>{{ t('payments.form.reservationId') }}</span><input
            v-model="form.reservationId"
            type="text"
            class="w-full rounded-xl border border-slate-200 px-3 py-2"
          ></label>
          <label class="space-y-2 text-sm"><span>{{ t('payments.form.travelerId') }}</span><input
            v-model="form.travelerId"
            type="text"
            class="w-full rounded-xl border border-slate-200 px-3 py-2"
          ></label>
          <label class="space-y-2 text-sm"><span>{{ t('payments.form.amount') }}</span><input
            v-model.number="form.amountInCents"
            type="number"
            min="1"
            class="w-full rounded-xl border border-slate-200 px-3 py-2"
          ></label>
          <label class="space-y-2 text-sm"><span>{{ t('payments.form.currency') }}</span><input
            v-model="form.currency"
            type="text"
            maxlength="3"
            class="w-full rounded-xl border border-slate-200 px-3 py-2 uppercase"
          ></label>
          <label class="space-y-2 text-sm"><span>{{ t('payments.form.checkInDate') }}</span><input
            v-model="form.checkInDate"
            type="date"
            class="w-full rounded-xl border border-slate-200 px-3 py-2"
          ></label>
          <label class="space-y-2 text-sm"><span>{{ t('payments.form.checkOutDate') }}</span><input
            v-model="form.checkOutDate"
            type="date"
            class="w-full rounded-xl border border-slate-200 px-3 py-2"
          ></label>
        </div>

        <div class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 class="text-lg font-semibold text-slate-900">
                {{ t('payments.methodTitle') }}
              </h2>
              <p class="mt-1 text-sm text-slate-600">
                {{ t('payments.securityNotice') }}
              </p>
            </div>
            <button
              v-if="isStripeMode"
              type="button"
              class="rounded-full border border-blue-200 px-4 py-2 text-sm font-medium text-blue-700"
              :disabled="stripeLoading || processing"
              @click="prepareStripe"
            >
              {{ stripeReady ? t('payments.integration.sessionReady') : t('payments.actions.prepareSecureForm') }}
            </button>
          </div>
          <p class="mt-4 text-sm text-slate-500">
            {{ isStripeMode ? t('payments.integration.stripeFieldHint') : t('payments.tokenHint') }}
          </p>

          <div
            v-if="isStripeMode"
            class="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4"
          >
            <p class="text-sm font-semibold text-slate-900">
              {{ t('payments.integration.secureFormTitle') }}
            </p>
            <p class="mt-1 text-sm text-slate-600">
              {{ t('payments.integration.stripeFieldHint') }}
            </p>
            <div class="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
              <div
                v-if="stripeLoading"
                class="text-sm text-slate-500"
              >
                {{ t('payments.integration.loadingConfig') }}
              </div>
              <div id="stripe-payment-element" />
              <p
                v-if="stripeNotice"
                class="mt-3 text-sm text-slate-500"
              >
                {{ stripeNotice }}
              </p>
              <p class="mt-3 text-xs text-slate-400">
                {{ t('payments.integration.securityNoticeStripeHint') }}
              </p>
            </div>
          </div>
          <div
            v-else
            class="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-slate-600"
          >
            {{ t('payments.integration.fakeModeDescription') }}
          </div>

          <div class="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              class="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:bg-blue-300"
              :disabled="processing || stripeLoading"
              @click="submitPayment"
            >
              {{ processing ? t('payments.actions.processing') : t('payments.actions.payNow') }}
            </button>
            <button
              v-if="!isStripeMode"
              type="button"
              class="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 disabled:opacity-60"
              :disabled="processing || stripeLoading"
              @click="simulateDuplicate"
            >
              {{ t('payments.actions.testDuplicate') }}
            </button>
          </div>
        </div>

        <div class="grid gap-6 xl:grid-cols-2">
          <article class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 class="text-lg font-semibold text-slate-900">
              {{ t('payments.result.title') }}
            </h2>
            <div
              v-if="paymentResult"
              class="mt-4 space-y-3 text-sm"
            >
              <div class="flex justify-between gap-4">
                <span>{{ t('payments.result.status') }}</span><span class="font-semibold">{{ paymentResult.status === 'confirmed' ? t('payments.result.confirmed') : t('payments.result.failed') }}</span>
              </div>
              <div class="flex justify-between gap-4">
                <span>{{ t('payments.result.paymentId') }}</span><span class="font-mono text-xs">{{ paymentResult.payment_id }}</span>
              </div>
              <div class="flex justify-between gap-4">
                <span>{{ t('payments.result.amount') }}</span><span class="font-semibold">{{ formatMoney(paymentResult.amount_in_cents, paymentResult.currency) }}</span>
              </div>
              <div class="flex justify-between gap-4">
                <span>{{ t('payments.result.receipt') }}</span><span class="font-semibold">{{ paymentResult.receipt_number || t('payments.result.noReceipt') }}</span>
              </div>
              <div class="flex justify-between gap-4">
                <span>{{ t('payments.result.idempotency') }}</span><span class="font-mono text-xs">{{ lastIdempotencyKey || '-' }}</span>
              </div>
            </div>
            <p
              v-else
              class="mt-4 text-sm text-slate-500"
            >
              {{ t('payments.feedback.readyDescription') }}
            </p>
          </article>

          <article class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 class="text-lg font-semibold text-slate-900">
              {{ t('payments.events.title') }}
            </h2>
            <p class="mt-1 text-sm text-slate-500">
              {{ t('payments.events.caption') }}
            </p>
            <p
              v-if="eventsNotice"
              class="mt-3 text-sm text-amber-700"
            >
              {{ eventsNotice }}
            </p>
            <div
              v-if="eventsLoading"
              class="mt-4 space-y-3"
            >
              <div
                v-for="i in 3"
                :key="i"
                class="h-16 animate-pulse rounded-2xl bg-slate-100"
              />
            </div>
            <ul
              v-else-if="paymentEvents.length"
              class="mt-4 max-h-80 space-y-3 overflow-y-auto"
            >
              <li
                v-for="event in paymentEvents"
                :key="event.event_id"
                class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <div class="flex items-start justify-between gap-4">
                  <div>
                    <p class="text-sm font-semibold text-slate-900">
                      {{ eventLabel(event.event_type) }}
                    </p><p class="mt-1 text-sm text-slate-600">
                      {{ eventDetail(event) }}
                    </p>
                  </div>
                  <time class="text-xs text-slate-400">{{ formatDate(event.created_at) }}</time>
                </div>
              </li>
            </ul>
            <p
              v-else
              class="mt-4 text-sm text-slate-500"
            >
              {{ t('payments.events.empty') }}
            </p>
          </article>
        </div>
      </div>

      <aside class="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
        <img
          src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80"
          :alt="booking.property"
          class="h-56 w-full rounded-[1.5rem] object-cover"
        >
        <div class="px-2 pb-2 pt-5">
          <div class="flex items-center justify-between gap-4">
            <div>
              <h2 class="text-2xl font-semibold text-slate-900">
                {{ booking.property }}
              </h2><p class="mt-1 text-sm text-slate-500">
                {{ booking.location }}
              </p>
            </div><span class="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">{{ booking.rating }} ({{ booking.reviews }})</span>
          </div>
          <div class="mt-6 grid grid-cols-2 gap-4 border-y border-slate-100 py-5 text-sm">
            <div>
              <p class="text-xs uppercase tracking-[0.2em] text-slate-400">
                {{ t('payments.summary.dates') }}
              </p><p class="mt-2 font-medium text-slate-900">
                {{ booking.dates }}
              </p>
            </div>
            <div>
              <p class="text-xs uppercase tracking-[0.2em] text-slate-400">
                {{ t('payments.summary.guests') }}
              </p><p class="mt-2 font-medium text-slate-900">
                {{ booking.guests }}
              </p>
            </div>
          </div>
          <div class="mt-6">
            <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
              {{ t('payments.summary.breakdown') }}
            </p><ul class="mt-4 space-y-3 text-sm text-slate-600">
              <li
                v-for="line in booking.lines"
                :key="line.label"
                class="flex items-center justify-between gap-3"
              >
                <span>{{ line.label }}</span><span class="font-medium text-slate-900">{{ line.amount }}</span>
              </li>
            </ul>
          </div>
          <div class="mt-6 border-t border-slate-100 pt-5">
            <p class="text-sm font-semibold text-slate-500">
              {{ t('payments.summary.total') }}
            </p><p class="mt-1 text-3xl font-semibold tracking-tight text-blue-600">
              {{ formatMoney(form.amountInCents, form.currency) }}
            </p>
          </div>
          <p class="mt-6 text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            {{ t('payments.summary.footer') }}
          </p>
        </div>
      </aside>
    </div>
  </section>
</template>
