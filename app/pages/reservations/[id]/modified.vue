<script setup lang="ts">
import type { ReservationResponse, ReservationHistoryEvent } from '~/types/reservations'
import { getReservationHistory } from '~/services/reservationService'

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()
const authStore = useAuthStore()
const { getReservation } = useReservations()

const reservationId = route.params.id as string

const loading = ref(true)
const error = ref<string | null>(null)
const reservation = ref<ReservationResponse | null>(null)
const historyEvents = ref<ReservationHistoryEvent[]>([])

const localeMap: Record<string, string> = {
  es: 'es-CO',
  en: 'en-US',
  pt: 'pt-BR'
}

const statusLabel = computed(() => {
  if (!reservation.value) return t('status.unknown')
  return t(`status.${reservation.value.status}`)
})

const statusTitle = computed(() => {
  const status = reservation.value?.status

  if (status === 'modification_confirmed') return t('reservationFlow.modified.title.modification_confirmed')
  if (status === 'additional_charge_failed') return t('reservationFlow.modified.title.additional_charge_failed')
  if (status === 'refund_failed') return t('reservationFlow.modified.title.refund_failed')
  if (status === 'modification_pending_payment' || status === 'refund_pending') {
    return t('reservationFlow.modified.title.pending')
  }

  return t('reservationFlow.modified.title.default')
})

const statusDescription = computed(() => {
  const status = reservation.value?.status

  if (status === 'modification_confirmed') {
    return t('reservationFlow.modified.description.modification_confirmed')
  }

  if (status === 'additional_charge_failed') {
    return t('reservationFlow.modified.description.additional_charge_failed')
  }

  if (status === 'refund_failed') {
    return t('reservationFlow.modified.description.refund_failed')
  }

  if (status === 'modification_pending_payment' || status === 'refund_pending') {
    return t('reservationFlow.modified.description.pending')
  }

  return t('reservationFlow.modified.description.default')
})

const showOnsitePaymentMessage = computed(() => {
  return reservation.value?.status === 'modification_pending_payment'
})

const pendingModification = computed(() => {
  if (!historyEvents.value.length) return null

  const modificationConfirmed = historyEvents.value.find(
    e => e.type === 'modification_confirmed' || e.type === 'modification_pre_confirmed'
  )
  return modificationConfirmed || null
})

const displayCheckIn = computed(() => {
  if (pendingModification.value?.metadata?.check_in_date) {
    return formatDateTime(pendingModification.value.metadata.check_in_date as string, 'checkIn')
  }
  return reservation.value?.check_in_date ? formatDateTime(reservation.value.check_in_date, 'checkIn') : '-'
})

const displayCheckOut = computed(() => {
  if (pendingModification.value?.metadata?.check_out_date) {
    return formatDateTime(pendingModification.value.metadata.check_out_date as string, 'checkOut')
  }
  return reservation.value?.check_out_date ? formatDateTime(reservation.value.check_out_date, 'checkOut') : '-'
})

const displayGuests = computed(() => {
  if (pendingModification.value?.metadata?.number_of_guests) {
    return pendingModification.value.metadata.number_of_guests
  }
  return reservation.value?.number_of_guests || 1
})

function formatDateTime(dateStr: string, type: 'checkIn' | 'checkOut' | 'default' = 'default'): string {
  try {
    const date = new Date(dateStr)
    if (type === 'checkIn') {
      date.setHours(15, 0, 0, 0)
    } else if (type === 'checkOut') {
      date.setHours(11, 0, 0, 0)
    }
    return date.toLocaleString(localeMap[locale.value] || 'es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return dateStr
  }
}

async function loadReservation() {
  loading.value = true
  error.value = null

  try {
    reservation.value = await getReservation(reservationId, authStore.userId || undefined)

    if (reservation.value?.status === 'modification_pending_payment' || reservation.value?.status === 'refund_pending') {
      const history = await getReservationHistory(reservationId, authStore.userId || '')
      historyEvents.value = history.events || []
    }
  } catch (err) {
    error.value = t('errors.failed')
    console.error('Failed to load modified reservation details:', err)
  } finally {
    loading.value = false
  }
}

async function goToReservations() {
  await router.push('/reservations')
}

async function goToDetail() {
  await router.push(`/reservations/${reservationId}`)
}

onMounted(async () => {
  if (!authStore.userId) {
    await router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }

  await loadReservation()
})

useSeoMeta({
  title: () => `${t('reservationFlow.modified.metaTitle')} - ${t('common.appName')}`
})

definePageMeta({
  layout: 'default'
})
</script>

<template>
  <div class="min-h-screen bg-[#f4f6fb] py-10 md:py-14">
    <div class="mx-auto max-w-[860px] px-4">
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
        class="space-y-6"
      >
        <div class="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div class="mb-4 flex justify-center">
            <div class="flex h-14 w-14 items-center justify-center rounded-full bg-[#dff7e8]">
              <UIcon name="i-lucide-circle-check-big" class="h-7 w-7 text-[#16a34a]" />
            </div>
          </div>

          <h1 class="text-4xl font-bold tracking-tight text-slate-900">
            {{ statusTitle }}
          </h1>
          <p class="mx-auto mt-3 max-w-[520px] text-slate-500">
            {{ statusDescription }}
          </p>

          <UAlert
            v-if="showOnsitePaymentMessage"
            icon="i-lucide-info"
            color="warning"
            class="mx-auto mt-5 max-w-[620px] text-left"
            title="El pago adicional se realizará en el lugar de la reserva al momento de realizar check-in."
          />

          <div class="mt-8 overflow-hidden rounded-2xl border border-slate-200">
            <img
              src="/mock/property-1.svg"
              :alt="t('reservationFlow.modified.imageAlt')"
              class="h-[220px] w-full object-cover"
            >
          </div>

          <div class="mt-6 grid gap-3 sm:grid-cols-2">
            <UButton
              color="primary"
              @click="goToReservations"
            >
              {{ t('reservationFlow.modified.returnToReservations') }}
            </UButton>
            <UButton
              color="neutral"
              variant="soft"
              @click="goToDetail"
            >
              {{ t('reservationFlow.modified.viewReservation') }}
            </UButton>
          </div>
        </div>

        <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 class="text-lg font-semibold text-slate-900">{{ t('reservationFlow.modified.summaryTitle') }}</h2>
          <div class="mt-4 space-y-2 text-sm text-slate-600">
            <p><strong>{{ t('reservationFlow.modified.reservationId') }}:</strong> {{ reservation.id }}</p>
            <p><strong>{{ t('booking.status') }}:</strong> {{ statusLabel }}</p>
            <p><strong>{{ t('booking.checkIn') }}:</strong> {{ displayCheckIn }}</p>
            <p><strong>{{ t('booking.checkOut') }}:</strong> {{ displayCheckOut }}</p>
            <p><strong>{{ t('booking.guests') }}:</strong> {{ displayGuests }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
