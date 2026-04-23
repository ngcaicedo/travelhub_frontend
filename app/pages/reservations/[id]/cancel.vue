<script setup lang="ts">
import type { ReservationConfirmResponse, ReservationResponse, ReservationStatus } from '~/types/reservations'
import { buildReservationPolicyItems, formatReservationRefundType } from '~/utils/reservationPolicy'

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()
const authStore = useAuthStore()
const {
  getReservation,
  previewCancellation,
  confirmCancellation,
  pollReservationUntilFinal,
  buildIdempotencyKey
} = useReservations()

const reservationId = route.params.id as string

const loading = ref(true)
const submitLoading = ref(false)
const error = ref<string | null>(null)
const pollTimeout = ref(false)
const reason = ref('')
const reservation = ref<ReservationResponse | null>(null)
const preview = ref<Awaited<ReturnType<typeof previewCancellation>> | null>(null)
const confirmResponse = ref<ReservationConfirmResponse | null>(null)

const localeMap: Record<string, string> = {
  es: 'es-CO',
  en: 'en-US',
  pt: 'pt-BR'
}

const terminalStatuses: ReservationStatus[] = ['refund_completed', 'refund_failed', 'cancelled']

const statusLabel = computed(() => {
  if (!reservation.value) return t('status.unknown')
  return t(`status.${reservation.value.status}`)
})

const policyItems = computed(() => buildReservationPolicyItems(preview.value?.policy_applied, t))

const refundTypeLabel = computed(() => {
  if (!preview.value?.change_allowed) return ''

  return formatReservationRefundType(preview.value.refund_type, t)
})

function formatMoney(value: string, currency: string) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return `${value} ${currency}`

  try {
    return new Intl.NumberFormat(localeMap[locale.value] || 'en-US', {
      style: 'currency',
      currency
    }).format(numeric)
  } catch {
    return `${value} ${currency}`
  }
}

async function loadData() {
  loading.value = true
  error.value = null

  try {
    const [reservationResponse, previewResponse] = await Promise.all([
      getReservation(reservationId),
      previewCancellation(reservationId)
    ])

    reservation.value = reservationResponse
    preview.value = previewResponse
  } catch (err) {
    error.value = t('errors.failed')
    console.error('Failed to load cancellation data:', err)
  } finally {
    loading.value = false
  }
}

async function pollUntilFinal() {
  pollTimeout.value = false

  const result = await pollReservationUntilFinal(reservationId, {
    maxAttempts: 8,
    intervalMs: 3000,
    terminalStatuses
  })

  reservation.value = result.reservation

  if (result.state === 'timeout') {
    pollTimeout.value = true
    return
  }

  await router.push(`/reservations/${reservationId}/cancelled`)
}

async function confirmCancellationFlow() {
  if (!reservation.value) return

  const travelerId = authStore.userId
  if (!travelerId) {
    await router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }

  submitLoading.value = true
  error.value = null

  try {
    const response = await confirmCancellation(reservationId, travelerId, {
      idempotency_key: buildIdempotencyKey('reservation-cancellation'),
      reason: reason.value || undefined
    })

    confirmResponse.value = response

    if (terminalStatuses.includes(response.status_after)) {
      await router.push(`/reservations/${reservationId}/cancelled`)
      return
    }

    await pollUntilFinal()
  } catch (err) {
    error.value = t('errors.failed')
    console.error('Cancellation confirmation failed:', err)
  } finally {
    submitLoading.value = false
  }
}

async function keepReservation() {
  await router.push(`/reservations/${reservationId}`)
}

onMounted(async () => {
  await loadData()
})

useSeoMeta({
  title: () => `${t('reservationFlow.cancel.metaTitle')} - ${t('common.appName')}`
})

definePageMeta({
  layout: 'default'
})
</script>

