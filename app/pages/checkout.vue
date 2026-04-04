<script setup lang="ts">
import {
  normalizePaymentEvents,
  normalizePaymentResponse,
  scenarioPresets,
  type PaymentEvent,
  type PaymentResponse,
  type ScenarioKind
} from '~/utils/payments'

type FeedbackTone = 'info' | 'success' | 'error' | 'warning'

const config = useRuntimeConfig()
const { t, locale } = useI18n()

const paymentsApiBase = String(config.public.paymentsApiBase || 'http://localhost:8002').replace(/\/$/, '')
const requestTimeoutMs = 10000

const form = reactive({
  scenario: 'success' as ScenarioKind,
  cardholderName: scenarioPresets.success.cardholderName,
  cardNumber: scenarioPresets.success.cardNumber,
  expiration: scenarioPresets.success.expiration,
  cvv: scenarioPresets.success.cvv,
  paymentToken: scenarioPresets.success.paymentToken,
  reservationId: '11111111-1111-1111-1111-111111111111',
  travelerId: '22222222-2222-2222-2222-222222222222',
  amountInCents: 287650,
  currency: 'COP'
})

const processing = ref(false)
const eventsLoading = ref(false)
const paymentResult = ref<PaymentResponse | null>(null)
const paymentEvents = ref<PaymentEvent[]>([])
const eventsNotice = ref('')
const lastIdempotencyKey = ref('')
const feedback = ref({
  tone: 'info' as FeedbackTone,
  title: '',
  description: ''
})

const booking = computed(() => ({
  property: t('payments.booking.property'),
  location: t('payments.booking.location'),
  rating: '4.95',
  reviews: t('payments.booking.reviews'),
  dates: t('payments.booking.dates'),
  guests: t('payments.booking.guests'),
  total: formatMoney(form.amountInCents, form.currency),
  image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
  lines: [
    { label: t('payments.booking.line1'), amount: '$2,250.00' },
    { label: t('payments.booking.line2'), amount: '$120.00' },
    { label: t('payments.booking.line3'), amount: '$245.00' },
    { label: t('payments.booking.line4'), amount: '$261.50' }
  ]
}))

const scenarioOptions = computed(() => [
  { label: t('payments.scenarios.success'), value: 'success' },
  { label: t('payments.scenarios.insufficient'), value: 'insufficient' },
  { label: t('payments.scenarios.declined'), value: 'declined' }
])

const translatedStatus = computed(() => {
  if (!paymentResult.value) {
    return ''
  }

  return paymentResult.value.status === 'confirmed'
    ? t('payments.result.confirmed')
    : t('payments.result.failed')
})

const toneClasses = computed(() => {
  if (feedback.value.tone === 'success') {
    return 'border-success-200 bg-success-50 text-success-900'
  }

  if (feedback.value.tone === 'warning') {
    return 'border-warning-200 bg-warning-50 text-warning-900'
  }

  if (feedback.value.tone === 'error') {
    return 'border-error-200 bg-error-50 text-error-900'
  }

  return 'border-travelhub-200 bg-travelhub-50 text-travelhub-900'
})

watchEffect(() => {
  if (paymentResult.value || processing.value) {
    return
  }

  feedback.value = {
    tone: 'info',
    title: t('payments.feedback.readyTitle'),
    description: t('payments.feedback.readyDescription')
  }
})

watch(() => form.scenario, (scenario) => {
  const preset = scenarioPresets[scenario]

  form.cardholderName = preset.cardholderName
  form.cardNumber = preset.cardNumber
  form.expiration = preset.expiration
  form.cvv = preset.cvv
  form.paymentToken = preset.paymentToken
})

useSeoMeta({
  title: () => `${t('payments.meta.title')} - TravelHub`
})

function formatMoney(amountInCents: number, currency: string) {
  const normalizedCurrency = currency?.trim().toUpperCase()

  if (!normalizedCurrency || normalizedCurrency.length !== 3) {
    return `${(amountInCents / 100).toFixed(2)}`
  }

  try {
    return new Intl.NumberFormat(locale.value, {
      style: 'currency',
      currency: normalizedCurrency,
      maximumFractionDigits: 2
    }).format(amountInCents / 100)
  } catch {
    return `${(amountInCents / 100).toFixed(2)} ${normalizedCurrency}`
  }
}

