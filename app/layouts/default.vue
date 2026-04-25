<script setup lang="ts">
const route = useRoute()
const { locale, locales, setLocale, t } = useI18n()
const authStore = useAuthStore()

const localeOptions = computed(() =>
  (locales.value as Array<{ code: string, name: string }>).map(item => ({
    label: item.name,
    value: item.code
  }))
)

const navigationItems = computed(() => {
  const items = []

  if (!authStore.isAuthenticated) {
    items.push({
      to: '/login',
      label: t('navigation.login'),
      active: route.path === '/login'
    })
  }

  items.push(
    {
      to: '/properties',
      label: t('navigation.search'),
      active: route.path === '/properties' || route.path === '/search'
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
  )

  if (authStore.isHotelUser) {
    items.push({
      to: '/hotel/reservations',
      label: t('navigation.hotelReservations'),
      active: route.path === '/hotel/reservations'
    })
  }

  return items
})

function onLocaleChange(code: string) {
  setLocale(code as 'es' | 'en' | 'pt')
}
</script>

<template>
  <div class="min-h-screen bg-[#f8fafc]">
    <UHeader
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
        <div class="flex items-center gap-2">
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
          <UButton
            v-if="authStore.isAuthenticated"
            :label="t('navigation.logout')"
            icon="i-lucide-log-out"
            color="neutral"
            variant="ghost"
            size="sm"
            @click="authStore.logout()"
          />
        </div>
      </template>
    </UHeader>

    <PaymentsPaymentStatusBanner />

    <UMain class="pb-10">
      <slot />
    </UMain>
  </div>
</template>
