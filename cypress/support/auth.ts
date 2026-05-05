import { screenshot } from './screenshots'
import {
  DEMO_HOTEL_A,
  DEMO_HOTEL_B,
  DEMO_OTP_CODE,
  type DemoHotel
} from './demoData'

export type SessionRole = 'traveler' | 'hotel'

export interface SessionUser {
  email: string
  password: string
  fullName: string
  phone: string
  role: SessionRole
  hotelName?: string
  userId?: string
}

function base64UrlEncode(value: string): string {
  return btoa(value).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')
}

function buildFakeJwt(user: SessionUser): string {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = base64UrlEncode(JSON.stringify({
    sub: user.userId ?? '00000000-0000-0000-0000-000000000000',
    email: user.email,
    role: user.role
  }))
  return `${header}.${payload}.cypress-signature`
}

export function fromDemoHotel(hotel: DemoHotel): SessionUser {
  return {
    email: hotel.email,
    password: hotel.password,
    fullName: hotel.fullName,
    phone: hotel.phone,
    role: 'hotel',
    hotelName: hotel.hotelName
  }
}

export const demoHotelA: SessionUser = fromDemoHotel(DEMO_HOTEL_A)
export const demoHotelB: SessionUser = fromDemoHotel(DEMO_HOTEL_B)

interface BuildOptions {
  emailPrefix?: string
}

function uniqueSuffix() {
  return `${Date.now()}.${Math.floor(Math.random() * 100000)}`
}

export function buildTraveler(opts: BuildOptions = {}): SessionUser {
  const prefix = opts.emailPrefix ?? 'traveler'
  return {
    email: `${prefix}.${uniqueSuffix()}@example.com`,
    password: 'Test1234!',
    fullName: 'Ana García',
    phone: '3001234567',
    role: 'traveler'
  }
}

export function buildHotelPartner(opts: BuildOptions = {}): SessionUser {
  const prefix = opts.emailPrefix ?? 'hotel'
  return {
    email: `${prefix}.${uniqueSuffix()}@example.com`,
    password: 'Test1234!',
    fullName: 'Carlos Mendoza',
    phone: '3017654321',
    role: 'hotel',
    hotelName: 'Hotel Cypress Test'
  }
}

export function seedUser(user: SessionUser): Cypress.Chainable<SessionUser> {
  const body: Record<string, string> = {
    email: user.email,
    phone: user.phone,
    password: user.password,
    full_name: user.fullName,
    role: user.role
  }
  if (user.role === 'hotel' && user.hotelName) {
    body.hotel_name = user.hotelName
  }
  return cy.request({
    method: 'POST',
    url: `${Cypress.env('usersApiUrl')}/api/v1/users`,
    body,
    failOnStatusCode: false
  }).then((response) => {
    const created = (response.body && typeof response.body === 'object')
      ? response.body as { id?: string }
      : null
    const merged: SessionUser = { ...user, userId: created?.id ?? user.userId }
    return merged
  })
}

interface LoginOptions {
  /**
   * Si es true, intercepta /api/v1/auth/verify-otp con un fixture local.
   * Por defecto: true para travelers (no hay seed demo), false para hotels
   * (el backend acepta DEMO_OTP_CODE para emails en DEMO_HOTEL_EMAILS cuando
   * DEMO_SEED_ENABLED=true).
   */
  stubOtp?: boolean
  /**
   * Código OTP a digitar. Si stubOtp=true, cualquier valor sirve. Si stubOtp=false,
   * debe coincidir con DEMO_OTP_CODE del backend (default '000000').
   */
  otpCode?: string
  cacheSession?: boolean
}

function shouldStubOtpByDefault(role: SessionRole): boolean {
  return role !== 'hotel'
}

function expectedLandingPath(role: SessionRole): string {
  return role === 'hotel' ? '/hotel/dashboard' : '/properties'
}

function performLogin(user: SessionUser, opts: LoginOptions) {
  const stub = opts.stubOtp ?? shouldStubOtpByDefault(user.role)
  const code = opts.otpCode ?? (stub ? '123456' : DEMO_OTP_CODE)

  if (stub) {
    cy.intercept('POST', '**/api/v1/auth/verify-otp', {
      statusCode: 200,
      body: {
        access_token: buildFakeJwt(user),
        token_type: 'bearer',
        role: user.role
      }
    }).as('verifyOtp')
  }

  cy.visit('/login')
  screenshot.take('login_page_loaded')
  cy.get('[data-cy=login-email]').type(user.email)
  cy.get('[data-cy=login-password]').type(user.password)
  screenshot.take('login_form_filled')
  cy.get('[data-cy=login-submit]').click()

  cy.url().should('include', '/verify-otp')
  screenshot.take('otp_page_loaded')
  cy.get('[data-cy=otp-input]').type(code)
  cy.get('[data-cy=otp-submit]').click()

  if (stub) {
    cy.wait('@verifyOtp')
  }

  cy.url().should('include', expectedLandingPath(user.role))
  cy.getCookie('auth_token').should('exist')
}

export function loginAs(user: SessionUser, opts: LoginOptions = {}) {
  if (opts.cacheSession === false) {
    performLogin(user, opts)
    return
  }

  cy.session(
    [user.email, user.role],
    () => {
      performLogin(user, opts)
    },
    {
      validate() {
        cy.getCookie('auth_token').should('exist')
      }
    }
  )
}

export function loginAsTraveler(user: SessionUser, opts: LoginOptions = {}) {
  if (user.role !== 'traveler') {
    throw new Error('loginAsTraveler called with non-traveler user')
  }
  loginAs(user, opts)
}

export function loginAsHotelPartner(user: SessionUser, opts: LoginOptions = {}) {
  if (user.role !== 'hotel') {
    throw new Error('loginAsHotelPartner called with non-hotel user')
  }
  loginAs(user, opts)
}
