import { screenshot } from '../support/screenshots'

export class VerifyOtpPage {
  assertOnUrl(email: string) {
    cy.url().should('include', `/verify-otp?email=${encodeURIComponent(email)}`)
    screenshot.take('otp_page_loaded')
  }

  typeCode(code: string) {
    cy.get('[data-cy=otp-input]').type(code)
    screenshot.take('otp_code_entered')
  }

  submit() {
    cy.get('[data-cy=otp-submit]').click()
    screenshot.take('otp_submitted')
  }

  getErrorMessage() {
    return cy.get('[role="alert"]')
  }
}
