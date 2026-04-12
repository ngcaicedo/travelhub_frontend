import 'cypress-mochawesome-reporter/register'
import './screenshots'

Cypress.on('uncaught:exception', (error) => {
  const message = error?.message || ''
  const stack = error?.stack || ''
  const isKnownMatchedError = message.includes("Cannot read properties of undefined (reading 'matched')")
  const isKnownLeftError = message.includes("Cannot read properties of undefined (reading 'left')")
  const isHeaderComponentError = stack.includes('Header.vue')
  const isSelectComponentError = stack.includes('Select.vue')

  if (
    isKnownMatchedError
    || isKnownLeftError
    || isHeaderComponentError
    || isSelectComponentError
  ) {
    Cypress.log({
      name: 'uncaught:exception',
      message: `Suppressed known exception: ${message}`,
      consoleProps: () => ({ message, stack })
    })
    return false
  }

  return true
})

beforeEach(() => {
  cy.setCookie('i18n_locale', 'es')
})
