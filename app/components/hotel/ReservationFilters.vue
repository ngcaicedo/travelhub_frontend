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
  local.guest_name = ''
  apply()
}
</script>

<template>
  <div class="flex flex-wrap items-end gap-3">
    <label class="flex flex-1 min-w-[200px] flex-col gap-1">
      <span class="text-xs font-medium text-(--ui-text-muted)">
        {{ t('hotel.dashboard.filters.guest') }}
      </span>
      <UInput
        v-model="local.guest_name"
        :placeholder="t('hotel.dashboard.filters.guestPlaceholder')"
        icon="i-lucide-search"
      />
    </label>
    <label class="flex flex-col gap-1">
      <span class="text-xs font-medium text-(--ui-text-muted)">
        {{ t('hotel.dashboard.filters.status') }}
      </span>
      <USelectMenu
        v-model="local.status"
        :items="statusOptions"
        value-key="value"
        multiple
        :placeholder="t('hotel.dashboard.filters.statusPlaceholder')"
        class="w-[180px]"
      />
    </label>
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
</template>
