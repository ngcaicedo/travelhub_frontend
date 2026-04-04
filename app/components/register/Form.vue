<script setup lang="ts">
const props = defineProps<{
  type: 'traveler' | 'hotelPartner'
}>()

const form = reactive(
  props.type === 'traveler'
    ? { fullName: '', email: '', password: '' }
    : { hotelName: '', contactName: '', email: '', password: '' }
)

const showPassword = ref(false)
const agreeTerms = ref(false)
const passwordRef = computed(() => form.password)
const { score, label, bgColor, textColor } = usePasswordStrength(passwordRef)

function onSubmit() {
  // TODO: Integrate with registration API
}
</script>

<template>
  <form
    class="space-y-5 mt-8"
    @submit.prevent="onSubmit"
  >
    <!-- Traveler-specific fields -->
    <UFormField
      v-if="type === 'traveler'"
      :label="$t('auth.register.fullName')"
    >
      <UInput
        v-model="(form as { fullName: string }).fullName"
        :placeholder="$t('auth.register.fullNamePlaceholder')"
        icon="i-lucide-user"
        size="xl"
        class="w-full"
      />
    </UFormField>

    <!-- Hotel Partner-specific fields -->
    <template v-if="type === 'hotelPartner'">
      <UFormField :label="$t('auth.register.hotelName')">
        <UInput
          v-model="(form as { hotelName: string }).hotelName"
          :placeholder="$t('auth.register.hotelNamePlaceholder')"
          icon="i-lucide-building-2"
          size="xl"
          class="w-full"
        />
      </UFormField>

      <UFormField :label="$t('auth.register.contactName')">
        <UInput
          v-model="(form as { contactName: string }).contactName"
          :placeholder="$t('auth.register.contactNamePlaceholder')"
          icon="i-lucide-user"
          size="xl"
          class="w-full"
        />
      </UFormField>
    </template>

    <!-- Shared fields -->
    <UFormField :label="$t('auth.register.email')">
      <UInput
        v-model="form.email"
        type="email"
        :placeholder="$t('auth.register.emailPlaceholder')"
        icon="i-lucide-mail"
        size="xl"
        class="w-full"
      />
    </UFormField>

    <UFormField :label="$t('auth.register.password')">
      <UInput
        v-model="form.password"
        :type="showPassword ? 'text' : 'password'"
        :placeholder="$t('auth.register.passwordPlaceholder')"
        icon="i-lucide-lock"
        size="xl"
        class="w-full"
        :ui="{ trailing: 'pointer-events-auto' }"
      >
        <template #trailing>
          <UButton
            :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
            color="neutral"
            variant="ghost"
            size="xs"
            :padded="false"
            @click="showPassword = !showPassword"
          />
        </template>
      </UInput>

      <div
        v-if="form.password.length > 0"
        class="mt-2"
      >
        <div class="flex gap-1 h-1.5">
          <div
            v-for="i in 4"
            :key="i"
            class="flex-1 rounded-full transition-colors"
            :class="i <= score ? bgColor : 'bg-slate-200'"
          />
        </div>
        <div class="flex items-center justify-between mt-1.5">
          <span
            class="text-xs font-medium uppercase"
            :class="textColor"
          >{{ label }}</span>
          <span class="text-xs text-slate-400">{{ $t('auth.register.passwordHint') }}</span>
        </div>
      </div>
    </UFormField>

    <div class="pt-2">
      <UCheckbox v-model="agreeTerms">
        <template #label>
          <span class="text-sm text-slate-500">
            {{ $t('auth.register.termsAgree') }}
            <NuxtLink
              to="#"
              class="font-medium text-travelhub-600 hover:text-travelhub-700"
            >{{ $t('auth.register.termsOfService') }}</NuxtLink>
            {{ $t('auth.register.and') }}
            <NuxtLink
              to="#"
              class="font-medium text-travelhub-600 hover:text-travelhub-700"
            >{{ $t('auth.register.privacyPolicy') }}</NuxtLink>.
          </span>
        </template>
      </UCheckbox>
    </div>

    <div class="pt-4">
      <UButton
        type="submit"
        :label="$t('auth.register.submit')"
        size="xl"
        block
      />
    </div>
  </form>
</template>
