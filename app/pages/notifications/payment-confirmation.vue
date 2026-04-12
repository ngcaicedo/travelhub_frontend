<script setup lang="ts">
import { buildReceiptFilename, createPaymentReceiptPdf } from '~/utils/receiptPdf'

const { t, locale, tm, getLocaleMessage } = useI18n()
const route = useRoute()
const router = useRouter()
const {
  confirmation,
  loading,
  error,
  loadConfirmation,
  reconcilePaymentTransaction
} = usePaymentConfirmation()

const isReconciling = ref(false)
const verificationExpired = ref(false)
const transientError = ref<string | null>(null)

const paymentId = computed(() => {
  const value = route.query.paymentId
  return typeof value === 'string' ? value : ''
})

const transactionId = computed(() => {
  const value = route.query.transactionId
  return typeof value === 'string' ? value : ''
})

function isTranslationKey(value: string) {
  return /^[a-z]+(?:\.[a-zA-Z0-9_-]+)+$/.test(value)
}

function localizeNotificationError(value: string | null) {
  if (!value) return null
  if (isTranslationKey(value)) return t(value)

  const normalized = value.toLowerCase()
  const matchers = (key: string) => {
    const translated = tm(key)
    const localeValues = ['es', 'en', 'pt']
      .map((localeCode) => {
        const segments = key.split('.')
        let current: unknown = getLocaleMessage(localeCode)

        for (const segment of segments) {
          if (typeof current !== 'object' || current === null || !(segment in current)) {
            return null
          }
          current = (current as Record<string, unknown>)[segment]
        }

        return current
      })

    return [translated, ...localeValues]
      .flatMap(entry => Array.isArray(entry) ? entry : [])
      .filter((entry): entry is string => typeof entry === 'string')
      .map(entry => entry.toLowerCase())
  }

  if (matchers('payments.detection.insufficientFunds').some(matcher => normalized.includes(matcher))) {
    return t('notifications.errors.insufficientFunds')
  }

  if (matchers('payments.detection.cardDeclined').some(matcher => normalized.includes(matcher))) {
    return t('notifications.errors.paymentDeclined')
  }

  if (
    normalized.includes('timeout')
    || normalized.includes('timed out')
    || normalized.includes('fetch failed')
    || normalized.includes('network')
  ) {
    return t('notifications.errors.backendUnavailable')
  }

  if (normalized.includes('invalid_backend_response')) {
    return t('notifications.errors.invalidConfirmationResponse')
  }

  if (normalized.includes('invalid payment confirmation response')) {
    return t('notifications.errors.invalidConfirmationResponse')
  }

  if (normalized.includes('invalid checkout status response')) {
    return t('notifications.errors.invalidCheckoutStatusResponse')
  }

  return t('notifications.errors.title')
}

const currentError = computed(() => localizeNotificationError(transientError.value || error.value))

const localeMap: Record<string, string> = {
  es: 'es-CO',
  en: 'en-US',
  pt: 'pt-BR'
}

const receiptFilename = computed(() => {
  return buildReceiptFilename(confirmation.value?.receipt_number || null)
})

const receiptReference = computed(() => {
  const value = confirmation.value?.receipt_number
  if (value) return `#${value}`

  const reservationId = confirmation.value?.reservation_id || ''
  if (!reservationId) return '#'

  const seed = reservationId.replace(/[^a-fA-F0-9]/g, '')
  const numericSeed = Number.parseInt(seed.slice(0, 10), 16)
  const safeValue = Number.isFinite(numericSeed) ? numericSeed : 0

  return `#TH-${String((safeValue % 90000) + 10000)}`
})

const stayDates = computed(() => {
  if (!confirmation.value) return '-'
  return `${formatDate(confirmation.value.check_in_date)} - ${formatDate(confirmation.value.check_out_date)}`
})

const checkInDate = computed(() => {
  return confirmation.value ? formatDate(confirmation.value.check_in_date) : '-'
})

const staySummary = computed(() => {
  if (!confirmation.value?.check_in_date || !confirmation.value?.check_out_date) return '-'

  const start = new Date(`${confirmation.value.check_in_date}T00:00:00`)
  const end = new Date(`${confirmation.value.check_out_date}T00:00:00`)

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return stayDates.value
  }

  const formatter = new Intl.DateTimeFormat(localeMap[locale.value] || 'en-US', {
    month: 'short',
    day: 'numeric'
  })

  const yearFormatter = new Intl.DateTimeFormat(localeMap[locale.value] || 'en-US', {
    year: 'numeric'
  })

  return `${formatter.format(start)} - ${formatter.format(end)}, ${yearFormatter.format(end)}`
})

