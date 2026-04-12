import 'cypress-mochawesome-reporter/register'
import './screenshots'

Cypress.on('uncaught:exception', (error) => {
  const message = error?.message || ''
  const stack = error?.stack || ''

  if (
    message.includes("Cannot read properties of undefined (reading 'matched')")
    || message.includes("Cannot read properties of undefined (reading 'left')")
    || stack.includes('Header.vue')
    || stack.includes('Select')
  ) {
    return false
  }

  return true
})

beforeEach(() => {
  cy.setCookie('i18n_locale', 'es')
})
