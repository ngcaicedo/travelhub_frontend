<script setup lang="ts">
import type { NavigationMenuItem, DropdownMenuItem } from '@nuxt/ui'

const route = useRoute()
const authStore = useAuthStore()
const { t, locale, locales, setLocale } = useI18n()

const open = ref(false)

const managerRoles = ['hotel_admin', 'hotel_manager']
const isManager = computed(() => !!authStore.role && managerRoles.includes(authStore.role))

const navItems = computed<NavigationMenuItem[][]>(() => {
  const items: NavigationMenuItem[] = [
    {
      label: t('hotel.nav.dashboard'),
      icon: 'i-lucide-layout-dashboard',
      to: '/hotel/dashboard',
      active: route.path === '/hotel/dashboard',
    },
    {
      label: t('hotel.nav.pricing'),
      icon: 'i-lucide-badge-dollar-sign',
      to: '/hotel/pricing',
      active: route.path.startsWith('/hotel/pricing'),
    },
  ],
])

const userMenu = computed<DropdownMenuItem[][]>(() => [
  [
    {
      label: t('navigation.logout'),
      icon: 'i-lucide-log-out',
      onSelect: () => authStore.logout(),
    },
  ],
])

const localeOptions = computed(() =>
  (locales.value as Array<{ code: string, name: string }>).map(item => ({
    label: item.name,
    value: item.code,
  })),
)

function onLocaleChange(code: string) {
  setLocale(code as 'es' | 'en' | 'pt')
}
</script>

<template>
  <UDashboardGroup>
    <UDashboardSidebar
      id="hotel"
      v-model:open="open"
      collapsible
      resizable
      role="complementary"
      :aria-label="t('hotel.nav.portalLabel')"
      :ui="{ footer: 'border-t border-default' }"
    >
      <template #header="{ collapsed }">
        <NuxtLink to="/hotel/dashboard" class="flex items-center gap-3">
          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            class="shrink-0"
          >
            <rect width="32" height="32" rx="8" fill="var(--ui-primary)" />
            <path
              d="M13.9373 25.125L11.4623 20.525L6.8623 18.05L8.6373 16.3L12.2623 16.925L14.8123 14.375L6.8873 11L8.9873 8.85L18.6123 10.55L21.7123 7.45C22.0956 7.06667 22.5706 6.875 23.1373 6.875C23.704 6.875 24.179 7.06667 24.5623 7.45C24.9456 7.83333 25.1373 8.30417 25.1373 8.8625C25.1373 9.42083 24.9456 9.89167 24.5623 10.275L21.4373 13.4L23.1373 23L21.0123 25.125L17.6123 17.2L15.0623 19.75L15.7123 23.35L13.9373 25.125Z"
              fill="white"
            />
          </svg>
          <div v-if="!collapsed" class="flex flex-col leading-tight">
            <span class="text-base font-bold text-(--ui-text-highlighted)">TravelHub</span>
            <span class="text-xs font-medium text-(--ui-text-muted)">{{ t('hotel.nav.portalLabel') }}</span>
          </div>
        </NuxtLink>
      </template>

      <UNavigationMenu
        :items="navItems"
        orientation="vertical"
        highlight
        :collapsed="false"
        :aria-label="t('navigation.mainNav')"
      />

      <template #footer="{ collapsed }">
        <UDropdownMenu
          :items="userMenu"
          :ui="{ content: 'w-(--reka-dropdown-menu-trigger-width)' }"
        >
          <UButton
            color="neutral"
            variant="ghost"
            block
            :square="collapsed"
            class="data-[state=open]:bg-(--ui-bg-elevated)"
          >
            <UAvatar :alt="authStore.userId ?? ''" size="xs" />
            <span v-if="!collapsed" class="truncate">
              {{ t('hotel.nav.adminAccount') }}
            </span>
            <UIcon
              v-if="!collapsed"
              name="i-lucide-ellipsis-vertical"
              class="ms-auto size-5 shrink-0"
            />
          </UButton>
        </UDropdownMenu>
      </template>
    </UDashboardSidebar>

    <UDashboardPanel id="hotel-main">
      <UDashboardNavbar
        :title="t('hotel.dashboard.headerTitle')"
        role="banner"
        :aria-label="t('hotel.dashboard.headerTitle')"
      >
        <template #right>
          <USelect
            :model-value="locale"
            :items="localeOptions"
            icon="i-lucide-globe"
            color="neutral"
            variant="ghost"
            size="sm"
            class="w-[138px]"
            :aria-label="t('navigation.language')"
            @update:model-value="onLocaleChange"
          />
        </template>
      </UDashboardNavbar>

      <main class="flex-1 overflow-y-auto">
        <slot />
      </main>
    </UDashboardPanel>
  </UDashboardGroup>
</template>
