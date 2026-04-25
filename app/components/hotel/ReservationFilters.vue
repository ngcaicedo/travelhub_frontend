<script setup lang="ts">
import type { HostReservationsFilters, ReservationStatus } from '~/types/hotel'

const props = defineProps<{ modelValue: HostReservationsFilters }>()
const emit = defineEmits<{ 'update:modelValue': [HostReservationsFilters] }>()

const { t } = useI18n()

const statusOptions = computed<{ value: ReservationStatus, label: string }[]>(() => [
  { value: 'pending_payment', label: t('hotel.dashboard.status.pendingPayment') },
  { value: 'confirmed', label: t('hotel.dashboard.status.confirmed') },
  { value: 'cancelled', label: t('hotel.dashboard.status.cancelled') },
  { value: 'completed', label: t('hotel.dashboard.status.completed') },
])

const local = reactive<HostReservationsFilters>({ ...props.modelValue })

watch(
  () => props.modelValue,
  (val) => {
    Object.assign(local, val)
  },
  { deep: true },
)

function apply() {
  emit('update:modelValue', { ...local })
}

function clear() {
  local.status = []
  local.start_date = undefined
  local.end_date = undefined
  local.guest_name = ''
  apply()
}
</script>

<template>
  <div class="grid gap-4 md:grid-cols-4">
    <UFormField :label="t('hotel.dashboard.filters.guest')">
      <UInput
        v-model="local.guest_name"
        :placeholder="t('hotel.dashboard.filters.guestPlaceholder')"
        icon="i-lucide-search"
      />
    </UFormField>
    <UFormField :label="t('hotel.dashboard.filters.startDate')">
      <UInput
        v-model="local.start_date"
        type="date"
      />
    </UFormField>
    <UFormField :label="t('hotel.dashboard.filters.endDate')">
      <UInput
        v-model="local.end_date"
        type="date"
      />
    </UFormField>
    <UFormField :label="t('hotel.dashboard.filters.status')">
      <USelectMenu
        v-model="local.status"
        :items="statusOptions"
        value-key="value"
        multiple
        :placeholder="t('hotel.dashboard.filters.statusPlaceholder')"
      />
    </UFormField>
    <div class="md:col-span-4 flex justify-end gap-2">
      <UButton
        variant="ghost"
        :label="t('hotel.dashboard.filters.clear')"
        @click="clear"
      />
      <UButton
        :label="t('hotel.dashboard.filters.apply')"
        @click="apply"
      />
    </div>
  </div>
</template>
