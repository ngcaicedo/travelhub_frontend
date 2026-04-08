// https://nuxt.com/docs/api/configuration/nuxt-config
/// <reference types="@nuxtjs/i18n" />
export default defineNuxtConfig({

  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxtjs/i18n',
    '@pinia/nuxt'
  ],
  ssr: false,

  devtools: {
    enabled: true
  },
  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }
      ]
    }
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    public: {
      paymentsApiBase: process.env.NUXT_PUBLIC_PAYMENTS_API_BASE || 'http://localhost:8003',
      usersApiBase: '',
      securityApiBase: '',
      usersApiUrl: process.env.USERS_API_URL || 'http://localhost:8000',
      securityApiUrl: process.env.SECURITY_API_URL || 'http://localhost:8001',
      reservationsApiUrl: process.env.RESERVATIONS_API_URL || 'http://localhost:8002'
    }
  },

  compatibilityDate: '2025-01-15',

  i18n: {
    defaultLocale: 'es',
    langDir: 'locales',
    locales: [
      { code: 'es', name: 'Español', file: 'es.json' },
      { code: 'en', name: 'English', file: 'en.json' },
      { code: 'pt', name: 'Português', file: 'pt.json' }
    ],
    strategy: 'no_prefix',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_locale',
      fallbackLocale: 'es'
    }
  }
})
