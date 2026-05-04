<script setup lang="ts">
import type { HostReservationItem, HostReservationsFilters } from '~/types/hotel'
import type { ReservationCancellationReason } from '~/types/reservations'
import {
  cancelHotelReservation,
} from '~/services/reservationService'
import { listHostReservations } from '~/services/hostReservationsService'

definePageMeta({
  layout: 'hotel',
  middleware: 'hotel-only',
})

const router = useRouter()
const { t, locale } = useI18n()
const authStore = useAuthStore()
const {
  reservations,
  metrics,
  trends,
  loading,
  error,
  refreshReservations,
  refreshMetrics,
  refreshTrends,
} = useHostReservations()

function onReservationSelect(item: HostReservationItem) {
  router.push(`/hotel/reservations/${item.id}`)
}

const today = new Date()
const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

const initialStart = thirtyDaysAgo.toISOString().slice(0, 10)
const initialEnd = today.toISOString().slice(0, 10)

const filters = reactive<HostReservationsFilters>({
  status: [],
  guest_name: '',
  sort_by: 'check_in_date',
  sort_dir: 'desc',
  page: 1,
  page_size: 10,
})

const dateRangeDraft = reactive({
  start_date: initialStart,
  end_date: initialEnd,
})

const analyticsRange = reactive({
  start_date: initialStart,
  end_date: initialEnd,
})

const selectedCurrency = ref<string | undefined>(undefined)
const actingId = ref<string | null>(null)
const success = ref<string | null>(null)
const cancelTargetId = ref<string | null>(null)
const cancelReason = ref<ReservationCancellationReason>('maintenance')
const cancelNote = ref('')

function buildFilters(): HostReservationsFilters {
  return {
    status: [...(filters.status ?? [])],
    guest_name: filters.guest_name,
    sort_by: filters.sort_by,
    sort_dir: filters.sort_dir,
    page: filters.page,
    page_size: filters.page_size,
  }
}

function buildRange() {
  const toUtcStartOfDay = (value?: string) =>
    value ? `${value}T00:00:00.000Z` : undefined
  const toUtcEndOfDay = (value?: string) =>
    value ? `${value}T23:59:59.999Z` : undefined

  return {
    start_date: toUtcStartOfDay(analyticsRange.start_date),
    end_date: toUtcEndOfDay(analyticsRange.end_date),
    currency: selectedCurrency.value,
  }
}

async function reload() {
  const range = buildRange()
  await Promise.all([
    refreshReservations(buildFilters()),
    refreshMetrics(range),
    refreshTrends({ ...range, granularity: 'week' }),
  ])
}

watch(
  () => [filters.page, filters.sort_by, filters.sort_dir],
  () => refreshReservations(buildFilters()),
)

function applyDateRange() {
  analyticsRange.start_date = dateRangeDraft.start_date
  analyticsRange.end_date = dateRangeDraft.end_date
  const range = buildRange()
  refreshMetrics(range)
  refreshTrends({ ...range, granularity: 'week' })
}

async function resetDateRange() {
  dateRangeDraft.start_date = initialStart
  dateRangeDraft.end_date = initialEnd
  analyticsRange.start_date = initialStart
  analyticsRange.end_date = initialEnd
  await initializeAnalyticsRangeFromConfirmedReservations()
  applyDateRange()
}

async function initializeAnalyticsRangeFromConfirmedReservations() {
  if (!authStore.token) return

  let earliest
  let latest
  try {
    ;[earliest, latest] = await Promise.all([
      listHostReservations(authStore.token, {
        status: ['confirmed'],
        sort_by: 'check_in_date',
        sort_dir: 'asc',
        page: 1,
        page_size: 1,
      }),
      listHostReservations(authStore.token, {
        status: ['confirmed'],
        sort_by: 'check_in_date',
        sort_dir: 'desc',
        page: 1,
        page_size: 1,
      }),
    ])
  } catch {
    return
  }

  const earliestDate = earliest.items[0]?.check_in_date?.slice(0, 10)
  const latestDate = latest.items[0]?.check_in_date?.slice(0, 10)
  const latestCheckoutDate = latest.items[0]?.check_out_date?.slice(0, 10)

  if (!earliestDate || !latestCheckoutDate) return

  dateRangeDraft.start_date = earliestDate
  dateRangeDraft.end_date = latestCheckoutDate
  analyticsRange.start_date = earliestDate
  analyticsRange.end_date = latestCheckoutDate
}

function onTableFiltersUpdate(value: HostReservationsFilters) {
  Object.assign(filters, value, {
    page: 1,
  })
  refreshReservations(buildFilters())
}

