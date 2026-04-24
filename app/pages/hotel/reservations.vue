<script setup lang="ts">
import type { Property } from '~/types/api'
import type {
  HotelReservationListItem,
  ReservationCancellationReason
} from '~/types/reservations'
import {
  cancelHotelReservation,
  confirmHotelReservation,
  getHotelReservations
} from '~/services/reservationService'
import { getAllProperties } from '~/services/propertyServices'

const authStore = useAuthStore()
const route = useRoute()

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

const statusOptions = [
  { label: 'Todos', value: 'all' },
  { label: 'Pendiente', value: 'pending_payment' },
  { label: 'Confirmada', value: 'confirmed' },
  { label: 'Cancelada', value: 'cancelled' },
  { label: 'Completada', value: 'completed' }
]

const cancellationReasonOptions = [
  { label: 'Mantenimiento', value: 'maintenance' },
  { label: 'Overbooking', value: 'overbooking' },
  { label: 'Politica del hotel', value: 'hotel_policy' },
  { label: 'Otro', value: 'other' }
]

useSeoMeta({
  title: 'Dashboard de reservas hoteleras - TravelHub'
})

definePageMeta({
  layout: 'default'
})

const cancelTargetReservation = computed(() =>
  reservations.value.find(reservation => reservation.id === cancelTargetId.value) || null
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

const statusLabels: Record<string, string> = {
  pending_payment: 'Pendiente',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
  completed: 'Completada'
}

function propertyName(propertyId: string) {
  return properties.value.find(property => property.id === propertyId)?.name || propertyId
}

function reservationStatusLabel(status: string) {
  return statusLabels[status] || status
}

function canConfirm(status: string) {
  return status === 'pending_payment'
}

function canCancel(status: string) {
  return status === 'pending_payment' || status === 'confirmed'
}

function formatMoney(amount: string, currency: string) {
  const parsed = Number(amount)
  if (Number.isNaN(parsed)) return `${amount} ${currency}`
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency
  }).format(parsed)
}

function formatDate(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return new Intl.DateTimeFormat('es-CO', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(parsed)
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
    error.value = (err as { message?: string }).message || 'No fue posible cargar las reservas.'
  } finally {
    loading.value = false
  }
}

async function confirmReservation(reservationId: string) {
  if (!authStore.token) return
  actingId.value = reservationId
  error.value = null
  success.value = null
  try {
    await confirmHotelReservation(reservationId, authStore.token, 'confirmacion manual del hotel')
    success.value = 'La reserva fue confirmada y se notifico al viajero.'
    await loadReservations()
  } catch (err) {
    error.value = (err as { message?: string }).message || 'No fue posible confirmar la reserva.'
  } finally {
    actingId.value = null
  }
}

