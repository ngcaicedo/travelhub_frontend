import { LoginPage } from '../pages/LoginPage'
import { RegisterPage } from '../pages/RegisterPage'

const loginPage = new LoginPage()
const registerPage = new RegisterPage()

export const givenSteps = {
  givenIAmOnLogin() {
    loginPage.visit()
  },

  givenIAmOnRegister() {
    registerPage.visit()
  },

  givenOtpServiceResponds(statusCode = 200, fixture = 'responses/otpSuccess.json') {
    cy.intercept('POST', '**/api/v1/auth/verify-otp', {
      statusCode,
      fixture
    }).as('verifyOtp')
  },

  givenOtpServiceFails(statusCode: number, body: object) {
    cy.intercept('POST', '**/api/v1/auth/verify-otp', {
      statusCode,
      body
    }).as('verifyOtp')
  }
}
