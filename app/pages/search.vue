<script setup lang="ts">
import { useSearch } from '~/composables/useSearch'
import type { SearchRequest, SearchResultItem } from '~/types/search'

type SortOption = 'recommended' | 'price_asc' | 'price_desc' | 'rating'

interface SearchAmenity {
  id: string
  label: string
}

interface SearchResultCard {
  id: string
  name: string
  location: string
  rating: number
  reviewCount?: number
  pricePerNight: number
  currency: string
  image: string
  imageAlt: string
  amenities: string[]
}

const { t } = useI18n()
const search = useSearch()

definePageMeta({
  layout: 'default'
})

useSeoMeta({
  title: () => `${t('search.pageTitle')} - TravelHub`,
  description: () => t('search.pageDescription')
})

const searchState = reactive({
  city: 'Bogota',
  checkIn: '2026-04-10',
  checkOut: '2026-04-12',
  guests: 2,
  minPrice: '',
  maxPrice: '',
  sort: 'recommended' as SortOption
})

const currentPage = ref(1)
const pageSize = 8

const validationErrors = reactive({
  city: '',
  checkIn: '',
  checkOut: '',
  guests: '',
  minPrice: '',
  maxPrice: ''
})

const hasAttemptedSearch = ref(false)

const amenities = computed<SearchAmenity[]>(() => [
  { id: 'wifi', label: t('search.amenities.wifi') },
  { id: 'pool', label: t('search.amenities.pool') },
  { id: 'breakfast', label: t('search.amenities.breakfast') }
])

const selectedAmenities = ref<string[]>(['wifi'])

const pagination = computed(() => search.results.value?.pagination)

const paginationButtons = computed(() => {
  const totalPages = pagination.value?.total_pages ?? 0

  if (totalPages <= 1) {
    return []
  }

  const windowSize = 5
  const halfWindow = Math.floor(windowSize / 2)
  let start = Math.max(1, currentPage.value - halfWindow)
  const end = Math.min(totalPages, start + windowSize - 1)

  if (end - start + 1 < windowSize) {
    start = Math.max(1, end - windowSize + 1)
  }

  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
})

const results = computed<SearchResultCard[]>(() =>
  (search.results.value?.items ?? []).map(mapSearchResultToCard)
)

const emptyState = computed(() => search.results.value?.empty_state ?? [])

const summaryText = computed(() => {
  if (!search.results.value) {
    return t('search.summaryReady')
  }

  const total = pagination.value?.total ?? 0
  const dateFormatter = new Intl.DateTimeFormat('en-GB', {
    month: 'short',
    day: 'numeric'
  })
  const checkIn = new Date(`${searchState.checkIn}T00:00:00`)
  const checkOut = new Date(`${searchState.checkOut}T00:00:00`)

  return `${total.toLocaleString()} ${t('search.resultsFound')} • ${dateFormatter.format(checkIn)} — ${dateFormatter.format(checkOut)} • ${searchState.guests} ${t('search.guests')}`
})

const sortOptions = computed(() => [
  { label: t('search.sort.recommended'), value: 'recommended' },
  { label: t('search.sort.priceAsc'), value: 'price_asc' },
  { label: t('search.sort.priceDesc'), value: 'price_desc' },
  { label: t('search.sort.rating'), value: 'rating' }
])

const toggleAmenity = (amenityId: string) => {
  if (selectedAmenities.value.includes(amenityId)) {
    selectedAmenities.value = selectedAmenities.value.filter(item => item !== amenityId)
    return
  }

  selectedAmenities.value = [...selectedAmenities.value, amenityId]
}

const clearValidationErrors = () => {
  validationErrors.city = ''
  validationErrors.checkIn = ''
  validationErrors.checkOut = ''
  validationErrors.guests = ''
  validationErrors.minPrice = ''
  validationErrors.maxPrice = ''
}

