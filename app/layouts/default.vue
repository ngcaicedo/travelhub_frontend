<script setup lang="ts">
const { locale, locales, setLocale } = useI18n()

const localeOptions = computed(() =>
  (locales.value as Array<{ code: string, name: string }>).map(l => ({
    label: l.name,
    value: l.code
  }))
)

function onLocaleChange(code: string) {
  setLocale(code as 'es' | 'en' | 'pt')
}
</script>

<template>
  <UApp>
    <UHeader class="bg-white border-b border-[#e2e8f0]">
      <template #left>
        <NuxtLink to="/">
          <AppLogo class="h-6 w-auto shrink-0" />
        </NuxtLink>
      </template>

      <template #right>
        <USelect
          :model-value="locale"
          :items="localeOptions"
          icon="i-lucide-globe"
          color="neutral"
          variant="ghost"
          size="sm"
          class="w-auto"
          @update:model-value="onLocaleChange"
        />
      </template>
    </UHeader>

    <UMain>
      <slot />
    </UMain>
  </UApp>
</template>
