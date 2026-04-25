import { screenshot } from '../support/screenshots'

export class CheckoutPage {
  visit(options?: Partial<Cypress.VisitOptions>) {
    cy.visit('/checkout', options)
    screenshot.take('checkout_page_loaded')
  }

  chooseScenario(value: 'success' | 'insufficient' | 'declined') {
    cy.get('[data-cy=checkout-scenario]').select(value)
    screenshot.take(`checkout_scenario_${value}`)
  }

  clickPrepareSecureForm() {
    cy.get('[data-cy=checkout-prepare-secure-form]').click()
    screenshot.take('checkout_prepare_secure_form')
  }

  clickPayNow() {
    cy.get('[data-cy=checkout-pay-now]').click()
    screenshot.take('checkout_pay_now')
  }

  clickTestDuplicate() {
    cy.get('[data-cy=checkout-test-duplicate]').click()
    screenshot.take('checkout_test_duplicate')
  }

  feedback() {
    return cy.get('[data-cy=checkout-feedback]')
  }

  secureElement() {
    return cy.get('[data-cy=checkout-stripe-element]')
  }

  manualTokenField() {
    return cy.get('[data-cy=checkout-token]')
  }

  manualCardNumberField() {
    return cy.get('[data-cy=checkout-card-number]')
  }

  complianceBanner() {
    return cy.get('[data-cy=checkout-compliance-banner]')
  }
}
