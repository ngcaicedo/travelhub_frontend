<script setup lang="ts">
import type { ReservationStatus, ReservationWithDetailsResponse } from '~/types/reservations'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { getReservationsByUser } = useReservations()

type ReservationTab = 'upcoming' | 'past' | 'cancelled'

interface ReservationCardViewModel {
  id: string
  status: ReservationStatus
  imageUrl: string
  imageAlt: string
  propertyName: string
  location: string
  checkInLabel: string
  checkOutLabel: string
  guestLabel: string
  totalLabel: string
  statusLabel: string
  statusTone: string
  kind: ReservationTab
  canCancel: boolean
  canModify: boolean
  isModified: boolean
  isModificationPendingPayment: boolean
  reservation: ReservationWithDetailsResponse['reservation']
}

const loading = ref(true)
const error = ref<string | null>(null)
const selectedTab = ref<ReservationTab>('upcoming')
const reservations = ref<ReservationCardViewModel[]>([])

const localeMap: Record<string, string> = {
  es: 'es-CO',
  en: 'en-US',
  pt: 'pt-BR'
}

const profileName = computed(() => {
  const email = authStore.email

  if (!email) {
    return t('reservationsList.sidebarTitle')
  }

  const localPart = email.split('@')[0] || email
  const normalized = localPart.replace(/[._-]+/g, ' ').trim()

  if (!normalized) {
    return email
  }

  return normalized.replace(/\b\w/g, letter => letter.toUpperCase())
})

const profileInitials = computed(() => {
  if (authStore.email) {
    const localPart = authStore.email.split('@')[0] ?? ''
    const parts = localPart.split(/[._-]+/).filter(Boolean)
    const initials = parts.slice(0, 2).map(part => part[0]?.toUpperCase() ?? '').join('')
    if (initials) return initials
  }

  return 'TH'
})

const filteredReservations = computed(() => reservations.value.filter(item => item.kind === selectedTab.value))
const upcomingCount = computed(() => reservations.value.filter(item => item.kind === 'upcoming').length)
const pastCount = computed(() => reservations.value.filter(item => item.kind === 'past').length)
const cancelledCount = computed(() => reservations.value.filter(item => item.kind === 'cancelled').length)

