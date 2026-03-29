<template>
  <div class="min-h-screen bg-[#f8fafc]">
    <UHeader>
      <template #left>
        <NuxtLink to="/">
          <AppLogo class="h-6 w-auto shrink-0" />
        </NuxtLink>
      </template>
    </UHeader>

    <UMain>
      <slot />
    </UMain>
  </div>
</template>