const cancellationReasonOptions = computed(() => [
  { label: t('hotelReservations.cancellationReasons.maintenance'), value: 'maintenance' },
  { label: t('hotelReservations.cancellationReasons.overbooking'), value: 'overbooking' },
  { label: t('hotelReservations.cancellationReasons.hotel_policy'), value: 'hotel_policy' },
  { label: t('hotelReservations.cancellationReasons.other'), value: 'other' },
])

const cancelTargetReservation = computed(() =>
  reservations.value?.items.find(reservation => reservation.id === cancelTargetId.value) || null
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

function hasAction(reservation: HostReservationItem, action: 'confirm' | 'cancel') {
  return reservation.available_actions?.some(item => item.action === action) ?? false
}

function canCancel(reservation: HostReservationItem) {
  return hasAction(reservation, 'cancel')
}

function reservationStatusLabel(status: string) {
  return t(`hotelReservations.status.${status}` as never, status)
}



function formatDate(value: string) {
  return new Date(value).toLocaleDateString(locale.value, {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  })
}

function calculateNights(checkIn: string, checkOut: string) {
  const inDate = new Date(checkIn).getTime()
  const outDate = new Date(checkOut).getTime()
  return Math.max(Math.round((outDate - inDate) / (1000 * 60 * 60 * 24)), 0)
}

function cancelSummaryPrimary(reservation: HostReservationItem) {
  return reservation.guest_full_name?.trim() || reservation.room_type?.trim() || '—'
}

function cancelSummarySecondary(reservation: HostReservationItem) {
  return reservation.room_type?.trim() || '—'
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
    await reload()
  } catch (err) {
    error.value = (err as { message?: string }).message || t('hotelReservations.feedback.cancelError')
  } finally {
    actingId.value = null
  }
}

onMounted(async () => {
  await initializeAnalyticsRangeFromConfirmedReservations()
  await reload()
})

const formattedRevenue = computed(() => {
  if (!metrics.value) return '—'
  return new Intl.NumberFormat(locale.value, {
    style: 'currency',
    currency: metrics.value.revenue_currency?.toUpperCase() || 'COP',
    maximumFractionDigits: 0,
  }).format(Number(metrics.value.revenue_amount))
})

const formattedAdr = computed(() => {
  if (!metrics.value) return '—'
  return new Intl.NumberFormat(locale.value, {
    style: 'currency',
    currency: metrics.value.revenue_currency?.toUpperCase() || 'COP',
    maximumFractionDigits: 0,
  }).format(Number(metrics.value.average_daily_rate))
})

const occupancyPct = computed(() => {
  if (!metrics.value) return '—'
  return `${(metrics.value.occupancy_rate * 100).toFixed(1)}%`
})

const rangeLabel = computed(() => {
  if (!analyticsRange.start_date || !analyticsRange.end_date) return ''
  const fmt = (iso: string) => new Date(iso).toLocaleDateString(locale.value, { month: 'short', day: '2-digit' })
  return `${fmt(analyticsRange.start_date)} – ${fmt(analyticsRange.end_date)}`
})

const currencyOptions = computed(() => {
  const list = trends.value?.available_currencies?.length
    ? trends.value.available_currencies
    : metrics.value?.available_currencies ?? []
  return list.map(code => ({ label: code, value: code }))
})

watch(
  () => trends.value?.available_currencies,
  (list) => {
    if (!selectedCurrency.value && list && list.length > 0) {
      selectedCurrency.value = list[0]
    }
  },
)

function onCurrencyChange(value: string) {
  selectedCurrency.value = value
  const range = buildRange()
  refreshMetrics(range)
  refreshTrends({ ...range, granularity: 'week' })
}
</script>

