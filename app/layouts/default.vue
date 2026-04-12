<script setup lang="ts">
const route = useRoute()
const { locale, locales, setLocale, t } = useI18n()
const isCypressRuntime = import.meta.client && typeof window !== 'undefined' && 'Cypress' in window

const localeOptions = computed(() =>
  (locales.value as Array<{ code: string, name: string }>).map(item => ({
    label: item.name,
    value: item.code
  }))
)

const navigationItems = computed(() => [
  {
    to: '/login',
    label: t('navigation.login'),
    active: route.path === '/login'
  },
  {
    to: '/reservations',
    label: t('navigation.reservations'),
    active: route.path === '/reservations' || route.path.startsWith('/reservations/')
  },
  {
    to: '/checkout',
    label: t('navigation.checkout'),
    active: route.path === '/checkout' || route.path.startsWith('/notifications/payment-confirmation')
  }
])

function onLocaleChange(code: string) {
  setLocale(code as 'es' | 'en' | 'pt')
}
</script>

<template>
  <div class="min-h-screen bg-[#f8fafc]">
    <header
      v-if="isCypressRuntime"
      class="border-b border-slate-200 bg-white/90"
    >
      <div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div class="flex items-center gap-6">
          <NuxtLink to="/">
            <AppLogo class="h-6 w-auto shrink-0" />
          </NuxtLink>

          <nav class="hidden items-center gap-2 md:flex">
            <NuxtLink
              v-for="item in navigationItems"
              :key="item.to"
              :to="item.to"
              :class="[
                'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                item.active ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
              ]"
            >
              {{ item.label }}
            </NuxtLink>
          </nav>
        </div>

        <span class="text-sm text-slate-500">
          {{ locale.toUpperCase() }}
        </span>
      </div>
    </header>

    <UHeader
      v-else
      class="border-b border-slate-200 bg-white/90 backdrop-blur"
    >
      <template #left>
        <div class="flex items-center gap-6">
          <NuxtLink to="/">
            <AppLogo class="h-6 w-auto shrink-0" />
          </NuxtLink>

          <nav class="hidden items-center gap-2 md:flex">
            <UButton
              v-for="item in navigationItems"
              :key="item.to"
              :to="item.to"
              :label="item.label"
              :color="item.active ? 'primary' : 'neutral'"
              :variant="item.active ? 'subtle' : 'ghost'"
            />
          </nav>
        </div>
      </template>

      <template #right>
        <div class="flex items-center">
          <USelect
            :model-value="locale"
            :items="localeOptions"
            icon="i-lucide-globe"
            color="neutral"
            variant="ghost"
            size="sm"
            class="w-[138px]"
            @update:model-value="onLocaleChange"
          />
        </div>
      </template>
    </UHeader>

    <UMain class="pb-10">
      <slot />
    </UMain>
  </div>
</template>
