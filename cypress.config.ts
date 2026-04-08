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
    baseUrl: 'http://localhost:3000',
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
      usersApiUrl: 'http://localhost:8000',
      securityApiUrl: 'http://localhost:8001'
    },
    setupNodeEvents(on) {
      mochawesomePlugin(on)
    }
  }
})
