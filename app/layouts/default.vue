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
  <div class="min-h-screen bg-[#f8fafc]">
    <header class="bg-white border-b border-[#e2e8f0] px-10 py-4 flex items-center justify-between">
      <NuxtLink to="/">
        <AppLogo class="h-6 w-auto shrink-0" />
      </NuxtLink>

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
    </header>

    <main class="px-10 py-8">
      <slot />
    </main>
  </div>
</template>
