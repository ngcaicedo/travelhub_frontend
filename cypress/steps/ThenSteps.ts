import { LoginPage } from '../pages/LoginPage'
import { PaymentConfirmationPage } from '../pages/PaymentConfirmationPage'
import { PropertyDetailPage } from '../pages/PropertyDetailPage'
import { RegisterPage } from '../pages/RegisterPage'
import { ReservationsListPage } from '../pages/ReservationsListPage'
import { SearchPage } from '../pages/SearchPage'
import { VerifyOtpPage } from '../pages/VerifyOtpPage'
import { screenshot } from '../support/screenshots'

const loginPage = new LoginPage()
const paymentConfirmationPage = new PaymentConfirmationPage()
const propertyDetailPage = new PropertyDetailPage()
const registerPage = new RegisterPage()
const reservationsListPage = new ReservationsListPage()
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
  },

  thenISeeThePropertyName(name: string) {
    propertyDetailPage.name().should('be.visible').and('contain.text', name)
    screenshot.take('property_name_verified')
  },

  thenISeeThePropertyLocation(location: string) {
    propertyDetailPage.location().should('contain.text', location)
    screenshot.take('property_location_verified')
  },

  thenISeeThePropertyRatingMatches(pattern: RegExp) {
    propertyDetailPage.rating().invoke('text').should('match', pattern)
    screenshot.take('property_rating_verified')
  },

  thenISeeThePropertyDescriptionContains(text: string) {
    propertyDetailPage.description().scrollIntoView().should('contain.text', text)
    screenshot.take('property_description_verified')
  },

  thenISeeAtLeastOneAmenity() {
    propertyDetailPage.amenitiesSection().scrollIntoView().should('be.visible')
    propertyDetailPage.amenityItems().its('length').should('be.gte', 1)
    screenshot.take('property_amenities_verified')
  },

  thenISeeThePropertyHasMaxGuests(maxGuests: number) {
    propertyDetailPage.features().should('have.attr', 'data-cy-max-guests', String(maxGuests))
    screenshot.take('property_features_verified')
  },

  thenISeeTheReserveCallToAction() {
    propertyDetailPage.reserveButton().scrollIntoView().should('be.visible')
    screenshot.take('property_reserve_cta_verified')
  },

  thenISeeReservationCount(count: number) {
    if (count === 0) {
      reservationsListPage.cards().should('not.exist')
      return
    }
    reservationsListPage.list().should('be.visible')
    reservationsListPage.cards().should('have.length', count)
    screenshot.take(`reservations_count_${count}_verified`)
  },

  thenISeeReservationWithStatus(reservationId: string, status: string) {
    reservationsListPage.cardById(reservationId)
      .should('be.visible')
      .and('have.attr', 'data-cy-reservation-status', status)
    screenshot.take(`reservation_${status}_verified`)
  },

  thenTheReservationCardContains(reservationId: string, text: string) {
    reservationsListPage.cardById(reservationId).should('contain.text', text)
  },

  thenIAmOnCheckoutWithReservation() {
    cy.location('pathname').should('eq', '/checkout')
    cy.location('search').should('include', 'reservationId=')
    screenshot.take('checkout_url_verified')
  },

  thenIAmOnPaymentConfirmationPage() {
    cy.location('pathname').should('eq', '/notifications/payment-confirmation')
    cy.location('search').should('match', /paymentId=/)
    screenshot.take('payment_confirmation_url_verified')
  }
}
