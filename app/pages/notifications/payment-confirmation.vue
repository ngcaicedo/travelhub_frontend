<script setup lang="ts">
const { t, locale } = useI18n()
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

const currentError = computed(() => transientError.value || error.value)

const localeMap: Record<string, string> = {
  es: 'es-CO',
  en: 'en-US',
  pt: 'pt-BR'
}

const receiptFilename = computed(() => {
  if (!confirmation.value?.receipt_number) {
    return 'travelhub-receipt.txt'
  }
  return `travelhub-${confirmation.value.receipt_number}.txt`
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

function buildReceiptContent() {
  if (!confirmation.value) return ''

  return [
    'TravelHub',
    `${t('notifications.receipt.title')}: ${confirmation.value.receipt_number || t('notifications.receipt.pending')}`,
    `${t('notifications.summary.reservationId')}: ${confirmation.value.reservation_id}`,
    `${t('notifications.summary.property')}: ${confirmation.value.property_name || t('notifications.summary.propertyFallback')}`,
    `${t('notifications.summary.dates')}: ${formatDate(confirmation.value.check_in_date)} - ${formatDate(confirmation.value.check_out_date)}`,
    `${t('notifications.summary.amountPaid')}: ${formatMoney(confirmation.value.amount_in_cents, confirmation.value.currency)}`,
    `${t('notifications.summary.paymentId')}: ${confirmation.value.payment_id}`
  ].join('\n')
}

function downloadReceipt() {
  const content = buildReceiptContent()
  if (!content) return

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = receiptFilename.value
  anchor.click()
  URL.revokeObjectURL(url)
}

async function loadPageState() {
  transientError.value = null
  verificationExpired.value = false

  if (paymentId.value) {
    try {
      await loadConfirmation(paymentId.value)
    } catch {
      transientError.value = t('notifications.errors.title')
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
      transientError.value = outcome.error || t('notifications.verification.failed')
      return
    }

    verificationExpired.value = true
    return
  }

  transientError.value = t('notifications.errors.missingReference')
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

onMounted(loadPageState)

useSeoMeta({
  title: () => `${t('notifications.meta.title')} - TravelHub`
})

definePageMeta({
  layout: 'default'
})
</script>

<template>
  <div class="min-h-screen bg-[#f3f5f9] py-10 md:py-14">
    <div class="mx-auto max-w-[880px] px-4">
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
        class="space-y-7"
      >
        <div class="pt-2 text-center">
          <div class="mb-5 flex justify-center">
            <div class="rounded-full bg-green-100/80 p-5">
              <UIcon
                name="i-lucide-badge-check"
                class="h-10 w-10 text-green-600"
              />
            </div>
          </div>
          <h1 class="text-[44px] leading-[1.05] font-bold tracking-tight text-slate-900">
            {{ t('notifications.success.title') }}
          </h1>
          <p class="mt-2 text-[17px] text-slate-500">
            {{ t('notifications.success.subtitle') }}
          </p>
        </div>

        <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div class="grid grid-cols-1 md:grid-cols-[250px_1fr]">
            <div class="h-56 md:h-full">
              <img
                src="/mock/property-1.svg"
                :alt="confirmation.property_name || t('notifications.summary.propertyFallback')"
                class="h-full w-full object-cover"
              >
            </div>

            <div class="p-6 md:p-7">
              <div class="mb-3 flex items-start justify-between gap-3">
                <p class="text-[11px] font-semibold uppercase tracking-[0.14em] text-travelhub-600">
                  {{ t('notifications.summary.badge') }}
                </p>
                <p class="text-xs font-semibold uppercase text-slate-400">
                  {{ confirmation.receipt_number || t('notifications.receipt.pending') }}
                </p>
              </div>

              <h2 class="mb-5 max-w-[420px] text-[30px] font-bold leading-tight text-slate-900">
                {{ confirmation.property_name || t('notifications.summary.propertyFallback') }}
              </h2>

              <div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div class="flex items-start gap-2.5">
                  <UIcon
                    name="i-lucide-calendar-range"
                    class="mt-0.5 h-4 w-4 text-travelhub-600"
                  />
                  <div>
                    <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      {{ t('notifications.summary.dates') }}
                    </p>
                    <p class="text-[15px] font-medium text-slate-700">
                      {{ formatDate(confirmation.check_in_date) }} - {{ formatDate(confirmation.check_out_date) }}
                    </p>
                  </div>
                </div>

                <div class="flex items-start gap-2.5">
                  <UIcon
                    name="i-lucide-wallet"
                    class="mt-0.5 h-4 w-4 text-travelhub-600"
                  />
                  <div>
                    <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      {{ t('notifications.summary.amountPaid') }}
                    </p>
                    <p class="text-[15px] font-medium text-slate-700">
                      {{ formatMoney(confirmation.amount_in_cents, confirmation.currency) }}
                    </p>
                  </div>
                </div>

                <div class="flex items-start gap-2.5">
                  <UIcon
                    name="i-lucide-hash"
                    class="mt-0.5 h-4 w-4 text-travelhub-600"
                  />
                  <div>
                    <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      {{ t('notifications.summary.reservationId') }}
                    </p>
                    <p class="text-[15px] break-all font-medium text-slate-700">
                      {{ confirmation.reservation_id }}
                    </p>
                  </div>
                </div>

                <div class="flex items-start gap-2.5">
                  <UIcon
                    name="i-lucide-credit-card"
                    class="mt-0.5 h-4 w-4 text-travelhub-600"
                  />
                  <div>
                    <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      {{ t('notifications.summary.paymentId') }}
                    </p>
                    <p class="text-[15px] break-all font-medium text-slate-700">
                      {{ confirmation.payment_id }}
                    </p>
                  </div>
                </div>
              </div>

              <div class="flex flex-wrap gap-3">
                <UButton
                  icon="i-lucide-suitcase"
                  class="font-semibold"
                  @click="goToReservations"
                >
                  {{ t('notifications.actions.viewReservations') }}
                </UButton>
                <a
                  href="#"
                  class="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
                  @click.prevent="downloadReceipt"
                >
                  <UIcon
                    name="i-lucide-download"
                    class="h-4 w-4"
                  />
                  {{ t('notifications.actions.downloadReceipt') }}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
