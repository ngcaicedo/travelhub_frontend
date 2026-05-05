<script setup lang="ts">
import type { Property } from '~/types/api'
import type {
  HotelReservationListItem,
  ReservationCancellationReason
} from '~/types/reservations'
import {
  cancelHotelReservation,
  getHotelReservations
} from '~/services/reservationService'
import { getAllProperties } from '~/services/propertyServices'

const authStore = useAuthStore()
const route = useRoute()
const { t, locale } = useI18n()

const loading = ref(false)
const actingId = ref<string | null>(null)
const error = ref<string | null>(null)
const success = ref<string | null>(null)
const properties = ref<Property[]>([])
const reservations = ref<HotelReservationListItem[]>([])
const selectedPropertyId = ref<string>('')
const statusFilter = ref<string>('all')
const cancelTargetId = ref<string | null>(null)
const cancelReason = ref<ReservationCancellationReason>('maintenance')
const cancelNote = ref('')

const localeMap: Record<string, string> = {
  es: 'es-CO',
  en: 'en-US',
  pt: 'pt-BR'
}

const statusOptions = computed(() => [
  { label: t('hotelReservations.filters.allStatuses'), value: 'all' },
  { label: t('hotelReservations.status.pending_payment'), value: 'pending_payment' },
  { label: t('hotelReservations.status.confirmed'), value: 'confirmed' },
  { label: t('hotelReservations.status.cancelled'), value: 'cancelled' },
  { label: t('hotelReservations.status.completed'), value: 'completed' }
])

const cancellationReasonOptions = computed(() => [
  { label: t('hotelReservations.cancellationReasons.maintenance'), value: 'maintenance' },
  { label: t('hotelReservations.cancellationReasons.overbooking'), value: 'overbooking' },
  { label: t('hotelReservations.cancellationReasons.hotel_policy'), value: 'hotel_policy' },
  { label: t('hotelReservations.cancellationReasons.other'), value: 'other' }
])

useSeoMeta({
  title: () => `${t('hotelReservations.metaTitle')} - TravelHub`
})

definePageMeta({
  layout: 'default'
})

const cancelTargetReservation = computed(() =>
  reservations.value.find(reservation => reservation.id === cancelTargetId.value)
)

const isCancelModalOpen = computed({
  get: () => !!cancelTargetId.value,
  set: (open: boolean) => {
    if (!open) closeCancelModal()
  }
})

const isCancellationNoteRequired = computed(() => cancelReason.value === 'other')
const cancellationNote = computed(() => cancelNote.value.trim())
const isCancellationSubmitDisabled = computed(() =>
  !cancelTargetReservation.value ||
  actingId.value === cancelTargetId.value ||
  (isCancellationNoteRequired.value && !cancellationNote.value)
)

function propertyName(propertyId: string) {
  return properties.value.find(property => property.id === propertyId)?.name || propertyId
}

function reservationStatusLabel(status: string) {
  return t(`hotelReservations.status.${status}` as never, status)
}

function hasAction(reservation: HotelReservationListItem, action: 'confirm' | 'cancel') {
  return reservation.available_actions?.some(item => item.action === action) ?? false
}

function canCancel(reservation: HotelReservationListItem) {
  if (reservation.available_actions) {
    return hasAction(reservation, 'cancel')
  }

  return ['pending', 'pending_payment', 'confirmed', 'modification_confirmed'].includes(reservation.status)
}

