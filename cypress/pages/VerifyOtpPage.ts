import { screenshot } from '../support/screenshots'

export class VerifyOtpPage {
  assertOnUrl(email: string) {
    cy.location('pathname').should('eq', '/verify-otp')
    cy.location('search').then((search) => {
      const params = new URLSearchParams(search)
      expect(params.get('email')).to.eq(email)
    })
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
