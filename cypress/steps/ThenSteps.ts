import { VerifyOtpPage } from '../pages/VerifyOtpPage'
import { LoginPage } from '../pages/LoginPage'
import { RegisterPage } from '../pages/RegisterPage'

const verifyOtpPage = new VerifyOtpPage()
const loginPage = new LoginPage()
const registerPage = new RegisterPage()

export const thenSteps = {
  thenIAmOn(path: string) {
    cy.url().should('include', path)
  },

  thenISeeTheOtpVerification(email: string) {
    verifyOtpPage.assertOnUrl(email)
  },

  thenISeeALoginError() {
    loginPage.getErrorMessage().should('be.visible')
  },

  thenISeeARegisterError() {
    registerPage.getErrorMessage().should('be.visible')
  },

  thenISeeAnOtpError() {
    verifyOtpPage.getErrorMessage().should('be.visible')
  },

  thenIHaveAToken() {
    cy.getCookie('auth_token').should('exist')
  }
}