function formatMoney(amount: string, currency: string) {
  const parsed = Number(amount)
  if (Number.isNaN(parsed)) return `${amount} ${currency}`
  return new Intl.NumberFormat(localeMap[locale.value] || 'en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(parsed)
}

function formatDate(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return new Intl.DateTimeFormat(localeMap[locale.value] || 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(parsed)
}

function calculateNights(checkIn: string, checkOut: string) {
  const start = new Date(checkIn)
  const end = new Date(checkOut)
  const diffMs = end.getTime() - start.getTime()
  if (Number.isNaN(diffMs) || diffMs <= 0) return 0
  return Math.round(diffMs / (1000 * 60 * 60 * 24))
}

function cancelSummaryPrimary(reservation: HotelReservationListItem) {
  return propertyName(reservation.id_property) || '—'
}

function cancelSummarySecondary(reservation: HotelReservationListItem) {
  return propertyName(reservation.id_property) || '—'
}

function openCancelModal(reservationId: string) {
  cancelTargetId.value = reservationId
  cancelReason.value = 'maintenance'
  cancelNote.value = ''
}

function closeCancelModal() {
  cancelTargetId.value = null
  cancelReason.value = 'maintenance'
  cancelNote.value = ''
  error.value = null
}

async function loadProperties() {
  properties.value = await getAllProperties()
  if (!selectedPropertyId.value && properties.value.length > 0) {
    selectedPropertyId.value = properties.value[0]!.id
  }
}

async function loadReservations() {
  if (!authStore.token || !selectedPropertyId.value) return
  loading.value = true
  error.value = null
  try {
    reservations.value = await getHotelReservations(
      selectedPropertyId.value,
      authStore.token,
      statusFilter.value === 'all' ? undefined : statusFilter.value
    )
  } catch (err) {
    error.value = (err as { message?: string }).message || t('hotelReservations.feedback.loadError')
  } finally {
    loading.value = false
  }
}

async function cancelReservation(reservationId: string) {
  if (!authStore.token) return
  if (isCancellationNoteRequired.value && !cancellationNote.value) {
    error.value = t('hotelReservations.feedback.otherReasonRequired')
    return
  }

  actingId.value = reservationId
  error.value = null
  success.value = null
  try {
    await cancelHotelReservation(
      reservationId,
      authStore.token,
      cancelReason.value,
      cancellationNote.value || undefined,
      locale.value
    )
    closeCancelModal()
    success.value = t('hotelReservations.feedback.cancelSuccess')
    await loadReservations()
  } catch (err) {
    error.value = (err as { message?: string }).message || t('hotelReservations.feedback.cancelError')
  } finally {
    actingId.value = null
  }
}

watch([selectedPropertyId, statusFilter], async () => {
  await loadReservations()
})

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    await navigateTo({ path: '/login', query: { redirect: route.fullPath } })
    return
  }
  if (!authStore.isHotelUser) {
    await navigateTo('/properties')
    return
  }
  await loadProperties()
  await loadReservations()
})
</script>

