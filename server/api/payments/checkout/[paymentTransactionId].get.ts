export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const paymentTransactionId = getRouterParam(event, 'paymentTransactionId')

  try {
    return await $fetch(`${config.public.paymentsApiBase}/api/v1/payments/checkout/${paymentTransactionId}`, {
      timeout: 10000
    })
  } catch (error: unknown) {
    const response = (error as { response?: { status?: number, _data?: unknown } } | null)?.response

    throw createError({
      statusCode: response?.status || 500,
      statusMessage: 'Checkout session lookup failed',
      data: response?._data || null
    })
  }
})
