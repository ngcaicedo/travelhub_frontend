<script setup lang="ts">
import type { ReservationResponse } from '~/types/reservations'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const authStore = useAuthStore()
const { getReservation } = useReservations()

const reservationId = route.params.id as string

const loading = ref(true)
const error = ref<string | null>(null)
const reservation = ref<ReservationResponse | null>(null)

const statusLabel = computed(() => {
  if (!reservation.value) return t('status.unknown')
  return t(`status.${reservation.value.status}`)
})

const statusTitle = computed(() => {
  const status = reservation.value?.status

  if (status === 'refund_completed') return t('reservationFlow.cancelled.title.refund_completed')
  if (status === 'refund_failed') return t('reservationFlow.cancelled.title.refund_failed')
  if (status === 'cancelled') return t('reservationFlow.cancelled.title.cancelled')
  if (status === 'cancel_requested' || status === 'refund_pending') return t('reservationFlow.cancelled.title.pending')

  return t('reservationFlow.cancelled.title.default')
})

const statusDescription = computed(() => {
  const status = reservation.value?.status

  if (status === 'refund_completed') {
    return t('reservationFlow.cancelled.description.refund_completed')
  }

  if (status === 'refund_failed') {
    return t('reservationFlow.cancelled.description.refund_failed')
  }

  if (status === 'cancelled') {
    return t('reservationFlow.cancelled.description.cancelled')
  }

  if (status === 'cancel_requested' || status === 'refund_pending') {
    return t('reservationFlow.cancelled.description.pending')
  }

  return t('reservationFlow.cancelled.description.default')
})

async function loadReservation() {
  loading.value = true
  error.value = null

  try {
    reservation.value = await getReservation(reservationId, authStore.userId || undefined)
  } catch (err) {
    error.value = t('errors.failed')
    console.error('Failed to load cancelled reservation details:', err)
  } finally {
    loading.value = false
  }
}

async function goToReservations() {
  await router.push('/reservations')
}

async function goToSearch() {
  await router.push('/properties')
}

onMounted(async () => {
  if (!authStore.userId) {
    await router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }

  await loadReservation()
})

useSeoMeta({
  title: () => `${t('reservationFlow.cancelled.metaTitle')} - ${t('common.appName')}`
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
        data-cy="reservation-cancelled"
        :data-cy-status="reservation.status"
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

          <div class="mt-8 overflow-hidden rounded-2xl border border-slate-200">
            <img
              src="/mock/property-1.svg"
              :alt="t('reservationFlow.cancelled.imageAlt')"
              class="h-[220px] w-full object-cover"
            >
          </div>

          <div class="mt-6 grid gap-3 sm:grid-cols-2">
            <UButton
              color="primary"
              @click="goToReservations"
            >
              {{ t('reservationFlow.cancelled.returnToReservations') }}
            </UButton>
            <UButton
              color="neutral"
              variant="soft"
              @click="goToSearch"
            >
              {{ t('reservationFlow.cancelled.findNewStay') }}
            </UButton>
          </div>
        </div>

        <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 class="text-lg font-semibold text-slate-900">{{ t('reservationFlow.cancelled.summaryTitle') }}</h2>
          <div class="mt-4 space-y-2 text-sm text-slate-600">
            <p><strong>{{ t('reservationFlow.cancelled.reservationId') }}:</strong> {{ reservation.id }}</p>
            <p><strong>{{ t('booking.status') }}:</strong> {{ statusLabel }}</p>
            <p><strong>{{ t('booking.checkIn') }}:</strong> {{ reservation.check_in_date }}</p>
            <p><strong>{{ t('booking.checkOut') }}:</strong> {{ reservation.check_out_date }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
