import { LoginPage } from '../pages/LoginPage'
import { PaymentConfirmationPage } from '../pages/PaymentConfirmationPage'
import { RegisterPage } from '../pages/RegisterPage'
import { SearchPage } from '../pages/SearchPage'
import { VerifyOtpPage } from '../pages/VerifyOtpPage'

const loginPage = new LoginPage()
const paymentConfirmationPage = new PaymentConfirmationPage()
const registerPage = new RegisterPage()
const searchPage = new SearchPage()
const verifyOtpPage = new VerifyOtpPage()

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
  },

  thenISeeSearchResultCount(count: number) {
    if (count === 0) {
      searchPage.resultCards().should('not.exist')
      return
    }
    searchPage.resultsContainer().should('be.visible')
    searchPage.resultCards().should('have.length', count)
  },

  thenTheFirstSearchResultIs(propertyId: string, propertyName?: string) {
    searchPage.resultCards()
      .first()
      .should('have.attr', 'data-cy-property-id', propertyId)
    if (propertyName) {
      searchPage.resultCards().first().should('contain.text', propertyName)
    }
  },

  thenISeeTheSearchEmptyState() {
    searchPage.emptyState().should('be.visible')
  },

  thenTheSearchSummaryContains(text: string) {
    searchPage.summary().should('contain.text', text)
  },

  thenTheSortLabelIs(label: string) {
    searchPage.sortTrigger().should('contain.text', label)
  },

  thenTheURLQueryIncludes(fragment: string) {
    cy.location('search').should('include', fragment)
  },

  thenTheLastSearchRequestUsedOrder(orderBy: string, orderDir: string) {
    cy.wait('@searchRequest').then((interception) => {
      const url = interception.request.url
      expect(url).to.match(new RegExp(`order_by=${orderBy}`))
      expect(url).to.match(new RegExp(`order_dir=${orderDir}`))
    })
  },

  thenTheFakeChargeFlowCompletes() {
    cy.wait('@createCharge')
    cy.wait('@getPayment')
    cy.wait('@getPaymentEvents')
    cy.wait('@getPaymentConfirmation')
  },

  thenIAmOnPaymentConfirmation(paymentId: string) {
    cy.url().should('include', `/notifications/payment-confirmation?paymentId=${paymentId}`)
  },

  thenISeeTheReservationConfirmation(reservationId: string, propertyName: string, receiptNumber: string) {
    paymentConfirmationPage.title().should('contain.text', 'Reserva confirmada')
    paymentConfirmationPage.reservationId().should('contain.text', reservationId)
    cy.contains(propertyName).should('be.visible')
    cy.contains(receiptNumber).should('be.visible')
  },

  thenTheStripeFailureFlowCompletes() {
    cy.wait('@createIntent')
    cy.wait('@finalizePayment')
    cy.wait('@getFailedPayment')
    cy.wait('@getFailedPaymentEvents')
  },

  thenISeeCheckoutFeedback(text: string) {
    cy.get('[data-cy=checkout-feedback]').should('contain.text', text)
  }
}