const parseLocalDate = (value: string) => {
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

const validateSearchForm = () => {
  clearValidationErrors()

  let isValid = true

  if (!searchState.city.trim()) {
    validationErrors.city = t('search.validation.requiredCity')
    isValid = false
  }

  if (!searchState.checkIn) {
    validationErrors.checkIn = t('search.validation.requiredCheckIn')
    isValid = false
  }

  if (!searchState.checkOut) {
    validationErrors.checkOut = t('search.validation.requiredCheckOut')
    isValid = false
  }

  if (searchState.guests < 1) {
    validationErrors.guests = t('search.validation.requiredGuests')
    isValid = false
  }

  const checkInDate = searchState.checkIn ? parseLocalDate(searchState.checkIn) : null
  const checkOutDate = searchState.checkOut ? parseLocalDate(searchState.checkOut) : null

  if (checkInDate && checkOutDate && checkOutDate <= checkInDate) {
    validationErrors.checkOut = t('search.validation.checkOutAfterCheckIn')
    isValid = false
  }

  if (searchState.minPrice !== '' && Number(searchState.minPrice) < 0) {
    validationErrors.minPrice = t('search.validation.priceNonNegative')
    isValid = false
  }

  if (searchState.maxPrice !== '' && Number(searchState.maxPrice) < 0) {
    validationErrors.maxPrice = t('search.validation.priceNonNegative')
    isValid = false
  }

  if (
    searchState.minPrice !== ''
    && searchState.maxPrice !== ''
    && Number(searchState.minPrice) > Number(searchState.maxPrice)
  ) {
    validationErrors.maxPrice = t('search.validation.priceRange')
    isValid = false
  }

  return isValid
}

const mapSearchResultToCard = (item: SearchResultItem): SearchResultCard => ({
  id: item.id,
  name: item.nombre,
  location: `${item.ciudad}, ${item.pais}`,
  rating: item.rating,
  reviewCount: Math.max(1, Math.round(item.rating * 200)),
  pricePerNight: Number(item.precio_desde),
  currency: item.moneda,
  image: item.imagen_principal_url || '/mock/property-1.svg',
  imageAlt: item.nombre,
  amenities: [...item.amenidades]
})

const formatMoney = (amount: number, currency: string) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  }).format(amount)

const buildSearchRequest = (): SearchRequest => ({
  ciudad: searchState.city.trim(),
  check_in: searchState.checkIn,
  check_out: searchState.checkOut,
  huespedes: Number(searchState.guests),
  amenidades: selectedAmenities.value.length ? selectedAmenities.value : undefined,
  precio_min: searchState.minPrice === '' ? undefined : Number(searchState.minPrice),
  precio_max: searchState.maxPrice === '' ? undefined : Number(searchState.maxPrice),
  order_by:
    searchState.sort === 'price_asc' || searchState.sort === 'price_desc'
      ? 'price'
      : searchState.sort === 'rating'
        ? 'rating'
        : 'name',
  order_dir: searchState.sort === 'price_desc' ? 'desc' : 'asc',
  page: currentPage.value,
  page_size: pageSize
})

const runSearch = async (page: number) => {
  currentPage.value = page
  hasAttemptedSearch.value = true

  if (!validateSearchForm()) {
    return
  }

  try {
    await search.searchProperties(buildSearchRequest())
  } catch {
    // Error state is already handled by useSearch composable.
  }
}

const submitSearch = async () => {
  await runSearch(1)
}

const goToPage = async (page: number) => {
  await runSearch(page)
}

onMounted(async () => {
  await runSearch(1)
})
</script>

