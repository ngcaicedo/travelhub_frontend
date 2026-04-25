<script setup lang="ts">
import type { NavigationMenuItem, DropdownMenuItem } from '@nuxt/ui'

const route = useRoute()
const authStore = useAuthStore()
const { t, locale, locales, setLocale } = useI18n()

const open = ref(false)

const navItems = computed<NavigationMenuItem[][]>(() => [
  [
    {
      label: t('hotel.nav.dashboard'),
      icon: 'i-lucide-layout-dashboard',
      to: '/hotel/dashboard',
      active: route.path === '/hotel/dashboard',
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
      :ui="{ footer: 'border-t border-default' }"
    >
      <template #header="{ collapsed }">
        <NuxtLink to="/hotel/dashboard" class="flex items-center gap-3">
          <AppLogo class="h-7 w-auto shrink-0" />
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
      <UDashboardNavbar :title="t('hotel.dashboard.headerTitle')">
        <template #right>
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
        </template>
      </UDashboardNavbar>

      <slot />
    </UDashboardPanel>
  </UDashboardGroup>
</template>