<template>
  <div class="min-h-screen bg-[#f4f6fb] py-8 md:py-12">
    <div class="mx-auto max-w-[1020px] px-4">
      <div class="mb-8">
        <h1 class="text-4xl font-bold tracking-tight text-slate-900">
          {{ t('reservationFlow.cancel.title') }}
        </h1>
        <p class="mt-2 text-slate-500">
          {{ t('reservationFlow.cancel.subtitle') }}
        </p>
      </div>

      <UAlert
        v-if="error"
        icon="i-lucide-alert-circle"
        color="error"
        :title="error"
        class="mb-4"
      />

      <div
        v-if="loading"
        class="rounded-2xl border border-slate-200 bg-white p-8 text-center"
      >
        <UIcon name="i-lucide-loader-circle" class="mx-auto mb-2 size-6 animate-spin text-travelhub-500" />
        <p class="text-slate-600">{{ t('common.loading') }}</p>
      </div>

      <div
        v-else-if="reservation && preview"
        class="grid gap-6 lg:grid-cols-[1fr_320px]"
      >
        <div class="space-y-4">
          <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p class="text-sm text-slate-500">{{ t('reservationFlow.cancel.reservationLabel') }} #{{ reservation.id }}</p>
            <p class="mt-2 text-xl font-semibold text-slate-900">{{ statusLabel }}</p>
            <div
              v-if="policyItems.length"
              class="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4"
            >
              <p class="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                {{ t('reservationFlow.policy.title') }}
              </p>
              <ul class="space-y-2">
                <li
                  v-for="item in policyItems"
                  :key="item.key"
                  class="flex items-start justify-between gap-4 text-sm"
                >
                  <span class="font-medium text-slate-700">{{ item.label }}</span>
                  <span class="text-right text-slate-600">{{ item.value }}</span>
                </li>
              </ul>
            </div>
            <p v-else class="mt-2 text-sm text-slate-600">
              {{ t('reservationFlow.cancel.policyMissing') }}
            </p>
          </div>

          <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <UFormField :label="t('reservationFlow.cancel.reasonLabel')" name="reason">
              <UTextarea
                v-model="reason"
                :rows="4"
                :placeholder="t('reservationFlow.cancel.reasonPlaceholder')"
              />
            </UFormField>
          </div>

          <UAlert
            v-if="pollTimeout"
            icon="i-lucide-clock-alert"
            color="warning"
            :title="t('reservationFlow.polling.pendingTitle')"
            :description="t('reservationFlow.polling.pendingDescription')"
          >
            <template #actions>
              <UButton
                color="warning"
                variant="soft"
                @click="pollUntilFinal"
              >
                {{ t('reservationFlow.polling.retryButton') }}
              </UButton>
            </template>
          </UAlert>
        </div>

        <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 class="text-xl font-semibold text-slate-900">{{ t('reservationFlow.cancel.refundBreakdown') }}</h2>

          <div class="mt-4 space-y-3 border-b border-slate-200 pb-4 text-sm">
            <div class="flex justify-between text-slate-700">
              <span>{{ t('reservationFlow.cancel.refundAmount') }}</span>
              <span class="font-medium">{{ formatMoney(preview.refund_amount, reservation.currency) }}</span>
            </div>
            <div class="flex justify-between text-slate-700">
              <span>{{ t('reservationFlow.cancel.penaltyAmount') }}</span>
              <span class="font-medium">{{ formatMoney(preview.penalty_amount, reservation.currency) }}</span>
            </div>
            <div
              v-if="refundTypeLabel"
              class="flex justify-between text-slate-700"
            >
              <span>{{ t('reservationFlow.cancel.refundType') }}</span>
              <span class="font-medium">{{ refundTypeLabel }}</span>
            </div>
          </div>

          <p class="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
            {{ preview.change_allowed ? t('reservationFlow.cancel.allowed') : t('reservationFlow.cancel.notAllowed') }}
          </p>

          <div class="mt-6 space-y-3">
            <UButton
              block
              color="error"
              :loading="submitLoading"
              :disabled="!preview.change_allowed"
              @click="confirmCancellationFlow"
            >
              {{ t('reservationFlow.cancel.confirmButton') }}
            </UButton>

            <UButton
              block
              color="neutral"
              variant="soft"
              @click="keepReservation"
            >
              {{ t('reservationFlow.cancel.keepButton') }}
            </UButton>
          </div>

          <div v-if="confirmResponse" class="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
            {{ t('reservationFlow.cancel.statusAfter') }}: {{ t(`status.${confirmResponse.status_after}`) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