<template>
  <div class="min-h-screen bg-[#f8fafc]">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-6">
      <nav class="flex items-center gap-2 text-sm text-slate-500">
        <NuxtLink
          to="/"
          class="hover:text-slate-700 transition-colors"
        >
          {{ t('search.breadcrumb.home') }}
        </NuxtLink>
        <UIcon
          name="i-lucide-chevron-right"
          class="size-4"
        />
        <span class="font-medium text-slate-700">{{ searchState.city || t('search.breadcrumb.currentSearch') }}</span>
      </nav>

      <section class="space-y-5">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div class="space-y-2">
            <p class="text-xs font-bold uppercase tracking-[0.18em] text-travelhub-600">
              {{ t('search.sectionLabel') }}
            </p>
            <h1 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-950 tracking-tight">
              {{ t('search.heading', { city: searchState.city || 'London' }) }}
            </h1>
            <p class="text-sm sm:text-base text-slate-500">
              {{ summaryText }}
            </p>
          </div>

          <div class="flex items-center gap-3">
            <UButton
              icon="i-lucide-map-pinned"
              color="neutral"
              variant="soft"
              class="shadow-sm"
            >
              {{ t('search.showMap') }}
            </UButton>

            <USelect
              v-model="searchState.sort"
              :items="sortOptions"
              :label="t('search.sortLabel')"
              class="w-[220px]"
            />
          </div>
        </div>

        <UCard :ui="{ body: 'p-4 sm:p-6' }">
          <form
            class="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr_1fr_0.7fr_auto] gap-4 items-end"
            @submit.prevent="submitSearch"
          >
            <div class="space-y-2">
              <UFormField :label="t('search.fields.city')">
                <UInput
                  v-model="searchState.city"
                  icon="i-lucide-map-pinned"
                  :placeholder="t('search.placeholders.city')"
                  size="xl"
                  :class="validationErrors.city ? 'ring-1 ring-error-500' : ''"
                />
              </UFormField>
              <p class="min-h-5 text-sm text-error-600">
                {{ hasAttemptedSearch && validationErrors.city ? validationErrors.city : ' ' }}
              </p>
            </div>

            <div class="space-y-2">
              <UFormField :label="t('search.fields.checkIn')">
                <UInput
                  v-model="searchState.checkIn"
                  type="date"
                  size="xl"
                  :class="validationErrors.checkIn ? 'ring-1 ring-error-500' : ''"
                />
              </UFormField>
              <p class="min-h-5 text-sm text-error-600">
                {{ hasAttemptedSearch && validationErrors.checkIn ? validationErrors.checkIn : ' ' }}
              </p>
            </div>

            <div class="space-y-2">
              <UFormField :label="t('search.fields.checkOut')">
                <UInput
                  v-model="searchState.checkOut"
                  type="date"
                  size="xl"
                  :class="validationErrors.checkOut ? 'ring-1 ring-error-500' : ''"
                />
              </UFormField>
              <p class="min-h-5 text-sm text-error-600">
                {{ hasAttemptedSearch && validationErrors.checkOut ? validationErrors.checkOut : ' ' }}
              </p>
            </div>

            <div class="space-y-2">
              <UFormField :label="t('search.fields.guests')">
                <UInput
                  v-model="searchState.guests"
                  type="number"
                  min="1"
                  size="xl"
                  :class="validationErrors.guests ? 'ring-1 ring-error-500' : ''"
                />
              </UFormField>
              <p class="min-h-5 text-sm text-error-600">
                {{ hasAttemptedSearch && validationErrors.guests ? validationErrors.guests : ' ' }}
              </p>
            </div>

            <UButton
              type="submit"
              size="xl"
              icon="i-lucide-search"
              class="justify-center"
              :loading="search.loading.value"
            >
              {{ t('search.searchAction') }}
            </UButton>
          </form>

          <div class="mt-5 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <div class="space-y-3">
              <div class="flex items-center justify-between gap-3">
                <p class="text-sm font-semibold text-slate-900">
                  {{ t('search.amenitiesLabel') }}
                </p>
                <p class="text-xs text-slate-500">
                  {{ t('search.amenitiesHint') }}
                </p>
              </div>

              <div class="flex flex-wrap gap-2">
                <button
                  v-for="amenity in amenities"
                  :key="amenity.id"
                  type="button"
                  class="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors"
                  :class="selectedAmenities.includes(amenity.id)
                    ? 'border-travelhub-200 bg-travelhub-50 text-travelhub-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'"
                  @click="toggleAmenity(amenity.id)"
                >
                  <UIcon
                    :name="selectedAmenities.includes(amenity.id) ? 'i-lucide-check' : 'i-lucide-circle-plus'"
                    class="size-4"
                  />
                  {{ amenity.label }}
                </button>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <UFormField :label="t('search.fields.minPrice')">
                  <UInput
                    v-model="searchState.minPrice"
                    type="number"
                    min="0"
                    size="lg"
                    :class="validationErrors.minPrice ? 'ring-1 ring-error-500' : ''"
                  />
                </UFormField>
                <p class="min-h-5 text-sm text-error-600">
                  {{ hasAttemptedSearch && validationErrors.minPrice ? validationErrors.minPrice : ' ' }}
                </p>
              </div>

              <div class="space-y-2">
                <UFormField :label="t('search.fields.maxPrice')">
                  <UInput
                    v-model="searchState.maxPrice"
                    type="number"
                    min="0"
                    size="lg"
                    :class="validationErrors.maxPrice ? 'ring-1 ring-error-500' : ''"
                  />
                </UFormField>
                <p class="min-h-5 text-sm text-error-600">
                  {{ hasAttemptedSearch && validationErrors.maxPrice ? validationErrors.maxPrice : ' ' }}
                </p>
              </div>
            </div>
          </div>
        </UCard>
      </section>

      <div v-if="search.loading.value" class="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <USkeleton
          v-for="n in 4"
          :key="n"
          class="h-[420px] rounded-[28px]"
        />
      </div>

      <template v-else>
        <div
          v-if="search.error.value"
          class="rounded-3xl border border-error-200 bg-error-50 p-6 text-error-700"
        >
          <p class="font-semibold">
            {{ t('search.errorTitle') }}
          </p>
          <p class="mt-2 text-sm">
            {{ search.error.value }}
          </p>
        </div>

        <template v-else>
          <section
            v-if="results.length > 0"
            class="grid grid-cols-1 xl:grid-cols-2 gap-6"
          >
            <article
              v-for="result in results"
              :key="result.id"
              class="overflow-hidden rounded-[28px] bg-white shadow-[0_10px_30px_rgba(15,23,42,0.08)] border border-slate-100"
            >
              <div class="relative h-[240px] sm:h-[280px] overflow-hidden">
                <img
                  :src="result.image"
                  :alt="result.imageAlt"
                  class="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.03]"
                >
                <div class="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/45 to-transparent" />
              </div>

              <div class="p-5 sm:p-6 space-y-5">
                <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div class="space-y-2">
                    <div class="flex items-center gap-1 text-amber-500">
                      <UIcon
                        v-for="star in 5"
                        :key="star"
                        name="i-lucide-star"
                        class="size-4 fill-current"
                      />
                    </div>

                    <div>
                      <h2 class="text-2xl font-bold text-slate-950 tracking-tight">
                        {{ result.name }}
                      </h2>
                      <p class="mt-1 flex items-center gap-2 text-sm text-slate-500">
                        <UIcon
                          name="i-lucide-map-pin"
                          class="size-4"
                        />
                        {{ result.location }}
                      </p>
                    </div>
                  </div>

                  <div class="shrink-0 rounded-2xl bg-slate-50 px-4 py-3 text-center border border-slate-100">
                    <p class="text-sm font-semibold text-travelhub-600">
                      {{ result.rating.toFixed(1) }}
                    </p>
                    <p
                      v-if="result.reviewCount"
                      class="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400"
                    >
                      {{ result.reviewCount.toLocaleString() }} {{ t('search.reviews') }}
                    </p>
                  </div>
                </div>

                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="amenity in result.amenities"
                    :key="amenity"
                    class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
                  >
                    {{ amenity }}
                  </span>
                </div>

                <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-t border-slate-100 pt-4">
                  <div>
                    <p class="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                      {{ t('search.pricePerNight') }}
                    </p>
                    <div class="flex items-end gap-2">
                      <span class="text-3xl font-bold text-slate-950">
                        {{ formatMoney(result.pricePerNight, result.currency) }}
                      </span>
                      <span class="pb-1 text-sm text-slate-500">/ {{ t('search.night') }}</span>
                    </div>
                  </div>

                  <UButton
                    size="lg"
                    class="sm:min-w-[180px] justify-center"
                  >
                    {{ t('search.bookNow') }}
                  </UButton>
                </div>
              </div>
            </article>
          </section>

          <div
            v-else
            class="rounded-[28px] border border-slate-200 bg-white p-8 sm:p-10 shadow-sm"
          >
            <div class="mx-auto max-w-2xl space-y-5 text-center">
              <div class="mx-auto flex size-14 items-center justify-center rounded-full bg-travelhub-50 text-travelhub-600">
                <UIcon
                  name="i-lucide-search-x"
                  class="size-7"
                />
              </div>

              <div class="space-y-2">
                <h2 class="text-2xl font-bold text-slate-950">
                  {{ t('search.emptyTitle') }}
                </h2>
                <p class="text-slate-500">
                  {{ t('search.emptyDescription') }}
                </p>
              </div>

              <div class="flex flex-wrap justify-center gap-3">
                <UBadge
                  v-for="item in emptyState"
                  :key="item.code"
                  color="neutral"
                  variant="soft"
                >
                  {{ item.message }}
                </UBadge>
              </div>
            </div>
          </div>

          <div
            v-if="pagination && pagination.total_pages > 1"
            class="flex flex-col items-center gap-3 pt-2"
          >
            <p class="text-sm text-slate-500">
              {{ t('search.paginationSummary', { page: pagination.page, totalPages: pagination.total_pages }) }}
            </p>

            <div class="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm border border-slate-200">
              <button
                type="button"
                class="rounded-full px-3 py-1 text-sm font-semibold text-slate-600 disabled:opacity-40"
                :disabled="pagination.page === 1"
                @click="goToPage(Math.max(1, pagination.page - 1))"
              >
                {{ t('search.pagination.prev') }}
              </button>

              <button
                v-for="page in paginationButtons"
                :key="page"
                type="button"
                class="rounded-full px-3 py-1 text-sm font-semibold transition-colors"
                :class="page === pagination.page ? 'text-travelhub-700 bg-travelhub-50' : 'text-slate-400 hover:text-slate-600'"
                @click="goToPage(page)"
              >
                {{ page }}
              </button>

              <button
                type="button"
                class="rounded-full px-3 py-1 text-sm font-semibold text-slate-600 disabled:opacity-40"
                :disabled="pagination.page >= pagination.total_pages"
                @click="goToPage(Math.min(pagination.total_pages, pagination.page + 1))"
              >
                {{ t('search.pagination.next') }}
              </button>
            </div>
          </div>
        </template>
      </template>
    </div>
  </div>
</template>