function formatEventDate(value: string | null) {
  if (!value) {
    return t('payments.events.dateUnavailable')
  }

  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) {
    return t('payments.events.dateUnavailable')
  }

  return new Intl.DateTimeFormat(locale.value, {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(parsedDate)
}

function buildIdempotencyKey() {
  return `checkout-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function resolveFailureMessage(reason: string | null) {
  if (reason === 'insufficient_funds') {
    return t('payments.feedback.failureInsufficient')
  }

  return t('payments.feedback.failureDeclined')
}

function translateEventType(eventType: string) {
  const translationMap: Record<string, string> = {
    'payment.succeeded': t('payments.events.labels.paymentSucceeded'),
    'reservation.confirmation.requested': t('payments.events.labels.reservationConfirmationRequested'),
    'inventory.update.requested': t('payments.events.labels.inventoryUpdateRequested'),
    'receipt.generated': t('payments.events.labels.receiptGenerated'),
    'payment.failed': t('payments.events.labels.paymentFailed')
  }

  return translationMap[eventType] || eventType
}

function describeEventPayload(event: PaymentEvent) {
  const payload = event.payload || {}

  if (event.event_type === 'receipt.generated' && typeof payload.receipt_number === 'string') {
    return payload.receipt_number
  }

  if (event.event_type === 'payment.failed' && typeof payload.failure_reason === 'string') {
    return payload.failure_reason
  }

  if (event.event_type === 'payment.succeeded' && typeof payload.gateway_charge_id === 'string') {
    return payload.gateway_charge_id
  }

  if (typeof payload.status === 'string' && payload.status.length > 0) {
    return payload.status
  }

  const firstPayloadValue = Object.values(payload).find((value) => typeof value === 'string' && value.length > 0)
  return typeof firstPayloadValue === 'string'
    ? firstPayloadValue
    : t('payments.events.details.recorded')
}

function isTimeoutError(error: unknown) {
  const candidate = error as { name?: string, message?: string }
  return candidate?.name === 'AbortError' || candidate?.message?.toLowerCase().includes('timeout') === true
}

function isDuplicateError(detail: unknown): detail is { message: string } {
  return typeof detail === 'object' && detail !== null && 'message' in detail && typeof detail.message === 'string'
}

function isInvalidResponseError(error: unknown) {
  const candidate = error as { data?: { detail?: string } }
  return candidate?.data?.detail === 'invalid_backend_response'
}

function isNetworkError(error: unknown) {
  const candidate = error as { message?: string }
  return candidate?.message?.toLowerCase().includes('fetch') === true
}

async function performCharge(idempotencyKey: string) {
  const rawResponse = await $fetch<unknown>(`${paymentsApiBase}/api/v1/payments/charges`, {
    method: 'POST',
    timeout: requestTimeoutMs,
    headers: {
      'x-forwarded-proto': 'https'
    },
    body: {
      reservation_id: form.reservationId,
      traveler_id: form.travelerId,
      payment_method_token: form.paymentToken,
      amount_in_cents: form.amountInCents,
      currency: form.currency.toUpperCase(),
      idempotency_key: idempotencyKey
    }
  })

  const normalizedResponse = normalizePaymentResponse(rawResponse)

  if (!normalizedResponse) {
    throw createError({
      statusCode: 502,
      statusMessage: 'Invalid payments backend response',
      data: {
        detail: 'invalid_backend_response'
      }
    })
  }

  return normalizedResponse
}

async function loadEvents(paymentId: string) {
  eventsLoading.value = true
  eventsNotice.value = ''

  try {
    const rawResponse = await $fetch<unknown>(`${paymentsApiBase}/api/v1/payments/${paymentId}/events`, {
      timeout: requestTimeoutMs
    })
    paymentEvents.value = normalizePaymentEvents(rawResponse)

    if (!Array.isArray(rawResponse)) {
      eventsNotice.value = t('payments.feedback.eventsUnavailable')
    }
  } catch {
    paymentEvents.value = []
    eventsNotice.value = t('payments.feedback.eventsUnavailable')
  } finally {
    eventsLoading.value = false
  }
}

function applyChargeFeedback(response: PaymentResponse) {
  if (response.status === 'confirmed') {
    feedback.value = {
      tone: 'success',
      title: t('payments.feedback.successTitle'),
      description: t('payments.feedback.successDescription', { receipt: response.receipt_number || 'N/A' })
    }
    return
  }

  feedback.value = {
    tone: 'error',
    title: t('payments.feedback.failureTitle'),
    description: resolveFailureMessage(response.failure_reason)
  }
}

function applyChargeError(error: unknown) {
  const candidate = error as { data?: { detail?: unknown } }
  const detail = candidate?.data?.detail

  if (isDuplicateError(detail)) {
    feedback.value = {
      tone: 'warning',
      title: t('payments.feedback.duplicateTitle'),
      description: detail.message
    }
    return
  }

  if (isTimeoutError(error)) {
    feedback.value = {
      tone: 'error',
      title: t('payments.feedback.requestErrorTitle'),
      description: t('payments.feedback.timeoutDescription')
    }
    return
  }

  if (isInvalidResponseError(error)) {
    feedback.value = {
      tone: 'error',
      title: t('payments.feedback.requestErrorTitle'),
      description: t('payments.feedback.invalidResponseDescription')
    }
    return
  }

  if (isNetworkError(error)) {
    feedback.value = {
      tone: 'error',
      title: t('payments.feedback.requestErrorTitle'),
      description: t('payments.feedback.backendUnavailableDescription')
    }
    return
  }

  feedback.value = {
    tone: 'error',
    title: t('payments.feedback.requestErrorTitle'),
    description: typeof detail === 'string' ? detail : t('payments.feedback.requestErrorDescription')
  }
}

async function submitPayment() {
  processing.value = true
  paymentResult.value = null
  paymentEvents.value = []
  eventsNotice.value = ''

  const idempotencyKey = buildIdempotencyKey()
  lastIdempotencyKey.value = idempotencyKey

  try {
    const response = await performCharge(idempotencyKey)
    paymentResult.value = response
    applyChargeFeedback(response)
    await loadEvents(response.payment_id)
  } catch (error) {
    applyChargeError(error)
  } finally {
    processing.value = false
  }
}

async function simulateDuplicate() {
  processing.value = true
  paymentResult.value = null
  paymentEvents.value = []
  eventsNotice.value = ''

  const idempotencyKey = buildIdempotencyKey()
  lastIdempotencyKey.value = idempotencyKey

  try {
    const firstCharge = await performCharge(idempotencyKey)
    paymentResult.value = firstCharge
    await loadEvents(firstCharge.payment_id)
    await performCharge(idempotencyKey)

    feedback.value = {
      tone: 'warning',
      title: t('payments.feedback.duplicateTitle'),
      description: t('payments.feedback.duplicateUnexpectedDescription')
    }
  } catch (error) {
    const candidate = error as { data?: { detail?: unknown } }
    const detail = candidate?.data?.detail

    if (isDuplicateError(detail)) {
      feedback.value = {
        tone: 'warning',
        title: t('payments.feedback.duplicateTitle'),
        description: t('payments.feedback.duplicateDescription')
      }
    } else {
      applyChargeError(error)
    }
  } finally {
    processing.value = false
  }
}
</script>

<template>
  <div class="mx-auto flex w-full max-w-[1180px] flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
    <div class="rounded-xl border border-travelhub-100 bg-travelhub-50/70 px-4 py-3">
      <div class="flex flex-wrap items-center justify-center gap-3 text-sm text-slate-700">
        <UIcon
          name="i-lucide-timer"
          class="size-4 text-travelhub-600"
        />
        <span>{{ t('payments.timer.prefix') }} <strong class="text-travelhub-600">{{ t('payments.timer.value') }}</strong></span>
        <UBadge color="primary" variant="soft">
          12
        </UBadge>
        <UBadge color="primary" variant="soft">
          45
        </UBadge>
      </div>
    </div>

    <div class="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
      <section class="px-1 lg:px-2">
        <div class="max-w-2xl">
          <h1 class="text-5xl font-extrabold tracking-tight text-slate-900">
            {{ t('payments.title') }}
          </h1>
          <p class="mt-3 flex items-center gap-2 text-sm text-success-700">
            <UIcon name="i-lucide-lock" class="size-4" />
            {{ t('payments.subtitle') }}
          </p>

          <div class="mt-10">
            <h2 class="text-xl font-bold text-slate-900">
              {{ t('payments.methodTitle') }}
            </h2>

            <div class="mt-6 max-w-xl">
              <UFormField :label="t('payments.scenarioLabel')">
                <USelect
                  v-model="form.scenario"
                  :items="scenarioOptions"
                  option-attribute="label"
                  value-attribute="value"
                  size="xl"
                  class="w-full"
                />
              </UFormField>
            </div>

            <div class="mt-8 h-px bg-slate-200" />

            <div class="mt-8 max-w-xl space-y-6">
              <div class="grid gap-4 md:grid-cols-2">
                <UFormField :label="t('payments.form.cardholder')">
                  <UInput
                    v-model="form.cardholderName"
                    :placeholder="t('payments.form.cardholderPlaceholder')"
                    size="xl"
                    class="w-full"
                  />
                </UFormField>

                <UFormField :label="t('payments.form.token')">
                  <UInput
                    v-model="form.paymentToken"
                    size="xl"
                    class="w-full font-mono text-sm"
                  />
                </UFormField>
              </div>

              <UFormField :label="t('payments.form.cardNumber')">
                <UInput
                  v-model="form.cardNumber"
                  icon="i-lucide-credit-card"
                  size="xl"
                  class="w-full"
                />
              </UFormField>

              <div class="grid gap-4 md:grid-cols-2">
                <UFormField :label="t('payments.form.expiration')">
                  <UInput
                    v-model="form.expiration"
                    size="xl"
                    class="w-full"
                  />
                </UFormField>

                <UFormField :label="t('payments.form.cvv')">
                  <UInput
                    v-model="form.cvv"
                    size="xl"
                    class="w-full"
                  />
                </UFormField>
              </div>

              <div class="grid gap-4 md:grid-cols-2">
                <UFormField :label="t('payments.form.reservationId')">
                  <UInput
                    v-model="form.reservationId"
                    size="xl"
                    class="w-full font-mono text-sm"
                  />
                </UFormField>

                <UFormField :label="t('payments.form.travelerId')">
                  <UInput
                    v-model="form.travelerId"
                    size="xl"
                    class="w-full font-mono text-sm"
                  />
                </UFormField>
              </div>

              <div class="grid gap-4 md:grid-cols-2">
                <UFormField :label="t('payments.form.amount')">
                  <UInput
                    v-model.number="form.amountInCents"
                    type="number"
                    min="1"
                    step="100"
                    size="xl"
                    class="w-full"
                  />
                </UFormField>

                <UFormField :label="t('payments.form.currency')">
                  <UInput
                    v-model="form.currency"
                    maxlength="3"
                    size="xl"
                    class="w-full uppercase"
                  />
                </UFormField>
              </div>

              <div class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                <div class="flex items-start gap-3">
                  <UIcon name="i-lucide-shield-check" class="mt-0.5 size-5 text-travelhub-600" />
                  <div class="space-y-1">
                    <p>{{ t('payments.securityNotice') }}</p>
                    <p class="text-xs text-slate-500">
                      {{ t('payments.tokenHint') }}
                    </p>
                  </div>
                </div>
              </div>

              <div class="rounded-xl border px-4 py-4" :class="toneClasses">
                <p class="font-semibold">
                  {{ feedback.title }}
                </p>
                <p class="mt-1 text-sm leading-6">
                  {{ feedback.description }}
                </p>
              </div>

              <div
                v-if="paymentResult"
                class="rounded-xl border border-slate-200 bg-white px-4 py-4"
              >
                <p class="text-sm font-semibold text-slate-900">
                  {{ t('payments.result.title') }}
                </p>
                <div class="mt-3 grid gap-2 text-sm text-slate-600">
                  <div class="flex items-center justify-between gap-4">
                    <span>{{ t('payments.result.status') }}</span>
                    <strong class="text-slate-900">{{ translatedStatus }}</strong>
                  </div>
                  <div class="flex items-center justify-between gap-4">
                    <span>{{ t('payments.result.paymentId') }}</span>
                    <strong class="font-mono text-xs text-slate-900">{{ paymentResult.payment_id }}</strong>
                  </div>
                  <div class="flex items-center justify-between gap-4">
                    <span>{{ t('payments.result.receipt') }}</span>
                    <strong class="text-slate-900">{{ paymentResult.receipt_number || t('payments.result.noReceipt') }}</strong>
                  </div>
                  <div class="flex items-center justify-between gap-4">
                    <span>{{ t('payments.result.amount') }}</span>
                    <strong class="text-slate-900">{{ formatMoney(paymentResult.amount_in_cents, paymentResult.currency) }}</strong>
                  </div>
                  <div class="flex items-center justify-between gap-4">
                    <span>{{ t('payments.result.idempotency') }}</span>
                    <strong class="font-mono text-xs text-slate-900">{{ lastIdempotencyKey }}</strong>
                  </div>
                </div>
              </div>

              <div class="rounded-xl border border-slate-200 bg-white px-4 py-4">
                <div class="flex items-center justify-between gap-4">
                  <div>
                    <p class="text-sm font-semibold text-slate-900">
                      {{ t('payments.events.title') }}
                    </p>
                    <p class="mt-1 text-xs text-slate-500">
                      {{ t('payments.events.caption') }}
                    </p>
                  </div>
                  <UBadge
                    color="neutral"
                    variant="soft"
                  >
                    {{ paymentEvents.length }}
                  </UBadge>
                </div>

                <div
                  v-if="eventsNotice"
                  class="mt-4 rounded-xl border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-900"
                >
                  {{ eventsNotice }}
                </div>

                <div
                  v-if="eventsLoading"
                  class="mt-4 space-y-3"
                >
                  <div
                    v-for="placeholder in 3"
                    :key="placeholder"
                    class="h-16 animate-pulse rounded-xl bg-slate-100"
                  />
                </div>

                <div
                  v-else-if="paymentEvents.length"
                  class="mt-4 max-h-72 space-y-3 overflow-y-auto pr-1"
                >
                  <article
                    v-for="event in paymentEvents"
                    :key="event.event_id"
                    class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <div class="flex items-start justify-between gap-3">
                      <div>
                        <p class="text-sm font-semibold text-slate-900">
                          {{ translateEventType(event.event_type) }}
                        </p>
                        <p class="mt-1 text-xs text-slate-500">
                          {{ describeEventPayload(event) }}
                        </p>
                      </div>
                      <span class="shrink-0 text-[11px] font-medium text-slate-400">
                        {{ formatEventDate(event.created_at) }}
                      </span>
                    </div>
                  </article>
                </div>

                <div
                  v-else
                  class="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500"
                >
                  {{ t('payments.events.empty') }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <aside>
        <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div class="relative">
            <img
              :src="booking.image"
              :alt="booking.property"
              class="h-[270px] w-full object-cover"
            >
            <div class="absolute left-4 top-4 rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-700 shadow">
              {{ booking.rating }} ({{ booking.reviews }})
            </div>
          </div>

          <div class="p-5">
            <h3 class="text-[30px] font-extrabold tracking-tight text-slate-900">
              {{ booking.property }}
            </h3>
            <p class="mt-2 text-sm text-slate-500">
              {{ booking.location }}
            </p>

            <div class="mt-6 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p class="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  {{ t('payments.summary.dates') }}
                </p>
                <p class="mt-2 font-semibold text-slate-900">
                  {{ booking.dates }}
                </p>
              </div>
              <div class="text-right">
                <p class="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  {{ t('payments.summary.guests') }}
                </p>
                <p class="mt-2 font-semibold text-slate-900">
                  {{ booking.guests }}
                </p>
              </div>
            </div>

            <div class="mt-8 space-y-4 border-t border-slate-200 pt-6">
              <p class="text-xs font-semibold uppercase tracking-widest text-slate-400">
                {{ t('payments.summary.breakdown') }}
              </p>

              <div
                v-for="line in booking.lines"
                :key="line.label"
                class="flex items-center justify-between gap-4 text-sm text-slate-600"
              >
                <span>{{ line.label }}</span>
                <strong class="text-slate-900">{{ line.amount }}</strong>
              </div>
            </div>

            <div class="mt-8 flex items-center justify-between border-t border-slate-200 pt-6">
              <div>
                <p class="text-sm font-semibold text-slate-900">
                  {{ t('payments.summary.total') }}
                </p>
                <p class="mt-2 text-[38px] font-extrabold tracking-tight text-travelhub-600">
                  {{ booking.total }}
                </p>
              </div>
            </div>

            <div class="mt-6 space-y-3">
              <UButton
                block
                size="xl"
                color="primary"
                icon="i-lucide-lock"
                :loading="processing"
                @click="submitPayment"
              >
                {{ processing ? t('payments.actions.processing') : t('payments.actions.payNow') }}
              </UButton>

              <UButton
                block
                size="xl"
                color="neutral"
                variant="outline"
                icon="i-lucide-copy-check"
                :disabled="processing"
                @click="simulateDuplicate"
              >
                {{ t('payments.actions.testDuplicate') }}
              </UButton>
            </div>

            <p class="mt-4 text-center text-xs font-semibold uppercase tracking-widest text-slate-400">
              {{ t('payments.summary.footer') }}
            </p>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>
