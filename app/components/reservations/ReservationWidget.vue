<script setup lang="ts">
import { useI18n } from '#imports'
import type { ReservationRequest } from '~/types/reservations'
import { searchService } from '~/services/search'
import {
  calculateStayDuration,
  formatCurrency,
  validateReservationDates
} from '~/utils/validation'
import { computeCanonicalBreakdown } from '~/utils/pricing'
import { parseApiDateToTimestamp } from '~/utils/dates'
import { useReservations } from '~/composables/useReservations'
import { useAuthStore } from '~/stores/auth'

interface Props {
  property: {
    id: string
    price_per_night: number
    currency: string
    max_guests: number
    tax_rate?: number
    cleaning_fee?: number
  }
  initialCheckInDate?: string
  initialCheckOutDate?: string
  initialNumberOfGuests?: number
}

const { t, locale } = useI18n()
const router = useRouter()
const { createReservation, loading, error } = useReservations()
const authStore = useAuthStore()
const reservationLockDurationMs = 15 * 60 * 1000

const props = defineProps<Props>()

const checkInDate = ref<string>(props.initialCheckInDate || '')
const checkOutDate = ref<string>(props.initialCheckOutDate || '')
const numberOfGuests = ref<number>(props.initialNumberOfGuests || 1)
const submitError = ref<string | null>(null)
const availabilityLoading = ref(false)
const availabilityError = ref<string | null>(null)
const availabilityConfirmed = ref(false)
const availabilityBlocked = ref(false)
const effectiveNightlyRate = ref<number | null>(null)
let availabilityRequestSequence = 0

const extractApiDetailText = (details: unknown): string => {
  if (typeof details === 'string') {
    return details.toLowerCase()
  }

  if (typeof details === 'object' && details !== null) {
    const record = details as Record<string, unknown>
    const candidate = [record.detail, record.message, record.error]
      .find(value => typeof value === 'string' && value.trim().length > 0)

    if (typeof candidate === 'string') {
      return candidate.toLowerCase()
    }
  }

  return ''
}

const parseLocalDate = (dateValue: string): Date | null => {
  const [yearStr, monthStr, dayStr] = dateValue.split('-')
  if (!yearStr || !monthStr || !dayStr) return null

  const year = Number(yearStr)
  const monthIndex = Number(monthStr) - 1
  const day = Number(dayStr)
  if (!Number.isInteger(year) || !Number.isInteger(monthIndex) || !Number.isInteger(day)) {
    return null
  }

  return new Date(year, monthIndex, day)
}