<template>
  <div class="flex flex-col gap-8 p-8">
    <div class="flex flex-col gap-1">
      <h1 class="text-3xl font-black tracking-tight text-(--ui-text-highlighted)">
        {{ t('hotel.dashboard.welcomeTitle') }}
      </h1>
      <p class="text-base text-(--ui-text-muted)">
        {{ t('hotel.dashboard.welcomeSubtitle') }}
      </p>
    </div>

    <UAlert
      v-if="error"
      icon="i-lucide-alert-circle"
      color="error"
      :title="t('hotel.dashboard.error')"
      :description="error"
    />

    <UAlert
      v-if="success"
      icon="i-lucide-check-circle-2"
      color="success"
      :title="t('hotelReservations.feedback.successTitle')"
      :description="success"
      closable
      @close="success = null"
    />

    <UCard :ui="{ body: 'p-4' }">
      <div class="flex flex-wrap items-end gap-3">
        <label class="flex flex-col gap-1">
          <span class="text-xs font-medium text-(--ui-text-muted)">
            {{ t('hotel.dashboard.filters.startDate') }}
          </span>
          <UInput v-model="dateRangeDraft.start_date" type="date" class="w-[150px]" />
        </label>
        <label class="flex flex-col gap-1">
          <span class="text-xs font-medium text-(--ui-text-muted)">
            {{ t('hotel.dashboard.filters.endDate') }}
          </span>
          <UInput v-model="dateRangeDraft.end_date" type="date" class="w-[150px]" />
        </label>
        <UButton
          variant="ghost"
          :label="t('hotel.dashboard.filters.clear')"
          @click="resetDateRange"
        />
        <UButton
          :label="t('hotel.dashboard.filters.apply')"
          @click="applyDateRange"
        />
      </div>
    </UCard>

    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <HotelKpiCard
        icon="i-lucide-banknote"
        :label="t('hotel.dashboard.kpi.revenue')"
        :value="formattedRevenue"
      />
      <HotelKpiCard
        icon="i-lucide-bed-double"
        :label="t('hotel.dashboard.kpi.occupancy')"
        :value="occupancyPct"
        icon-color="bg-amber-50 text-amber-600"
      />
      <HotelKpiCard
        icon="i-lucide-trending-up"
        :label="t('hotel.dashboard.kpi.adr')"
        :value="formattedAdr"
        icon-color="bg-emerald-50 text-emerald-600"
      />
      <HotelKpiCard
        icon="i-lucide-calendar-check"
        :label="t('hotel.dashboard.kpi.activeBookings')"
        :value="metrics ? String(metrics.active_reservations) : '—'"
        icon-color="bg-fuchsia-50 text-fuchsia-600"
      />
    </div>

    <HotelRevenueTrendsChart
      :data="trends"
      :loading="loading && !trends"
      :range-label="rangeLabel"
      :currency-options="currencyOptions"
      :selected-currency="selectedCurrency"
      @update:currency="onCurrencyChange"
    />

    <HotelReservationsTable
      :data="reservations"
      :loading="loading"
      :page="filters.page ?? 1"
      :page-size="filters.page_size ?? 10"
      :sort-by="filters.sort_by ?? 'check_in_date'"
      :sort-dir="filters.sort_dir ?? 'desc'"
      @update:page="(value) => (filters.page = value)"
      @update:sort-by="(value) => (filters.sort_by = value)"
      @update:sort-dir="(value) => (filters.sort_dir = value)"
      @select="onReservationSelect"
    >
      <template #filters>
        <HotelReservationFilters
          :model-value="filters"
          @update:model-value="onTableFiltersUpdate"
        />
      </template>

      <template #actions="{ reservation }">
        <div class="flex justify-end gap-2">
          <UButton
            v-if="canCancel(reservation)"
            icon="i-lucide-ban"
            color="error"
            variant="soft"
            size="xs"
            @click="openCancelModal(reservation.id)"
          >
            {{ t('hotelReservations.actions.cancel') }}
          </UButton>
          <UButton
            variant="ghost"
            color="neutral"
            size="xs"
            icon="i-lucide-chevron-right"
            :aria-label="t('hotel.detail.viewDetail')"
            @click="onReservationSelect(reservation)"
          />
        </div>
      </template>
    </HotelReservationsTable>

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
              for="dashboard-reservation-cancel-reason"
              class="text-[15px] font-semibold text-slate-700"
            >
              {{ t('hotelReservations.cancelModal.reasonLabel') }}
            </label>
            <USelect
              id="dashboard-reservation-cancel-reason"
              v-model="cancelReason"
              :items="cancellationReasonOptions"
              :placeholder="t('hotelReservations.cancelModal.reasonPlaceholder')"
              class="w-full"
              :ui="{
                base: 'h-12 rounded-xl border-slate-200 bg-white text-slate-700',
                trailingIcon: 'text-slate-400'
              }"
              data-testid="dashboard-cancel-reason-select"
            />
          </div>

          <div class="space-y-3">
            <label
              for="dashboard-reservation-cancel-note"
              class="text-[15px] font-semibold text-slate-700"
            >
              {{ t('hotelReservations.cancelModal.notesLabel') }}
              {{ isCancellationNoteRequired
                ? t('hotelReservations.cancelModal.requiredTag')
                : t('hotelReservations.cancelModal.optionalTag') }}
            </label>
            <UTextarea
              id="dashboard-reservation-cancel-note"
              v-model="cancelNote"
              :rows="4"
              autoresize
              class="w-full"
              :ui="{
                base: 'min-h-[108px] rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 placeholder:text-slate-400'
              }"
              :placeholder="t('hotelReservations.cancelModal.notesPlaceholder')"
              data-testid="dashboard-cancel-note-textarea"
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
