<script setup lang="ts">
import { useSearch } from '~/composables/useSearch'
import { formatCurrency } from '~/utils/validation'
import { encodePropertyRouteId } from '~/utils/propertyRouteId'
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
  maxGuests: number
  pricePerNight: number
  currency: string
  image: string
  imageAlt: string
  amenities: string[]
}

type QueryParamValue = string | null | Array<string | null> | undefined

const formatLocalDate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const createRelativeDate = (offsetDays: number) => {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + offsetDays)
  return formatLocalDate(date)
}

const createDefaultSearchState = () => ({
  city: 'Bogota',
  checkIn: createRelativeDate(1),
  checkOut: createRelativeDate(3),
  guests: 2,
  minPrice: '',
  maxPrice: '',
  sort: 'recommended' as SortOption
})

const { t, locale } = useI18n()
const search = useSearch()
const route = useRoute()
const router = useRouter()

definePageMeta({
  layout: 'default'
})

useSeoMeta({
  title: () => `${t('search.pageTitle')} - TravelHub`,
  description: () => t('search.pageDescription')
})

const searchState = reactive(createDefaultSearchState())

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

const amenityLabelMap = computed<Record<string, string>>(() => ({
  wifi: t('search.amenities.wifi'),
  piscina: t('search.amenities.pool'),
  desayuno_incluido: t('search.amenities.breakfast'),
  aire_acondicionado: t('search.amenities.airConditioning'),
  pet_friendly: t('search.amenities.petFriendly'),
  parqueadero: t('search.amenities.parking'),
  gimnasio: t('search.amenities.gym'),
  spa: t('search.amenities.spa')
}))

const selectedAmenities = ref<string[]>([])

const parseQueryNumber = (value: QueryParamValue, fallback: number) => {
  const singleValue = Array.isArray(value) ? value[0] : value
  const parsed = Number(singleValue)
  return Number.isFinite(parsed) ? parsed : fallback
}

const parseQueryString = (value: QueryParamValue, fallback: string) => {
  const singleValue = Array.isArray(value) ? value[0] : value
  const trimmedValue = singleValue?.trim()

  return trimmedValue ? trimmedValue : fallback
}

const parseQueryAmenities = (value: QueryParamValue) => {
  if (!value) {
    return []
  }

  return (Array.isArray(value) ? value : [value]).filter(
    (item): item is string => Boolean(item)
  )
}

const hasInitialSearchQueryParams = () => {
  return Boolean(
    route.query.city
    || route.query.check_in
    || route.query.check_out
    || route.query.guests
    || route.query.amenities
    || route.query.min_price
    || route.query.max_price
    || route.query.sort
    || route.query.page
  )
}

const isValidSortOption = (value: string): value is SortOption =>
  ['recommended', 'price_asc', 'price_desc', 'rating'].includes(value)

const parseFiniteNumber = (value: string) => {
  if (!value.trim()) {
    return null
  }

  const parsedValue = Number(value)
  return Number.isFinite(parsedValue) ? parsedValue : null
}

const normalizePriceInput = (value: string) => {
  const parsedValue = parseFiniteNumber(value)
  return parsedValue === null ? '' : String(parsedValue)
}

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
  const dateFormatter = new Intl.DateTimeFormat(locale.value, {
    month: 'short',
    day: 'numeric'
  })
  const checkIn = new Date(`${searchState.checkIn}T00:00:00`)
  const checkOut = new Date(`${searchState.checkOut}T00:00:00`)

  return `${total.toLocaleString(locale.value)} ${t('search.resultsFound')} • ${dateFormatter.format(checkIn)} — ${dateFormatter.format(checkOut)} • ${searchState.guests.toLocaleString(locale.value)} ${t('search.guests')}`
})

const sortOptions = computed(() => [
  { label: t('search.sort.recommended'), value: 'recommended' },
  { label: t('search.sort.priceAsc'), value: 'price_asc' },
  { label: t('search.sort.priceDesc'), value: 'price_desc' },
  { label: t('search.sort.rating'), value: 'rating' }
])

const activeSortLabel = computed(
  () => sortOptions.value.find(o => o.value === searchState.sort)?.label ?? ''
)

