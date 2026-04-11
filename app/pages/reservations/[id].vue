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
const localeMap: Record<string, string> = {
  es: 'es-CO',
  en: 'en-US',
  pt: 'pt-BR'
}

const buildReservationCode = (value: string): string => {
  const seed = value.replace(/[^a-fA-F0-9]/g, '')

  if (!seed) return '00000'

  const numericSeed = Number.parseInt(seed.slice(0, 10), 16)
  const safeValue = Number.isFinite(numericSeed) ? numericSeed : 0

  return String((safeValue % 90000) + 10000)
}

const reservationReference = computed(() => reservation.value ? `#TH-${buildReservationCode(reservation.value.id)}` : '#')

const formatDate = (dateString: string): string => {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(dateString)
    ? new Date(`${dateString}T00:00:00`)
    : new Date(dateString)

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

const checkInSummary = computed(() => reservation.value ? formatDate(reservation.value.check_in_date) : '-')
const guestSummary = computed(() => `${mockGuests} ${t('booking.adults')}`)

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
  <div class="min-h-screen bg-[#f4f6fb] py-8 md:py-12">
    <div class="mx-auto max-w-[920px] px-4">
      <div
        v-if="loading"
        class="py-14 text-center"
      >
        <USpin class="mx-auto mb-4" />
        <p class="text-slate-600">
          {{ t('common.loading') }}
        </p>
      </div>

      <UAlert
        v-else-if="error"
        icon="i-lucide-alert-circle"
        color="error"
        :title="t('errors.failed')"
        :description="errorDescription"
        class="mx-auto max-w-[720px]"
      />

      <div
        v-else-if="reservation"
        class="mx-auto max-w-[760px] space-y-9"
      >
        <div class="pt-1 text-center">
          <div class="mb-6 flex justify-center">
            <div class="flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[#dff7e8]">
              <UIcon
                name="i-lucide-circle-check-big"
                class="h-8 w-8 text-[#16a34a]"
              />
            </div>
          </div>

          <h1 class="text-[34px] leading-[1.02] font-bold tracking-tight text-slate-900 md:text-[50px]">
            {{ t('booking.success') }}
          </h1>
          <p class="mx-auto mt-2 max-w-[520px] text-[16px] leading-7 text-slate-500">
            {{ t('booking.confirmationSent') }}
          </p>
        </div>

        <div class="overflow-hidden rounded-2xl border border-[#dbe4ef] bg-white shadow-[0_2px_10px_rgba(15,23,42,0.04)]">
          <div class="grid grid-cols-1 md:grid-cols-[260px_1fr]">
            <div class="h-[172px] md:h-full">
              <img
                src="/mock/property-1.svg"
                :alt="t('booking.propertyPreviewAlt')"
                class="h-full w-full object-cover"
              >
            </div>

            <div class="flex flex-col justify-center p-7 md:px-8 md:py-6">
              <div class="mb-4 flex items-start justify-between gap-4">
                <p class="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#2563eb]">
                  {{ t('booking.reservationDetails') }}
                </p>
                <p class="pt-0.5 text-[14px] font-medium text-slate-400">
                  {{ reservationReference }}
                </p>
              </div>

              <h2 class="mb-5 max-w-[400px] text-[18px] leading-[1.35] font-semibold text-slate-900 md:text-[19px]">
                {{ mockPropertyName }}
              </h2>

              <div class="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div class="flex items-start gap-2.5">
                  <UIcon
                    name="i-lucide-calendar-range"
                    class="mt-0.5 h-4.5 w-4.5 text-[#2563eb]"
                  />
                  <div>
                    <p class="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                      {{ t('booking.checkIn') }}
                    </p>
                    <p class="text-[14px] leading-5 font-medium text-slate-700">
                      {{ checkInSummary }}
                    </p>
                  </div>
                </div>

                <div class="flex items-start gap-2.5">
                  <UIcon
                    name="i-lucide-users"
                    class="mt-0.5 h-4.5 w-4.5 text-[#2563eb]"
                  />
                  <div>
                    <p class="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                      {{ t('booking.guests') }}
                    </p>
                    <p class="text-[14px] leading-5 font-medium text-slate-700">
                      {{ guestSummary }}
                    </p>
                  </div>
                </div>
              </div>

              <UButton
                icon="i-lucide-clipboard-list"
                color="neutral"
                variant="soft"
                class="w-fit rounded-xl border-0 bg-[#f5f7fb] px-4 py-2 text-[14px] font-semibold text-slate-700 hover:bg-[#eef3fb]"
                @click="copyReservationId"
              >
                {{ t('booking.manageReservation') }}
              </UButton>
            </div>
          </div>
        </div>

        <div class="space-y-4">
          <h3 class="text-[20px] font-bold tracking-tight text-slate-900 md:text-[22px]">
            {{ t('booking.nextSteps') }}
          </h3>

          <div class="rounded-2xl border border-[#dbe4ef] bg-white px-5 py-6 shadow-[0_2px_10px_rgba(15,23,42,0.03)] md:min-h-[122px] md:px-6">
            <div class="flex items-start gap-4">
              <div class="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#edf3ff]">
                <UIcon
                  name="i-lucide-key-round"
                  class="h-4.5 w-4.5 text-[#2563eb]"
                />
              </div>
              <div class="pt-1">
                <p class="mb-1 text-[15px] font-semibold text-slate-900">
                  {{ t('booking.checkInInstructions') }}
                </p>
                <p class="max-w-[250px] text-[14px] leading-6 text-slate-500">
                  {{ t('booking.checkInInstructionsDescription') }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="pt-2">
          <div class="mb-7 border-t border-slate-200" />
          <div class="text-center">
            <button
              class="inline-flex items-center gap-2 text-[15px] font-medium text-slate-500 transition-colors hover:text-slate-700"
              @click="backToHome"
            >
              <UIcon
                name="i-lucide-arrow-left"
                class="h-4 w-4"
              />
              {{ t('booking.backHome') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
