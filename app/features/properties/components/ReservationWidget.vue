<script setup lang="ts">
import type { ReservationRequest } from '~/shared/types/api'
import {
  calculateStayDuration,
  calculateTotalPrice,
  formatCurrency,
  validateReservationDates
} from '~/shared/utils/validation'
import { useReservations } from '~/features/reservations/composables/useReservations'

interface Props {
  property: {
    id: string
    price_per_night: number
    currency: string
    max_guests: number
  }
}

const { t } = useI18n()
const router = useRouter()
const { createReservation, loading, error } = useReservations()

const props = defineProps<Props>()

const checkInDate = ref<string>('')
const checkOutDate = ref<string>('')
const numberOfGuests = ref<number>(1)
const submitError = ref<string | null>(null)

// Computed properties
const checkInDateObj = computed((): Date | null => {
  return checkInDate.value ? new Date(checkInDate.value) : null
})

const checkOutDateObj = computed((): Date | null => {
  return checkOutDate.value ? new Date(checkOutDate.value) : null
})

const stayDuration = computed(() => {
  if (checkInDateObj.value && checkOutDateObj.value) {
    return calculateStayDuration(checkInDateObj.value, checkOutDateObj.value)
  }
  return 0
})

const totalPrice = computed(() => {
  if (stayDuration.value > 0) {
    return calculateTotalPrice(props.property.price_per_night, stayDuration.value)
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
  return today.toISOString().split('T')[0]!
}

const getMaxCheckoutDate = (): string => {
  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + 365)
  return maxDate.toISOString().split('T')[0]!
}

const handleSubmit = async () => {
  if (!canBook.value || !checkInDate.value || !checkOutDate.value) return

  submitError.value = null

  try {
    // TODO: Obtener user ID desde autenticación
    const mockUserId = '11111111-1111-1111-1111-111111111111'

    const reservationData: ReservationRequest = {
      id_traveler: mockUserId,
      id_property: props.property.id,
      check_in_date: new Date(checkInDate.value!).toISOString(),
      check_out_date: new Date(checkOutDate.value!).toISOString(),
      number_of_guests: numberOfGuests.value,
      currency: props.property.currency
    }

    const response = await createReservation(reservationData)

    // Navegar a página de confirmación
    await router.push(`/reservations/${response.id}`)
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
</script>

<template>
  <div class="bg-white rounded-lg border border-gray-200 p-6 sticky top-6 shadow-lg space-y-6">
    <!-- Price Header -->
    <div>
      <h3 class="text-3xl font-bold text-gray-900">
        {{ formatCurrency(props.property.price_per_night, props.property.currency) }}
        <span class="text-lg text-gray-600 font-normal">/{{ t('common.night') }}</span>
      </h3>
    </div>

    <!-- Booking Form -->
    <form
      class="space-y-4"
      @submit.prevent="handleSubmit"
    >
      <!-- Dates -->
      <div class="space-y-2">
        <label class="text-sm font-semibold text-gray-900">
          {{ t('booking.dates') }}
        </label>
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
          <span>{{ formatCurrency(props.property.price_per_night, props.property.currency) }} × {{ stayDuration }} {{ t('common.nights') }}</span>
          <span>{{ formatCurrency(totalPrice, props.property.currency) }}</span>
        </div>
        <div class="flex justify-between font-semibold text-lg text-gray-900 pt-2">
          <span>{{ t('booking.total') }}</span>
          <span>{{ formatCurrency(totalPrice, props.property.currency) }}</span>
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
    </form>
  </div>
</template>