function formatDate(value: string) {
  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(localeMap[locale.value] || 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(parsed)
}

function formatMoney(amount: string, currency: string) {
  const numeric = Number(amount)

  if (!Number.isFinite(numeric)) {
    return `${amount} ${currency}`
  }

  try {
    return new Intl.NumberFormat(localeMap[locale.value] || 'en-US', {
      style: 'currency',
      currency
    }).format(numeric)
  } catch {
    return `${numeric.toFixed(2)} ${currency}`
  }
}

function getReservationKind(status: ReservationStatus, checkOutDate: string): ReservationTab {
  const cancelledStatuses: ReservationStatus[] = [
    'cancelled', 'cancel_requested', 'refund_pending', 'refund_completed', 'refund_failed', 'additional_charge_failed'
  ]
  if (cancelledStatuses.includes(status)) return 'cancelled'
  return new Date(checkOutDate).getTime() >= Date.now() ? 'upcoming' : 'past'
}

function getStatusTone(status: ReservationStatus) {
  switch (status) {
    case 'confirmed':
      return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
    case 'pending_payment':
      return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
    case 'cancelled':
      return 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'
    case 'refund_completed':
      return 'bg-sky-50 text-sky-700 ring-1 ring-sky-200'
    case 'refund_failed':
      return 'bg-orange-50 text-orange-700 ring-1 ring-orange-200'
    case 'modification_pending_payment':
      return 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200'
    default:
      return 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'
  }
}

async function loadReservations() {
  if (!authStore.isAuthenticated || !authStore.userId) {
    await navigateTo({ path: '/login', query: { redirect: route.fullPath } })
    return
  }

  loading.value = true
  error.value = null

  try {
    const userReservations = await getReservationsByUser(authStore.userId)
    const mockImages = ['/mock/property-1.svg', '/mock/property-2.svg', '/mock/property-3.svg', '/mock/property-4.svg', '/mock/property-5.svg']

    reservations.value = userReservations
      .map<ReservationCardViewModel>((item, index) => {
        const checkInLabel = formatDate(item.reservation.check_in_date)
        const checkOutLabel = formatDate(item.reservation.check_out_date)
        const totalLabel = formatMoney(item.reservation.total_price, item.reservation.currency)
        const location = t('reservationsList.locationFallback')
        const propertyName = item.property_name || t('notifications.summary.propertyFallback')
        const canCancel = item.reservation.status === 'confirmed' || item.reservation.status === 'modification_confirmed'
        const canModify = item.reservation.status === 'confirmed'
        const isModified = item.reservation.status !== 'confirmed'
        const isModificationPendingPayment = item.reservation.status === 'modification_pending_payment'

        return {
          id: item.id,
          status: item.reservation.status,
          canCancel,
          canModify,
          isModified,
          isModificationPendingPayment,
          imageUrl: item.property_cover_image_url || mockImages[index % mockImages.length] || '/mock/property-1.svg',
          imageAlt: propertyName,
          propertyName,
          location,
          checkInLabel,
          checkOutLabel,
          guestLabel: t('reservationsList.guestCount', { count: item.reservation.number_of_guests }),
          totalLabel,
          statusLabel: t(`status.${item.reservation.status}`),
          statusTone: getStatusTone(item.reservation.status),
          kind: getReservationKind(item.reservation.status, item.reservation.check_out_date),
          reservation: item.reservation
        }
      })
      .sort((left, right) => {
        const leftDate = new Date(left.reservation.check_in_date).getTime()
        const rightDate = new Date(right.reservation.check_in_date).getTime()

        const kindOrder: Record<string, number> = { upcoming: 0, past: 1, cancelled: 2 }
        if (left.kind !== right.kind) {
          return (kindOrder[left.kind] ?? 3) - (kindOrder[right.kind] ?? 3)
        }

        return left.kind === 'upcoming' ? leftDate - rightDate : rightDate - leftDate
      })

    if (!reservations.value.length) {
      selectedTab.value = 'upcoming'
      return
    }

    if (!upcomingCount.value && pastCount.value) {
      selectedTab.value = 'past'
    } else if (!upcomingCount.value && !pastCount.value) {
      selectedTab.value = 'cancelled'
    }
  } catch (loadError) {
    error.value = t('errors.failed')
    console.error('Failed to load reservations dashboard:', loadError)
  } finally {
    loading.value = false
  }
}

async function modifyReservation(reservationId: string) {
  await router.push(`/reservations/${reservationId}/modify`)
}

async function cancelReservation(reservationId: string) {
  await router.push(`/reservations/${reservationId}/cancel`)
}

async function goToProperties() {
  await router.push('/properties')
}

onMounted(async () => {
  await loadReservations()
})

useSeoMeta({
  title: () => `${t('reservationsList.meta.title')} - ${t('common.appName')}`
})

definePageMeta({
  layout: 'default'
})
</script>

<template>
  <div class="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#f3f5f9_100%)] py-6 md:py-10">
    <div class="mx-auto max-w-[1280px] px-4">
      <div class="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside class="lg:sticky lg:top-6 lg:h-fit">
          <div class="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
            <div class="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
              <div class="flex h-11 w-11 items-center justify-center rounded-full bg-[#dbeafe] text-sm font-bold text-blue-700">
                {{ profileInitials }}
              </div>
              <div class="min-w-0">
                <p class="truncate text-[15px] font-semibold text-slate-900">
                  {{ profileName }}
                </p>
                <p class="truncate text-xs text-slate-500">
                  {{ authStore.email || t('reservationsList.sidebarSubtitle') }}
                </p>
              </div>
            </div>

            <div class="mt-4 space-y-2.5">
              <UButton
                block
                color="primary"
                variant="solid"
                icon="i-lucide-luggage"
                class="justify-start rounded-2xl px-4 py-3 text-[15px] font-semibold shadow-[0_10px_24px_rgba(37,99,235,0.2)]"
              >
                {{ t('reservationsList.myBookings') }}
              </UButton>

              <UButton
                block
                color="neutral"
                variant="soft"
                icon="i-lucide-map-pinned"
                class="justify-start rounded-2xl px-4 py-3 text-[15px] font-semibold"
                @click="goToProperties"
              >
                {{ t('reservationsList.newBooking') }}
              </UButton>
            </div>

            <div class="mt-8 rounded-2xl bg-slate-50 p-4">
              <p class="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                {{ t('reservationsList.sidebarTitle') }}
              </p>
              <p class="mt-2 text-sm leading-6 text-slate-600">
                {{ t('reservationsList.sidebarSubtitle') }}
              </p>
            </div>

          </div>
        </aside>

        <main class="min-w-0">
          <div class="mb-6 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
                {{ t('navigation.reservations') }}
              </p>
              <h1 class="mt-2 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                {{ t('reservationsList.title') }}
              </h1>
              <p class="mt-3 max-w-2xl text-base leading-7 text-slate-500">
                {{ t('reservationsList.subtitle') }}
              </p>
            </div>

            <UButton
              color="primary"
              variant="solid"
              icon="i-lucide-plus"
              class="w-fit rounded-2xl px-4 py-3 text-[15px] font-semibold shadow-[0_14px_30px_rgba(37,99,235,0.22)]"
              @click="goToProperties"
            >
              {{ t('reservationsList.newBooking') }}
            </UButton>
          </div>

          <div class="mb-5 flex items-end gap-8 border-b border-slate-200">
            <button
              type="button"
              class="relative pb-4 text-sm font-semibold transition-colors"
              :class="selectedTab === 'upcoming' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'"
              data-cy="reservation-tab-upcoming"
              @click="selectedTab = 'upcoming'"
            >
              <span class="inline-flex items-center gap-2">
                {{ t('reservationsList.upcoming') }}
                <span
                  class="rounded-full px-2 py-0.5 text-[11px] font-bold"
                  :class="selectedTab === 'upcoming' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'"
                >
                  {{ upcomingCount }}
                </span>
              </span>
              <span
                v-if="selectedTab === 'upcoming'"
                class="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-blue-600"
              />
            </button>

            <button
              type="button"
              class="relative pb-4 text-sm font-semibold transition-colors"
              :class="selectedTab === 'past' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'"
              data-cy="reservation-tab-past"
              @click="selectedTab = 'past'"
            >
              <span class="inline-flex items-center gap-2">
                {{ t('reservationsList.past') }}
                <span
                  class="rounded-full px-2 py-0.5 text-[11px] font-bold"
                  :class="selectedTab === 'past' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'"
                >
                  {{ pastCount }}
                </span>
              </span>
              <span
                v-if="selectedTab === 'past'"
                class="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-blue-600"
              />
            </button>

            <button
              type="button"
              class="relative pb-4 text-sm font-semibold transition-colors"
              :class="selectedTab === 'cancelled' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'"
              data-cy="reservation-tab-cancelled"
              @click="selectedTab = 'cancelled'"
            >
              <span class="inline-flex items-center gap-2">
                {{ t('reservationsList.cancelled') }}
                <span
                  class="rounded-full px-2 py-0.5 text-[11px] font-bold"
                  :class="selectedTab === 'cancelled' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'"
                >
                  {{ cancelledCount }}
                </span>
              </span>
              <span
                v-if="selectedTab === 'cancelled'"
                class="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-blue-600"
              />
            </button>
          </div>

          <UAlert
            v-if="error"
            icon="i-lucide-alert-circle"
            color="error"
            :title="error"
            class="mb-5"
          />

          <div v-if="loading" class="rounded-[28px] border border-slate-200 bg-white p-10 text-center shadow-[0_18px_60px_rgba(15,23,42,0.05)]">
            <UIcon name="i-lucide-loader-circle" class="mx-auto mb-3 size-8 animate-spin text-blue-600" />
            <p class="text-slate-600">
              {{ t('reservationsList.loading') }}
            </p>
          </div>

          <div
            v-else-if="!filteredReservations.length"
            class="rounded-[28px] border border-dashed border-slate-300 bg-white px-8 py-14 text-center shadow-[0_18px_60px_rgba(15,23,42,0.04)]"
            data-cy="reservation-empty"
          >
            <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <UIcon name="i-lucide-luggage" class="h-8 w-8 text-slate-500" />
            </div>
            <h2 class="mt-5 text-2xl font-bold tracking-tight text-slate-900">
              {{ t('reservationsList.emptyTitle') }}
            </h2>
            <p class="mx-auto mt-3 max-w-[520px] text-slate-500">
              {{ t('reservationsList.emptyDescription') }}
            </p>

            <div class="mt-8 flex justify-center gap-3">
              <UButton color="primary" variant="solid" @click="goToProperties">
                {{ t('reservationsList.newBooking') }}
              </UButton>
              <UButton color="neutral" variant="soft" @click="selectedTab = selectedTab === 'upcoming' ? 'past' : 'upcoming'">
                {{ selectedTab === 'upcoming' ? t('reservationsList.past') : t('reservationsList.upcoming') }}
              </UButton>
            </div>
          </div>

          <div
            v-else
            class="space-y-5"
            data-cy="reservation-list"
          >
            <article
              v-for="reservation in filteredReservations"
              :key="reservation.id"
              class="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.06)]"
              data-cy="reservation-card"
              :data-cy-reservation-id="reservation.id"
              :data-cy-reservation-status="reservation.status"
            >
              <div class="grid lg:grid-cols-[260px_1fr]">
                <div class="relative min-h-[240px] overflow-hidden bg-slate-100 lg:min-h-full">
                  <img
                    :src="reservation.imageUrl"
                    :alt="reservation.imageAlt"
                    class="h-full w-full object-cover"
                  >
                  <div class="absolute left-4 top-4 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]" :class="reservation.statusTone">
                    {{ reservation.statusLabel }}
                  </div>
                </div>

                <div class="p-6 md:p-7">
                  <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div class="min-w-0">
                      <h2 class="truncate text-2xl font-bold tracking-tight text-slate-900">
                        {{ reservation.propertyName }}
                      </h2>
                      <p class="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                        <UIcon name="i-lucide-map-pin" class="h-4 w-4 shrink-0 text-blue-600" />
                        {{ reservation.location }}
                      </p>
                    </div>

                    <div class="text-left xl:text-right">
                      <p class="text-3xl font-bold tracking-tight text-blue-600">
                        {{ reservation.totalLabel }}
                      </p>
                      <p class="mt-1 text-sm text-slate-400">
                        {{ reservation.status === 'pending_payment' ? t('reservationsList.estimatedPrice') : t('reservationsList.totalPrice') }}
                      </p>
                    </div>
                  </div>

                  <div class="mt-6 grid gap-4 border-t border-slate-200 pt-5 sm:grid-cols-2">
                    <div class="rounded-2xl bg-slate-50 p-4">
                      <p class="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                        {{ t('booking.checkIn') }}
                      </p>
                      <p class="mt-1 text-[15px] font-semibold text-slate-900">
                        {{ reservation.checkInLabel }}
                      </p>
                    </div>

                    <div class="rounded-2xl bg-slate-50 p-4">
                      <p class="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                        {{ t('booking.checkOut') }}
                      </p>
                      <p class="mt-1 text-[15px] font-semibold text-slate-900">
                        {{ reservation.checkOutLabel }}
                      </p>
                    </div>
                  </div>

                  <div class="mt-5 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                    <span class="inline-flex items-center gap-2">
                      <UIcon name="i-lucide-users" class="h-4.5 w-4.5 text-blue-600" />
                      {{ reservation.guestLabel }}
                    </span>
                    <span class="inline-flex items-center gap-2">
                      <UIcon name="i-lucide-calendar-range" class="h-4.5 w-4.5 text-blue-600" />
                      {{ t('reservationsList.viewDetails') }}
                    </span>
                  </div>

                  <div class="mt-6 flex flex-wrap gap-3 border-t border-slate-200 pt-5">
                    <template v-if="reservation.isModificationPendingPayment">
                      <p class="w-full text-sm text-slate-500">{{ t('reservationsList.additionalPaymentAtCheckIn') }}</p>
                    </template>
                    <template v-else-if="reservation.isModified">
                      <p class="w-full text-sm text-slate-500">{{ t('reservationsList.modifiedReservationNoActions') }}</p>
                    </template>
                    <template v-else>
                      <UButton
                        color="neutral"
                        variant="soft"
                        icon="i-lucide-pencil"
                        class="rounded-2xl px-4 py-2.5 text-[14px] font-semibold"
                        :disabled="!reservation.canModify"
                        data-cy="reservation-card-modify"
                        @click="modifyReservation(reservation.id)"
                      >
                        {{ t('reservationFlow.detail.modifyButton') }}
                      </UButton>

                      <UButton
                        color="error"
                        variant="soft"
                        icon="i-lucide-x-circle"
                        class="rounded-2xl px-4 py-2.5 text-[14px] font-semibold"
                        :disabled="!reservation.canCancel"
                        :title="reservation.canCancel ? undefined : t('reservationsList.cancelUnavailable')"
                        data-cy="reservation-card-cancel"
                        @click="cancelReservation(reservation.id)"
                      >
                        {{ t('reservationsList.cancelReservation') }}
                      </UButton>
                    </template>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>