<script setup lang="ts">
import type {
  ReservationConfirmResponse,
  ReservationModificationPreviewResponse,
  ReservationResponse,
  ReservationStatus
} from '~/types/reservations'

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()
const authStore = useAuthStore()
const {
  getReservation,
  previewModification,
  confirmModification,
  pollReservationUntilFinal,
  buildIdempotencyKey
} = useReservations()

const reservationId = route.params.id as string

const loading = ref(true)
const submitLoading = ref(false)
const previewLoading = ref(false)
const error = ref<string | null>(null)
const pollTimeout = ref(false)
const reservation = ref<ReservationResponse | null>(null)
const preview = ref<ReservationModificationPreviewResponse | null>(null)
const confirmResponse = ref<ReservationConfirmResponse | null>(null)

const checkInDate = ref('')
const checkOutDate = ref('')
const numberOfGuests = ref(1)

const localeMap: Record<string, string> = {
  es: 'es-CO',
  en: 'en-US',
  pt: 'pt-BR'
}

const terminalStatuses: ReservationStatus[] = [
  'modification_confirmed',
  'additional_charge_failed',
  'refund_failed'
]

const statusLabel = computed(() => {
  if (!reservation.value) return t('status.unknown')
  return t(`status.${reservation.value.status}`)
})

function formatDateInput(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ''

  const year = parsed.getFullYear()
  const month = String(parsed.getMonth() + 1).padStart(2, '0')
  const day = String(parsed.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function serializeDate(dateValue: string): string {
  const [yearPart, monthPart, dayPart] = dateValue.split('-')
  const year = Number(yearPart)
  const month = Number(monthPart)
  const day = Number(dayPart)

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return new Date().toISOString()
  }

  return new Date(Date.UTC(year, month - 1, day)).toISOString()
}

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

const canConfirm = computed(() => {
  if (!reservation.value || !preview.value) return false
  return preview.value.change_allowed && !!checkInDate.value && !!checkOutDate.value && numberOfGuests.value > 0
})

async function loadReservation() {
  loading.value = true
  error.value = null

  try {
    const response = await getReservation(reservationId)
    reservation.value = response
    checkInDate.value = formatDateInput(response.check_in_date)
    checkOutDate.value = formatDateInput(response.check_out_date)
    numberOfGuests.value = response.number_of_guests || 1
  } catch (err) {
    error.value = t('errors.failed')
    console.error('Failed to load reservation for modification:', err)
  } finally {
    loading.value = false
  }
}

async function runPreview() {
  if (!checkInDate.value || !checkOutDate.value || !reservation.value) return

  previewLoading.value = true
  error.value = null

  try {
    preview.value = await previewModification(reservationId, {
      check_in_date: serializeDate(checkInDate.value),
      check_out_date: serializeDate(checkOutDate.value),
      number_of_guests: numberOfGuests.value
    })
  } catch (err) {
    error.value = t('errors.failed')
    console.error('Modification preview failed:', err)
  } finally {
    previewLoading.value = false
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

  await loadReservation()
}

async function confirmChanges() {
  if (!reservation.value || !canConfirm.value) return

  const travelerId = authStore.userId
  if (!travelerId) {
    await router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }

  submitLoading.value = true
  error.value = null

  try {
    const response = await confirmModification(reservationId, travelerId, {
      idempotency_key: buildIdempotencyKey('reservation-modification'),
      check_in_date: serializeDate(checkInDate.value),
      check_out_date: serializeDate(checkOutDate.value),
      number_of_guests: numberOfGuests.value
    })

    confirmResponse.value = response

    if (terminalStatuses.includes(response.status_after)) {
      await loadReservation()
      return
    }

    await pollUntilFinal()
  } catch (err) {
    error.value = t('errors.failed')
    console.error('Modification confirmation failed:', err)
  } finally {
    submitLoading.value = false
  }
}

async function goToDetail() {
  await router.push(`/reservations/${reservationId}`)
}

onMounted(async () => {
  await loadReservation()
  if (reservation.value?.status === 'confirmed') {
    await runPreview()
  }
})

useSeoMeta({
  title: () => `${t('reservationFlow.modify.metaTitle')} - ${t('common.appName')}`
})

definePageMeta({
  layout: 'default'
})
</script>

<template>
  <div class="min-h-screen bg-[#f4f6fb] py-8 md:py-12">
    <div class="mx-auto max-w-[980px] px-4">
      <div class="mb-6 flex items-center justify-between">
        <h1 class="text-3xl font-bold tracking-tight text-slate-900">
          {{ t('reservationFlow.modify.title') }}
        </h1>
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-lucide-arrow-left"
          @click="goToDetail"
        >
          {{ t('reservationFlow.modify.backToReservation') }}
        </UButton>
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
        v-else-if="reservation"
        class="grid gap-6 lg:grid-cols-[1fr_320px]"
      >
        <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div class="mb-6">
            <p class="text-sm text-slate-500">{{ t('reservationFlow.modify.currentStatus') }}</p>
            <p class="mt-1 text-xl font-semibold text-slate-900">{{ statusLabel }}</p>
          </div>

          <UForm class="space-y-4" @submit.prevent="runPreview">
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
              <UFormField :label="t('booking.checkIn')" name="checkInDate">
                <UInput v-model="checkInDate" type="date" required />
              </UFormField>

              <UFormField :label="t('booking.checkOut')" name="checkOutDate">
                <UInput v-model="checkOutDate" type="date" required />
              </UFormField>
            </div>

            <UFormField :label="t('booking.guests')" name="numberOfGuests">
              <UInputNumber v-model="numberOfGuests" :min="1" />
            </UFormField>

            <div class="flex flex-wrap gap-3 pt-2">
              <UButton
                type="submit"
                color="neutral"
                variant="soft"
                :loading="previewLoading"
              >
                {{ t('reservationFlow.modify.recalculatePreview') }}
              </UButton>

              <UButton
                color="primary"
                :disabled="!canConfirm"
                :loading="submitLoading"
                @click="confirmChanges"
              >
                {{ t('reservationFlow.modify.confirmModification') }}
              </UButton>
            </div>
          </UForm>

          <UAlert
            v-if="pollTimeout"
            icon="i-lucide-clock-alert"
            color="warning"
            :title="t('reservationFlow.polling.pendingTitle')"
            :description="t('reservationFlow.polling.pendingDescription')"
            class="mt-6"
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

        <div class="space-y-4">
          <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 class="text-lg font-semibold text-slate-900">{{ t('reservationFlow.modify.previewSummary') }}</h2>

            <div v-if="preview" class="mt-4 space-y-3 text-sm">
              <div class="flex justify-between text-slate-700">
                <span>{{ t('reservationFlow.modify.changeAllowed') }}</span>
                <span class="font-medium">{{ preview.change_allowed ? t('common.yes') : t('common.no') }}</span>
              </div>
              <div class="flex justify-between text-slate-700">
                <span>{{ t('reservationFlow.modify.deltaAmount') }}</span>
                <span class="font-medium">{{ formatMoney(preview.delta_amount, reservation.currency) }}</span>
              </div>
              <div class="flex justify-between text-slate-700">
                <span>{{ t('reservationFlow.modify.estimatedRefund') }}</span>
                <span class="font-medium">{{ formatMoney(preview.estimated_refund_amount, reservation.currency) }}</span>
              </div>
              <div class="flex justify-between text-slate-700">
                <span>{{ t('reservationFlow.modify.additionalCharge') }}</span>
                <span class="font-medium">{{ preview.requires_additional_charge ? t('reservationFlow.modify.required') : t('common.no') }}</span>
              </div>
              <p class="rounded-xl bg-slate-50 p-3 text-slate-600">
                {{ preview.policy_applied || t('reservationFlow.modify.noPolicy') }}
              </p>
            </div>

            <p v-else class="mt-3 text-sm text-slate-500">
              {{ t('reservationFlow.modify.runPreviewHint') }}
            </p>
          </div>

          <div
            v-if="confirmResponse"
            class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
              <h3 class="text-base font-semibold text-slate-900">{{ t('reservationFlow.modify.lastConfirmation') }}</h3>
              <p class="mt-2 text-sm text-slate-600">{{ t('reservationFlow.modify.statusBefore') }}: {{ t(`status.${confirmResponse.status_before}`) }}</p>
              <p class="text-sm text-slate-600">{{ t('reservationFlow.modify.statusAfter') }}: {{ t(`status.${confirmResponse.status_after}`) }}</p>
              <p class="text-sm text-slate-600">{{ t('reservationFlow.modify.action') }}: {{ confirmResponse.action_applied }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
