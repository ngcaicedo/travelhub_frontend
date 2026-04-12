<script setup lang="ts">
import { getApiErrorMessage } from '~/utils/apiError'

const { t } = useI18n()
const route = useRoute()
const authStore = useAuthStore()

definePageMeta({
  layout: 'auth'
})

useSeoMeta({
  title: () => `${t('auth.verifyOtp.title')} - TravelHub`
})

const email = computed(() => (route.query.email ?? '') as string)
const redirect = computed(() => (route.query.redirect ?? '') as string)
const otp = ref('')
const error = ref('')
const isLoading = ref(false)

async function onSubmit() {
  if (!email.value || otp.value.length !== 6) {
    error.value = t('auth.verifyOtp.invalidOtp')
    return
  }

  isLoading.value = true
  error.value = ''

  try {
    await authStore.verifyOtp(email.value, otp.value, redirect.value || undefined)
  } catch (e) {
    error.value = getApiErrorMessage(e, t('common.unexpectedError'))
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="w-full max-w-[400px]">
    <div class="space-y-8">
      <div>
        <h1 class="text-3xl font-bold text-slate-900">
          {{ $t('auth.verifyOtp.title') }}
        </h1>
        <p class="mt-2 text-base text-slate-500">
          {{ $t('auth.verifyOtp.description') }}
        </p>
      </div>

      <UAlert
        v-if="error"
        role="alert"
        icon="i-lucide-alert-circle"
        color="error"
        :title="t('auth.verifyOtp.error')"
        :description="error"
        closable
        @close="error = ''"
      />

      <form
        class="space-y-6"
        @submit.prevent="onSubmit"
      >
        <UFormField :label="$t('auth.verifyOtp.otpLabel')">
          <UInput
            v-model="otp"
            type="text"
            maxlength="6"
            :placeholder="$t('auth.verifyOtp.otpPlaceholder')"
            size="xl"
            class="w-full text-center text-2xl font-mono tracking-widest"
            data-cy="otp-input"
          />
        </UFormField>

        <UButton
          type="submit"
          :label="$t('auth.verifyOtp.submit')"
          trailing-icon="i-lucide-arrow-right"
          size="xl"
          block
          :loading="isLoading"
          data-cy="otp-submit"
        />
      </form>
    </div>
  </div>
</template>
