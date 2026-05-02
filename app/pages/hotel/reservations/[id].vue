<script setup lang="ts">
import type { ReservationCancellationReason } from '~/types/reservations'

definePageMeta({
  layout: 'hotel',
  middleware: 'hotel-only',
})

const { t, locale } = useI18n()
const route = useRoute()

const reservationId = computed(() => route.params.id as string)

const { detail, loading, error, load, addNote, confirm, cancel } = useHostReservationDetail()

onMounted(() => load(reservationId.value))

useHead({
  title: computed(() =>
    detail.value
      ? t('hotel.detail.reservationNumber', { number: detail.value.reservation.id.slice(-8).toUpperCase() })
      : t('hotel.detail.metaTitle'),
  ),
})

// ── Formatters ────────────────────────────────────────────────────────────────

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(locale.value, {
    year: 'numeric',
    month: 'long',
    day: '2-digit',
  })
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(locale.value, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatCents(cents: number, currency: string) {
  return new Intl.NumberFormat(locale.value, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(cents / 100)
}

// ── Actions ───────────────────────────────────────────────────────────────────

const showConfirmModal = ref(false)
const showCancelModal = ref(false)
const cancelReason = ref<ReservationCancellationReason>('hotel_policy')
const actionLoading = ref(false)
const actionSuccess = ref(false)

const cancelReasonOptions = [
  { label: t('hotelReservations.cancellationReasons.maintenance'), value: 'maintenance' as const },
  { label: t('hotelReservations.cancellationReasons.overbooking'), value: 'overbooking' as const },
  { label: t('hotelReservations.cancellationReasons.hotel_policy'), value: 'hotel_policy' as const },
  { label: t('hotelReservations.cancellationReasons.other'), value: 'other' as const },
]

async function handleConfirm() {
  actionLoading.value = true
  const ok = await confirm(reservationId.value)
  actionLoading.value = false
  showConfirmModal.value = false
  if (ok) actionSuccess.value = true
}

async function handleCancel() {
  actionLoading.value = true
  const ok = await cancel(reservationId.value, cancelReason.value)
  actionLoading.value = false
  showCancelModal.value = false
  if (ok) actionSuccess.value = true
}

// ── Notes ─────────────────────────────────────────────────────────────────────

const noteContent = ref('')
const noteLoading = ref(false)
const noteError = ref<string | null>(null)

async function handleAddNote() {
  const content = noteContent.value.trim()
  if (!content || content.length > 1000) {
    noteError.value = t('hotel.detail.notes.validationError')
    return
  }
  noteError.value = null
  noteLoading.value = true
  const result = await addNote(reservationId.value, content)
  noteLoading.value = false
  if (result) noteContent.value = ''
}

// ── Available actions from backend ───────────────────────────────────────────

const canConfirm = computed(() =>
  detail.value?.available_actions.some(a => a.action === 'confirm') ?? false,
)
const canCancel = computed(() =>
  detail.value?.available_actions.some(a => a.action === 'cancel') ?? false,
)
</script>

<template>
  <div
    class="mx-auto max-w-4xl space-y-6 px-4 py-6"
    data-cy="hotel-reservation-detail"
    :data-cy-reservation-id="detail?.reservation.id ?? ''"
    :data-cy-reservation-status="detail?.reservation.status ?? ''"
  >
    <!-- Back link -->
    <UButton
      variant="ghost"
      color="neutral"
      icon="i-lucide-arrow-left"
      @click="navigateTo('/hotel/dashboard')"
    >
      {{ t('hotel.detail.backToDashboard') }}
    </UButton>

    <!-- Loading state -->
    <div v-if="loading && !detail" class="flex justify-center py-16">
      <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-(--ui-text-muted)" />
    </div>

    <!-- Error state -->
    <UAlert
      v-else-if="error && !detail"
      color="error"
      variant="soft"
      :title="t('hotel.detail.errors.load')"
      :description="error"
    />

    <template v-else-if="detail">
      <!-- Header with status badge and actions -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p class="text-sm text-(--ui-text-muted)" data-cy="hotel-detail-reservation-number">
            {{ t('hotel.detail.reservationNumber', { number: detail.reservation.id.slice(-8).toUpperCase() }) }}
          </p>
          <div class="mt-1 flex items-center gap-3" data-cy="hotel-detail-status">
            <HotelStatusBadge :status="detail.reservation.status" />
          </div>
        </div>

        <div class="flex flex-wrap gap-2">
          <UButton
            v-if="canConfirm"
            color="success"
            icon="i-lucide-check"
            data-cy="hotel-detail-action-confirm"
            @click="showConfirmModal = true"
          >
            {{ t('hotel.detail.actions.confirm') }}
          </UButton>
          <UButton
            v-if="canCancel"
            color="error"
            variant="soft"
            icon="i-lucide-x"
            data-cy="hotel-detail-action-cancel"
            @click="showCancelModal = true"
          >
            {{ t('hotel.detail.actions.cancel') }}
          </UButton>
        </div>
      </div>

      <!-- Success toast -->
      <UAlert
        v-if="actionSuccess"
        color="success"
        variant="soft"
        :title="t('hotel.detail.actions.success')"
        :close-button="{ icon: 'i-lucide-x', color: 'neutral', variant: 'link' }"
        data-cy="hotel-detail-action-success"
        @close="actionSuccess = false"
      />

      <!-- Error toast -->
      <UAlert
        v-if="error"
        color="error"
        variant="soft"
        :title="error"
        :close-button="{ icon: 'i-lucide-x', color: 'neutral', variant: 'link' }"
        @close="() => {}"
      />

      <!-- Guest info -->
      <UCard>
        <template #header>
          <h2 class="font-semibold text-(--ui-text-highlighted)">
            {{ t('hotel.detail.sections.guest') }}
          </h2>
        </template>
        <div v-if="detail.guest" class="grid gap-3 sm:grid-cols-3" data-cy="hotel-detail-guest">
          <div>
            <p class="text-xs text-(--ui-text-muted)">{{ t('hotel.detail.guest.name') }}</p>
            <p class="font-medium text-(--ui-text-highlighted)" data-cy="hotel-detail-guest-name">{{ detail.guest.full_name }}</p>
          </div>
          <div>
            <p class="text-xs text-(--ui-text-muted)">{{ t('hotel.detail.guest.email') }}</p>
            <p class="font-medium text-(--ui-text-highlighted)" data-cy="hotel-detail-guest-email">{{ detail.guest.email }}</p>
          </div>
          <div>
            <p class="text-xs text-(--ui-text-muted)">{{ t('hotel.detail.guest.phone') }}</p>
            <p class="font-medium text-(--ui-text-highlighted)" data-cy="hotel-detail-guest-phone">
              {{ detail.guest.phone ?? t('hotel.detail.guest.noPhone') }}
            </p>
          </div>
        </div>
        <p v-else class="text-sm text-(--ui-text-muted)">
          {{ t('hotel.detail.guest.noInfo') }}
        </p>
      </UCard>

      <!-- Reservation details -->
      <UCard>
        <template #header>
          <h2 class="font-semibold text-(--ui-text-highlighted)">
            {{ t('hotel.detail.sections.reservation') }}
          </h2>
        </template>
        <div class="grid gap-3 sm:grid-cols-2" data-cy="hotel-detail-reservation">
          <div>
            <p class="text-xs text-(--ui-text-muted)">{{ t('hotel.detail.reservation.checkIn') }}</p>
            <p
              class="font-medium text-(--ui-text-highlighted)"
              data-cy="hotel-detail-check-in"
              :data-cy-iso="detail.reservation.check_in_date"
            >
              {{ formatDate(detail.reservation.check_in_date) }}
            </p>
          </div>
          <div>
            <p class="text-xs text-(--ui-text-muted)">{{ t('hotel.detail.reservation.checkOut') }}</p>
            <p
              class="font-medium text-(--ui-text-highlighted)"
              data-cy="hotel-detail-check-out"
              :data-cy-iso="detail.reservation.check_out_date"
            >
              {{ formatDate(detail.reservation.check_out_date) }}
            </p>
          </div>
          <div>
            <p class="text-xs text-(--ui-text-muted)">{{ t('hotel.detail.reservation.roomType') }}</p>
            <p class="font-medium text-(--ui-text-highlighted)">
              {{ detail.reservation.id_room || '—' }}
            </p>
          </div>
          <div>
            <p class="text-xs text-(--ui-text-muted)">{{ t('hotel.detail.reservation.guests') }}</p>
            <p
              class="font-medium text-(--ui-text-highlighted)"
              data-cy="hotel-detail-guests"
              :data-cy-count="detail.reservation.number_of_guests"
            >{{ detail.reservation.number_of_guests }}</p>
          </div>
          <div class="sm:col-span-2">
            <p class="text-xs text-(--ui-text-muted)">{{ t('hotel.detail.reservation.specialRequests') }}</p>
            <p class="font-medium text-(--ui-text-highlighted)">
              {{ t('hotel.detail.reservation.noSpecialRequests') }}
            </p>
          </div>
        </div>
      </UCard>

      <!-- Payment breakdown -->
      <UCard>
        <template #header>
          <h2 class="font-semibold text-(--ui-text-highlighted)">
            {{ t('hotel.detail.sections.payment') }}
          </h2>
        </template>
        <div v-if="detail.reservation.price_breakdown" class="space-y-2" data-cy="hotel-detail-payment">
          <div class="flex justify-between text-sm">
            <span class="text-(--ui-text-muted)">
              {{ t('hotel.detail.payment.accommodation', { nights: detail.reservation.price_breakdown.nights }) }}
            </span>
            <span>
              {{ formatCents(detail.reservation.price_breakdown.accommodation_in_cents, detail.reservation.price_breakdown.currency) }}
            </span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-(--ui-text-muted)">{{ t('hotel.detail.payment.cleaningFee') }}</span>
            <span>
              {{ formatCents(detail.reservation.price_breakdown.cleaning_fee_in_cents, detail.reservation.price_breakdown.currency) }}
            </span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-(--ui-text-muted)">{{ t('hotel.detail.payment.serviceFee') }}</span>
            <span>
              {{ formatCents(detail.reservation.price_breakdown.service_fee_in_cents, detail.reservation.price_breakdown.currency) }}
            </span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-(--ui-text-muted)">{{ t('hotel.detail.payment.taxes') }}</span>
            <span>
              {{ formatCents(detail.reservation.price_breakdown.taxes_in_cents, detail.reservation.price_breakdown.currency) }}
            </span>
          </div>
          <USeparator />
          <div class="flex justify-between font-bold">
            <span>{{ t('hotel.detail.payment.total') }}</span>
            <span
              data-cy="hotel-detail-payment-total"
              :data-cy-cents="detail.reservation.price_breakdown.total_in_cents"
              :data-cy-currency="detail.reservation.price_breakdown.currency"
            >
              {{ formatCents(detail.reservation.price_breakdown.total_in_cents, detail.reservation.price_breakdown.currency) }}
            </span>
          </div>
        </div>
        <p v-else class="text-sm text-(--ui-text-muted)">
          {{ t('hotel.detail.payment.noBreakdown') }}
        </p>
      </UCard>

      <!-- Change history -->
      <UCard>
        <template #header>
          <h2 class="font-semibold text-(--ui-text-highlighted)">
            {{ t('hotel.detail.sections.history') }}
          </h2>
        </template>
        <div v-if="detail.change_history.length > 0" class="space-y-3">
          <div
            v-for="event in detail.change_history"
            :key="event.id"
            class="flex flex-col gap-1 border-l-2 border-(--ui-border) pl-3 text-sm"
          >
            <p class="font-medium text-(--ui-text-highlighted)">{{ event.action }}</p>
            <div class="flex flex-wrap gap-x-4 text-xs text-(--ui-text-muted)">
              <span v-if="event.previous_status">
                {{ t('hotel.detail.history.from') }}: {{ event.previous_status }}
              </span>
              <span>{{ t('hotel.detail.history.to') }}: {{ event.new_status }}</span>
              <span v-if="event.reason">{{ t('hotel.detail.history.reason') }}: {{ event.reason }}</span>
              <span>{{ formatDateTime(event.created_at) }}</span>
            </div>
          </div>
        </div>
        <p v-else class="text-sm text-(--ui-text-muted)">
          {{ t('hotel.detail.history.empty') }}
        </p>
      </UCard>

      <!-- Internal notes -->
      <UCard>
        <template #header>
          <h2 class="font-semibold text-(--ui-text-highlighted)">
            {{ t('hotel.detail.sections.notes') }}
          </h2>
        </template>
        <div class="space-y-4">
          <!-- Existing notes -->
          <div v-if="detail.internal_notes.length > 0" class="space-y-3">
            <div
              v-for="note in detail.internal_notes"
              :key="note.id"
              class="rounded-lg bg-(--ui-bg-elevated) p-3"
            >
              <p class="text-sm text-(--ui-text-highlighted)">{{ note.content }}</p>
              <p class="mt-1 text-xs text-(--ui-text-muted)">
                {{ note.author_name ?? t('hotel.detail.notes.by') }} · {{ formatDateTime(note.created_at) }}
              </p>
            </div>
          </div>
          <p v-else class="text-sm text-(--ui-text-muted)">
            {{ t('hotel.detail.notes.empty') }}
          </p>

          <!-- Add note form -->
          <div class="space-y-2">
            <UTextarea
              v-model="noteContent"
              :placeholder="t('hotel.detail.notes.placeholder')"
              :rows="3"
              :maxlength="1000"
            />
            <p v-if="noteError" class="text-xs text-(--ui-color-error-500)">{{ noteError }}</p>
            <UButton
              :loading="noteLoading"
              :disabled="!noteContent.trim()"
              icon="i-lucide-plus"
              @click="handleAddNote"
            >
              {{ noteLoading ? t('hotel.detail.notes.adding') : t('hotel.detail.notes.add') }}
            </UButton>
          </div>
        </div>
      </UCard>
    </template>

    <!-- Confirm modal -->
    <UModal v-model:open="showConfirmModal">
      <template #content>
        <div class="space-y-4 p-6" data-cy="hotel-detail-confirm-modal">
          <h3 class="text-lg font-bold">{{ t('hotel.detail.actions.confirmTitle') }}</h3>
          <p class="text-sm text-(--ui-text-muted)">{{ t('hotel.detail.actions.confirmDesc') }}</p>
          <div class="flex justify-end gap-2">
            <UButton variant="ghost" color="neutral" @click="showConfirmModal = false">
              {{ t('hotel.detail.actions.abort') }}
            </UButton>
            <UButton
              color="success"
              :loading="actionLoading"
              data-cy="hotel-detail-confirm-modal-proceed"
              @click="handleConfirm"
            >
              {{ t('hotel.detail.actions.proceed') }}
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Cancel modal -->
    <UModal v-model:open="showCancelModal">
      <template #content>
        <div class="space-y-4 p-6" data-cy="hotel-detail-cancel-modal">
          <h3 class="text-lg font-bold">{{ t('hotel.detail.actions.cancelTitle') }}</h3>
          <p class="text-sm text-(--ui-text-muted)">{{ t('hotel.detail.actions.cancelDesc') }}</p>
          <USelect
            v-model="cancelReason"
            :items="cancelReasonOptions"
            value-key="value"
            :label="t('hotel.detail.actions.cancelReason')"
          />
          <div class="flex justify-end gap-2">
            <UButton variant="ghost" color="neutral" @click="showCancelModal = false">
              {{ t('hotel.detail.actions.abort') }}
            </UButton>
            <UButton
              color="error"
              :loading="actionLoading"
              data-cy="hotel-detail-cancel-modal-proceed"
              @click="handleCancel"
            >
              {{ t('hotel.detail.actions.proceed') }}
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
