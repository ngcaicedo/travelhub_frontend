import { defineConfig } from 'cypress'
import mochawesomePlugin from 'cypress-mochawesome-reporter/plugin'

export default defineConfig({
  reporter: 'cypress-mochawesome-reporter',
  reporterOptions: {
    reportDir: 'cypress/reports',
    reportFilename: 'index',
    charts: true,
    embeddedScreenshots: true,
    inlineAssets: true,
    saveAllAttempts: false,
    overwrite: true,
    html: true,
    json: true
  },
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL || 'http://localhost:3000',
    specPattern: 'cypress/e2e/scenarios/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
    fixturesFolder: 'cypress/fixtures',
    screenshotsFolder: 'cypress/screenshots',
    videosFolder: 'cypress/videos',
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 8000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    retries: {
      runMode: 1,
      openMode: 0
    },
    env: {
      usersApiUrl: process.env.NUXT_PUBLIC_USERS_API_BASE || 'http://localhost:8000',
      securityApiUrl: process.env.NUXT_PUBLIC_SECURITY_API_BASE || 'http://localhost:8001',
      propertiesApiUrl: process.env.NUXT_PUBLIC_PROPERTIES_API_BASE || 'http://localhost:8005',
      reservationsApiUrl: process.env.NUXT_PUBLIC_RESERVATIONS_API_BASE || 'http://localhost:8002',
      searchApiUrl: process.env.NUXT_PUBLIC_SEARCH_API_BASE || 'http://localhost:8006',
      paymentsApiBase: process.env.NUXT_PUBLIC_PAYMENTS_API_BASE || 'http://localhost:8003'
    },
    setupNodeEvents(on) {
      mochawesomePlugin(on)
    }
  }
})
