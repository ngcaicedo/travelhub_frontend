<script setup lang="ts">
import type { ReservationResponse } from '~/types/reservations'

const { t, locale } = useI18n()
const route = useRoute()

const reservationId = route.params.id as string
const loading = ref(false)
const error = ref<string | null>(null)

const errorDescription = computed(() => {
  if (!error.value) return ''
  return error.value.includes('.') ? t(error.value) : error.value
})

const reservation = ref<ReservationResponse | null>(null)
const mockPropertyName = computed(() => t('booking.mockPropertyName'))
const mockGuests = 2
const reservationReference = computed(() => reservation.value ? `#${reservation.value.id.slice(0, 8).toUpperCase()}` : '#')

const formatDate = (dateString: string): string => {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(dateString)
    ? new Date(`${dateString}T00:00:00`)
    : new Date(dateString)
  const localeMap: Record<string, string> = {
    es: 'es-ES',
    en: 'en-US',
    pt: 'pt-PT'
  }

  if (Number.isNaN(date.getTime())) {
    return dateString
  }

  return new Intl.DateTimeFormat(localeMap[locale.value] || 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date)
}

const fetchReservation = async () => {
  loading.value = true
  error.value = null

  try {
    // TODO: Reemplazar con llamado GET real cuando backend esté disponible:
    // reservation.value = await getReservation(reservationId)

    // MVP: Usando mock data para desarrollo local
    const mockReservation: ReservationResponse = {
      id: reservationId,
      status: 'confirmed',
      total_price: '3720',
      currency: 'COP',
      check_in_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      check_out_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString()
    }
    reservation.value = mockReservation
  } catch (err: unknown) {
    error.value = 'errors.failed'
    console.error('Error fetching reservation:', err)
  } finally {
    loading.value = false
  }
}

const copyReservationId = () => {
  if (import.meta.client && reservation.value) {
    navigator.clipboard.writeText(reservation.value.id)
  }
}

const backToHome = async () => {
  await navigateTo('/')
}

onMounted(async () => {
  await fetchReservation()
})

useSeoMeta({
  title: () => `${t('booking.confirmBooking')} - ${t('common.appName')}`
})

definePageMeta({
  layout: 'default'
})
</script>

<template>
  <div class="min-h-screen bg-[#f3f5f9] py-10 md:py-14">
    <div class="max-w-[760px] mx-auto px-4">
      <!-- Loading State -->
      <div
        v-if="loading"
        class="text-center py-12"
      >
        <USpin class="mx-auto mb-4" />
        <p class="text-gray-600">
          {{ t('common.loading') }}
        </p>
      </div>

      <!-- Error State -->
      <UAlert
        v-else-if="error"
        icon="i-lucide-alert-circle"
        color="error"
        :title="t('errors.failed')"
        :description="errorDescription"
        class="mb-8"
      />

      <!-- Success State -->
      <div
        v-else-if="reservation"
        class="space-y-7"
      >
        <!-- Success Header -->
        <div class="text-center pt-2">
          <div class="flex justify-center mb-5">
            <div class="rounded-full bg-green-100/80 p-5">
              <UIcon
                name="i-lucide-check-circle-2"
                class="w-10 h-10 text-green-600"
              />
            </div>
          </div>
          <h1 class="text-[44px] leading-[1.05] font-bold tracking-tight text-slate-900 mb-2">
            {{ t('booking.success') }}
          </h1>
          <p class="text-slate-500 text-[17px]">
            {{ t('booking.confirmationSent') }}
          </p>
        </div>

        <!-- Reservation Summary Card -->
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="grid grid-cols-1 md:grid-cols-[250px_1fr]">
            <div class="h-52 md:h-full">
              <img
                src="/mock/property-1.svg"
                :alt="t('booking.propertyPreviewAlt')"
                class="w-full h-full object-cover"
              >
            </div>
            <div class="p-6 md:p-7">
              <div class="flex items-start justify-between gap-3 mb-3">
                <p class="text-[11px] font-semibold tracking-[0.14em] text-travelhub-600 uppercase">
                  {{ t('booking.reservationDetails') }}
                </p>
                <p class="text-xs font-semibold text-slate-400 uppercase">
                  {{ reservationReference }}
                </p>
              </div>

              <h2 class="text-[30px] leading-tight font-bold text-slate-900 max-w-[420px] mb-5">
                {{ mockPropertyName }}
              </h2>

              <div class="grid grid-cols-2 gap-5 mb-5">
                <div class="flex items-start gap-2.5">
                  <UIcon
                    name="i-lucide-calendar"
                    class="w-4 h-4 text-travelhub-600 mt-0.5"
                  />
                  <div>
                    <p class="text-[11px] tracking-wide uppercase text-slate-400 font-semibold">
                      {{ t('booking.checkIn') }}
                    </p>
                    <p class="text-[15px] text-slate-700 font-medium">
                      {{ formatDate(reservation.check_in_date) }}
                    </p>
                  </div>
                </div>

                <div class="flex items-start gap-2.5">
                  <UIcon
                    name="i-lucide-users"
                    class="w-4 h-4 text-travelhub-600 mt-0.5"
                  />
                  <div>
                    <p class="text-[11px] tracking-wide uppercase text-slate-400 font-semibold">
                      {{ t('booking.guests') }}
                    </p>
                    <p class="text-[15px] text-slate-700 font-medium">
                      {{ mockGuests }} {{ t('booking.adults') }}
                    </p>
                  </div>
                </div>
              </div>

              <UButton
                icon="i-lucide-receipt-text"
                color="neutral"
                variant="soft"
                class="font-semibold"
                @click="copyReservationId"
              >
                {{ t('booking.manageReservation') }}
              </UButton>
            </div>
          </div>
        </div>

        <div class="space-y-4">
          <h3 class="text-[34px] leading-tight font-bold text-slate-900">
            {{ t('booking.nextSteps') }}
          </h3>

          <div class="bg-white rounded-xl border border-slate-200 p-6 md:p-7">
            <div class="flex gap-4 items-start">
              <div class="w-11 h-11 rounded-full bg-travelhub-50 flex items-center justify-center shrink-0 mt-0.5">
                <UIcon
                  name="i-lucide-key-round"
                  class="w-5 h-5 text-travelhub-600"
                />
              </div>
              <div>
                <p class="text-lg font-semibold text-slate-900 mb-1">
                  {{ t('booking.checkInInstructions') }}
                </p>
                <p class="text-slate-500 text-[15px] max-w-[430px]">
                  {{ t('booking.checkInInstructionsDescription') }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="pt-2">
          <div class="border-t border-slate-200 mb-5" />
          <div class="text-center">
            <button
              class="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors font-medium"
              @click="backToHome"
            >
              <UIcon
                name="i-lucide-arrow-left"
                class="w-4 h-4"
              />
              {{ t('booking.backHome') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
