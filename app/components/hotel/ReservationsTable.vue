<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { HostReservationItem, HostReservationsPage } from '~/types/hotel'

const props = defineProps<{
  data: HostReservationsPage | null
  loading: boolean
  page: number
  pageSize: number
  sortBy: 'check_in_date' | 'created_at' | 'total_price'
  sortDir: 'asc' | 'desc'
}>()

const emit = defineEmits<{
  'update:page': [number]
  'update:sortBy': ['check_in_date' | 'created_at' | 'total_price']
  'update:sortDir': ['asc' | 'desc']
}>()

const { t, locale } = useI18n()

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(locale.value, {
    month: 'short',
    day: '2-digit',
  })
}

function formatRange(item: HostReservationItem) {
  return `${formatDate(item.check_in_date)} → ${formatDate(item.check_out_date)}`
}

function formatPrice(item: HostReservationItem) {
  return new Intl.NumberFormat(locale.value, {
    style: 'currency',
    currency: item.currency || 'COP',
    maximumFractionDigits: 2,
  }).format(Number(item.total_price))
}

function nights(item: HostReservationItem) {
  const inDate = new Date(item.check_in_date).getTime()
  const outDate = new Date(item.check_out_date).getTime()
  return Math.max(Math.round((outDate - inDate) / (1000 * 60 * 60 * 24)), 0)
}

const columns: TableColumn<HostReservationItem>[] = [
  { accessorKey: 'guest_full_name', header: t('hotel.dashboard.table.headers.guest') },
  { accessorKey: 'room_type', header: t('hotel.dashboard.table.headers.room') },
  {
    accessorKey: 'check_in_date',
    header: t('hotel.dashboard.table.headers.checkIn'),
    enableSorting: true,
  },
  {
    accessorKey: 'created_at',
    header: t('hotel.dashboard.table.headers.createdAt'),
    enableSorting: true,
  },
  {
    accessorKey: 'total_price',
    header: t('hotel.dashboard.table.headers.amount'),
    enableSorting: true,
    meta: { class: { td: 'text-right', th: 'text-right' } },
  },
  { accessorKey: 'status', header: t('hotel.dashboard.table.headers.status') },
]

const sorting = computed({
  get: () => [{ id: props.sortBy, desc: props.sortDir === 'desc' }],
  set: (value) => {
    const next = value?.[0]
    if (!next) return
    emit('update:sortBy', next.id as 'check_in_date' | 'created_at' | 'total_price')
    emit('update:sortDir', next.desc ? 'desc' : 'asc')
  },
})

const totalPages = computed(() => {
  if (!props.data) return 1
  return Math.max(Math.ceil(props.data.total / props.pageSize), 1)
})

const currentPage = computed({
  get: () => props.page,
  set: (value: number) => emit('update:page', value),
})
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-base font-bold text-slate-900">
          {{ t('hotel.dashboard.table.title') }}
        </h3>
        <span class="text-xs text-slate-500">
          {{ t('hotel.dashboard.table.totalLabel', { total: data?.total ?? 0 }) }}
        </span>
      </div>
    </template>

    <UTable
      v-model:sorting="sorting"
      :data="data?.items ?? []"
      :columns="columns"
      :loading="loading"
      :empty-state="{
        icon: 'i-lucide-inbox',
        label: t('hotel.dashboard.table.empty'),
      }"
      sort-mode="manual"
    >
      <template #guest_full_name-cell="{ row }">
        <div class="flex items-center gap-3">
          <UAvatar
            :alt="row.original.guest_full_name ?? ''"
            size="sm"
          />
          <div class="flex flex-col">
            <span class="font-bold text-slate-900">
              {{ row.original.guest_full_name ?? '—' }}
            </span>
            <span class="text-xs text-slate-500">
              ID: #{{ row.original.reservation_number }}
            </span>
          </div>
        </div>
      </template>

      <template #room_type-cell="{ row }">
        <div class="flex flex-col">
          <span class="text-slate-900">{{ row.original.room_type ?? '—' }}</span>
          <span class="text-xs text-slate-500">
            {{ t('hotel.dashboard.table.guestsCount', { count: row.original.number_of_guests }) }}
          </span>
        </div>
      </template>

      <template #check_in_date-cell="{ row }">
        <div class="flex flex-col">
          <span class="text-slate-900">{{ formatRange(row.original) }}</span>
          <span class="text-xs text-slate-500">
            {{ t('hotel.dashboard.table.nights', { count: nights(row.original) }) }}
          </span>
        </div>
      </template>

      <template #created_at-cell="{ row }">
        {{ new Date(row.original.created_at).toLocaleDateString(locale) }}
      </template>

      <template #total_price-cell="{ row }">
        <span class="font-bold text-slate-900">
          {{ formatPrice(row.original) }}
        </span>
      </template>

      <template #status-cell="{ row }">
        <HotelStatusBadge :status="row.original.status" />
      </template>
    </UTable>

    <template v-if="data && data.items.length > 0" #footer>
      <div class="flex items-center justify-between">
        <span class="text-xs text-slate-500">
          {{ t('hotel.dashboard.table.pageOf', { page: currentPage, total: totalPages }) }}
        </span>
        <UPagination
          v-model:page="currentPage"
          :total="data.total"
          :items-per-page="pageSize"
          :sibling-count="1"
          show-edges
        />
      </div>
    </template>
  </UCard>
</template>