<template>
  <div class="min-h-screen bg-[#f3f5f9] py-10 md:py-14">
    <div class="mx-auto max-w-[1120px] px-4">
      <div class="mb-8">
        <p class="text-sm font-semibold uppercase tracking-[0.16em] text-travelhub-600">
          {{ t('hotelReservations.hero.eyebrow') }}
        </p>
        <h1 class="mt-3 text-4xl font-bold tracking-tight text-slate-900">
          {{ t('hotelReservations.hero.title') }}
        </h1>
        <p class="mt-2 max-w-[760px] text-base text-slate-500">
          {{ t('hotelReservations.hero.description') }}
        </p>
      </div>

      <UAlert
        v-if="error"
        color="error"
        icon="i-lucide-alert-circle"
        class="mb-4"
        :title="t('hotelReservations.feedback.errorTitle')"
        :description="error"
        closable
        @close="error = null"
      />

      <UAlert
        v-if="success"
        color="success"
        icon="i-lucide-check-circle-2"
        class="mb-4"
        :title="t('hotelReservations.feedback.successTitle')"
        :description="success"
        closable
        @close="success = null"
      />

      <div class="mb-6 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2">
        <USelect
          v-model="selectedPropertyId"
          :items="properties.map(property => ({ label: property.name, value: property.id }))"
          :placeholder="t('hotelReservations.filters.propertyPlaceholder')"
        />
        <USelect
          v-model="statusFilter"
          :items="statusOptions"
          :placeholder="t('hotelReservations.filters.statusPlaceholder')"
        />
      </div>

      <div
        v-if="loading"
        class="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm"
      >
        {{ t('hotelReservations.feedback.loading') }}
      </div>

      <div
        v-else-if="reservations.length === 0"
        class="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm"
      >
        <h2 class="text-2xl font-bold text-slate-900">
          {{ t('hotelReservations.empty.title') }}
        </h2>
        <p class="mt-3 text-slate-500">
          {{ t('hotelReservations.empty.description') }}
        </p>
      </div>

      <div
        v-else
        class="grid gap-4"
      >
        <article
          v-for="reservation in reservations"
          :key="reservation.id"
          class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p class="text-sm font-semibold uppercase tracking-[0.16em] text-travelhub-600">
                {{ propertyName(reservation.id_property) }}
              </p>
              <h2 class="mt-2 text-xl font-bold text-slate-900">
                {{ t('hotelReservations.card.reservationLabel', { id: reservation.id }) }}
              </h2>
              <p class="mt-1 text-sm text-slate-500">
                {{ formatDate(reservation.check_in_date) }} - {{ formatDate(reservation.check_out_date) }}
              </p>
            </div>

            <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
              {{ reservationStatusLabel(reservation.status) }}
            </span>
          </div>

          <div class="mt-5 grid gap-4 md:grid-cols-4">
            <div class="rounded-xl bg-slate-50 p-4">
              <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {{ t('hotelReservations.card.guests') }}
              </p>
              <p class="mt-2 text-sm font-medium text-slate-700">
                {{ reservation.number_of_guests }}
              </p>
            </div>
            <div class="rounded-xl bg-slate-50 p-4">
              <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {{ t('hotelReservations.card.amount') }}
              </p>
              <p class="mt-2 text-sm font-medium text-slate-700">
                {{ formatMoney(reservation.total_price, reservation.currency) }}
              </p>
            </div>
            <div class="rounded-xl bg-slate-50 p-4">
              <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {{ t('hotelReservations.card.traveler') }}
              </p>
              <p class="mt-2 break-all text-sm font-medium text-slate-700">
                {{ reservation.id_traveler }}
              </p>
            </div>
            <div class="rounded-xl bg-slate-50 p-4">
              <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {{ t('hotelReservations.card.hold') }}
              </p>
              <p class="mt-2 text-sm font-medium text-slate-700">
                {{ formatDate(reservation.hold_expires_at) }}
              </p>
            </div>
          </div>

          <div class="mt-5 flex flex-wrap gap-3">
            <UButton
              v-if="canCancel(reservation)"
              icon="i-lucide-ban"
              color="error"
              variant="soft"
              @click="openCancelModal(reservation.id)"
            >
              {{ t('hotelReservations.actions.cancel') }}
            </UButton>
          </div>
        </article>
      </div>
    </div>

    <UModal
      v-model:open="isCancelModalOpen"
      :title="t('hotelReservations.cancelModal.title')"
      :description="t('hotelReservations.cancelModal.description')"
      close-icon="i-lucide-x"
      :close="{
        color: 'neutral',
        variant: 'ghost',
        class: 'rounded-full text-slate-400 hover:bg-transparent hover:text-slate-600'
      }"
      :ui="{
        content: 'max-w-[512px] overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.24)]',
        header: 'border-b border-slate-200 px-6 py-6 sm:px-8',
        body: 'px-6 py-7 sm:px-8',
        footer: 'border-t border-slate-200 bg-slate-50 px-6 py-6 sm:px-8'
      }"
    >
      <template #title>
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
            <UIcon
              name="i-lucide-badge-x"
              class="h-6 w-6"
            />
          </div>
          <p class="text-[22px] font-bold tracking-tight text-slate-900">
            {{ t('hotelReservations.cancelModal.title') }}
          </p>
        </div>
      </template>

      <template #body>
        <div
          v-if="cancelTargetReservation"
          class="space-y-7"
        >
          <div class="rounded-2xl border border-[#d8e2f0] bg-[#f5f8ff] px-4 py-4 sm:px-5">
            <p class="text-xs font-semibold uppercase tracking-[0.14em] text-[#255cff]">
              {{ t('hotelReservations.cancelModal.summaryTitle') }}
            </p>
            <div class="mt-3 space-y-2.5">
              <p class="text-[18px] font-bold leading-7 text-slate-900">
                {{ cancelSummaryPrimary(cancelTargetReservation) }}
              </p>
              <p class="text-sm font-medium leading-6 text-slate-500 break-words">
                {{ t('hotelReservations.cancelModal.reservationId', { id: cancelTargetReservation.id }) }}
              </p>
              <p class="flex items-center gap-2 text-sm font-medium leading-6 text-slate-700">
                <UIcon
                  name="i-lucide-calendar-days"
                  class="h-4 w-4 shrink-0 text-slate-400"
                />
                <span>{{ formatDate(cancelTargetReservation.check_in_date) }} - {{ formatDate(cancelTargetReservation.check_out_date) }}</span>
              </p>
              <p class="text-sm leading-6 text-slate-500">
                {{ t('hotelReservations.cancelModal.staySummaryWithRoom', {
                  nights: calculateNights(cancelTargetReservation.check_in_date, cancelTargetReservation.check_out_date),
                  room: cancelSummarySecondary(cancelTargetReservation)
                }) }}
              </p>
              <p class="text-sm leading-6 text-slate-600">
                {{ t('hotelReservations.cancelModal.guestsAndStatus', {
                  guests: cancelTargetReservation.number_of_guests,
                  status: reservationStatusLabel(cancelTargetReservation.status)
                }) }}
              </p>
            </div>
          </div>

          <div class="space-y-3">
            <label
              for="reservation-cancel-reason"
              class="text-[15px] font-semibold text-slate-700"
            >
              {{ t('hotelReservations.cancelModal.reasonLabel') }}
            </label>
            <USelect
              id="reservation-cancel-reason"
              v-model="cancelReason"
              :items="cancellationReasonOptions"
              :placeholder="t('hotelReservations.cancelModal.reasonPlaceholder')"
              class="w-full"
              :ui="{
                base: 'h-12 rounded-xl border-slate-200 bg-white text-slate-700',
                trailingIcon: 'text-slate-400'
              }"
              data-testid="cancel-reason-select"
            />
          </div>

          <div class="space-y-3">
            <label
              for="reservation-cancel-note"
              class="text-[15px] font-semibold text-slate-700"
            >
              {{ t('hotelReservations.cancelModal.notesLabel') }}
              {{ isCancellationNoteRequired
                ? t('hotelReservations.cancelModal.requiredTag')
                : t('hotelReservations.cancelModal.optionalTag') }}
            </label>
            <UTextarea
              id="reservation-cancel-note"
              v-model="cancelNote"
              :rows="4"
              autoresize
              class="w-full"
              :ui="{
                base: 'min-h-[108px] rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 placeholder:text-slate-400'
              }"
              :placeholder="t('hotelReservations.cancelModal.notesPlaceholder')"
              data-testid="cancel-note-textarea"
            />
            <p
              v-if="isCancellationNoteRequired && !cancellationNote"
              class="text-sm font-medium text-rose-600"
            >
              {{ t('hotelReservations.cancelModal.notesRequiredMessage') }}
            </p>
          </div>

          <UAlert
            color="warning"
            variant="subtle"
            icon="i-lucide-circle-alert"
            :title="t('hotelReservations.cancelModal.warningTitle')"
            class="rounded-2xl border border-amber-200 bg-amber-50"
            :ui="{
              title: 'text-[15px] font-semibold text-amber-700',
              description: 'text-[15px] leading-7 text-amber-700',
              icon: 'text-amber-500'
            }"
            :description="cancelTargetReservation.status === 'confirmed'
              ? t('hotelReservations.cancelModal.warningConfirmed')
              : t('hotelReservations.cancelModal.warningPending')"
          />
        </div>
      </template>

      <template #footer>
        <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <UButton
            color="neutral"
            variant="outline"
            size="xl"
            class="justify-center rounded-xl border-slate-200 px-6 py-3 font-semibold text-slate-700"
            @click="closeCancelModal()"
          >
            {{ t('hotelReservations.cancelModal.keepReservation') }}
          </UButton>
          <UButton
            color="error"
            icon="i-lucide-ban"
            :disabled="isCancellationSubmitDisabled"
            :loading="actingId === cancelTargetId"
            size="xl"
            class="justify-center rounded-xl bg-red-500 px-6 py-3 font-semibold text-white hover:bg-red-600 disabled:bg-red-200"
            @click="cancelTargetReservation && cancelReservation(cancelTargetReservation.id)"
          >
            {{ t('hotelReservations.cancelModal.confirmAction') }}
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
