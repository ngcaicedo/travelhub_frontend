<script setup lang="ts">
const { t } = useI18n()
const router = useRouter()
const tracker = usePaymentStatusTracker()

const trackerState = tracker.state

function isTranslationKey(value: string) {
  return /^[a-z]+(?:\.[a-zA-Z0-9_-]+)+$/.test(value)
}

function resolveFailureMessage(value: string | null) {
  if (!value) return t('payments.feedback.requestErrorDescription')
  if (isTranslationKey(value)) return t(value)

  const normalized = value.toLowerCase()
  if (normalized.includes('insufficient_funds') || normalized.includes('fondos insuficientes')) {
    return t('payments.feedback.failureInsufficient')
  }
  if (normalized.includes('card_declined') || normalized.includes('tarjeta fue rechazada') || normalized.includes('tarjeta rechazada')) {
    return t('payments.feedback.failureDeclined')
  }
  return value
}

const toneClass = computed(() => trackerState.value.status === 'confirmed'
  ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
  : trackerState.value.status === 'failed'
    ? 'border-rose-200 bg-rose-50 text-rose-950'
    : 'border-blue-200 bg-blue-50 text-blue-950')

const title = computed(() => trackerState.value.status === 'confirmed'
  ? t('payments.feedback.successTitle')
  : trackerState.value.status === 'failed'
    ? t('payments.feedback.failureTitle')
    : t('payments.actions.processing'))

const description = computed(() => trackerState.value.status === 'confirmed'
  ? t('notifications.success.subtitle')
  : trackerState.value.status === 'failed'
    ? resolveFailureMessage(trackerState.value.error)
    : t('payments.feedback.pendingVerificationDescription'))

async function goToConfirmation() {
  if (!trackerState.value.paymentId) return
  await router.push({
    path: '/notifications/payment-confirmation',
    query: { paymentId: trackerState.value.paymentId }
  })
}

async function goToCheckout() {
  await router.push({
    path: '/checkout',
    query: tracker.buildCheckoutQuery()
  })
}
</script>

<template>
  <div
    v-if="trackerState.visible && trackerState.status !== 'idle'"
    class="sticky top-0 z-40 border-b shadow-sm"
    :class="toneClass"
  >
    <div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
      <div class="min-w-0">
        <p class="text-sm font-semibold">
          {{ title }}
        </p>
        <p class="text-sm opacity-90">
          {{ description }}
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <UButton
          v-if="trackerState.status === 'confirmed'"
          color="neutral"
          variant="solid"
          size="sm"
          @click="goToConfirmation"
        >
          {{ t('notifications.meta.title') }}
        </UButton>
        <UButton
          v-if="trackerState.status === 'failed'"
          color="neutral"
          variant="solid"
          size="sm"
          @click="goToCheckout"
        >
          {{ t('notifications.actions.backToCheckout') }}
        </UButton>
        <UButton
          v-if="trackerState.status === 'confirmed' || trackerState.status === 'failed'"
          color="neutral"
          variant="ghost"
          size="sm"
          icon="i-lucide-x"
          @click="tracker.dismiss()"
        />
      </div>
    </div>
  </div>
</template>
