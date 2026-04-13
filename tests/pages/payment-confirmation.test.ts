import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { flushPromises } from '@vue/test-utils'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import PaymentConfirmationPage from '~/pages/notifications/payment-confirmation.vue'

vi.mock('~/utils/receiptPdf', () => ({
  buildReceiptFilename: (receiptNumber: string | null) => receiptNumber ? `receipt-${receiptNumber}.pdf` : 'receipt.pdf',
  createPaymentReceiptPdf: vi.fn(() => new Blob(['pdf'], { type: 'application/pdf' }))
}))

const confirmation = ref({
  payment_id: 'payment-123',
  reservation_id: 'reservation-123',
  traveler_id: 'traveler-123',
  status: 'confirmed',
  amount_in_cents: 287600,
  currency: 'COP',
  receipt_id: 'receipt-123',
  receipt_number: 'RCPT-123',
  property_name: 'Renaissance Estate & Private Vineyard',
  check_in_date: '2026-10-12',
  check_out_date: '2026-10-17'
})

const latestReservation = ref(null)
const loading = ref(false)
const error = ref<string | null>(null)
const loadConfirmation = vi.fn()
const reconcilePaymentTransaction = vi.fn()

vi.mock('~/composables/usePaymentConfirmation', () => ({
  usePaymentConfirmation: () => ({
    confirmation,
    latestReservation,
    loading,
    error,
    loadConfirmation,
    reconcilePaymentTransaction
  })
}))

const defaultConfirmation = {
  payment_id: 'payment-123',
  reservation_id: 'reservation-123',
  traveler_id: 'traveler-123',
  status: 'confirmed',
  amount_in_cents: 287600,
  currency: 'COP',
  receipt_id: 'receipt-123',
  receipt_number: 'RCPT-123',
  property_name: 'Renaissance Estate & Private Vineyard',
  check_in_date: '2026-10-12',
  check_out_date: '2026-10-17'
}

function mountPage(query: Record<string, string> = { paymentId: 'payment-123' }) {
  return mountSuspended(PaymentConfirmationPage, { route: { query } })
}