function formatDate(value: string | null) {
  if (!value) return '-'
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00`)
    : new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(localeMap[locale.value] || 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(parsed)
}

function formatMoney(amountInCents: number, currency: string) {
  try {
    return new Intl.NumberFormat(localeMap[locale.value] || 'en-US', {
      style: 'currency',
      currency
    }).format(amountInCents / 100)
  } catch {
    return `${(amountInCents / 100).toFixed(2)} ${currency}`
  }
}

function downloadReceipt() {
  if (!confirmation.value) return

  const blob = createPaymentReceiptPdf({
    summary: confirmation.value,
    formattedDates: `${formatDate(confirmation.value.check_in_date)} - ${formatDate(confirmation.value.check_out_date)}`,
    formattedAmount: formatMoney(confirmation.value.amount_in_cents, confirmation.value.currency),
    labels: {
      brand: t('common.appName'),
      badge: t('notifications.summary.badge'),
      paidBadge: t('notifications.receipt.paidBadge'),
      title: t('notifications.receipt.pdfTitle'),
      subtitle: t('notifications.receipt.pdfSubtitle'),
      receipt: t('notifications.receipt.title'),
      reservationId: t('notifications.summary.reservationId'),
      paymentId: t('notifications.summary.paymentId'),
      property: t('notifications.summary.property'),
      dates: t('notifications.summary.dates'),
      amountPaid: t('notifications.summary.amountPaid'),
      propertyFallback: t('notifications.summary.propertyFallback'),
      pending: t('notifications.receipt.pending'),
      footer: t('notifications.receipt.footer')
    }
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = receiptFilename.value
  anchor.click()
  setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 1000)
}

async function loadPageState() {
  transientError.value = null
  verificationExpired.value = false

  if (paymentId.value) {
    try {
      await loadConfirmation(paymentId.value)
    } catch {
      transientError.value = error.value || 'notifications.errors.title'
    }
    return
  }

  if (transactionId.value) {
    isReconciling.value = true
    const outcome = await reconcilePaymentTransaction(transactionId.value, {
      maxAttempts: 6,
      intervalMs: 5000
    })
    isReconciling.value = false

    if (outcome.status === 'confirmed') {
      await router.replace({
        path: '/notifications/payment-confirmation',
        query: { paymentId: outcome.paymentId }
      })
      return
    }

    if (outcome.status === 'failed') {
      transientError.value = outcome.error || 'notifications.verification.failed'
      return
    }

    verificationExpired.value = true
    return
  }

  transientError.value = 'notifications.errors.missingReference'
}

async function retryVerification() {
  if (!transactionId.value) return
  await loadPageState()
}

async function goToReservations() {
  await navigateTo('/reservations')
}

async function goToCheckout() {
  await navigateTo('/checkout')
}

async function backToHome() {
  await navigateTo('/')
}

onMounted(loadPageState)

useSeoMeta({
  title: () => `${t('notifications.meta.title')} - ${t('common.appName')}`
})

definePageMeta({
  layout: 'default'
})
</script>

<template>
  <div class="min-h-screen bg-[#f4f6fb] py-10 md:py-14">
    <div class="mx-auto max-w-[920px] px-4">
      <div
        v-if="loading && !confirmation"
        class="py-16 text-center"
      >
        <USpin class="mx-auto mb-4" />
        <p class="text-slate-500">
          {{ t('common.loading') }}
        </p>
      </div>

      <div
        v-else-if="isReconciling"
        class="mx-auto max-w-[720px] rounded-[28px] border border-amber-200 bg-white p-8 shadow-sm"
      >
        <div class="mb-6 flex justify-center">
          <div class="flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
            <UIcon
              name="i-lucide-loader-circle"
              class="h-10 w-10 animate-spin text-amber-600"
            />
          </div>
        </div>

        <div class="text-center">
          <h1 class="text-4xl font-bold tracking-tight text-slate-900">
            {{ t('notifications.verification.title') }}
          </h1>
          <p class="mt-3 text-lg text-slate-600">
            {{ t('notifications.verification.subtitle') }}
          </p>
          <p class="mx-auto mt-6 max-w-[560px] text-sm leading-6 text-slate-500">
            {{ t('notifications.verification.description') }}
          </p>
        </div>
      </div>

      <UAlert
        v-else-if="currentError"
        icon="i-lucide-alert-triangle"
        color="warning"
        :title="verificationExpired ? t('notifications.verification.title') : t('notifications.errors.title')"
        :description="verificationExpired ? t('notifications.verification.expired') : currentError"
        class="mx-auto max-w-[720px]"
      >
        <template #actions>
          <div class="flex flex-wrap gap-3">
            <UButton
              v-if="verificationExpired"
              color="warning"
              variant="soft"
              @click="retryVerification"
            >
              {{ t('notifications.actions.retryVerification') }}
            </UButton>
            <UButton
              color="neutral"
              variant="soft"
              @click="goToCheckout"
            >
              {{ t('notifications.actions.backToCheckout') }}
            </UButton>
          </div>
        </template>
      </UAlert>

      <div
        v-else-if="confirmation"
        class="mx-auto max-w-[760px] space-y-8"
      >
        <div class="pt-2 text-center">
          <div class="mb-6 flex justify-center">
            <div class="flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[#dff7e8]">
              <UIcon
                name="i-lucide-circle-check-big"
                class="h-8 w-8 text-[#16a34a]"
              />
            </div>
          </div>
          <h1 class="text-[34px] leading-[1.02] font-bold tracking-tight text-slate-900 md:text-[50px]">
            <span data-cy="payment-confirmation-title">{{ t('notifications.success.title') }}</span>
          </h1>
          <p class="mx-auto mt-2 max-w-[520px] text-[16px] leading-7 text-slate-500">
            {{ t('notifications.success.subtitle') }}
          </p>
        </div>

        <div class="overflow-hidden rounded-2xl border border-[#dbe4ef] bg-white shadow-[0_2px_10px_rgba(15,23,42,0.04)]">
          <div class="grid grid-cols-1 md:grid-cols-[260px_1fr]">
            <div class="h-[172px] md:h-full">
              <img
                src="/mock/property-1.svg"
                :alt="confirmation.property_name || t('notifications.summary.propertyFallback')"
                class="h-full w-full object-cover"
              >
            </div>

            <div class="flex flex-col justify-center p-7 md:px-8 md:py-6">
              <div class="mb-4 flex items-start justify-between gap-4">
                <p class="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#2563eb]">
                  {{ t('notifications.summary.badge') }}
                </p>
                <p class="pt-0.5 text-[14px] font-medium text-slate-400">
                  {{ receiptReference }}
                </p>
              </div>

              <h2 class="mb-5 max-w-[400px] text-[18px] font-semibold leading-[1.35] text-slate-900 md:text-[19px]">
                {{ confirmation.property_name || t('notifications.summary.propertyFallback') }}
              </h2>

              <div class="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div class="flex items-start gap-2.5">
                  <UIcon
                    name="i-lucide-calendar-range"
                    class="mt-0.5 h-4.5 w-4.5 text-[#2563eb]"
                  />
                  <div>
                    <p class="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                      {{ t('notifications.summary.dates') }}
                    </p>
                    <p class="text-[14px] leading-5 font-medium text-slate-700">
                      {{ checkInDate }}
                    </p>
                  </div>
                </div>

                <div class="flex items-start gap-2.5">
                  <UIcon
                    name="i-lucide-wallet"
                    class="mt-0.5 h-4.5 w-4.5 text-[#2563eb]"
                  />
                  <div>
                    <p class="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                      {{ t('notifications.summary.amountPaid') }}
                    </p>
                    <p class="text-[14px] leading-5 font-medium text-slate-700">
                      {{ formatMoney(confirmation.amount_in_cents, confirmation.currency) }}
                    </p>
                  </div>
                </div>
              </div>

              <div class="mb-4 rounded-xl bg-slate-50/80 px-3 py-2.5">
                <p class="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  {{ t('notifications.summary.stay') }}
                </p>
                <p class="mt-1 text-[13px] font-medium text-slate-700">
                  {{ staySummary }}
                </p>
              </div>

              <div class="mb-5 border-t border-slate-100 pt-4">
                <div>
                  <p class="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    {{ t('notifications.summary.reservationId') }}
                  </p>
                  <p class="mt-1 text-[13px] break-all font-medium text-slate-700">
                    <span data-cy="payment-confirmation-reservation-id">{{ confirmation.reservation_id }}</span>
                  </p>
                </div>
              </div>

              <div class="flex flex-wrap gap-3">
                <UButton
                  data-cy="payment-confirmation-view-reservations"
                  icon="i-lucide-suitcase"
                  class="rounded-xl px-4 py-2 text-[14px] font-semibold"
                  @click="goToReservations"
                >
                  {{ t('notifications.actions.viewReservations') }}
                </UButton>
                <UButton
                  data-cy="payment-confirmation-download-receipt"
                  icon="i-lucide-download"
                  color="neutral"
                  variant="soft"
                  class="rounded-xl bg-[#f5f7fb] px-4 py-2 text-[14px] font-semibold text-slate-700 hover:bg-[#eef3fb]"
                  @click="downloadReceipt"
                >
                  {{ t('notifications.actions.downloadReceipt') }}
                </UButton>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-4">
          <h3 class="text-[20px] font-bold tracking-tight text-slate-900 md:text-[22px]">
            {{ t('booking.nextSteps') }}
          </h3>

          <div class="rounded-2xl border border-[#dbe4ef] bg-white px-5 py-6 shadow-[0_2px_10px_rgba(15,23,42,0.03)] md:min-h-[122px] md:px-6">
            <div class="flex items-start gap-4">
              <div class="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#edf3ff]">
                <UIcon
                  name="i-lucide-key-round"
                  class="h-4.5 w-4.5 text-[#2563eb]"
                />
              </div>
              <div class="pt-1">
                <p class="mb-1 text-[15px] font-semibold text-slate-900">
                  {{ t('booking.checkInInstructions') }}
                </p>
                <p class="max-w-[250px] text-[14px] leading-6 text-slate-500">
                  {{ t('booking.checkInInstructionsDescription') }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="pt-2">
          <div class="mb-7 border-t border-slate-200" />
          <div class="text-center">
            <button
              data-cy="payment-confirmation-back-home"
              class="inline-flex items-center gap-2 text-[15px] font-medium text-slate-500 transition-colors hover:text-slate-700"
              @click="backToHome"
            >
              <UIcon
                name="i-lucide-arrow-left"
                class="h-4 w-4"
              />
              {{ t('booking.backHome') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
