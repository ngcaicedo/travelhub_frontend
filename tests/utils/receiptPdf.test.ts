import { describe, expect, it } from 'vitest'
import { buildReceiptFilename, createPaymentReceiptPdf } from '~/utils/receiptPdf'

describe('receiptPdf', () => {
  it('builds a pdf filename based on receipt number', () => {
    expect(buildReceiptFilename('RCPT-123')).toBe('travelhub-RCPT-123.pdf')
    expect(buildReceiptFilename(null)).toBe('travelhub-receipt.pdf')
  })

  it('creates a valid pdf blob for the payment receipt', async () => {
    const blob = createPaymentReceiptPdf({
      summary: {
        payment_id: 'payment-123',
        reservation_id: 'reservation-123',
        traveler_id: 'traveler-123',
        status: 'confirmed',
        amount_in_cents: 287650,
        currency: 'COP',
        receipt_id: 'receipt-123',
        receipt_number: 'RCPT-123',
        property_name: 'Renaissance Estate & Private Vineyard',
        property_address: null,
        check_in_date: '2026-10-12',
        check_out_date: '2026-10-17',
        guests_count: null,
        nights: null,
        nightly_rate_in_cents: null,
        taxes_in_cents: null,
        total_in_cents: null,
        cancellation_policy: null
      },
      formattedAmount: '$2,876.50',
      formattedDates: 'Oct 12, 2026 - Oct 17, 2026',
      labels: {
        brand: 'TravelHub',
        badge: 'Payment confirmation',
        paidBadge: 'Paid',
        title: 'Payment receipt',
        subtitle: 'Your payment was confirmed successfully.',
        receipt: 'Receipt',
        reservationId: 'Reservation ID',
        paymentId: 'Payment ID',
        property: 'Property',
        dates: 'Stay dates',
        amountPaid: 'Amount paid',
        propertyFallback: 'TravelHub stay',
        pending: 'Pending receipt',
        footer: 'Generated from your TravelHub confirmation page.'
      }
    })

    const text = await blob.text()
    expect(blob.type).toBe('application/pdf')
    expect(text.startsWith('%PDF-1.4')).toBe(true)
    expect(text).toContain('TravelHub')
    expect(text).toContain('reservation-123')
  })
})
