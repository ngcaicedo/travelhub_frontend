import { screenshot } from '../support/screenshots'

export class LoginPage {
  visit() {
    cy.visit('/login')
    screenshot.take('login_page_loaded')
  }

  typeEmail(email: string) {
    cy.get('[data-cy=login-email]').type(email)
  }

  typePassword(password: string) {
    cy.get('[data-cy=login-password]').type(password)
  }

  submit() {
    screenshot.take('login_form_filled')
    cy.get('[data-cy=login-submit]').click()
    screenshot.take('login_form_submitted')
  }

  getErrorMessage() {
    return cy.get('[role="alert"]')
  }
}
