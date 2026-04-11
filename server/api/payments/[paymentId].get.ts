export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const paymentId = getRouterParam(event, 'paymentId')

  try {
    return await $fetch(`${config.public.paymentsApiBase}/api/v1/payments/${paymentId}`, {
      timeout: 10000
    })
  } catch (error: unknown) {
    const response = (error as { response?: { status?: number, _data?: unknown } } | null)?.response

    throw createError({
      statusCode: response?.status || 500,
      statusMessage: 'Payment lookup failed',
      data: response?._data || null
    })
  }
})
