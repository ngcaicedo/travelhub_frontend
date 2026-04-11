<script setup lang="ts">
const { t, locale } = useI18n()
const { latestReservation } = usePaymentConfirmation()

const localeMap: Record<string, string> = {
  es: 'es-CO',
  en: 'en-US',
  pt: 'pt-BR'
}

function formatDate(value: string | null) {
  if (!value) return '-'
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00`)
    : new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(localeMap[locale.value] || 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(parsed)
}

function formatMoney(amountInCents: number, currency: string) {
  try {
    return new Intl.NumberFormat(localeMap[locale.value] || 'en-US', {
      style: 'currency',
      currency
    }).format(amountInCents / 100)
  } catch {
    return `${(amountInCents / 100).toFixed(2)} ${currency}`
  }
}

useSeoMeta({
  title: () => `${t('reservationHistory.meta.title')} - ${t('common.appName')}`
})

definePageMeta({
  layout: 'default'
})
</script>

<template>
  <div class="min-h-screen bg-[#f3f5f9] py-10 md:py-14">
    <div class="mx-auto max-w-[920px] px-4">
      <div class="mb-8">
        <p class="text-sm font-semibold uppercase tracking-[0.16em] text-travelhub-600">
          {{ t('reservationHistory.badge') }}
        </p>
        <h1 class="mt-3 text-4xl font-bold tracking-tight text-slate-900">
          {{ t('reservationHistory.title') }}
        </h1>
        <p class="mt-2 max-w-[640px] text-base text-slate-500">
          {{ t('reservationHistory.subtitle') }}
        </p>
      </div>

      <div
        v-if="latestReservation"
        class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p class="text-sm font-semibold uppercase tracking-[0.16em] text-travelhub-600">
              {{ t('reservationHistory.latestReservation') }}
            </p>
            <h2 class="mt-2 text-2xl font-bold text-slate-900">
              {{ latestReservation.propertyName || t('notifications.summary.propertyFallback') }}
            </h2>
          </div>
          <span class="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
            {{ t(`status.${latestReservation.status}`) }}
          </span>
        </div>

        <div class="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div class="rounded-xl bg-slate-50 p-4">
            <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              {{ t('notifications.summary.reservationId') }}
            </p>
            <p class="mt-2 break-all text-sm font-medium text-slate-700">
              {{ latestReservation.reservationId }}
            </p>
          </div>
          <div class="rounded-xl bg-slate-50 p-4">
            <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              {{ t('notifications.summary.dates') }}
            </p>
            <p class="mt-2 text-sm font-medium text-slate-700">
              {{ formatDate(latestReservation.checkInDate) }} - {{ formatDate(latestReservation.checkOutDate) }}
            </p>
          </div>
          <div class="rounded-xl bg-slate-50 p-4">
            <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              {{ t('notifications.summary.amountPaid') }}
            </p>
            <p class="mt-2 text-sm font-medium text-slate-700">
              {{ formatMoney(latestReservation.amountInCents, latestReservation.currency) }}
            </p>
          </div>
          <div class="rounded-xl bg-slate-50 p-4">
            <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              {{ t('notifications.receipt.label') }}
            </p>
            <p class="mt-2 text-sm font-medium text-slate-700">
              {{ latestReservation.receiptNumber || t('notifications.receipt.pending') }}
            </p>
          </div>
        </div>
      </div>

      <div
        v-else
        class="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm"
      >
        <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
          <UIcon
            name="i-lucide-suitcase"
            class="h-8 w-8 text-slate-500"
          />
        </div>
        <h2 class="mt-5 text-2xl font-bold text-slate-900">
          {{ t('reservationHistory.emptyTitle') }}
        </h2>
        <p class="mx-auto mt-3 max-w-[480px] text-slate-500">
          {{ t('reservationHistory.emptyDescription') }}
        </p>
      </div>
    </div>
  </div>
</template>
