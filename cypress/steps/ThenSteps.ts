import { HotelDashboardPage } from '../pages/HotelDashboardPage'
import { HotelReservationDetailPage } from '../pages/HotelReservationDetailPage'
import { LoginPage } from '../pages/LoginPage'
import { PaymentConfirmationPage } from '../pages/PaymentConfirmationPage'
import { PropertyDetailPage } from '../pages/PropertyDetailPage'
import { RegisterPage } from '../pages/RegisterPage'
import { ReservationCancelPage } from '../pages/ReservationCancelPage'
import { ReservationModifyPage } from '../pages/ReservationModifyPage'
import { ReservationsListPage } from '../pages/ReservationsListPage'
import { SearchPage } from '../pages/SearchPage'
import { VerifyOtpPage } from '../pages/VerifyOtpPage'
import { screenshot } from '../support/screenshots'

const hotelDashboardPage = new HotelDashboardPage()
const hotelReservationDetailPage = new HotelReservationDetailPage()
const loginPage = new LoginPage()
const paymentConfirmationPage = new PaymentConfirmationPage()
const propertyDetailPage = new PropertyDetailPage()
const registerPage = new RegisterPage()
const reservationCancelPage = new ReservationCancelPage()
const reservationModifyPage = new ReservationModifyPage()
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

  thenTheSearchResultsContain(propertyIds: string[]) {
    searchPage.resultCards().should('have.length', propertyIds.length)
    propertyIds.forEach((id) => {
      cy.get(`[data-cy=search-result-card][data-cy-property-id="${id}"]`)
        .should('exist')
    })
  },

  thenTheSearchResultsAreOrdered(propertyIds: string[]) {
    searchPage.resultCards().should('have.length', propertyIds.length)
    searchPage.resultCards().then(($cards) => {
      const actualIds = Array.from($cards).map(card =>
        card.getAttribute('data-cy-property-id')
      )
      expect(actualIds).to.deep.equal(propertyIds)
    })
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
    cy.location('pathname', { timeout: 20000 }).should('eq', '/notifications/payment-confirmation')
    cy.location('search').should('match', /paymentId=/)
    screenshot.take('payment_confirmation_url_verified')
  },

  thenIAmOnReservationCancelPage(reservationId: string) {
    cy.location('pathname').should('eq', `/reservations/${reservationId}/cancel`)
    reservationCancelPage.root().should('be.visible')
    screenshot.take('reservation_cancel_page_verified')
  },

  thenISeeRefundBreakdown() {
    reservationCancelPage.refundAmount().should('be.visible')
    reservationCancelPage.penaltyAmount().should('be.visible')
  },

  thenIAmOnReservationCancelledPage(reservationId: string) {
    cy.location('pathname', { timeout: 30000 }).should('eq', `/reservations/${reservationId}/cancelled`)
    cy.get('[data-cy=reservation-cancelled]', { timeout: 30000 }).should('be.visible')
    screenshot.take('reservation_cancelled_page_verified')
  },

  thenTheReservationIsCancelled() {
    cy.get('[data-cy=reservation-cancelled]')
      .invoke('attr', 'data-cy-status')
      .should('match', /^(cancelled|refund_completed|refund_failed|refund_pending|cancel_requested)$/)
  },

  thenTheReservationCardHasCancelledStatus(reservationId: string) {
    reservationsListPage.cardById(reservationId)
      .should('be.visible')
      .invoke('attr', 'data-cy-reservation-status')
      .should('match', /^(cancelled|refund_completed|refund_failed|refund_pending|cancel_requested)$/)
  },

  thenTheReservationIsNotInUpcomingTab(reservationId: string) {
    reservationsListPage.selectTab('upcoming')
    cy.get(`[data-cy=reservation-card][data-cy-reservation-id="${reservationId}"]`)
      .should('not.exist')
  },

  thenIAmOnReservationModifyPage(reservationId: string) {
    cy.location('pathname').should('eq', `/reservations/${reservationId}/modify`)
    reservationModifyPage.root().should('be.visible')
    screenshot.take('reservation_modify_page_verified')
  },

  thenTheModificationPreviewIsAllowed() {
    reservationModifyPage.preview()
      .should('have.attr', 'data-cy-change-allowed', 'true')
  },

  thenIAmOnHotelDashboard() {
    cy.location('pathname').should('eq', '/hotel/dashboard')
    hotelDashboardPage.root().should('exist')
  },

  thenISeeAllHotelKpis() {
    hotelDashboardPage.kpiRevenue().should('exist')
    hotelDashboardPage.kpiOccupancy().should('exist')
    hotelDashboardPage.kpiAdr().should('exist')
    hotelDashboardPage.kpiActiveBookings().should('exist')
    screenshot.take('hotel_kpis_visible')
  },

  thenTheHotelDashboardListsReservation(reservationId: string) {
    hotelDashboardPage.rowByReservationId(reservationId)
      .scrollIntoView()
      .should('be.visible')
    screenshot.take('hotel_dashboard_reservation_listed')
  },

  thenTheHotelDashboardHasAtLeastOneReservation() {
    hotelDashboardPage.reservationRows().its('length').should('be.gte', 1)
  },

  thenIAmOnHotelReservationDetail(reservationId: string) {
    cy.location('pathname').should('eq', `/hotel/reservations/${reservationId}`)
    cy.get('[data-cy=hotel-reservation-detail]', { timeout: 20000 })
      .should('have.attr', 'data-cy-reservation-id', reservationId)
    screenshot.take('hotel_reservation_detail_url_verified')
  },

  thenISeeHotelReservationGuest(fullName: string, email: string) {
    hotelReservationDetailPage.guestName().should('contain.text', fullName)
    hotelReservationDetailPage.guestEmail().should('contain.text', email)
  },

  thenISeeHotelReservationDates(checkIn: string, checkOut: string) {
    hotelReservationDetailPage.checkIn()
      .invoke('attr', 'data-cy-iso')
      .should((value) => expect(String(value).slice(0, 10)).to.eq(checkIn))
    hotelReservationDetailPage.checkOut()
      .invoke('attr', 'data-cy-iso')
      .should((value) => expect(String(value).slice(0, 10)).to.eq(checkOut))
  },

  thenISeeHotelReservationGuests(count: number) {
    hotelReservationDetailPage.guests()
      .should('have.attr', 'data-cy-count', String(count))
  },

  thenISeeHotelReservationStatus(expected: RegExp) {
    hotelReservationDetailPage.root()
      .invoke('attr', 'data-cy-reservation-status')
      .should('match', expected)
  },

  thenTheHotelReservationStatusIs(expected: RegExp) {
    hotelReservationDetailPage.root()
      .invoke('attr', 'data-cy-reservation-status')
      .should('match', expected)
  },

  thenISeeHotelReservationActionSuccess() {
    hotelReservationDetailPage.successAlert().should('be.visible')
    screenshot.take('hotel_reservation_action_success')
  },

  thenISeeHotelReservationPaymentBreakdown() {
    hotelReservationDetailPage.paymentTotal()
      .scrollIntoView()
      .should('be.visible')
      .invoke('attr', 'data-cy-cents')
      .then(cents => expect(Number(cents)).to.be.greaterThan(0))
  }
}