const sortDropdownItems = computed(() =>
  sortOptions.value.map(opt => ({
    label: opt.label,
    icon: searchState.sort === opt.value ? 'i-lucide-check' : undefined,
    onSelect: () => { searchState.sort = opt.value as SortOption }
  }))
)

watch(() => searchState.sort, async (newSort, oldSort, onInvalidate) => {
  if (newSort === oldSort || !hasAttemptedSearch.value) return
  let cancelled = false
  onInvalidate(() => { cancelled = true })
  await runSearch(1)
  if (cancelled) return
})

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

  const minPrice = parseFiniteNumber(searchState.minPrice)
  const maxPrice = parseFiniteNumber(searchState.maxPrice)

  if (searchState.minPrice !== '' && minPrice === null) {
    validationErrors.minPrice = t('search.validation.priceInvalid')
    isValid = false
  }

  const checkInDate = searchState.checkIn ? parseLocalDate(searchState.checkIn) : null
  const checkOutDate = searchState.checkOut ? parseLocalDate(searchState.checkOut) : null

  if (checkInDate && checkOutDate && checkOutDate <= checkInDate) {
    validationErrors.checkOut = t('search.validation.checkOutAfterCheckIn')
    isValid = false
  }

  if (minPrice !== null && minPrice < 0) {
    validationErrors.minPrice = t('search.validation.priceNonNegative')
    isValid = false
  }

  if (searchState.maxPrice !== '' && maxPrice === null) {
    validationErrors.maxPrice = t('search.validation.priceInvalid')
    isValid = false
  }

  if (maxPrice !== null && maxPrice < 0) {
    validationErrors.maxPrice = t('search.validation.priceNonNegative')
    isValid = false
  }

  if (
    minPrice !== null
    && maxPrice !== null
    && minPrice > maxPrice
  ) {
    validationErrors.maxPrice = t('search.validation.priceRange')
    isValid = false
  }

  return isValid
}

const mapSearchResultToCard = (item: SearchResultItem): SearchResultCard => ({
  id: item.id,
  name: item.name,
  location: [item.city, item.country].filter(Boolean).join(', '),
  rating: item.rating,
  reviewCount: Math.max(1, Math.round(item.rating * 200)),
  maxGuests: item.max_capacity,
  pricePerNight: Number(item.price_from),
  currency: item.currency,
  image: item.main_image_url || '/mock/property-1.svg',
  imageAlt: item.name,
  amenities: item.amenities.map((amenity) => amenityLabelMap.value[amenity] || amenity.replaceAll('_', ' '))
})

const getStarFillPercent = (rating: number, index: number) => {
  const normalized = Math.max(0, Math.min(5, rating))
  const relativeValue = normalized - (index - 1)

  if (relativeValue >= 1) {
    return 100
  }

  if (relativeValue <= 0) {
    return 0
  }

  return Math.round(relativeValue * 100)
}

const getStarFillStyle = (rating: number, index: number) => {
  const fillPercent = getStarFillPercent(rating, index)

  return {
    backgroundImage: `linear-gradient(90deg, rgb(245 158 11) ${fillPercent}%, rgb(148 163 184) ${fillPercent}%)`,
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    color: 'transparent',
    WebkitTextFillColor: 'transparent'
  }
}

const formatMoney = (amount: number, currency: string) => formatCurrency(amount, currency, locale.value)

const formatRating = (rating: number) => rating.toFixed(1)