async function cancelReservation(reservationId: string) {
  if (!authStore.token) return
  if (isCancellationNoteRequired.value && !cancellationNote.value) {
    error.value = 'Debes agregar una nota cuando selecciones "Otro" como motivo.'
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
      cancelReason.value === 'other' ? cancellationNote.value : undefined
    )
    closeCancelModal()
    success.value = 'La reserva fue cancelada. Si aplicaba, el reembolso se inicio automaticamente.'
    await loadReservations()
  } catch (err) {
    error.value = (err as { message?: string }).message || 'No fue posible cancelar la reserva.'
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
          Operacion hotelera
        </p>
        <h1 class="mt-3 text-4xl font-bold tracking-tight text-slate-900">
          Dashboard de reservas
        </h1>
        <p class="mt-2 max-w-[760px] text-base text-slate-500">
          Confirma o cancela reservas pendientes y confirmadas sin salir del panel operativo.
        </p>
      </div>

      <UAlert
        v-if="error"
        color="error"
        icon="i-lucide-alert-circle"
        class="mb-4"
        title="No pudimos completar la accion"
        :description="error"
        closable
        @close="error = null"
      />

      <UAlert
        v-if="success"
        color="success"
        icon="i-lucide-check-circle-2"
        class="mb-4"
        title="Operacion completada"
        :description="success"
        closable
        @close="success = null"
      />

      <div class="mb-6 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2">
        <USelect
          v-model="selectedPropertyId"
          :items="properties.map(property => ({ label: property.name, value: property.id }))"
          placeholder="Selecciona una propiedad"
        />
        <USelect
          v-model="statusFilter"
          :items="statusOptions"
          placeholder="Filtrar por estado"
        />
      </div>

      <div
        v-if="loading"
        class="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm"
      >
        Cargando reservas...
      </div>

      <div
        v-else-if="reservations.length === 0"
        class="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm"
      >
        <h2 class="text-2xl font-bold text-slate-900">
          No hay reservas para este filtro
        </h2>
        <p class="mt-3 text-slate-500">
          Ajusta la propiedad o el estado para ver reservas operables.
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
                Reserva {{ reservation.id }}
              </h2>
              <p class="mt-1 text-sm text-slate-500">
                {{ formatDate(reservation.check_in_date) }} - {{ formatDate(reservation.check_out_date) }}
              </p>
            </div>

            <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
              {{ reservation.status }}
            </span>
          </div>

          <div class="mt-5 grid gap-4 md:grid-cols-4">
            <div class="rounded-xl bg-slate-50 p-4">
              <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Huespedes
              </p>
              <p class="mt-2 text-sm font-medium text-slate-700">
                {{ reservation.number_of_guests }}
              </p>
            </div>
            <div class="rounded-xl bg-slate-50 p-4">
              <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Monto
              </p>
              <p class="mt-2 text-sm font-medium text-slate-700">
                {{ formatMoney(reservation.total_price, reservation.currency) }}
              </p>
            </div>
            <div class="rounded-xl bg-slate-50 p-4">
              <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Viajero
              </p>
              <p class="mt-2 break-all text-sm font-medium text-slate-700">
                {{ reservation.id_traveler }}
              </p>
            </div>
            <div class="rounded-xl bg-slate-50 p-4">
              <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Hold
              </p>
              <p class="mt-2 text-sm font-medium text-slate-700">
                {{ formatDate(reservation.hold_expires_at) }}
              </p>
            </div>
          </div>

          <div class="mt-5 flex flex-wrap gap-3">
            <UButton
              v-if="canConfirm(reservation.status)"
              icon="i-lucide-check"
              color="primary"
              :loading="actingId === reservation.id"
              @click="confirmReservation(reservation.id)"
            >
              Confirmar
            </UButton>
            <UButton
              v-if="canCancel(reservation.status)"
              icon="i-lucide-ban"
              color="error"
              variant="soft"
              @click="openCancelModal(reservation.id)"
            >
              Cancelar
            </UButton>
          </div>
        </article>
      </div>
    </div>

    <UModal
      v-model:open="isCancelModalOpen"
      title="Confirmar cancelación"
      :close="false"
      :ui="{
        content: 'max-w-[512px] rounded-[24px]',
        header: 'border-b border-slate-200 px-6 py-5 sm:px-8',
        body: 'px-6 py-6 sm:px-8',
        footer: 'border-t border-slate-200 px-6 py-5 sm:px-8'
      }"
    >
      <template #title>
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
            <UIcon
              name="i-lucide-badge-x"
              class="h-6 w-6"
            />
          </div>
          <div>
            <p class="text-2xl font-bold text-slate-900">
              Confirmar Cancelación
            </p>
          </div>
        </div>
      </template>

      <template #body>
        <div
          v-if="cancelTargetReservation"
          class="space-y-6"
        >
          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p class="text-xs font-semibold uppercase tracking-[0.16em] text-travelhub-600">
              Resumen de la reserva
            </p>
            <div class="mt-3 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p class="text-xl font-bold text-slate-900">
                  {{ propertyName(cancelTargetReservation.id_property) }}
                </p>
                <p class="mt-1 text-sm text-slate-500">
                  ID: #{{ cancelTargetReservation.id }}
                </p>
                <p class="mt-2 text-sm text-slate-600">
                  {{ cancelTargetReservation.number_of_guests }} huéspedes · {{ reservationStatusLabel(cancelTargetReservation.status) }}
                </p>
              </div>
              <div class="text-sm text-slate-500 md:text-right">
                <p>{{ formatDate(cancelTargetReservation.check_in_date) }} - {{ formatDate(cancelTargetReservation.check_out_date) }}</p>
                <p class="mt-1 font-medium text-slate-700">
                  {{ formatMoney(cancelTargetReservation.total_price, cancelTargetReservation.currency) }}
                </p>
              </div>
            </div>
          </div>

          <div class="space-y-2">
            <label
              for="reservation-cancel-reason"
              class="text-sm font-semibold text-slate-700"
            >
              Motivo de la cancelación
            </label>
            <USelect
              id="reservation-cancel-reason"
              v-model="cancelReason"
              :items="cancellationReasonOptions"
              placeholder="Selecciona un motivo..."
              data-testid="cancel-reason-select"
            />
          </div>

          <div class="space-y-2">
            <label
              for="reservation-cancel-note"
              class="text-sm font-semibold text-slate-700"
            >
              Notas adicionales {{ isCancellationNoteRequired ? '(Obligatorio)' : '(Opcional)' }}
            </label>
            <UTextarea
              id="reservation-cancel-note"
              v-model="cancelNote"
              :rows="4"
              autoresize
              placeholder="Añade más detalles sobre la cancelación..."
              data-testid="cancel-note-textarea"
            />
            <p
              v-if="isCancellationNoteRequired && !cancellationNote"
              class="text-sm font-medium text-rose-600"
            >
              Debes indicar el motivo específico de la cancelación.
            </p>
          </div>

          <UAlert
            color="warning"
            variant="subtle"
            icon="i-lucide-circle-alert"
            title="Aviso importante"
            :description="cancelTargetReservation.status === 'confirmed'
              ? 'Al confirmar, se iniciará el proceso de reembolso automático según la política de cancelación vigente. Esta acción no se puede deshacer.'
              : 'Al confirmar, la reserva quedará cancelada y la habitación volverá a estar disponible. Esta acción no se puede deshacer.'"
          />
        </div>
      </template>

      <template #footer>
        <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <UButton
            color="neutral"
            variant="outline"
            @click="closeCancelModal()"
          >
            Mantener Reserva
          </UButton>
          <UButton
            color="error"
            icon="i-lucide-ban"
            :disabled="isCancellationSubmitDisabled"
            :loading="actingId === cancelTargetId"
            @click="cancelTargetReservation && cancelReservation(cancelTargetReservation.id)"
          >
            Confirmar Cancelación
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
