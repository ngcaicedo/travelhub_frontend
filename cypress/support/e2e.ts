import 'cypress-mochawesome-reporter/register'
import './screenshots'
import './cursor'

beforeEach(() => {
  cy.setCookie('i18n_locale', 'es')
})