const formatDateInputValue = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formatSelectedDateLabel = (dateValue: string): string => {
  const parsed = parseLocalDate(dateValue)
  if (!parsed) return dateValue

  return new Intl.DateTimeFormat(locale.value, {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(parsed)
}

const serializeDateAtUtcMidnight = (dateValue: string): string | null => {
  const localDate = parseLocalDate(dateValue)
  if (!localDate) return null

  return new Date(
    Date.UTC(localDate.getFullYear(), localDate.getMonth(), localDate.getDate())
  ).toISOString()
}

// Computed properties
const checkInDateObj = computed((): Date | null => {
  return checkInDate.value ? parseLocalDate(checkInDate.value) : null
})

const checkOutDateObj = computed((): Date | null => {
  return checkOutDate.value ? parseLocalDate(checkOutDate.value) : null
})

const stayDuration = computed(() => {
  if (checkInDateObj.value && checkOutDateObj.value) {
    return calculateStayDuration(checkInDateObj.value, checkOutDateObj.value)
  }
  return 0
})

const selectedNightlyRate = computed(() => effectiveNightlyRate.value ?? props.property.price_per_night)

const hasDynamicPricing = computed(() => (
  effectiveNightlyRate.value !== null
  && Math.abs(effectiveNightlyRate.value - props.property.price_per_night) > 0.001
))

const breakdown = computed(() => {
  if (stayDuration.value <= 0) return null
  return computeCanonicalBreakdown({
    pricePerNight: selectedNightlyRate.value,
    cleaningFee: props.property.cleaning_fee ?? 0,
    taxRate: props.property.tax_rate ?? 0,
    nights: stayDuration.value,
    guests: numberOfGuests.value
  })
})

const totalPrice = computed(() => (breakdown.value ? breakdown.value.totalInCents / 100 : 0))
const accommodationAmount = computed(() => (breakdown.value ? breakdown.value.accommodationInCents / 100 : 0))
const cleaningAmount = computed(() => (breakdown.value ? breakdown.value.cleaningFeeInCents / 100 : 0))
const serviceFeeAmount = computed(() => (breakdown.value ? breakdown.value.serviceFeeInCents / 100 : 0))
const taxesAmount = computed(() => (breakdown.value ? breakdown.value.taxesInCents / 100 : 0))

const canBook = computed(() => {
  if (!checkInDateObj.value || !checkOutDateObj.value) return false

  const validation = validateReservationDates(checkInDateObj.value, checkOutDateObj.value)
  return (
    validation.valid
    && numberOfGuests.value > 0
    && numberOfGuests.value <= props.property.max_guests
    && !availabilityLoading.value
    && !availabilityBlocked.value
  )
})

const shouldCheckAvailability = computed(() => {
  if (!checkInDateObj.value || !checkOutDateObj.value) return false
  const validation = validateReservationDates(checkInDateObj.value, checkOutDateObj.value)
  return validation.valid && numberOfGuests.value > 0 && numberOfGuests.value <= props.property.max_guests
})

const unavailableDatesMessage = computed(() => t('booking.selectedDatesUnavailableDetailed', {
  checkIn: formatSelectedDateLabel(checkInDate.value),
  checkOut: formatSelectedDateLabel(checkOutDate.value)
}))

const pricingMessage = computed(() => {
  if (!shouldCheckAvailability.value) return null
  if (availabilityLoading.value) {
    return { tone: 'info' as const, text: t('booking.priceRefreshing') }
  }
  if (availabilityBlocked.value) {
    return { tone: 'warning' as const, text: unavailableDatesMessage.value }
  }
  if (availabilityError.value) {
    return { tone: 'warning' as const, text: t('booking.priceRefreshError') }
  }
  if (hasDynamicPricing.value && availabilityConfirmed.value) {
    return {
      tone: 'success' as const,
      text: t('booking.dynamicRateApplied', {
        amount: formatCurrency(selectedNightlyRate.value, props.property.currency, locale.value)
      })
    }
  }
  return null
})

const pricingMessageClass = computed(() => {
  switch (pricingMessage.value?.tone) {
    case 'success':
      return 'border-emerald-200 bg-emerald-50 text-emerald-800'
    case 'warning':
      return 'border-amber-200 bg-amber-50 text-amber-800'
    default:
      return 'border-blue-200 bg-blue-50 text-blue-800'
  }
})

const resetAvailabilityState = () => {
  availabilityLoading.value = false
  availabilityError.value = null
  availabilityConfirmed.value = false
  availabilityBlocked.value = false
  effectiveNightlyRate.value = null
}

const refreshAvailability = async () => {
  const currentSequence = ++availabilityRequestSequence

  if (!shouldCheckAvailability.value) {
    resetAvailabilityState()
    return
  }

  availabilityLoading.value = true
  availabilityError.value = null
  availabilityBlocked.value = false

  try {
    const response = await searchService.checkAvailability({
      property_id: props.property.id,
      check_in: checkInDate.value,
      check_out: checkOutDate.value,
      guests: numberOfGuests.value
    })

    if (currentSequence !== availabilityRequestSequence) {
      return
    }

    availabilityConfirmed.value = response.available
    availabilityBlocked.value = !response.available
    effectiveNightlyRate.value = response.available && typeof response.price_from === 'number'
      ? response.price_from
      : null
  } catch (error) {
    if (currentSequence !== availabilityRequestSequence) {
      return
    }

    availabilityError.value = t('booking.priceRefreshError')
    availabilityConfirmed.value = false
    availabilityBlocked.value = false
    effectiveNightlyRate.value = null
    console.error('Failed to refresh effective pricing for reservation widget:', error)
  } finally {
    if (currentSequence === availabilityRequestSequence) {
      availabilityLoading.value = false
    }
  }
}

// Methods
const getTodayDate = (): string => {
  const today = new Date()
  return formatDateInputValue(today)
}

const getMaxCheckoutDate = (): string => {
  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + 365)
  return formatDateInputValue(maxDate)
}

const handleSubmit = async () => {
  if (!canBook.value || !checkInDate.value || !checkOutDate.value) return

  submitError.value = null

  try {
    const travelerId = authStore.userId
    if (!travelerId) {
      submitError.value = t('errors.unauthorized')
      await router.push({ path: '/login', query: { redirect: router.currentRoute.value.fullPath } })
      return
    }
    const checkInDateIso = serializeDateAtUtcMidnight(checkInDate.value)
    const checkOutDateIso = serializeDateAtUtcMidnight(checkOutDate.value)
    if (!checkInDateIso || !checkOutDateIso) {
      submitError.value = t('errors.validation')
      return
    }

    const reservationData: ReservationRequest = {
      id_traveler: travelerId,
      id_property: props.property.id,
      id_room: props.property.id,
      check_in_date: checkInDateIso,
      check_out_date: checkOutDateIso,
      number_of_guests: numberOfGuests.value,
      currency: props.property.currency
    }

    const response = await createReservation(reservationData)
    const lockExpiresAt = parseApiDateToTimestamp(response.hold_expires_at)
      ?? (Date.now() + reservationLockDurationMs)

    // Redirigir al checkout para completar el pago con ventana de bloqueo.
    await router.push({
      path: '/checkout',
      query: {
        reservationId: response.id,
        travelerId: travelerId,
        checkInDate: checkInDate.value,
        checkOutDate: checkOutDate.value,
        lockExpiresAt: String(lockExpiresAt),
        amountInCents: String(Math.round(totalPrice.value * 100)),
        currency: props.property.currency
      }
    })
  } catch (err: unknown) {
    const apiError = err as { statusCode?: number, details?: unknown, message?: string }
    const statusCode = apiError.statusCode
    const detailText = extractApiDetailText(apiError.details)
    const isUnavailableError = apiError.message === 'errors.unavailable'
      || detailText.includes('not available')

    if (statusCode === 400 && isUnavailableError) {
      submitError.value = unavailableDatesMessage.value
    } else if (statusCode === 400) {
      submitError.value = t('errors.validation')
    } else if (statusCode === 409) {
      submitError.value = unavailableDatesMessage.value
    } else {
      submitError.value = t('errors.serverError')
    }
  }
}

watch(error, (newError) => {
  if (newError && !submitError.value) {
    submitError.value = newError
  }
})

watch(() => [props.initialCheckInDate, props.initialCheckOutDate, props.initialNumberOfGuests], () => {
  if (props.initialCheckInDate) {
    checkInDate.value = props.initialCheckInDate
  }
  if (props.initialCheckOutDate) {
    checkOutDate.value = props.initialCheckOutDate
  }
  if (props.initialNumberOfGuests) {
    numberOfGuests.value = props.initialNumberOfGuests
  }
}, { immediate: true })

watch(
  () => [props.property.id, checkInDate.value, checkOutDate.value, numberOfGuests.value],
  () => {
    refreshAvailability()
  },
  { immediate: true }
)
</script>

<template>
  <div class="bg-white rounded-lg border border-gray-200 p-6 shadow-lg space-y-6">
    <!-- Price Header -->
    <div>
      <h3 class="text-3xl font-bold text-gray-900">
        {{ formatCurrency(selectedNightlyRate, props.property.currency, locale) }}
        <span class="text-lg text-gray-600 font-normal">/{{ t('common.night') }}</span>
      </h3>
      <p
        v-if="pricingMessage"
        class="mt-3 rounded-xl border px-3 py-2 text-sm"
        :class="pricingMessageClass"
      >
        {{ pricingMessage.text }}
      </p>
    </div>

    <!-- Check-in and Check-out Times -->
    <div class="grid grid-cols-2 gap-4 pb-4 border-b border-gray-200">
      <div>
        <p class="text-xs text-gray-600 mb-1">{{ t('booking.checkIn') }}</p>
        <p class="text-sm font-semibold text-gray-900">16:00</p>
      </div>
      <div>
        <p class="text-xs text-gray-600 mb-1">{{ t('booking.checkOut') }}</p>
        <p class="text-sm font-semibold text-gray-900">10:00</p>
      </div>
    </div>

    <!-- Booking Form -->
    <UForm
      :state="{ checkInDate, checkOutDate, numberOfGuests }"
      class="space-y-4"
      @submit="handleSubmit"
    >
      <!-- Dates -->
      <div class="space-y-2">
        <p class="text-sm font-semibold text-gray-900">
          {{ t('booking.dates') }}
        </p>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <UFormField
              :label="t('booking.checkIn')"
              name="checkIn"
            >
              <UInput
                v-model="checkInDate"
                type="date"
                :min="getTodayDate()"
                :max="getMaxCheckoutDate()"
                :disabled="loading"
                data-cy="reservation-check-in"
                required
              />
            </UFormField>
          </div>
          <div>
            <UFormField
              :label="t('booking.checkOut')"
              name="checkOut"
            >
              <UInput
                v-model="checkOutDate"
                type="date"
                :min="checkInDate || getTodayDate()"
                :max="getMaxCheckoutDate()"
                :disabled="loading"
                data-cy="reservation-check-out"
                required
              />
            </UFormField>
          </div>
        </div>
      </div>

      <!-- Guests -->
      <UFormField :label="t('booking.guests')">
        <UInputNumber
          v-model="numberOfGuests"
          :min="1"
          :max="props.property.max_guests"
          :disabled="loading"
          :aria-label="t('booking.guests')"
          data-cy="reservation-guests"
        />
      </UFormField>

      <!-- Error Message -->
      <UAlert
        v-if="submitError"
        icon="i-lucide-alert-circle"
        color="error"
        :title="submitError"
      />

      <!-- Price Breakdown -->
      <div
        v-if="stayDuration > 0"
        class="space-y-2 text-sm border-t border-b border-gray-200 py-4"
      >
        <div class="flex justify-between text-gray-700">
          <span>{{ formatCurrency(selectedNightlyRate, props.property.currency, locale) }} × {{ stayDuration }} {{ t(stayDuration === 1 ? 'common.night' : 'common.nights') }} × {{ numberOfGuests }} {{ t(numberOfGuests === 1 ? 'common.guest' : 'common.guests') }}</span>
          <span>{{ formatCurrency(accommodationAmount, props.property.currency, locale) }}</span>
        </div>
        <div
          v-if="cleaningAmount > 0"
          class="flex justify-between text-gray-700"
        >
          <span>{{ t('payments.booking.lines.cleaning') }}</span>
          <span>{{ formatCurrency(cleaningAmount, props.property.currency, locale) }}</span>
        </div>
        <div
          v-if="serviceFeeAmount > 0"
          class="flex justify-between text-gray-700"
        >
          <span>{{ t('payments.booking.lines.service') }}</span>
          <span>{{ formatCurrency(serviceFeeAmount, props.property.currency, locale) }}</span>
        </div>
        <div
          v-if="taxesAmount > 0"
          class="flex justify-between text-gray-700"
        >
          <span>{{ t('payments.booking.lines.taxes') }}</span>
          <span>{{ formatCurrency(taxesAmount, props.property.currency, locale) }}</span>
        </div>
        <div class="flex justify-between font-semibold text-lg text-gray-900 pt-2 border-t border-gray-100">
          <span>{{ t('booking.total') }}</span>
          <span>{{ formatCurrency(totalPrice, props.property.currency, locale) }}</span>
        </div>
      </div>

      <!-- Submit Button -->
      <UButton
        type="submit"
        :disabled="!canBook || loading"
        :loading="loading"
        block
        size="lg"
        icon="i-lucide-check"
        data-cy="reservation-confirm"
      >
        {{ t('booking.confirmBooking') }}
      </UButton>

      <!-- Secondary text -->
      <p class="text-xs text-gray-500 text-center">
        {{ t('booking.youWontBeCharged') }}
      </p>
    </UForm>
  </div>
</template>