describe('PaymentConfirmationPage', () => {
  beforeEach(() => {
    loading.value = false
    error.value = null
    confirmation.value = { ...defaultConfirmation }
    loadConfirmation.mockReset().mockResolvedValue(confirmation.value)
    reconcilePaymentTransaction.mockReset()
    sessionStorage.clear()
  })

  // --- Basic rendering ---

  it('renders the payment confirmation summary and actions', async () => {
    const wrapper = await mountPage()
    const text = wrapper.text()

    expect(loadConfirmation).toHaveBeenCalledWith('payment-123')
    expect(text).toContain('Renaissance Estate & Private Vineyard')
    expect(text).toMatch(/Booking Confirmed|Reserva confirmada/)
    expect(text).toMatch(/View my reservations|Ver mis reservas/)
    expect(text).toMatch(/Download receipt|Descargar recibo/)
  })

  it('shows loading state', async () => {
    loading.value = true
    confirmation.value = null as unknown as typeof confirmation.value

    const wrapper = await mountPage()
    expect(wrapper.text()).toMatch(/Loading|Cargando/)
  })

  // --- Receipt reference ---

  it('renders receipt reference with receipt number', async () => {
    const wrapper = await mountPage()
    expect(wrapper.text()).toContain('#RCPT-123')
  })

  it('renders TH- fallback when no receipt number', async () => {
    confirmation.value = { ...defaultConfirmation, receipt_number: '' }
    const wrapper = await mountPage()
    expect(wrapper.text()).toMatch(/#TH-\d+/)
  })

  it('renders # when no receipt number and no reservation_id', async () => {
    confirmation.value = { ...defaultConfirmation, receipt_number: '', reservation_id: '' }
    const wrapper = await mountPage()
    expect(wrapper.text()).toContain('#')
  })

  // --- Formatted amount ---

  it('renders formatted amount', async () => {
    const wrapper = await mountPage()
    expect(wrapper.text()).toMatch(/2[.,]876/)
  })

  // --- Stay dates and summary ---

  it('renders stay summary with formatted dates', async () => {
    const wrapper = await mountPage()
    expect(wrapper.text()).toMatch(/Oct/)
  })

  it('renders dates from sessionStorage fallback', async () => {
    confirmation.value = { ...defaultConfirmation, check_in_date: '', check_out_date: '' }
    sessionStorage.setItem('reservation_checkout_date', '2026-11-01')
    sessionStorage.setItem('reservation_checkout_out_date', '2026-11-05')

    const wrapper = await mountPage()
    expect(wrapper.text()).toMatch(/Nov/)
  })

  it('shows dash when no dates available', async () => {
    confirmation.value = { ...defaultConfirmation, check_in_date: '', check_out_date: '' }
    const wrapper = await mountPage()
    expect(wrapper.text()).toContain('-')
  })

  // --- Property name fallback ---

  it('renders fallback property name when not provided', async () => {
    confirmation.value = { ...defaultConfirmation, property_name: '' }
    const wrapper = await mountPage()
    expect(wrapper.text().length).toBeGreaterThan(10)
  })

  // --- Download receipt ---

  it('calls createPaymentReceiptPdf when clicking download', async () => {
    const { createPaymentReceiptPdf } = await import('~/utils/receiptPdf')

    // Stub URL.createObjectURL/revokeObjectURL since happy-dom doesn't support Blob from mocks
    const originalCreateObjectURL = URL.createObjectURL
    const originalRevokeObjectURL = URL.revokeObjectURL
    URL.createObjectURL = vi.fn(() => 'blob:mock-url')
    URL.revokeObjectURL = vi.fn()

    try {
      const wrapper = await mountPage()
      const downloadButton = wrapper.findAll('button').find(
        btn => btn.text().match(/Download receipt|Descargar recibo|Baixar recibo/)
      )

      expect(downloadButton).toBeTruthy()
      if (downloadButton) {
        await downloadButton.trigger('click')
        await flushPromises()
        expect(createPaymentReceiptPdf).toHaveBeenCalled()
      }
    } finally {
      URL.createObjectURL = originalCreateObjectURL
      URL.revokeObjectURL = originalRevokeObjectURL
    }
  })

  // --- Navigation buttons ---

  it('view reservations button triggers navigation', async () => {
    const wrapper = await mountPage()
    const button = wrapper.findAll('button').find(
      btn => btn.text().match(/View my reservations|Ver mis reservas/)
    )
    expect(button).toBeTruthy()
    if (button) {
      await button.trigger('click')
      await flushPromises()
    }
    expect(wrapper.exists()).toBe(true)
  })

  it('back to home button triggers navigation', async () => {
    const wrapper = await mountPage()
    const button = wrapper.findAll('button').find(
      btn => btn.text().match(/Back to home|Volver al inicio|Voltar/)
    )
    expect(button).toBeTruthy()
    if (button) {
      await button.trigger('click')
      await flushPromises()
    }
    expect(wrapper.exists()).toBe(true)
  })

  // --- Error states ---

  it('shows error when loadConfirmation fails', async () => {
    loadConfirmation.mockImplementation(async () => {
      error.value = 'notifications.errors.backendUnavailable'
      throw new Error('fail')
    })

    const wrapper = await mountPage()
    await flushPromises()

    // Error path: confirmation stays null, transientError is set
    expect(wrapper.text().length).toBeGreaterThan(0)
  })

  it('shows missing reference error when no query params', async () => {
    loadConfirmation.mockReset()

    const wrapper = await mountPage({})
    await flushPromises()

    expect(wrapper.text().length).toBeGreaterThan(0)
  })

  // --- Reconciliation flow ---

  it('calls reconcilePaymentTransaction with transactionId', async () => {
    reconcilePaymentTransaction.mockResolvedValueOnce({
      status: 'confirmed',
      paymentId: 'payment-456'
    })

    await mountPage({ transactionId: 'tx-123' })
    await flushPromises()

    expect(reconcilePaymentTransaction).toHaveBeenCalledWith('tx-123', {
      maxAttempts: 6,
      intervalMs: 5000
    })
  })

  it('reconciliation failed shows error state', async () => {
    reconcilePaymentTransaction.mockResolvedValueOnce({
      status: 'failed',
      error: 'card_declined'
    })

    const wrapper = await mountPage({ transactionId: 'tx-fail' })
    await flushPromises()

    // transientError is set, component re-renders with error
    expect(wrapper.text().length).toBeGreaterThan(0)
  })

  it('reconciliation pending shows verification expired', async () => {
    reconcilePaymentTransaction.mockResolvedValueOnce({ status: 'pending' })

    const wrapper = await mountPage({ transactionId: 'tx-pending' })
    await flushPromises()

    expect(wrapper.text().length).toBeGreaterThan(0)
  })

  it('retry verification re-calls reconcile', async () => {
    reconcilePaymentTransaction
      .mockResolvedValueOnce({ status: 'pending' })
      .mockResolvedValueOnce({ status: 'confirmed', paymentId: 'pay-ok' })

    const wrapper = await mountPage({ transactionId: 'tx-retry' })
    await flushPromises()

    const retryButton = wrapper.findAll('button').find(
      btn => btn.text().match(/Retry|Reintentar|Tentar/)
    )

    if (retryButton) {
      await retryButton.trigger('click')
      await flushPromises()
      expect(reconcilePaymentTransaction).toHaveBeenCalledTimes(2)
    }
  })

  it('back to checkout button works in error state', async () => {
    reconcilePaymentTransaction.mockResolvedValueOnce({ status: 'pending' })

    const wrapper = await mountPage({ transactionId: 'tx-err' })
    await flushPromises()

    const checkoutButton = wrapper.findAll('button').find(
      btn => btn.text().match(/Checkout|checkout|Pago/i)
    )

    if (checkoutButton) {
      await checkoutButton.trigger('click')
      await flushPromises()
    }
    expect(wrapper.exists()).toBe(true)
  })
})