const buildSearchRequest = (): SearchRequest => ({
  city: searchState.city.trim(),
  check_in: searchState.checkIn,
  check_out: searchState.checkOut,
  guests: Number(searchState.guests),
  amenities: selectedAmenities.value.length ? selectedAmenities.value : undefined,
  min_price: parseFiniteNumber(searchState.minPrice) ?? undefined,
  max_price: parseFiniteNumber(searchState.maxPrice) ?? undefined,
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

const syncQueryParams = async (mode: 'push' | 'replace' = 'push') => {
  const routeLocation = {
    query: {
      city: searchState.city,
      check_in: searchState.checkIn,
      check_out: searchState.checkOut,
      guests: String(searchState.guests),
      amenities: selectedAmenities.value,
      min_price: searchState.minPrice || undefined,
      max_price: searchState.maxPrice || undefined,
      sort: searchState.sort,
      page: String(currentPage.value)
    }
  }

  if (mode === 'replace') {
    await router.replace(routeLocation)
    return
  }

  await router.push(routeLocation)
}

const hydrateFromQuery = () => {
  const city = parseQueryString(route.query.city, searchState.city)
  const checkIn = parseQueryString(route.query.check_in, searchState.checkIn)
  const checkOut = parseQueryString(route.query.check_out, searchState.checkOut)
  const guests = Math.max(1, parseQueryNumber(route.query.guests, searchState.guests))
  const minPrice = normalizePriceInput(parseQueryString(route.query.min_price, ''))
  const maxPrice = normalizePriceInput(parseQueryString(route.query.max_price, ''))
  const sort = parseQueryString(route.query.sort, searchState.sort)
  const page = Math.max(1, parseQueryNumber(route.query.page, 1))
  const queryAmenities = parseQueryAmenities(route.query.amenities)

  searchState.city = city
  searchState.checkIn = checkIn
  searchState.checkOut = checkOut
  searchState.guests = guests
  searchState.minPrice = minPrice
  searchState.maxPrice = maxPrice
  searchState.sort = isValidSortOption(sort) ? sort : 'recommended'
  currentPage.value = page

  selectedAmenities.value = queryAmenities.length ? queryAmenities : selectedAmenities.value
}

const runSearch = async (page: number, historyMode: 'push' | 'replace' = 'push') => {
  currentPage.value = page
  hasAttemptedSearch.value = true

  if (!validateSearchForm()) {
    return
  }

  try {
    await search.searchProperties(buildSearchRequest())
    if (search.results.value?.pagination?.page) {
      currentPage.value = search.results.value.pagination.page
    }
    await syncQueryParams(historyMode)
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
  if (!hasInitialSearchQueryParams()) {
    return
  }

  hydrateFromQuery()
  await runSearch(currentPage.value, 'replace')
})
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <div class="max-w-7xl mx-auto px-safe py-6 lg:py-8 space-y-6">
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
              {{ searchState.city ? t('search.heading', { city: searchState.city }) : t('search.breadcrumb.currentSearch') }}
            </h1>
            <p
              class="text-sm sm:text-base text-slate-500"
              data-cy="search-summary"
            >
              {{ summaryText }}
            </p>
          </div>

          <div class="flex items-center gap-3">
            <UDropdownMenu :items="sortDropdownItems" size="md">
              <UButton
                size="md"
                variant="outline"
                color="neutral"
                icon="i-lucide-arrow-up-down"
                trailing-icon="i-lucide-chevron-down"
                data-cy="search-sort-trigger"
              >
                {{ t('search.sortButton', { option: activeSortLabel }) }}
              </UButton>
            </UDropdownMenu>
          </div>
        </div>

        <UCard :ui="{ body: 'p-4 sm:p-6' }">
          <UForm
            :state="searchState"
            class="space-y-5"
            @submit="submitSearch"
          >
            <!-- Row 1: Main fields -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <UFormField :label="t('search.fields.city')">
                <UInput
                  v-model="searchState.city"
                  icon="i-lucide-map-pinned"
                  :placeholder="t('search.placeholders.city')"
                  size="md"
                  data-cy="search-city"
                  :class="validationErrors.city ? 'ring-1 ring-error-500' : ''"
                />
                <p class="min-h-5 text-sm text-error-600">
                  {{ hasAttemptedSearch && validationErrors.city ? validationErrors.city : ' ' }}
                </p>
              </UFormField>

              <UFormField :label="t('search.fields.checkIn')">
                <UInput
                  v-model="searchState.checkIn"
                  type="date"
                  size="md"
                  data-cy="search-check-in"
                  :class="validationErrors.checkIn ? 'ring-1 ring-error-500' : ''"
                />
                <p class="min-h-5 text-sm text-error-600">
                  {{ hasAttemptedSearch && validationErrors.checkIn ? validationErrors.checkIn : ' ' }}
                </p>
              </UFormField>

              <UFormField :label="t('search.fields.checkOut')">
                <UInput
                  v-model="searchState.checkOut"
                  type="date"
                  size="md"
                  data-cy="search-check-out"
                  :class="validationErrors.checkOut ? 'ring-1 ring-error-500' : ''"
                />
                <p class="min-h-5 text-sm text-error-600">
                  {{ hasAttemptedSearch && validationErrors.checkOut ? validationErrors.checkOut : ' ' }}
                </p>
              </UFormField>

              <UFormField :label="t('search.fields.guests')">
                <UInput
                  v-model="searchState.guests"
                  type="number"
                  min="1"
                  size="md"
                  data-cy="search-guests"
                  :class="validationErrors.guests ? 'ring-1 ring-error-500' : ''"
                />
                <p class="min-h-5 text-sm text-error-600">
                  {{ hasAttemptedSearch && validationErrors.guests ? validationErrors.guests : ' ' }}
                </p>
              </UFormField>
            </div>

            <!-- Row 2: Filters -->
            <div class="border-t border-slate-100 pt-5 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-5 items-start">
              <div class="space-y-3">
                <div class="flex items-center gap-3">
                  <p class="text-sm font-semibold text-slate-900">
                    {{ t('search.amenitiesLabel') }}
                  </p>
                  <p class="text-xs text-slate-400">
                    {{ t('search.amenitiesHint') }}
                  </p>
                </div>

                <div class="flex flex-wrap gap-2">
                  <UButton
                    v-for="amenity in amenities"
                    :key="amenity.id"
                    :aria-pressed="selectedAmenities.includes(amenity.id)"
                    :variant="selectedAmenities.includes(amenity.id) ? 'soft' : 'outline'"
                    :color="selectedAmenities.includes(amenity.id) ? 'primary' : 'neutral'"
                    :icon="selectedAmenities.includes(amenity.id) ? 'i-lucide-check' : 'i-lucide-circle-plus'"
                    :label="amenity.label"
                    class="rounded-full"
                    size="sm"
                    @click="toggleAmenity(amenity.id)"
                  />
                </div>
              </div>

              <div class="space-y-3">
                <p class="text-sm font-semibold text-slate-900">
                  {{ t('search.fields.priceRange') }}
                </p>
                <div class="grid grid-cols-2 gap-3">
                  <UFormField :label="t('search.fields.minPrice')">
                    <UInput
                      v-model="searchState.minPrice"
                      type="number"
                      min="0"
                      size="md"
                      class="w-[140px]"
                      :class="validationErrors.minPrice ? 'ring-1 ring-error-500' : ''"
                    />
                    <p class="min-h-5 text-sm text-error-600">
                      {{ hasAttemptedSearch && validationErrors.minPrice ? validationErrors.minPrice : ' ' }}
                    </p>
                  </UFormField>

                  <UFormField :label="t('search.fields.maxPrice')">
                    <UInput
                      v-model="searchState.maxPrice"
                      type="number"
                      min="0"
                      size="md"
                      class="w-[140px]"
                      :class="validationErrors.maxPrice ? 'ring-1 ring-error-500' : ''"
                    />
                    <p class="min-h-5 text-sm text-error-600">
                      {{ hasAttemptedSearch && validationErrors.maxPrice ? validationErrors.maxPrice : ' ' }}
                    </p>
                  </UFormField>
                </div>
              </div>
            </div>

            <!-- Row 3: Submit -->
            <div class="border-t border-slate-100 pt-4">
              <UButton
                type="submit"
                size="md"
                icon="i-lucide-search"
                class="w-full sm:w-auto justify-center"
                data-cy="search-submit"
                :loading="search.loading.value"
              >
                {{ t('search.searchAction') }}
              </UButton>
            </div>
          </UForm>
        </UCard>
      </section>

      <div v-if="search.loading.value" class="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <USkeleton
          v-for="n in 4"
          :key="n"
          class="h-96 rounded-xl"
        />
      </div>

      <template v-else>
        <div
          v-if="search.error.value"
          class="rounded-xl border border-error-200 bg-error-50 p-6 text-error-700"
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
            data-cy="search-results"
          >
            <article
              v-for="result in results"
              :key="result.id"
              class="overflow-hidden rounded-xl bg-white border border-slate-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(15,23,42,0.08)]"
              data-cy="search-result-card"
              :data-cy-property-id="result.id"
              :data-cy-property-name="result.name"
            >
              <div class="relative h-[256px] overflow-hidden">
                <img
                  :src="result.image"
                  :alt="result.imageAlt"
                  class="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.03]"
                >
              </div>

              <div class="p-5 space-y-0">
                <div class="flex items-start justify-between pb-2">
                  <div class="space-y-0">
                    <div
                      class="flex items-center gap-1 mb-1"
                      role="img"
                      :aria-label="t('search.ratingAria', { rating: formatRating(result.rating) })"
                    >
                      <span
                        v-for="star in 5"
                        :key="star"
                        class="inline-flex h-[10px] w-[10px] items-center justify-center text-[10px] leading-none align-middle"
                        :style="getStarFillStyle(result.rating, star)"
                      >
                        ★
                      </span>
                      <span class="sr-only">
                        {{ t('search.ratingAria', { rating: formatRating(result.rating) }) }}
                      </span>
                    </div>

                    <h2 class="text-lg font-bold text-slate-900 leading-7">
                      {{ result.name }}
                    </h2>
                    <p class="mt-0.5 flex items-center gap-1 text-sm text-slate-500">
                      <UIcon
                        name="i-lucide-map-pin"
                        class="size-3.5"
                      />
                      {{ result.location }}
                    </p>
                  </div>

                  <div class="shrink-0 flex flex-col items-end gap-1">
                    <div class="rounded bg-travelhub-500/10 px-2 py-1">
                      <p class="text-sm font-bold text-travelhub-500">
                        {{ formatRating(result.rating) }}
                      </p>
                    </div>
                    <p
                      v-if="result.reviewCount"
                      class="text-[10px] font-bold uppercase tracking-[0.5px] text-slate-400"
                    >
                      {{ result.reviewCount.toLocaleString() }} {{ t('search.reviews') }}
                    </p>
                  </div>
                </div>

                <div class="flex items-end justify-between border-t border-zinc-50 pt-5">
                  <div>
                    <p class="text-[10px] font-bold uppercase tracking-[0.5px] text-slate-400">
                      {{ t('search.pricePerNight') }}
                    </p>
                    <div class="flex items-baseline gap-1">
                      <span class="text-2xl font-extrabold text-slate-900">
                        {{ formatMoney(result.pricePerNight, result.currency) }}
                      </span>
                      <span class="text-sm font-medium text-slate-500">/ {{ t('search.night') }}</span>
                    </div>
                  </div>

                  <UButton
                    :to="{
                      path: `/properties/${encodePropertyRouteId(result.id)}`,
                      query: {
                        check_in: searchState.checkIn,
                        check_out: searchState.checkOut,
                        guests: String(searchState.guests)
                      }
                    }"
                    size="lg"
                    class="justify-center"
                    data-cy="search-result-view-property"
                  >
                    {{ t('search.viewProperty') }}
                  </UButton>
                </div>
              </div>
            </article>
          </section>

          <div
            v-else
            class="rounded-xl border border-slate-200 bg-white p-8 sm:p-10 shadow-sm"
            data-cy="search-empty-state"
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
              <UButton
                variant="ghost"
                color="neutral"
                class="rounded-full"
                :disabled="pagination.page === 1"
                :label="t('search.pagination.prev')"
                @click="goToPage(Math.max(1, pagination.page - 1))"
              />

              <UButton
                v-for="page in paginationButtons"
                :key="page"
                :variant="page === pagination.page ? 'soft' : 'ghost'"
                :color="page === pagination.page ? 'primary' : 'neutral'"
                class="rounded-full"
                :label="String(page)"
                @click="goToPage(page)"
              />

              <UButton
                variant="ghost"
                color="neutral"
                class="rounded-full"
                :disabled="pagination.page >= pagination.total_pages"
                :label="t('search.pagination.next')"
                @click="goToPage(Math.min(pagination.total_pages, pagination.page + 1))"
              />
            </div>
          </div>
        </template>
      </template>
    </div>
  </div>
</template>