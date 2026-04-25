<script setup lang="ts">
import { useI18n } from '#imports'
import type { ReservationRequest } from '~/types/reservations'
import {
  calculateStayDuration,
  calculateTotalPrice,
  formatCurrency,
  validateReservationDates
} from '~/utils/validation'
import { useReservations } from '~/composables/useReservations'
import { useAuthStore } from '~/stores/auth'

interface Props {
  property: {
    id: string
    price_per_night: number
    currency: string
    max_guests: number
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

const totalPrice = computed(() => {
  if (stayDuration.value > 0) {
    return calculateTotalPrice(
      props.property.price_per_night,
      stayDuration.value,
      props.property.currency,
      numberOfGuests.value
    )
  }
  return 0
})

const canBook = computed(() => {
  if (!checkInDateObj.value || !checkOutDateObj.value) return false

  const validation = validateReservationDates(checkInDateObj.value, checkOutDateObj.value)
  return (
    validation.valid
    && numberOfGuests.value > 0
    && numberOfGuests.value <= props.property.max_guests
  )
})

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
    const lockExpiresAt = Date.now() + reservationLockDurationMs

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
    const statusCode = (err as { statusCode?: number }).statusCode

    if (statusCode === 400) {
      submitError.value = t('errors.validation')
    } else if (statusCode === 409) {
      submitError.value = t('errors.unavailable')
    } else {
      submitError.value = t('errors.serverError')
    }
  }
}

watch(error, (newError) => {
  if (newError) {
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
</script>

<template>
  <div class="bg-white rounded-lg border border-gray-200 p-6 shadow-lg space-y-6">
    <!-- Price Header -->
    <div>
      <h3 class="text-3xl font-bold text-gray-900">
        {{ formatCurrency(props.property.price_per_night, props.property.currency, locale) }}
        <span class="text-lg text-gray-600 font-normal">/{{ t('common.night') }}</span>
      </h3>
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
                required
              />
            </UFormField>
          </div>
        </div>
      </div>

      <!-- Guests -->
      <UFormField
        :label="t('booking.guests')"
        name="guests"
      >
        <UInputNumber
          v-model="numberOfGuests"
          :min="1"
          :max="props.property.max_guests"
          :disabled="loading"
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
          <span>{{ formatCurrency(props.property.price_per_night, props.property.currency, locale) }} × {{ stayDuration }} {{ t(stayDuration === 1 ? 'common.night' : 'common.nights') }}</span>
          <span>{{ formatCurrency(totalPrice, props.property.currency, locale) }}</span>
        </div>
        <div class="flex justify-between font-semibold text-lg text-gray-900 pt-2">
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
