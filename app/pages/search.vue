<script setup lang="ts">
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
  reviewCount: number
  pricePerNight: number
  currency: string
  badge?: string
  image: string
  imageAlt: string
  amenities: string[]
}

const { t } = useI18n()

definePageMeta({
  layout: 'default'
})

useSeoMeta({
  title: () => `${t('search.pageTitle')} - TravelHub`,
  description: () => t('search.pageDescription')
})

const searchState = reactive({
  city: 'London',
  checkIn: '2026-10-12',
  checkOut: '2026-10-19',
  guests: 2,
  minPrice: 180,
  maxPrice: 520,
  sort: 'recommended' as SortOption
})

const amenities = computed<SearchAmenity[]>(() => [
  { id: 'wifi', label: t('search.amenities.wifi') },
  { id: 'pool', label: t('search.amenities.pool') },
  { id: 'breakfast', label: t('search.amenities.breakfast') }
])

const selectedAmenities = ref<string[]>(['wifi'])

const results = computed<SearchResultCard[]>(() => [
  {
    id: 'savoy-palace',
    name: 'The Savoy Palace & Spa',
    location: 'Westminster, London',
    rating: 4.9,
    reviewCount: 1200,
    pricePerNight: 345,
    currency: 'USD',
    badge: t('search.badges.guestFavorite'),
    image: '/mock/property-1.svg',
    imageAlt: 'The Savoy Palace & Spa',
    amenities: [t('search.amenities.wifi'), t('search.amenities.breakfast'), t('search.amenities.pool')]
  },
  {
    id: 'urban-vista',
    name: 'Urban Vista Suites',
    location: 'Canary Wharf, London',
    rating: 4.7,
    reviewCount: 840,
    pricePerNight: 189,
    currency: 'USD',
    image: '/mock/property-2.svg',
    imageAlt: 'Urban Vista Suites',
    amenities: [t('search.amenities.wifi'), t('search.amenities.breakfast')]
  },
  {
    id: 'regency-grand',
    name: 'Regency Grand London',
    location: 'Mayfair, London',
    rating: 4.8,
    reviewCount: 2150,
    pricePerNight: 512,
    currency: 'USD',
    badge: t('search.badges.lightningFast'),
    image: '/mock/property-3.svg',
    imageAlt: 'Regency Grand London',
    amenities: [t('search.amenities.pool'), t('search.amenities.wifi')]
  },
  {
    id: 'kensington-boutique',
    name: 'The Kensington Boutique',
    location: 'South Kensington, London',
    rating: 4.6,
    reviewCount: 530,
    pricePerNight: 220,
    currency: 'USD',
    badge: t('search.badges.lightningFast'),
    image: '/mock/property-4.svg',
    imageAlt: 'The Kensington Boutique',
    amenities: [t('search.amenities.wifi'), t('search.amenities.breakfast')]
  }
])

const summaryText = computed(() => {
  const dateFormatter = new Intl.DateTimeFormat('en-GB', {
    month: 'short',
    day: 'numeric'
  })

  const checkIn = new Date(`${searchState.checkIn}T00:00:00`)
  const checkOut = new Date(`${searchState.checkOut}T00:00:00`)

  return `${results.value.length.toLocaleString()} ${t('search.resultsFound')} • ${dateFormatter.format(checkIn)} — ${dateFormatter.format(checkOut)} • ${searchState.guests} ${t('search.guests')}`
})

const sortOptions: Array<{ label: string, value: SortOption }> = [
  { label: t('search.sort.recommended'), value: 'recommended' },
  { label: t('search.sort.priceAsc'), value: 'price_asc' },
  { label: t('search.sort.priceDesc'), value: 'price_desc' },
  { label: t('search.sort.rating'), value: 'rating' }
]

const toggleAmenity = (amenityId: string) => {
  if (selectedAmenities.value.includes(amenityId)) {
    selectedAmenities.value = selectedAmenities.value.filter(item => item !== amenityId)
    return
  }

  selectedAmenities.value = [...selectedAmenities.value, amenityId]
}

const formatMoney = (amount: number, currency: string) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  }).format(amount)
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
        <span>{{ t('search.breadcrumb.country') }}</span>
        <UIcon
          name="i-lucide-chevron-right"
          class="size-4"
        />
        <span class="font-medium text-slate-700">{{ t('search.breadcrumb.city') }}</span>
      </nav>

      <section class="space-y-5">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div class="space-y-2">
            <p class="text-xs font-bold uppercase tracking-[0.18em] text-travelhub-600">
              {{ t('search.sectionLabel') }}
            </p>
            <h1 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-950 tracking-tight">
              {{ t('search.heading', { city: searchState.city }) }}
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
          <div class="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr_1fr_0.7fr_auto] gap-4 items-end">
            <UFormField :label="t('search.fields.city')">
              <UInput
                v-model="searchState.city"
                icon="i-lucide-map-pinned"
                :placeholder="t('search.placeholders.city')"
                size="xl"
              />
            </UFormField>

            <UFormField :label="t('search.fields.checkIn')">
              <UInput
                v-model="searchState.checkIn"
                type="date"
                size="xl"
              />
            </UFormField>

            <UFormField :label="t('search.fields.checkOut')">
              <UInput
                v-model="searchState.checkOut"
                type="date"
                size="xl"
              />
            </UFormField>

            <UFormField :label="t('search.fields.guests')">
              <UInput
                v-model="searchState.guests"
                type="number"
                min="1"
                size="xl"
              />
            </UFormField>

            <UButton
              size="xl"
              icon="i-lucide-search"
              class="justify-center"
            >
              {{ t('search.searchAction') }}
            </UButton>
          </div>

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
              <UFormField :label="t('search.fields.minPrice')">
                <UInput
                  v-model="searchState.minPrice"
                  type="number"
                  min="0"
                  size="lg"
                />
              </UFormField>

              <UFormField :label="t('search.fields.maxPrice')">
                <UInput
                  v-model="searchState.maxPrice"
                  type="number"
                  min="0"
                  size="lg"
                />
              </UFormField>
            </div>
          </div>
        </UCard>
      </section>

      <section class="grid grid-cols-1 xl:grid-cols-2 gap-6">
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

            <UBadge
              v-if="result.badge"
              color="primary"
              variant="solid"
              class="absolute left-4 top-4 rounded-full px-3 py-1"
            >
              {{ result.badge }}
            </UBadge>
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
                <p class="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
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

      <div class="flex items-center justify-center py-4">
        <div class="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm border border-slate-200">
          <button
            type="button"
            class="rounded-full px-3 py-1 text-sm font-semibold text-slate-400"
          >
            1
          </button>
          <button
            type="button"
            class="rounded-full px-3 py-1 text-sm font-semibold text-travelhub-700 bg-travelhub-50"
          >
            2
          </button>
          <button
            type="button"
            class="rounded-full px-3 py-1 text-sm font-semibold text-slate-400"
          >
            3
          </button>
        </div>
      </div>
    </div>
  </div>
</template>